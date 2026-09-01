import CssBaseline from '@mui/material/CssBaseline'
import Snackbar from '@mui/material/Snackbar'
import { ThemeProvider } from '@mui/material/styles'
import { useGameStore } from './game/store/gameStore'
import { hainyahTheme } from './theme/hainyahTheme'
import { useGameEngine } from './ui/hooks/useGameEngine'
import { GameScreen } from './ui/screens/GameScreen'
import { OfflineSummaryDialog } from './ui/screens/OfflineSummaryDialog'
import { RaceSelectionScreen } from './ui/screens/RaceSelectionScreen'
import { VictoryDialog } from './ui/screens/VictoryDialog'

export function App() {
  useGameEngine()

  const state = useGameStore((store) => store.state)
  const offlineSummary = useGameStore((store) => store.offlineSummary)
  const victoryAcknowledged = useGameStore((store) => store.victoryAcknowledged)
  const notice = useGameStore((store) => store.notice)
  const clearNotice = useGameStore((store) => store.clearNotice)

  return (
    <ThemeProvider theme={hainyahTheme} defaultMode="dark">
      <CssBaseline />
      {state ? <GameScreen state={state} /> : <RaceSelectionScreen />}
      {offlineSummary ? <OfflineSummaryDialog summary={offlineSummary} /> : null}
      {state?.hasAscended && !victoryAcknowledged ? <VictoryDialog state={state} /> : null}
      <Snackbar
        open={Boolean(notice)}
        onClose={clearNotice}
        autoHideDuration={2600}
        message={notice}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </ThemeProvider>
  )
}
