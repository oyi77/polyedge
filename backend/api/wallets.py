"""Wallet management routes - CRUD, active wallet, balances."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
import json as _json

from backend.models.database import get_db, WalletConfig, BotState, SessionLocal
from backend.api.auth import require_admin
import logging

logger = logging.getLogger("trading_bot")
router = APIRouter(tags=["wallets"])


# ============================================================================
# Pydantic Models
# ============================================================================


class WalletConfigCreate(BaseModel):
    address: str
    pseudonym: Optional[str] = None
    source: Optional[str] = "user"
    tags: Optional[List[str]] = None
    enabled: Optional[bool] = True


class WalletConfigUpdate(BaseModel):
    pseudonym: Optional[str] = None
    tags: Optional[List[str]] = None
    enabled: Optional[bool] = None
    notes: Optional[str] = None


class ActiveWalletSet(BaseModel):
    address: str


class BalanceUpdate(BaseModel):
    usdc_balance: float
    source: Optional[str] = "manual"


def _row_to_dict(r: WalletConfig) -> dict:
    tags = []
    if r.tags:
        try:
            tags = _json.loads(r.tags)
        except Exception:
            tags = []
    return {
        "id": r.id,
        "address": r.address,
        "pseudonym": r.pseudonym or "",
        "source": r.source or "user",
        "tags": tags,
        "enabled": r.enabled,
        "added_at": r.added_at.isoformat() if r.added_at else None,
    }


# ============================================================================
# Wallet Config CRUD
# ============================================================================


@router.get("/api/wallets/config")
async def list_wallet_configs(
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """List all configured wallets."""
    rows = db.query(WalletConfig).order_by(WalletConfig.added_at.desc()).all()
    return {
        "items": [_row_to_dict(r) for r in rows],
        "total": len(rows),
    }


@router.post("/api/wallets/config")
async def create_wallet_config(
    body: WalletConfigCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Add a wallet to the config."""
    existing = db.query(WalletConfig).filter(WalletConfig.address == body.address).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Wallet {body.address} already configured")

    row = WalletConfig(
        address=body.address,
        pseudonym=body.pseudonym,
        source=body.source or "user",
        tags=_json.dumps(body.tags) if body.tags else None,
        enabled=body.enabled if body.enabled is not None else True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _row_to_dict(row)


@router.put("/api/wallets/config/{config_id}")
async def update_wallet_config(
    config_id: int,
    body: WalletConfigUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Update a wallet config."""
    row = db.query(WalletConfig).filter(WalletConfig.id == config_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Wallet config not found")

    if body.pseudonym is not None:
        row.pseudonym = body.pseudonym
    if body.tags is not None:
        row.tags = _json.dumps(body.tags)
    if body.enabled is not None:
        row.enabled = body.enabled
    if body.notes is not None:
        row.notes = body.notes

    db.commit()
    db.refresh(row)
    return _row_to_dict(row)


@router.delete("/api/wallets/config/{config_id}")
async def delete_wallet_config(
    config_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Remove a wallet config."""
    row = db.query(WalletConfig).filter(WalletConfig.id == config_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Wallet config not found")

    db.delete(row)
    db.commit()
    return {"status": "deleted"}


# ============================================================================
# Wallet Creation (generate new keypair)
# ============================================================================


@router.post("/api/wallets/create")
async def create_wallet(_: None = Depends(require_admin)):
    """Generate a new wallet keypair."""
    try:
        from eth_account import Account
        acct = Account.create()
        return {
            "address": acct.address,
            "private_key": acct.key.hex(),
        }
    except ImportError:
        raise HTTPException(status_code=501, detail="eth_account not installed — wallet creation disabled")


# ============================================================================
# Active Wallet
# ============================================================================


@router.get("/api/wallets/active")
async def get_active_wallet(
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Get the currently active wallet address."""
    state = db.query(BotState).first()
    return {"active_wallet": state.active_wallet if state else None}


@router.put("/api/wallets/active")
async def set_active_wallet(
    body: ActiveWalletSet,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Set the active wallet address."""
    # Verify the wallet exists in config
    wallet = db.query(WalletConfig).filter(WalletConfig.address == body.address).first()
    if not wallet:
        raise HTTPException(status_code=404, detail=f"Wallet {body.address} not configured")

    state = db.query(BotState).first()
    if not state:
        raise HTTPException(status_code=404, detail="Bot state not initialized")

    state.active_wallet = body.address
    db.commit()
    return {"active_wallet": body.address}


# ============================================================================
# Wallet Balance
# ============================================================================


@router.get("/api/wallets/{address}/balance")
async def get_wallet_balance(
    address: str,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Get wallet balance (from cache or Polymarket API)."""
    row = db.query(WalletConfig).filter(WalletConfig.address == address).first()
    if not row:
        return {
            "address": address,
            "usdc_balance": 0.0,
            "last_updated": None,
            "source": "error",
            "error": "Wallet not found",
        }

    # Try cache first
    if row.balance_cache:
        try:
            cached = _json.loads(row.balance_cache)
            return {
                "address": address,
                "usdc_balance": cached.get("usdc_balance", 0.0),
                "last_updated": cached.get("last_updated"),
                "source": "cache",
            }
        except Exception:
            pass

    return {
        "address": address,
        "usdc_balance": 0.0,
        "last_updated": None,
        "source": "none",
    }


@router.put("/api/wallets/{address}/balance")
async def update_wallet_balance(
    address: str,
    body: BalanceUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    """Update cached wallet balance."""
    row = db.query(WalletConfig).filter(WalletConfig.address == address).first()
    if not row:
        raise HTTPException(status_code=404, detail="Wallet not found")

    row.balance_cache = _json.dumps({
        "usdc_balance": body.usdc_balance,
        "last_updated": datetime.utcnow().isoformat(),
    })
    db.commit()

    return {
        "address": address,
        "usdc_balance": body.usdc_balance,
        "last_updated": datetime.utcnow().isoformat(),
        "source": body.source or "manual",
    }
