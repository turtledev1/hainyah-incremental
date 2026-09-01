import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import type { GameState } from '../../game/model/state'
import type { BuildingView, RealmView } from '../../game/selectors/realmView'
import { useGameStore } from '../../game/store/gameStore'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { CardGrid } from '../components/CardGrid'
import { CostList } from '../components/CostList'
import { SectionCard } from '../components/SectionCard'
import { describeWorkerContribution, workerRole } from '../buildingLabels'
import { formatNumber } from '../format'

interface BuildingsPanelProps {
  readonly state: GameState
  readonly view: RealmView
}

function WorkerControls({
  building,
  idleCitizens,
}: {
  readonly building: BuildingView
  readonly idleCitizens: number
}) {
  const { t } = useTranslation()
  const assign = useGameStore((store) => store.assign)
  const unassign = useGameStore((store) => store.unassign)
  const fillWorkers = useGameStore((store) => store.fillWorkers)
  const clearWorkers = useGameStore((store) => store.clearWorkers)

  if (building.definition.workerSlotsPerBuilding === 0) {
    return null
  }

  const nobodyToPlace = building.workerSlots - building.workers <= 0 || idleCitizens < 1

  return (
    <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.25 }}>
      <IconButton
        size="small"
        aria-label={t('actions.removeWorker', { buildingName: building.definition.name })}
        disabled={building.workers === 0}
        onClick={() => unassign(building.definition.id, 1)}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography variant="body2" sx={{ minWidth: 104, textAlign: 'center' }}>
        <span style={{ fontFamily: NUMERIC_FONT_FAMILY }}>
          {building.workers}/{building.workerSlots}
        </span>{' '}
        {workerRole(building.definition, t)}
      </Typography>
      <IconButton
        size="small"
        aria-label={t('actions.assignWorker', { buildingName: building.definition.name })}
        disabled={nobodyToPlace}
        onClick={() => assign(building.definition.id, 1)}
      >
        <AddIcon fontSize="small" />
      </IconButton>
      <Tooltip title={t('realm.fillSlotsExplained')}>
        <span>
          <Button
            size="small"
            variant="text"
            disabled={nobodyToPlace}
            onClick={() => fillWorkers(building.definition.id)}
          >
            {t('realm.fillSlots')}
          </Button>
        </span>
      </Tooltip>
      <Tooltip title={t('realm.clearSlotsExplained')}>
        <span>
          <Button
            size="small"
            variant="text"
            disabled={building.workers === 0}
            onClick={() => clearWorkers(building.definition.id)}
          >
            {t('realm.clearSlots')}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  )
}

function BuildingCard({
  building,
  state,
  bulkSteps,
  idleCitizens,
}: {
  readonly building: BuildingView
  readonly state: GameState
  readonly bulkSteps: readonly number[]
  readonly idleCitizens: number
}) {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)
  const build = useGameStore((store) => store.build)
  const demolish = useGameStore((store) => store.demolish)

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {building.definition.name}
          </Typography>
          <Typography sx={{ fontFamily: NUMERIC_FONT_FAMILY }}>{formatNumber(building.count)}</Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {building.definition.flavor}
        </Typography>

        {describeWorkerContribution(
          building.definition,
          registry,
          building.outputPerWorkerPerSecond,
          t,
        ).map((contribution) => (
          <Typography key={contribution} variant="caption" color="success.main">
            {contribution}
          </Typography>
        ))}

        <CostList costs={building.nextCost} state={state} />

        <Stack sx={{ gap: 0.75 }}>
          <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tooltip
              title={
                building.refusal
                  ? t(`refusals.construction.${building.refusal}`)
                  : t('actions.buildOne')
              }
            >
              <span>
                <Button
                  variant="contained"
                  disabled={Boolean(building.refusal)}
                  onClick={() => build(building.definition.id)}
                >
                  {t('actions.build')}
                </Button>
              </span>
            </Tooltip>
            {bulkSteps.map((step) => (
              <Tooltip key={step} title={t('realm.buildManyExplained', { count: step })}>
                <span>
                  <Button
                    variant="outlined"
                    disabled={Boolean(building.refusal)}
                    onClick={() => build(building.definition.id, step)}
                  >
                    {t('realm.buildMany', { count: step })}
                  </Button>
                </span>
              </Tooltip>
            ))}
          </Stack>
          <WorkerControls building={building} idleCitizens={idleCitizens} />
        </Stack>

        <Tooltip title={t('actions.razeExplained')}>
          <Button
            variant="text"
            color="error"
            sx={{
              alignSelf: 'flex-start',
              visibility: building.count > 0 ? 'visible' : 'hidden',
            }}
            onClick={() => demolish(building.definition.id)}
          >
            {t('actions.razeOne')}
          </Button>
        </Tooltip>
      </CardContent>
    </Card>
  )
}

export function BuildingsPanel({ state, view }: BuildingsPanelProps) {
  const { t } = useTranslation()
  const inProgress = state.constructionQueue[0]
  const registry = useGameStore((store) => store.registry)

  return (
    <SectionCard
      title={t('panels.buildings.title')}
      subtitle={t('realm.acresInUse', { used: view.occupiedAcres, total: state.acres })}
    >
      <Stack sx={{ gap: 0.5, minHeight: 34 }}>
        <Typography variant="caption" color="text.secondary">
          {inProgress
            ? `Building ${registry.buildingsById.get(inProgress.buildingId)?.name}${
                state.constructionQueue.length > 1
                  ? ` ${t('realm.queuedBehind', { count: state.constructionQueue.length - 1 })}`
                  : ''
              }`
            : t('realm.nothingUnderConstruction')}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={
            inProgress
              ? Math.max(
                  0,
                  Math.min(100, (1 - inProgress.secondsRemaining / inProgress.totalSeconds) * 100),
                )
              : 0
          }
          sx={{ opacity: inProgress ? 1 : 0.25 }}
        />
      </Stack>

      <CardGrid minimumColumnWidth={300}>
        {view.buildings.map((building) => (
          <BuildingCard
            key={building.definition.id}
            building={building}
            state={state}
            bulkSteps={view.bulkSteps}
            idleCitizens={view.idleCitizens}
          />
        ))}
      </CardGrid>
    </SectionCard>
  )
}
