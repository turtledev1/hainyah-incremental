import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { GameState } from '../../game/model/state'
import type { ConquestTargetView, RealmView } from '../../game/selectors/realmView'
import { useGameStore } from '../../game/store/gameStore'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { CardGrid } from '../components/CardGrid'
import { SectionCard } from '../components/SectionCard'
import { formatAmounts, formatDuration, formatNumber } from '../format'
import { contentKeys } from '../../i18n/contentKeys'

interface WarfarePanelProps {
  readonly state: GameState
  readonly view: RealmView
}

function TargetCard({
  target,
  soldiersAtHome,
}: {
  readonly target: ConquestTargetView
  readonly soldiersAtHome: number
}) {
  const { t } = useTranslation()
  const attack = useGameStore((store) => store.attack)
  const [requestedSoldiers, setRequestedSoldiers] = useState<number>(target.definition.recommendedSoldiers)

  const refusal = target.refusalAtRecommendedForce
  const canSend =
    target.placesFree > 0 && requestedSoldiers >= 1 && requestedSoldiers <= soldiersAtHome
  const powerPerSoldier =
    target.estimatedAttackPower / Math.max(1, target.definition.recommendedSoldiers)
  const projectedPower = powerPerSoldier * requestedSoldiers
  const isFavourable = projectedPower >= target.estimatedDefense

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.9 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t(contentKeys.conquestTargetName(target.definition.id))}
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            label={t('realm.timesTaken', { count: target.timesConquered })}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {t(contentKeys.conquestTargetFlavor(target.definition.id))}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: NUMERIC_FONT_FAMILY }}>
          {t('panels.conquest.targetSummary', {
            acres: formatNumber(target.definition.acresGained),
            garrison: t('realm.targetGarrison', {
              strength: formatNumber(target.estimatedDefense),
            }),
            travel: formatDuration(target.estimatedLegSeconds),
          })}
          {' · '}
          {t('realm.placesFree', {
            count: target.placesFree,
            places: target.definition.placesInTheWorld,
          })}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: NUMERIC_FONT_FAMILY }}>
          {t('panels.conquest.plunder', { loot: formatAmounts(target.definition.plunder, t) })}
        </Typography>

        <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
          <TextField
            size="small"
            type="number"
            label={t('panels.conquest.soldiersField')}
            value={requestedSoldiers}
            onChange={(event) => setRequestedSoldiers(Number(event.target.value))}
            sx={{ width: 110 }}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
          />
          <Typography variant="caption" color={isFavourable ? 'success.main' : 'error.main'} sx={{ fontFamily: NUMERIC_FONT_FAMILY }}>
            {t('panels.conquest.power', { power: formatNumber(projectedPower) })}
          </Typography>
        </Stack>

        <Tooltip
          title={
            target.placesFree <= 0
              ? t('refusals.expedition.everyPlaceUnderAttack')
              : refusal && requestedSoldiers === target.definition.recommendedSoldiers
              ? t(`refusals.expedition.${refusal}`)
              : t('realm.forceAdvice', {
                  count: target.definition.recommendedSoldiers,
                  verdict: t(isFavourable ? 'realm.forceLooksEnough' : 'realm.forceLooksShort'),
                })
          }
        >
          <span>
            <Button
              variant="contained"
              disabled={!canSend}
              onClick={() => attack(target.definition.id, requestedSoldiers)}
            >
              {t('actions.march')}
            </Button>
          </span>
        </Tooltip>
      </CardContent>
    </Card>
  )
}

export function WarfarePanel({ state, view }: WarfarePanelProps) {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)

  return (
    <Stack sx={{ gap: 2 }}>
      {state.expeditions.length > 0 ? (
        <SectionCard
          title={t('panels.conquest.campaignTitle')}
          subtitle={t('panels.conquest.campaignSubtitle')}
        >
          <Stack sx={{ gap: 1.25 }}>
            {state.expeditions.map((expedition) => {
              const target = registry.conquestTargetsById.get(expedition.targetId)
              const progress = Math.max(
                0,
                Math.min(100, (1 - expedition.secondsRemaining / expedition.totalPhaseSeconds) * 100),
              )
              return (
                <Stack key={expedition.id} sx={{ gap: 0.4 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2">
                      {t('realm.soldiersOnCampaign', {
                        count: expedition.soldiers,
                        activity: t(
                          expedition.phase === 'travelling'
                            ? 'realm.marchingOn'
                            : 'realm.returningFrom',
                          {
                            targetName: t(
                              contentKeys.conquestTargetName(expedition.targetId),
                            ),
                          },
                        ),
                      })}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: NUMERIC_FONT_FAMILY }}>
                      {formatDuration(expedition.secondsRemaining)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color={expedition.phase === 'travelling' ? 'primary' : 'success'}
                  />
                  {expedition.outcomeSucceeded ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: NUMERIC_FONT_FAMILY }}
                    >
                      {t('panels.conquest.carryingHome', {
                        acres: formatNumber(expedition.outcomeAcresGained),
                        loot: formatAmounts(expedition.outcomePlunder, t),
                      })}
                    </Typography>
                  ) : null}
                </Stack>
              )
            })}
          </Stack>
        </SectionCard>
      ) : null}

      <SectionCard
        title={t('panels.conquest.title')}
        subtitle={t('panels.conquest.subtitle')}
      >
        <CardGrid minimumColumnWidth={280}>
          {view.conquestTargets
            .filter((target) => target.isRevealed)
            .map((target) => (
            <TargetCard
              key={target.definition.id}
              target={target}
              soldiersAtHome={state.soldiersAtHome}
            />
          ))}
        </CardGrid>
      </SectionCard>
    </Stack>
  )
}
