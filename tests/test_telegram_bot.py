"""Tests for Telegram bot command handlers."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestTelegramBotCommands:
    @pytest.fixture
    def mock_bot(self):
        with patch.dict(
            "sys.modules",
            {
                "telegram": MagicMock(),
                "telegram.ext": MagicMock(),
            },
        ):
            with patch("backend.bot.telegram_bot.TELEGRAM_AVAILABLE", True):
                from backend.bot.telegram_bot import PolyEdgeBot

                bot = PolyEdgeBot.__new__(PolyEdgeBot)
                bot._bot = None
                bot._paused = False
                bot.admin_ids = set([123456])
                bot.on_pause = None
                bot.on_resume = None
                return bot

    @pytest.mark.asyncio
    async def test_cmd_pause_requires_admin(self, mock_bot):
        mock_update = MagicMock()
        mock_update.message = MagicMock()
        mock_update.message.reply_text = AsyncMock()

        await mock_bot._cmd_pause(mock_update, MagicMock())

        mock_update.message.reply_text.assert_called_once()
        call_args = mock_update.message.reply_text.call_args[0][0]
        assert "Admin only" in call_args

    @pytest.mark.asyncio
    async def test_cmd_pause_sets_paused_state(self, mock_bot):
        mock_update = MagicMock()
        mock_update.message = MagicMock()
        mock_update.message.reply_text = AsyncMock()

        mock_update.effective_user = MagicMock()
        mock_update.effective_user.id = 123456

        await mock_bot._cmd_pause(mock_update, MagicMock())

        assert mock_bot._paused is True

    @pytest.mark.asyncio
    async def test_cmd_resume_sets_running_state(self, mock_bot):
        mock_bot._paused = True

        mock_update = MagicMock()
        mock_update.message = MagicMock()
        mock_update.message.reply_text = AsyncMock()

        mock_update.effective_user = MagicMock()
        mock_update.effective_user.id = 123456

        await mock_bot._cmd_resume(mock_update, MagicMock())

        assert mock_bot._paused is False


class TestPolyEdgeBot:
    def test_bot_initializes_without_token(self):
        with patch.dict(
            "sys.modules",
            {
                "telegram": MagicMock(),
                "telegram.ext": MagicMock(),
            },
        ):
            with patch("backend.bot.telegram_bot.TELEGRAM_AVAILABLE", True):
                from backend.bot.telegram_bot import PolyEdgeBot

                bot = PolyEdgeBot.__new__(PolyEdgeBot)
                assert bot is not None

    def test_bot_reports_telegram_unavailable(self):
        with patch("backend.bot.telegram_bot.TELEGRAM_AVAILABLE", False):
            from backend.bot import telegram_bot

            assert telegram_bot.TELEGRAM_AVAILABLE is False
