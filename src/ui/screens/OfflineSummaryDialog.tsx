import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { RESOURCE_IDS } from '../../game/model/ids'
import type { OfflineProgressSummary } from '../../game/engine/offlineCatchUp'
import { useGameStore } from '../../game/store/gameStore'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { formatDuration, formatStockpile } from '../format'

export function OfflineSummaryDialog({ summary }: { readonly summary: OfflineProgressSummary }) {
  const { t } = useTranslation()
  const dismissOfflineSummary = useGameStore((store) => store.dismissOfflineSummary)

  const gains = RESOURCE_IDS.filter((resourceId) => Math.abs(summary.resourceGains[resourceId]) >= 1)

  return (
    <Dialog open onClose={dismissOfflineSummary} maxWidth="xs" fullWidth>
      <DialogTitle>{t('offline.title')}</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {summary.wasCapped
              ? t('offline.elapsedCapped', {
                  elapsed: formatDuration(summary.awaySeconds),
                  credited: formatDuration(summary.creditedSeconds),
                })
              : t('offline.elapsedUncapped', { elapsed: formatDuration(summary.awaySeconds) })}
          </Typography>

          <Stack sx={{ fontFamily: NUMERIC_FONT_FAMILY, gap: 0.25 }}>
            {gains.map((resourceId) => (
              <Typography key={resourceId} variant="body2">
                {summary.resourceGains[resourceId] >= 0 ? '+' : ''}
                {formatStockpile(summary.resourceGains[resourceId])} {resourceId}
              </Typography>
            ))}
            {Math.abs(summary.populationChange) >= 1 ? (
              <Typography variant="body2">
                {summary.populationChange >= 0 ? '+' : ''}
                {t('offline.citizensChange', { count: Math.round(summary.populationChange) })}
              </Typography>
            ) : null}
            {summary.acresGained > 0 ? (
              <Typography variant="body2">
                +{t('offline.acresGained', { count: summary.acresGained })}
              </Typography>
            ) : null}
            {summary.buildingsCompleted > 0 ? (
              <Typography variant="body2">
                {t('offline.buildingsFinished', { count: summary.buildingsCompleted })}
              </Typography>
            ) : null}
            {summary.battlesResolved > 0 ? (
              <Typography variant="body2">
                {t('offline.battlesFought', { count: summary.battlesResolved })}
              </Typography>
            ) : null}
            {summary.heistsResolved > 0 ? (
              <Typography variant="body2">
                {t('offline.jobsRun', { count: summary.heistsResolved })}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={dismissOfflineSummary}>
          Carry on
        </Button>
      </DialogActions>
    </Dialog>
  )
}
