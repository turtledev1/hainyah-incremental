import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { GameState } from '../../game/model/state'
import type { RealmView, ThieveryTargetView } from '../../game/selectors/realmView'
import { useGameStore } from '../../game/store/gameStore'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { CardGrid } from '../components/CardGrid'
import { SectionCard } from '../components/SectionCard'
import { BALANCE } from '../../game/content/balance'
import { formatAmounts, formatDuration, formatPercentage } from '../format'
import { contentKeys } from '../../i18n/contentKeys'

interface ThieveryPanelProps {
  readonly state: GameState
  readonly view: RealmView
}

function MarkCard({ target }: { readonly target: ThieveryTargetView }) {
  const { t } = useTranslation()
  const steal = useGameStore((store) => store.steal)

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t(contentKeys.thieveryTargetName(target.definition.id))}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(contentKeys.thieveryTargetFlavor(target.definition.id))}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: NUMERIC_FONT_FAMILY }}>
          {t('panels.thievery.targetSummary', {
            count: target.definition.requiredThieves,
            success: formatPercentage(target.successChance),
            duration: formatDuration(target.definition.durationSeconds),
          })}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: NUMERIC_FONT_FAMILY }}>
          {t('panels.thievery.takes', { loot: formatAmounts(target.definition.loot) })}
        </Typography>
        <Tooltip
          title={target.refusal ? t(`refusals.heist.${target.refusal}`) : t('actions.sendThemOut')}
        >
          <span>
            <Button
              variant="contained"
              disabled={Boolean(target.refusal)}
              onClick={() => steal(target.definition.id)}
            >
              {t('actions.runTheJob')}
            </Button>
          </span>
        </Tooltip>
      </CardContent>
    </Card>
  )
}

export function ThieveryPanel({ state, view }: ThieveryPanelProps) {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)

  return (
    <Stack sx={{ gap: 2 }}>
      {state.heists.length > 0 ? (
        <SectionCard
          title={t('panels.thievery.jobsTitle')}
          subtitle={t('panels.thievery.jobsSubtitle')}
        >
          <Stack sx={{ gap: 1.25 }}>
            {state.heists.map((heist) => {
              const target = registry.thieveryTargetsById.get(heist.targetId)
              return (
                <Stack key={heist.id} sx={{ gap: 0.4 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2">
                      {t('realm.thievesAtWork', {
                        count: heist.thieves,
                        targetName: target
                          ? t(contentKeys.thieveryTargetName(target.id))
                          : t('realm.somewhere'),
                      })}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: NUMERIC_FONT_FAMILY }}>
                      {formatDuration(heist.secondsRemaining)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(0, Math.min(100, (1 - heist.secondsRemaining / heist.totalSeconds) * 100))}
                    color="secondary"
                  />
                </Stack>
              )
            })}
          </Stack>
        </SectionCard>
      ) : null}

      <SectionCard
        title={t('panels.thievery.title')}
        subtitle={t('realm.thievesIdle', {
          count: state.thievesAtHome,
          ceiling: formatPercentage(BALANCE.thievery.maximumSuccessChance),
        })}
      >
        <CardGrid minimumColumnWidth={250}>
          {view.thieveryTargets.map((target) => (
            <MarkCard key={target.definition.id} target={target} />
          ))}
        </CardGrid>
      </SectionCard>
    </Stack>
  )
}
