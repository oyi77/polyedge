import type { CalibrationSummary } from '../types'

interface Props {
  calibration: CalibrationSummary
}

export function CalibrationPanel({ calibration }: Props) {
  const acc = calibration.accuracy ?? 0
  const accuracyPct = (acc * 100).toFixed(0)
  const accuracyColor = acc >= 0.55 ? '#22c55e' : acc < 0.50 ? '#dc2626' : '#a1a1aa'

  const brier = calibration.brier_score ?? 0.25
  const brierLabel = brier <= 0.20 ? 'Good' : brier <= 0.25 ? 'OK' : 'Poor'
  const brierColor = brier <= 0.20 ? '#22c55e' : brier <= 0.25 ? '#d97706' : '#dc2626'

  const predEdge = ((calibration.avg_predicted_edge ?? 0) * 100).toFixed(1)
  const actualEdge = ((calibration.avg_actual_edge ?? 0) * 100).toFixed(1)

  return (
    <div className="space-y-2">
      {/* Accuracy - large display */}
      <div className="flex items-center gap-3">
        <div className="text-2xl font-bold tabular-nums" style={{ color: accuracyColor }}>
          {accuracyPct}%
        </div>
        <div className="text-[10px] text-neutral-500 leading-tight">
          <div>Accuracy</div>
          <div className="tabular-nums text-neutral-600">
            {Math.round(acc * (calibration.total_with_outcome ?? 0))}/{calibration.total_with_outcome ?? 0}
          </div>
        </div>
      </div>

      {/* Brier + Edge comparison */}
      <div className="flex items-center justify-between text-[10px]">
        <div>
          <span className="text-neutral-500">Brier: </span>
          <span className="tabular-nums" style={{ color: brierColor }}>
            {brier.toFixed(3)} ({brierLabel})
          </span>
        </div>
      </div>

      {/* Predicted vs Actual edge bars */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-neutral-500 w-10 shrink-0">Pred</span>
          <div className="flex-1 meter-bar">
            <div
              className="meter-fill"
              style={{
                width: `${Math.min(100, Math.abs(calibration.avg_predicted_edge ?? 0) * 500)}%`,
                backgroundColor: '#d97706'
              }}
            />
          </div>
          <span className="tabular-nums text-amber-500 w-10 text-right">{predEdge}%</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-neutral-500 w-10 shrink-0">Actual</span>
          <div className="flex-1 meter-bar">
            <div
              className="meter-fill"
              style={{
                width: `${Math.min(100, Math.abs(calibration.avg_actual_edge ?? 0) * 500)}%`,
                backgroundColor: (calibration.avg_actual_edge ?? 0) >= 0 ? '#22c55e' : '#dc2626'
              }}
            />
          </div>
          <span
            className="tabular-nums w-10 text-right"
            style={{ color: (calibration.avg_actual_edge ?? 0) >= 0 ? '#22c55e' : '#dc2626' }}
          >
            {actualEdge}%
          </span>
        </div>
      </div>

      <div className="text-[9px] text-neutral-600 tabular-nums">
        {calibration.total_signals ?? 0} tracked / {calibration.total_with_outcome ?? 0} settled
      </div>
    </div>
  )
}
