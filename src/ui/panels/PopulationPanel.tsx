import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { GameState } from '../../game/model/state'
import type { RealmView } from '../../game/selectors/realmView'
import { useGameStore } from '../../game/store/gameStore'
import { SectionCard } from '../components/SectionCard'
import { formatNumber, formatRate } from '../format'

/** A citizen on the way, no housing for one, or no food to raise one on. */
function describeNextCitizen(view: RealmView, translate: TFunction): string {
  if (Number.isFinite(view.secondsUntilNextCitizen)) {
    return translate('realm.nextCitizenIn', { arrival: view.secondsUntilNextCitizen })
  }
  return view.freeHousingSlots <= 0
    ? translate('realm.nextCitizenNeedsHousing')
    : translate('realm.nextCitizenNeedsFood')
}

/** A greyed Recruit button with no reason is the barracks system's whole confusion. */
function describeRecruitmentBlock(
  role: 'soldiers' | 'thieves',
  view: RealmView,
  roomLeft: number,
  buildingsStanding: number,
  translate: TFunction,
): string | undefined {
  const prefix = role === 'soldiers' ? 'realm.soldiers' : 'realm.thieves'
  if (buildingsStanding === 0) {
    return translate(role === 'soldiers' ? 'realm.soldiersNeedBarracks' : 'realm.thievesNeedGuild')
  }
  if (roomLeft < 1) {
    const capacity = role === 'soldiers' ? view.armyCapacity : view.thievesCapacity
    return translate(
      capacity === 0
        ? `${prefix}Need${role === 'soldiers' ? 'DrillMasters' : 'Fences'}`
        : `${prefix}AtCapacity`,
    )
  }
  if (view.idleCitizens < 1) {
    return translate(`${prefix}NeedIdleCitizens`)
  }
  return undefined
}

interface PopulationPanelProps {
  readonly state: GameState
  readonly view: RealmView
}

const BULK_RECRUIT_COUNT = 10

export function PopulationPanel({ state, view }: PopulationPanelProps) {
  const { t } = useTranslation()
  const recruitSoldiers = useGameStore((store) => store.recruitSoldiers)
  const dismissSoldiers = useGameStore((store) => store.dismissSoldiers)
  const recruitThieves = useGameStore((store) => store.recruitThieves)
  const dismissThieves = useGameStore((store) => store.dismissThieves)

  const soldierRoomLeft = view.armyCapacity - (state.soldiersAtHome + view.soldiersAway)
  const thiefRoomLeft = view.thievesCapacity - (state.thievesAtHome + view.thievesAway)
  const soldierBlock = describeRecruitmentBlock(
    'soldiers',
    view,
    soldierRoomLeft,
    state.buildings.barracks,
    t,
  )
  const thiefBlock = describeRecruitmentBlock('thieves', view, thiefRoomLeft, state.buildings.thievesGuild, t)

  return (
    <SectionCard
      title={t('panels.people.title')}
      subtitle={
        view.foodConsumptionPerCitizenPerSecond === 0
          ? t('realm.doesNotHunger')
          : t('realm.eatingRate', { rate: formatNumber(view.foodConsumptionPerSecond) })
      }
    >
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 3 }}>
        <Stack sx={{ gap: 0.25, minWidth: 190 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('panels.people.idleCitizens')}
          </Typography>
          <Typography variant="h3">{formatNumber(view.idleCitizens)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {describeNextCitizen(view, t)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={view.progressTowardsNextCitizen * 100}
            sx={{ mt: 0.5, opacity: Number.isFinite(view.secondsUntilNextCitizen) ? 1 : 0.3 }}
          />
        </Stack>

        <Stack sx={{ gap: 0.75 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('panels.people.soldiers', {
              home: formatNumber(state.soldiersAtHome),
              capacity: formatNumber(view.armyCapacity),
            })}
          </Typography>
          {soldierBlock ? (
            <Typography variant="caption" color="warning.main" sx={{ maxWidth: 260 }}>
              {soldierBlock}
            </Typography>
          ) : null}
          <Stack direction="row" sx={{ gap: 0.75 }}>
            <Tooltip title={soldierBlock ?? t('actions.recruitSoldierExplained')}>
              <span>
                <Button variant="outlined" disabled={Boolean(soldierBlock)} onClick={() => recruitSoldiers(1)}>
                  {t('actions.recruitOne')}
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="outlined"
              disabled={Boolean(soldierBlock)}
              onClick={() => recruitSoldiers(BULK_RECRUIT_COUNT)}
            >
              {t('actions.recruitMany', { count: BULK_RECRUIT_COUNT })}
            </Button>
            <Button
              variant="text"
              disabled={state.soldiersAtHome < 1}
              onClick={() => dismissSoldiers(BULK_RECRUIT_COUNT)}
            >
              {t('actions.dismissMany', { count: BULK_RECRUIT_COUNT })}
            </Button>
          </Stack>
        </Stack>

        <Stack sx={{ gap: 0.75 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('panels.people.thieves', {
              home: formatNumber(state.thievesAtHome),
              capacity: formatNumber(view.thievesCapacity),
            })}
          </Typography>
          {thiefBlock ? (
            <Typography variant="caption" color="warning.main" sx={{ maxWidth: 260 }}>
              {thiefBlock}
            </Typography>
          ) : null}
          <Stack direction="row" sx={{ gap: 0.75 }}>
            <Tooltip title={thiefBlock ?? t('actions.recruitThiefExplained')}>
              <span>
                <Button variant="outlined" disabled={Boolean(thiefBlock)} onClick={() => recruitThieves(1)}>
                  {t('actions.recruitOne')}
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="outlined"
              disabled={Boolean(thiefBlock)}
              onClick={() => recruitThieves(BULK_RECRUIT_COUNT)}
            >
              {t('actions.recruitMany', { count: BULK_RECRUIT_COUNT })}
            </Button>
            <Button
              variant="text"
              disabled={state.thievesAtHome < 1}
              onClick={() => dismissThieves(BULK_RECRUIT_COUNT)}
            >
              {t('actions.dismissMany', { count: BULK_RECRUIT_COUNT })}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </SectionCard>
  )
}
