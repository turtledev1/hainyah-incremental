import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

interface CardGridProps {
  readonly minimumColumnWidth?: number
  readonly children: ReactNode
}

/** CSS grid, not MUI's Grid, whose prop shape changes between major versions. */
export function CardGrid({ minimumColumnWidth = 260, children }: CardGridProps) {
  return (
    <Box sx={{ display: 'grid',
        gap: 1.5,
        gridTemplateColumns: `repeat(auto-fill, minmax(${minimumColumnWidth}px, 1fr))` }}>
      {children}
    </Box>
  )
}
