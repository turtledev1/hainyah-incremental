import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { GameState } from '../../game/model/state'
import { useGameStore } from '../../game/store/gameStore'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { formatDuration, formatNumber } from '../format'

export function VictoryDialog({ state }: { readonly state: GameState }) {
  const { t } = useTranslation()
  const acknowledgeVictory = useGameStore((store) => store.acknowledgeVictory)
  const abandonRun = useGameStore((store) => store.abandonRun)
  const registry = useGameStore((store) => store.registry)

  return (
    <Dialog open maxWidth="sm" fullWidth>
      <DialogTitle>{t('victory.title')}</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 1.5 }}>
          <Typography variant="body1">
            {t('victory.body', {
              raceName: registry.racesById.get(state.raceId)?.name.toLowerCase() ?? '',
            })}
          </Typography>
          <Stack sx={{ fontFamily: NUMERIC_FONT_FAMILY, gap: 0.25 }}>
            <Typography variant="body2">
              {t('victory.timeTaken', { duration: formatDuration(state.elapsedSeconds) })}
            </Typography>
            <Typography variant="body2">{t('victory.acres', { count: state.acres })}</Typography>
            <Typography variant="body2">
              {t('victory.citizens', { count: Math.floor(state.population) })}
            </Typography>
            <Typography variant="body2">
              {t('victory.battlesWon', {
                count: state.statistics.battlesWon,
                lost: state.statistics.battlesLost,
              })}
            </Typography>
            <Typography variant="body2">
              {t('victory.heistsClean', { count: state.statistics.heistsSucceeded })}
            </Typography>
            <Typography variant="body2">
              {t('victory.spellsCast', { count: state.statistics.spellsCast })}
            </Typography>
            <Typography variant="body2">
              {t('victory.buildingsRaised', { count: state.statistics.buildingsConstructed })}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={acknowledgeVictory}>{t('victory.keepPlaying')}</Button>
        <Button variant="contained" onClick={abandonRun}>
          {t('victory.beginAgain')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
