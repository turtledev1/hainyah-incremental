import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import type { GameState } from '../../game/model/state'
import { useGameStore } from '../../game/store/gameStore'
import { useRealmView } from '../hooks/useRealmView'
import { AscensionPanel } from '../panels/AscensionPanel'
import { BuildingsPanel } from '../panels/BuildingsPanel'
import { EventLogPanel } from '../panels/EventLogPanel'
import { GatherPanel } from '../panels/GatherPanel'
import { MagicPanel } from '../panels/MagicPanel'
import { PopulationPanel } from '../panels/PopulationPanel'
import { ResourceBar } from '../panels/ResourceBar'
import { SettingsPanel } from '../panels/SettingsPanel'
import { ThieveryPanel } from '../panels/ThieveryPanel'
import { UpgradesPanel } from '../panels/UpgradesPanel'
import { WarfarePanel } from '../panels/WarfarePanel'
import { formatDuration } from '../format'
import { tabToShow, unlockedTabs, type TabKey } from '../tabs'
import { contentKeys } from '../../i18n/contentKeys'
import { RacePanel } from '../panels/RacePanel'

export function GameScreen({ state }: { readonly state: GameState }) {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)
  const view = useRealmView(state)
  const [requestedTab, setRequestedTab] = useState<TabKey>('realm')
  const activeTab = tabToShow(requestedTab, state, view)

  const race = registry.racesById.get(state.raceId)

  return (
    <Stack sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 1.5, md: 3 }, py: 3, gap: 2 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem' }}>
          Hainyah
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('realm.runHeadline', {
            raceName: t(contentKeys.raceName(state.raceId)),
            played: formatDuration(state.elapsedSeconds),
            circles: view.circles
              .map((circle) => t(contentKeys.circleName(circle.definition.id)))
              .join(' & '),
          })}
        </Typography>
      </Stack>

      <ResourceBar state={state} view={view} />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' } }}>
        <Stack sx={{ minWidth: 0, gap: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_event, nextTab: TabKey) => setRequestedTab(nextTab)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {unlockedTabs(state, view).map((tab) => (
              <Tab key={tab.key} value={tab.key} label={t(tab.labelKey)} />
            ))}
          </Tabs>

          {activeTab === 'realm' ? (
            <Stack sx={{ gap: 2 }}>
              <GatherPanel
                view={view}
                hasAnyBuildings={view.buildings.some((building) => building.count > 0)}
              />
              <PopulationPanel state={state} view={view} />
              <BuildingsPanel state={state} view={view} />
              <RacePanel raceId={state.raceId} />
            </Stack>
          ) : null}
          {activeTab === 'improvements' ? <UpgradesPanel state={state} view={view} /> : null}
          {activeTab === 'magic' ? <MagicPanel state={state} view={view} /> : null}
          {activeTab === 'conquest' ? <WarfarePanel state={state} view={view} /> : null}
          {activeTab === 'thievery' ? <ThieveryPanel state={state} view={view} /> : null}
          {activeTab === 'wonder' ? <AscensionPanel state={state} view={view} /> : null}
          {activeTab === 'settings' ? <SettingsPanel state={state} /> : null}
        </Stack>

        <Box sx={{ minWidth: 0 }}>
          <EventLogPanel state={state} />
        </Box>
      </Box>
    </Stack>
  )
}
