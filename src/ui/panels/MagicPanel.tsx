import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { GameState } from '../../game/model/state'
import type { RealmView, SpellView } from '../../game/selectors/realmView'
import { useGameStore } from '../../game/store/gameStore'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { CardGrid } from '../components/CardGrid'
import { SectionCard } from '../components/SectionCard'
import { summariseModifiers } from '../modifierLabels'
import { formatDuration, formatNumber, formatPerHour, formatStockpile } from '../format'
import { contentKeys } from '../../i18n/contentKeys'

interface MagicPanelProps {
  readonly state: GameState
  readonly view: RealmView
}

function SpellCard({ spell }: { readonly spell: SpellView }) {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)
  const cast = useGameStore((store) => store.cast)
  const isOnCooldown = spell.cooldownRemainingSeconds > 0

  return (
    <Card sx={{ opacity: spell.isUnlocked ? 1 : 0.5 }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t(contentKeys.spellName(spell.definition.id))}
          </Typography>
          <Stack direction="row" sx={{ gap: 0.5 }}>
            {spell.definition.effect.kind === 'buff' ? (
              <Tooltip
                title={
                  spell.definition.effect.shape === 'burst'
                    ? t('realm.burstExplained')
                    : t('realm.sustainedExplained')
                }
              >
                <Chip
                  size="small"
                  color={spell.definition.effect.shape === 'burst' ? 'warning' : 'default'}
                  variant={spell.definition.effect.shape === 'burst' ? 'filled' : 'outlined'}
                  label={t(
                    spell.definition.effect.shape === 'burst'
                      ? 'realm.spellShapeBurst'
                      : 'realm.spellShapeSustained',
                  )}
                />
              </Tooltip>
            ) : null}
            <Chip
              size="small"
              variant="outlined"
              label={t('realm.spellTier', { tier: spell.definition.tier })}
            />
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {t(contentKeys.spellDescription(spell.definition.id))}
        </Typography>

        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {spell.definition.effect.kind === 'instant'
            ? null
            : summariseModifiers(spell.definition.effect.modifiers, registry, t).map((effect) => (
                <Chip key={effect} size="small" variant="outlined" color="success" label={effect} />
              ))}
          {spell.definition.effect.kind === 'pendingBoost' ? (
            <Chip
              size="small"
              variant="outlined"
              label={t(
                spell.definition.effect.consumeOn === 'expedition'
                  ? 'realm.spellEffectOnAttack'
                  : 'realm.spellEffectOnHeist',
              )}
            />
          ) : null}
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {spell.definition.effect.kind === 'buff'
            ? t('realm.spellCost', {
                cost: formatNumber(spell.definition.manaCost),
                duration: spell.definition.effect.durationSeconds,
                cooldown: spell.definition.cooldownSeconds,
              })
            : t('realm.spellCostInstant', {
                cost: formatNumber(spell.definition.manaCost),
                cooldown: spell.definition.cooldownSeconds,
              })}
        </Typography>

        {isOnCooldown ? (
          <LinearProgress
            variant="determinate"
            value={Math.max(
              0,
              100 - (spell.cooldownRemainingSeconds / spell.definition.cooldownSeconds) * 100,
            )}
          />
        ) : null}

        <Tooltip title={spell.refusal ? t(`refusals.cast.${spell.refusal}`) : t('actions.castExplained')}>
          <span>
            <Button
              variant="contained"
              disabled={Boolean(spell.refusal)}
              onClick={() => cast(spell.definition.id)}
            >
              {isOnCooldown ? formatDuration(spell.cooldownRemainingSeconds) : t('actions.cast')}
            </Button>
          </span>
        </Tooltip>
      </CardContent>
    </Card>
  )
}

export function MagicPanel({ state, view }: MagicPanelProps) {
  const { t } = useTranslation()
  const activeBuffs = state.magic.activeBuffs
  const pendingBoosts = state.magic.pendingBoosts

  return (
    <Stack sx={{ gap: 2 }}>
      <SectionCard
        title={t('panels.circles.title')}
        subtitle={t('panels.circles.subtitle', { rate: formatPerHour(view.magicExperiencePerSecond) })}
      >
        <Stack sx={{ gap: 1.5 }}>
          {view.circles.map((circle) => {
            const nextThreshold = circle.experienceForNextTier
            const progress = nextThreshold
              ? Math.min(100, (circle.experience / nextThreshold) * 100)
              : 100
            return (
              <Stack key={circle.definition.id} sx={{ gap: 0.4 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {t(contentKeys.circleName(circle.definition.id))}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: NUMERIC_FONT_FAMILY }}>
                    {nextThreshold
                      ? t('realm.circleProgress', {
                          tier: circle.tiersUnlocked,
                          experience: formatStockpile(circle.experience),
                          threshold: formatNumber(nextThreshold),
                        })
                      : t('realm.circleMastered', { tier: circle.tiersUnlocked })}
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progress} color="secondary" />
                <Typography variant="caption" color="text.secondary">
                  {t(contentKeys.circleFlavor(circle.definition.id))}
                </Typography>
              </Stack>
            )
          })}
        </Stack>

        {activeBuffs.length > 0 || pendingBoosts.length > 0 ? (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
            {activeBuffs.map((buff) => (
              <Chip
                key={buff.spellId}
                color="secondary"
                size="small"
                label={t('realm.buffRunning', {
                  spellName: t(contentKeys.spellName(buff.spellId)),
                  remaining: formatDuration(buff.remainingSeconds),
                })}
              />
            ))}
            {pendingBoosts.map((boost) => (
              <Chip
                key={boost.spellId}
                color="primary"
                variant="outlined"
                size="small"
                label={t(
                  boost.consumeOn === 'expedition'
                    ? 'realm.boostAwaitsAttack'
                    : 'realm.boostAwaitsHeist',
                  { spellName: t(contentKeys.spellName(boost.spellId)) },
                )}
              />
            ))}
          </Stack>
        ) : null}
      </SectionCard>

      <SectionCard
        title={t('panels.spells.title')}
        subtitle={t('realm.manaSource', {
          pool: `${formatStockpile(state.magic.mana)}/${formatStockpile(view.manaCapacity)}`,
          rate: formatPerHour(view.manaRegenPerSecond),
        })}
      >
        <CardGrid minimumColumnWidth={250}>
          {view.spells.map((spell) => (
            <SpellCard key={spell.definition.id} spell={spell} />
          ))}
        </CardGrid>
      </SectionCard>
    </Stack>
  )
}
