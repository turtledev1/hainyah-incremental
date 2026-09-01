import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { GameEventKind, GameState } from '../../game/model/state'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { SectionCard } from '../components/SectionCard'
import { formatDuration } from '../format'

const KIND_COLOURS: Record<GameEventKind, string> = {
  construction: 'text.secondary',
  population: 'warning.main',
  magic: 'secondary.main',
  thievery: 'info.main',
  warfare: 'primary.main',
  ascension: 'success.main',
  offline: 'text.secondary',
}

export function EventLogPanel({ state }: { readonly state: GameState }) {
  const { t } = useTranslation()
  const mostRecentFirst = [...state.eventLog].reverse()

  return (
    <SectionCard title="Chronicle" subtitle="What has happened, most recent first.">
      <Box sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
        <Stack sx={{ gap: 0.75 }}>
          {mostRecentFirst.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nothing has happened yet. Gather something.
            </Typography>
          ) : (
            mostRecentFirst.map((event) => (
              <Stack key={event.id} direction="row" sx={{ gap: 1, alignItems: "baseline" }}>
                <Typography variant="caption" sx={{ fontFamily: NUMERIC_FONT_FAMILY, minWidth: 58, color: 'text.disabled' }}>
                  {formatDuration(event.atElapsedSeconds)}
                </Typography>
                <Typography variant="body2" sx={{ color: KIND_COLOURS[event.kind] }}>
                  {t(event.messageKey, event.values)}
                </Typography>
              </Stack>
            ))
          )}
        </Stack>
      </Box>
    </SectionCard>
  )
}
