import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { i18n, languageNames, rememberLanguage, type LanguageCode } from '../../i18n'

export function SettingsPanel({ state }: { readonly state: GameState }) {
  const { t } = useTranslation()
  const exportSave = useGameStore((store) => store.exportSave)
  const importSave = useGameStore((store) => store.importSave)
  const abandonRun = useGameStore((store) => store.abandonRun)

  const [exportedSave, setExportedSave] = useState('')
  const [saveToImport, setSaveToImport] = useState('')
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)

  const statistics = state.statistics

  return (
    <Stack sx={{ gap: 2 }}>
      <SectionCard title={t('settings.runTitle')} subtitle={t('settings.runSubtitle')}>
        <Stack sx={{ display: 'grid',
            gap: 0.5,
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            fontFamily: NUMERIC_FONT_FAMILY }}>
          <Typography variant="body2">
            {t('settings.played', { duration: formatDuration(state.elapsedSeconds) })}
          </Typography>
          <Typography variant="body2">
            {t('settings.handGathers', { count: statistics.manualGatherClicks })}
          </Typography>
          <Typography variant="body2">
            {t('settings.buildingsRaised', { count: statistics.buildingsConstructed })}
          </Typography>
          <Typography variant="body2">
            {t('settings.spellsCast', { count: statistics.spellsCast })}
          </Typography>
          <Typography variant="body2">
            {t('settings.battles', {
              won: formatNumber(statistics.battlesWon),
              lost: formatNumber(statistics.battlesLost),
            })}
          </Typography>
          <Typography variant="body2">
            {t('settings.heists', {
              clean: formatNumber(statistics.heistsSucceeded),
              botched: formatNumber(statistics.heistsFailed),
            })}
          </Typography>
          <Typography variant="body2">
            {t('settings.acresConquered', { count: statistics.acresConquered })}
          </Typography>
          <Typography variant="body2">
            {t('settings.soldiersLost', { count: statistics.soldiersLost })}
          </Typography>
          <Typography variant="body2">
            {t('settings.starved', { count: statistics.citizensStarved })}
          </Typography>
        </Stack>
      </SectionCard>

      <SectionCard title={t('settings.languageTitle')}>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(languageNames).map(([code, name]) => (
            <Button
              key={code}
              variant={i18n.language === code ? 'contained' : 'outlined'}
              onClick={() => rememberLanguage(code as LanguageCode)}
            >
              {name}
            </Button>
          ))}
        </Stack>
      </SectionCard>

      <SectionCard title={t('settings.saveTitle')} subtitle={t('settings.saveSubtitle')}>
        <Stack sx={{ gap: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: "flex-start" }}>
            <Button variant="outlined" onClick={() => setExportedSave(exportSave() ?? '')}>
              {t('settings.exportAction')}
            </Button>
            <TextField
              size="small"
              fullWidth
              multiline
              maxRows={4}
              value={exportedSave}
              placeholder={t('settings.exportPlaceholder')}
              slotProps={{ htmlInput: { readOnly: true, style: { fontFamily: NUMERIC_FONT_FAMILY } } }}
            />
          </Stack>

          <Stack direction="row" sx={{ gap: 1, alignItems: "flex-start" }}>
            <Button
              variant="outlined"
              disabled={saveToImport.trim().length === 0}
              onClick={() => importSave(saveToImport)}
            >
              {t('settings.importAction')}
            </Button>
            <TextField
              size="small"
              fullWidth
              multiline
              maxRows={4}
              value={saveToImport}
              onChange={(event) => setSaveToImport(event.target.value)}
              placeholder={t('settings.importPlaceholder')}
            />
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard title={t('settings.startOverTitle')} subtitle={t('settings.startOverSubtitle')}>
        <Button color="error" variant="outlined" onClick={() => setIsConfirmingReset(true)}>
          {t('settings.abandonAction')}
        </Button>
      </SectionCard>

      <Dialog open={isConfirmingReset} onClose={() => setIsConfirmingReset(false)}>
        <DialogTitle>{t('settings.abandonTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('settings.abandonWarning', { duration: formatDuration(state.elapsedSeconds) })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmingReset(false)}>{t('settings.keepPlaying')}</Button>
          <Button
            color="error"
            onClick={() => {
              setIsConfirmingReset(false)
              abandonRun()
            }}
          >
            {t('settings.abandonConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
