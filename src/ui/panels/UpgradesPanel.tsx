import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { UpgradeLineId } from '../../game/model/ids'
import type { GameState } from '../../game/model/state'
import type { RealmView, UpgradeView } from '../../game/selectors/realmView'
import { useGameStore } from '../../game/store/gameStore'
import { CardGrid } from '../components/CardGrid'
import { CostList } from '../components/CostList'
import { SectionCard } from '../components/SectionCard'
import { stackModifiers, summariseModifiers, upgradeTotal } from '../modifierLabels'
import { describeUnmetRequirements } from '../upgradeLabels'
import { contentKeys } from '../../i18n/contentKeys'

interface UpgradesPanelProps {
  readonly state: GameState
  readonly view: RealmView
}

function UpgradeCard({
  upgrade,
  state,
}: {
  readonly upgrade: UpgradeView
  readonly state: GameState
}) {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)
  const buyUpgrade = useGameStore((store) => store.buyUpgrade)
  const isRepeatable = upgrade.maximumPurchases > 1
  const isExhausted = upgrade.purchases >= upgrade.maximumPurchases
  const unmetRequirements = describeUnmetRequirements(upgrade.definition, state, registry, t)

  return (
    <Card sx={{ opacity: isExhausted ? 0.65 : 1 }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t(contentKeys.upgradeName(upgrade.definition.id))}
          </Typography>
          {isRepeatable ? (
            <Chip
              size="small"
              label={`${upgrade.purchases}/${upgrade.maximumPurchases}`}
              variant="outlined"
            />
          ) : upgrade.purchases > 0 ? (
            <Chip size="small" color="primary" label={t('actions.adopted')} />
          ) : null}
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {t(contentKeys.upgradeFlavor(upgrade.definition.id))}
        </Typography>

        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {summariseModifiers(
            upgrade.definition.modifiers,
            registry,
            t,
            upgradeTotal,
          ).map((effect) => (
            <Chip key={effect} size="small" variant="outlined" color="success" label={effect} />
          ))}
        </Stack>

        {isRepeatable ? (
          <Stack sx={{ gap: 0.25 }}>
            {upgrade.purchases > 0 ? (
              <Typography variant="caption" color="success.main">
                {t('realm.repeatableSoFar', {
                  effects: summariseModifiers(
                    stackModifiers(upgrade.definition.modifiers, upgrade.purchases),
                    registry,
                    t,
                  ).join(', '),
                })}
              </Typography>
            ) : null}
            {upgrade.purchases < upgrade.maximumPurchases ? (
              <Typography variant="caption" color="text.secondary">
                {t('realm.repeatableAtMaximum', {
                count: upgrade.maximumPurchases,
                  effects: summariseModifiers(
                    stackModifiers(upgrade.definition.modifiers, upgrade.maximumPurchases),
                    registry,
                    t,
                  ).join(', '),
                })}
              </Typography>
            ) : null}
          </Stack>
        ) : null}

        {unmetRequirements.length > 0 ? (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {unmetRequirements.map((requirement) => (
              <Chip
                key={requirement}
                size="small"
                variant="outlined"
                color="warning"
                label={requirement}
              />
            ))}
          </Stack>
        ) : null}

        {isExhausted ? null : <CostList costs={upgrade.cost} state={state} />}

        {isExhausted ? null : (
          <Tooltip
            title={
              upgrade.refusal ? t(`refusals.upgrade.${upgrade.refusal}`) : t('actions.adoptExplained')
            }
          >
            <span>
              <Button
                variant="contained"
                disabled={Boolean(upgrade.refusal)}
                onClick={() => buyUpgrade(upgrade.definition.id)}
              >
                {t(isRepeatable && upgrade.purchases > 0 ? 'actions.adoptAgain' : 'actions.adopt')}
              </Button>
            </span>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  )
}

export function UpgradesPanel({ state, view }: UpgradesPanelProps) {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)

  const upgradesByLine = new Map<UpgradeLineId, UpgradeView[]>()
  for (const upgrade of view.upgrades) {
    if (!upgrade.isVisible) {
      continue
    }
    const existing = upgradesByLine.get(upgrade.definition.lineId) ?? []
    existing.push(upgrade)
    upgradesByLine.set(upgrade.definition.lineId, existing)
  }

  if (upgradesByLine.size === 0) {
    return (
      <SectionCard
        title={t('panels.improvements.title')}
        subtitle={t('panels.improvements.emptySubtitle')}
      >
        <Typography variant="body2" color="text.secondary">
          {t('panels.improvements.emptyBody')}
        </Typography>
      </SectionCard>
    )
  }

  return (
    <Stack sx={{ gap: 2 }}>
      {registry.upgradeLines.map((line) => {
        const upgrades = upgradesByLine.get(line.id)
        if (!upgrades || upgrades.length === 0) {
          return null
        }
        return (
          <SectionCard
            key={line.id}
            title={t(contentKeys.upgradeLineName(line.id))}
            subtitle={t(contentKeys.upgradeLineFlavor(line.id))}
          >
            <CardGrid minimumColumnWidth={240}>
              {upgrades.map((upgrade) => (
                <UpgradeCard key={upgrade.definition.id} upgrade={upgrade} state={state} />
              ))}
            </CardGrid>
          </SectionCard>
        )
      })}
    </Stack>
  )
}
