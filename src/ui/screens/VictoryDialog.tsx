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
      <DialogTitle>The temple stands</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 1.5 }}>
          <Typography variant="body1">
            The last stone is set. Hai and Yah stop arguing long enough to look down at what the{' '}
            {registry.racesById.get(state.raceId)?.name.toLowerCase()} have built, and the world is
            yours.
          </Typography>
          <Stack sx={{ fontFamily: NUMERIC_FONT_FAMILY, gap: 0.25 }}>
            <Typography variant="body2">Time taken: {formatDuration(state.elapsedSeconds)}</Typography>
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
              Heists: {formatNumber(state.statistics.heistsSucceeded)} clean
            </Typography>
            <Typography variant="body2">
              Spells cast: {formatNumber(state.statistics.spellsCast)}
            </Typography>
            <Typography variant="body2">
              Buildings raised: {formatNumber(state.statistics.buildingsConstructed)}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={acknowledgeVictory}>Keep playing</Button>
        <Button variant="contained" onClick={abandonRun}>
          Begin again as another people
        </Button>
      </DialogActions>
    </Dialog>
  )
}
