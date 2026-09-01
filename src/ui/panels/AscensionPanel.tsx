import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { GameState } from '../../game/model/state'
import type { RealmView } from '../../game/selectors/realmView'
import { useGameStore } from '../../game/store/gameStore'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { CostList } from '../components/CostList'
import { SectionCard } from '../components/SectionCard'

interface AscensionPanelProps {
  readonly state: GameState
  readonly view: RealmView
}

export function AscensionPanel({ state, view }: AscensionPanelProps) {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)
  const advanceAscension = useGameStore((store) => store.advanceAscension)
  const { nextStage, completedStages, totalStages, refusal } = view.ascension

  return (
    <Stack sx={{ gap: 2 }}>
      <SectionCard
        title={t('panels.wonder.title')}
        subtitle={t('panels.wonder.subtitle')}
      >
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="caption" sx={{ fontFamily: NUMERIC_FONT_FAMILY }}>
            {t('panels.wonder.stageProgress', { completed: completedStages, total: totalStages })}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(completedStages / totalStages) * 100}
            color="primary"
          />
        </Stack>

        {nextStage ? (
          <Stack sx={{ gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('panels.wonder.nextStage', { stageName: nextStage.name })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {nextStage.flavor}
            </Typography>
            <CostList costs={nextStage.costs} state={state} />
            <Tooltip title={refusal ? t(`refusals.ascension.${refusal}`) : t('actions.build')}>
              <span>
                <Button variant="contained" disabled={Boolean(refusal)} onClick={advanceAscension}>
                  {t('panels.wonder.buildStage', { stageName: nextStage.name })}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        ) : (
          <Typography variant="body2" color="primary">
            {t('panels.wonder.standing')}
          </Typography>
        )}
      </SectionCard>

      <SectionCard title={t('panels.wonder.stagesTitle')} subtitle={t('panels.wonder.stagesSubtitle')}>
        <Stack sx={{ gap: 1 }}>
          {registry.ascensionStages.map((stage) => (
            <Stack key={stage.index} direction="row" sx={{ opacity: stage.index <= completedStages ? 1 : 0.55, justifyContent: "space-between", alignItems: "baseline", gap: 2 }}>
              <Typography variant="body2">
                {stage.index}. {stage.name}
              </Typography>
              {stage.index <= completedStages ? (
                <Typography variant="caption" color="success.main">
                  {t('panels.wonder.built')}
                </Typography>
              ) : (
                <CostList costs={stage.costs} state={state} />
              )}
            </Stack>
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  )
}
