import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { RaceId } from '../../game/model/ids'
import { contentKeys } from '../../i18n/contentKeys'
import { SectionCard } from '../components/SectionCard'

function Bullets({ heading, keyForList, color }: {
  readonly heading: string
  readonly keyForList: string
  readonly color: 'success.main' | 'error.main'
}) {
  const { t } = useTranslation()
  const bullets = t(keyForList, { returnObjects: true }) as readonly string[]

  return (
    <Box>
      <Typography variant="subtitle2" color={color}>
        {heading}
      </Typography>
      {bullets.map((bullet) => (
        <Typography key={bullet} variant="body2">
          • {bullet}
        </Typography>
      ))}
    </Box>
  )
}

export function RacePanel({ raceId }: { readonly raceId: RaceId }) {
  const { t } = useTranslation()

  return (
    <SectionCard
      title={t(contentKeys.raceName(raceId))}
      subtitle={t(contentKeys.raceTagline(raceId))}
    >
      <Stack sx={{ gap: 1 }}>
        <Bullets
          heading={t('raceSelection.strengths')}
          keyForList={contentKeys.raceAdvantages(raceId)}
          color="success.main"
        />
        <Bullets
          heading={t('raceSelection.costs')}
          keyForList={contentKeys.raceDisadvantages(raceId)}
          color="error.main"
        />
      </Stack>
    </SectionCard>
  )
}
