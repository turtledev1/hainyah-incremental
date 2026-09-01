import { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { GameState } from '../../game/model/state'
import { useGameStore } from '../../game/store/gameStore'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { SectionCard } from '../components/SectionCard'
import { formatDuration, formatNumber } from '../format'

export function SettingsPanel({ state }: { readonly state: GameState }) {
  const exportSave = useGameStore((store) => store.exportSave)
  const importSave = useGameStore((store) => store.importSave)
  const abandonRun = useGameStore((store) => store.abandonRun)

  const [exportedSave, setExportedSave] = useState('')
  const [saveToImport, setSaveToImport] = useState('')
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)

  const statistics = state.statistics

  return (
    <Stack sx={{ gap: 2 }}>
      <SectionCard title="This run" subtitle="Saved to this browser every few seconds.">
        <Stack sx={{ display: 'grid',
            gap: 0.5,
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            fontFamily: NUMERIC_FONT_FAMILY }}>
          <Typography variant="body2">Played: {formatDuration(state.elapsedSeconds)}</Typography>
          <Typography variant="body2">Hand-gathers: {formatNumber(statistics.manualGatherClicks)}</Typography>
          <Typography variant="body2">Buildings raised: {formatNumber(statistics.buildingsConstructed)}</Typography>
          <Typography variant="body2">Spells cast: {formatNumber(statistics.spellsCast)}</Typography>
          <Typography variant="body2">
            Battles: {formatNumber(statistics.battlesWon)} won, {formatNumber(statistics.battlesLost)} lost
          </Typography>
          <Typography variant="body2">
            Heists: {formatNumber(statistics.heistsSucceeded)} clean, {formatNumber(statistics.heistsFailed)} botched
          </Typography>
          <Typography variant="body2">Acres conquered: {formatNumber(statistics.acresConquered)}</Typography>
          <Typography variant="body2">Soldiers lost: {formatNumber(statistics.soldiersLost)}</Typography>
          <Typography variant="body2">Starved: {formatNumber(statistics.citizensStarved)}</Typography>
        </Stack>
      </SectionCard>

      <SectionCard title="Save" subtitle="Copy the text out to move a run between browsers.">
        <Stack sx={{ gap: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: "flex-start" }}>
            <Button variant="outlined" onClick={() => setExportedSave(exportSave() ?? '')}>
              Export
            </Button>
            <TextField
              size="small"
              fullWidth
              multiline
              maxRows={4}
              value={exportedSave}
              placeholder="Your exported save will appear here."
              slotProps={{ htmlInput: { readOnly: true, style: { fontFamily: NUMERIC_FONT_FAMILY } } }}
            />
          </Stack>

          <Stack direction="row" sx={{ gap: 1, alignItems: "flex-start" }}>
            <Button
              variant="outlined"
              disabled={saveToImport.trim().length === 0}
              onClick={() => importSave(saveToImport)}
            >
              Import
            </Button>
            <TextField
              size="small"
              fullWidth
              multiline
              maxRows={4}
              value={saveToImport}
              onChange={(event) => setSaveToImport(event.target.value)}
              placeholder="Paste a save here to replace this run."
            />
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard title="Start over" subtitle="Abandons this realm and returns to the choice of race.">
        <Button color="error" variant="outlined" onClick={() => setIsConfirmingReset(true)}>
          Abandon this run
        </Button>
      </SectionCard>

      <Dialog open={isConfirmingReset} onClose={() => setIsConfirmingReset(false)}>
        <DialogTitle>Abandon this realm?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This deletes the save in this browser. {formatDuration(state.elapsedSeconds)} of progress will be
            gone, and it cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmingReset(false)}>Keep playing</Button>
          <Button
            color="error"
            onClick={() => {
              setIsConfirmingReset(false)
              abandonRun()
            }}
          >
            Abandon it
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
