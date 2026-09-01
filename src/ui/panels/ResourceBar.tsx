import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { RESOURCE_IDS } from '../../game/model/ids'
import { useGameStore } from '../../game/store/gameStore'
import type { GameState } from '../../game/model/state'
import type { RealmView } from '../../game/selectors/realmView'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { formatDuration, formatNumber, formatPerHour, formatRate, formatStockpile } from '../format'
import { contentKeys } from '../../i18n/contentKeys'

interface ResourceBarProps {
  readonly state: GameState
  readonly view: RealmView
}

interface ReadoutProps {
  readonly label: string
  readonly value: string
  readonly detail?: string
  readonly tooltip: string
  readonly emphasis?: 'positive' | 'negative' | 'neutral'
}

function Readout({ label, value, detail, tooltip, emphasis = 'neutral' }: ReadoutProps) {
  const detailColor =
    emphasis === 'positive' ? 'success.main' : emphasis === 'negative' ? 'error.main' : 'text.secondary'

  return (
    <Tooltip title={tooltip}>
      <Stack sx={{ minWidth: 96, gap: 0.1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Typography sx={{ fontFamily: NUMERIC_FONT_FAMILY, fontSize: '1.05rem', lineHeight: 1.2 }}>
          {value}
        </Typography>
        {detail ? (
          <Typography variant="caption" sx={{ fontFamily: NUMERIC_FONT_FAMILY, color: detailColor }}>
            {detail}
          </Typography>
        ) : null}
      </Stack>
    </Tooltip>
  )
}

export function ResourceBar({ state, view }: ResourceBarProps) {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)
  const doesNotEat = view.foodConsumptionPerCitizenPerSecond === 0

  return (
    <Box sx={{ display: 'grid',
        gap: 2,
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        px: 2,
        py: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper' }}>
      {RESOURCE_IDS.map((resourceId) => {
        const perSecond =
          resourceId === 'food' ? view.netFoodPerSecond : view.productionPerSecond[resourceId]
        return (
          <Readout
            key={resourceId}
            label={t(contentKeys.resourceName(resourceId))}
            value={formatStockpile(state.resources[resourceId])}
            detail={formatRate(perSecond)}
            emphasis={perSecond > 0 ? 'positive' : perSecond < 0 ? 'negative' : 'neutral'}
            tooltip={
              resourceId === 'food'
                ? doesNotEat
                  ? t('bar.doesNotHunger')
                  : t('bar.foodProduced', {
                      produced: formatRate(view.productionPerSecond.food),
                      eaten: formatNumber(view.foodConsumptionPerSecond),
                    })
                : t('bar.produced', { produced: formatRate(view.productionPerSecond[resourceId]) })
            }
          />
        )
      })}

      <Readout
        label={t('bar.citizens')}
        value={`${formatNumber(Math.floor(state.population))} / ${formatNumber(
          view.populationCapacity,
        )}`}
        detail={t('realm.idleCitizens', { count: view.idleCitizens })}
        tooltip={
          Number.isFinite(view.secondsUntilNextCitizen)
            ? t('bar.citizensTooltip', { arrival: view.secondsUntilNextCitizen })
            : view.freeHousingSlots <= 0
              ? t('bar.citizensFull')
              : t('bar.citizensNoFood')
        }
      />
      <Readout
        label={t('bar.acres')}
        value={`${formatNumber(state.acres)}`}
        detail={t('realm.freeAcres', { count: view.freeAcres })}
        tooltip={t('bar.acresTooltip')}
      />
      <Readout
        label={t('bar.army')}
        value={`${formatNumber(state.soldiersAtHome)} / ${formatNumber(view.armyCapacity)}`}
        detail={
          view.soldiersAway > 0 ? t('realm.soldiersAway', { count: view.soldiersAway }) : undefined
        }
        tooltip={t('bar.armyTooltip')}
      />
      <Readout
        label={t('bar.thieves')}
        value={`${formatNumber(state.thievesAtHome)} / ${formatNumber(view.thievesCapacity)}`}
        detail={
          view.thievesAway > 0 ? t('realm.thievesOut', { count: view.thievesAway }) : undefined
        }
        tooltip={t('bar.thievesTooltip')}
      />
      <Readout
        label={t('bar.mana')}
        value={`${formatStockpile(state.magic.mana)} / ${formatStockpile(view.manaCapacity)}`}
        detail={formatPerHour(view.manaRegenPerSecond)}
        tooltip={t('bar.manaTooltip')}
      />
    </Box>
  )
}
