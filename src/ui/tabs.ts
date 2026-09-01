import type { GameState } from '../game/model/state'
import type { RealmView } from '../game/selectors/realmView'

export type TabKey =
  | 'realm'
  | 'improvements'
  | 'magic'
  | 'conquest'
  | 'thievery'
  | 'wonder'
  | 'settings'

interface TabDefinition {
  readonly key: TabKey
  readonly labelKey: string
  /** Absent means the tab is always there. */
  readonly isUnlocked?: (state: GameState, view: RealmView) => boolean
}

/** A tab appears when the thing behind it becomes real. */
export const TAB_DEFINITIONS: readonly TabDefinition[] = [
  { key: 'realm', labelKey: 'tabs.realm' },
  {
    key: 'improvements',
    labelKey: 'tabs.improvements',
    isUnlocked: (_state, view) => view.upgrades.some((upgrade) => upgrade.isVisible),
  },
  { key: 'magic', labelKey: 'tabs.magic', isUnlocked: (state) => state.buildings.temple > 0 },
  {
    key: 'conquest',
    labelKey: 'tabs.conquest',
    isUnlocked: (state) => state.buildings.barracks > 0,
  },
  {
    key: 'thievery',
    labelKey: 'tabs.thievery',
    isUnlocked: (state) => state.buildings.thievesGuild > 0,
  },
  {
    key: 'wonder',
    labelKey: 'tabs.wonder',
    isUnlocked: (state) => state.highestConquestTierDefeated > 0,
  },
  { key: 'settings', labelKey: 'tabs.settings' },
]

export function unlockedTabs(state: GameState, view: RealmView): readonly TabDefinition[] {
  return TAB_DEFINITIONS.filter((tab) => tab.isUnlocked?.(state, view) ?? true)
}

/** Razing the last temple should not leave the player staring at a tab that is gone. */
export function tabToShow(requested: TabKey, state: GameState, view: RealmView): TabKey {
  return unlockedTabs(state, view).some((tab) => tab.key === requested) ? requested : 'realm'
}
