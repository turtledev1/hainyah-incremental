import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ResourceAmounts } from '../../game/model/ids'
import type { GameState } from '../../game/model/state'
import { NUMERIC_FONT_FAMILY } from '../../theme/hainyahTheme'
import { amountEntries, formatNumber } from '../format'

interface CostListProps {
  readonly costs: ResourceAmounts
  readonly state: GameState
}

/** Costs the realm cannot currently meet are shown in the error colour. */
export function CostList({ costs, state }: CostListProps) {
  const entries = amountEntries(costs)
  if (entries.length === 0) {
    return null
  }

  return (
    <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: 1.25, rowGap: 0.25 }}>
      {entries.map(([resourceId, amount]) => (
        <Typography key={resourceId} variant="caption" sx={{ fontFamily: NUMERIC_FONT_FAMILY,
            color: state.resources[resourceId] >= amount ? 'text.secondary' : 'error.main' }}>
          {formatNumber(amount)} {resourceId}
        </Typography>
      ))}
    </Stack>
  )
}
