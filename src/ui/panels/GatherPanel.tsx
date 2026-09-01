import { useTranslation } from 'react-i18next'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ResourceId } from '../../game/model/ids'
import type { RealmView } from '../../game/selectors/realmView'
import { useGameStore } from '../../game/store/gameStore'
import { SectionCard } from '../components/SectionCard'
import { formatNumber } from '../format'
import { contentKeys } from '../../i18n/contentKeys'

interface GatherPanelProps {
  readonly view: RealmView
  readonly hasAnyBuildings: boolean
}

export function GatherPanel({ view, hasAnyBuildings }: GatherPanelProps) {
  const { t } = useTranslation()
  const registry = useGameStore((store) => store.registry)
  const gather = useGameStore((store) => store.gather)

  const gatherable = Object.keys(view.manualGatherAmounts) as ResourceId[]

  return (
    <SectionCard
      title={t('panels.gather.title')}
      subtitle={t(hasAnyBuildings ? 'panels.gather.laterSubtitle' : 'panels.gather.openingSubtitle')}
    >
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        {gatherable.map((resourceId) => {
          const amount = view.manualGatherAmounts[resourceId] ?? 0
          return (
            <Button
              key={resourceId}
              variant="outlined"
              onClick={() => gather(resourceId)}
              sx={{ minWidth: 150, justifyContent: 'space-between' }}
            >
              <span>{t(contentKeys.gatherAction(resourceId))}</span>
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
