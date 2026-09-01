import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ResourceId } from '../../game/model/ids'
import type { RealmView } from '../../game/selectors/realmView'
import { useGameStore } from '../../game/store/gameStore'
import { SectionCard } from '../components/SectionCard'
import { formatNumber } from '../format'

interface GatherPanelProps {
  readonly view: RealmView
  readonly hasAnyBuildings: boolean
}

export function GatherPanel({ view, hasAnyBuildings }: GatherPanelProps) {
  const registry = useGameStore((store) => store.registry)
  const gather = useGameStore((store) => store.gather)

  const gatherable = Object.keys(view.manualGatherAmounts) as ResourceId[]

  return (
    <SectionCard
      title="Your own hands"
      subtitle={
        hasAnyBuildings
          ? 'Still quicker than nothing, though your buildings have long since overtaken you.'
          : 'Ten empty acres and nobody on them yet. Everything starts here.'
      }
    >
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        {gatherable.map((resourceId) => {
          const resource = registry.resourcesById.get(resourceId)
          const amount = view.manualGatherAmounts[resourceId] ?? 0
          return (
            <Button
              key={resourceId}
              variant="outlined"
              onClick={() => gather(resourceId)}
              sx={{ minWidth: 150, justifyContent: 'space-between' }}
            >
              <span>{resource?.manualGather?.actionLabel ?? resourceId}</span>
              <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.75 }}>
                +{formatNumber(amount)}
              </Typography>
            </Button>
          )
        })}
      </Stack>
    </SectionCard>
  )
}
