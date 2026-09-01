import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { RaceDefinition } from '../../game/model/content'
import type { MagicCircleId, RaceId } from '../../game/model/ids'
import { useGameStore } from '../../game/store/gameStore'
import { CardGrid } from '../components/CardGrid'

export function RaceSelectionScreen() {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)
  const startNewRun = useGameStore((store) => store.startNewRun)

  const [selectedRaceId, setSelectedRaceId] = useState<RaceId | undefined>(undefined)
  const [selectedCircleIds, setSelectedCircleIds] = useState<MagicCircleId[]>([])

  const selectedRace = useMemo(
    () => (selectedRaceId ? registry.racesById.get(selectedRaceId) : undefined),
    [registry, selectedRaceId],
  )

  const grantedCircleIds = selectedRace?.magicCircleAccess.grantedCircleIds ?? []
  const chosenCircleCount = selectedRace?.magicCircleAccess.chosenCircleCount ?? 0
  const choosableCircleIds = selectedRace?.magicCircleAccess.choosableCircleIds ?? []
  const isReadyToBegin = Boolean(selectedRace) && selectedCircleIds.length === chosenCircleCount

  const toggleCircle = (circleId: MagicCircleId): void => {
    setSelectedCircleIds((current) => {
      if (current.includes(circleId)) {
        return current.filter((candidate) => candidate !== circleId)
      }
      if (current.length >= chosenCircleCount) {
        return [...current.slice(1), circleId]
      }
      return [...current, circleId]
    })
  }

  const selectRace = (raceId: RaceId): void => {
    setSelectedRaceId(raceId)
    setSelectedCircleIds([])
  }

  const circleName = (circleId: MagicCircleId): string =>
    registry.magicCirclesById.get(circleId)?.name ?? circleId

  function describeCircleAccess(race: RaceDefinition): string {
    const { grantedCircleIds: granted, chosenCircleCount: toChoose } = race.magicCircleAccess
    const grantedNames = granted.map(circleName).join(' and ')
    if (toChoose === 0) {
      return grantedNames
    }
    const chosenPart =
      toChoose === 1
        ? t('raceSelection.oneCircleOfYourChoice')
        : t('raceSelection.manyCirclesOfYourChoice', { count: toChoose })
    if (granted.length === 0) {
      return chosenPart.charAt(0).toUpperCase() + chosenPart.slice(1)
    }
    return t('raceSelection.grantedPlusChosen', { granted: grantedNames, chosen: chosenPart })
  }

  return (
    <Stack sx={{ maxWidth: 1100, mx: 'auto', px: 3, py: 5, gap: 3 }}>
      <Stack sx={{ gap: 1 }}>
        <Typography variant="h1">Hainyah</Typography>
        <Typography variant="body1" color="text.secondary">
          {t('raceSelection.intro')}
        </Typography>
      </Stack>

      <Divider />

      <Stack sx={{ gap: 1.5 }}>
        <Typography variant="h2">{t('raceSelection.chooseRace')}</Typography>
        <CardGrid minimumColumnWidth={280}>
          {registry.races.map((race) => (
            <Card
              key={race.id}
              sx={{
                borderColor: selectedRaceId === race.id ? 'primary.main' : undefined,
                borderWidth: selectedRaceId === race.id ? 2 : 1,
              }}
            >
              <CardActionArea onClick={() => selectRace(race.id)} sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="h3">{race.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    {race.tagline}
                  </Typography>

                  <Box>
                    <Typography variant="subtitle2" color="success.main">
                      {t('raceSelection.strengths')}
                    </Typography>
                    {race.advantages.map((advantage) => (
                      <Typography key={advantage} variant="body2">
                        • {advantage}
                      </Typography>
                    ))}
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="error.main">
                      {t('raceSelection.costs')}
                    </Typography>
                    {race.disadvantages.map((disadvantage) => (
                      <Typography key={disadvantage} variant="body2">
                        • {disadvantage}
                      </Typography>
                    ))}
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    {describeCircleAccess(race)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </CardGrid>
      </Stack>

      {selectedRace ? (
        <Stack sx={{ gap: 1.5 }}>
          <Typography variant="h2">
            {chosenCircleCount === 0
              ? t('raceSelection.yourCircle')
              : chosenCircleCount === 1
                ? t('raceSelection.chooseCircle')
                : t('raceSelection.chooseCircles', { count: chosenCircleCount })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('raceSelection.circleWarning')}
          </Typography>

          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {grantedCircleIds.map((circleId) => (
              <Chip
                key={circleId}
                label={t('raceSelection.circleByRight', { circleName: circleName(circleId) })}
                color="secondary"
                variant="filled"
              />
            ))}
            {choosableCircleIds.map((circleId) => {
              const isSelected = selectedCircleIds.includes(circleId)
              return (
                <Chip
                  key={circleId}
                  label={circleName(circleId)}
                  color={isSelected ? 'secondary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={() => toggleCircle(circleId)}
                />
              )
            })}
          </Stack>

          {[...grantedCircleIds, ...selectedCircleIds].map((circleId) => (
            <Typography key={circleId} variant="body2" color="text.secondary">
              {registry.magicCirclesById.get(circleId)?.flavor}
            </Typography>
          ))}
        </Stack>
      ) : null}

      <Box>
        <Button
          size="large"
          variant="contained"
          disabled={!isReadyToBegin}
          onClick={() => startNewRun(selectedRaceId!, [...grantedCircleIds, ...selectedCircleIds])}
        >
          {t('raceSelection.begin')}
        </Button>
      </Box>
    </Stack>
  )
}
