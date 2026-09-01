import type { ReactNode } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface SectionCardProps {
  readonly title: string
  readonly subtitle?: string
  readonly action?: ReactNode
  readonly children: ReactNode
}

export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
          <Stack sx={{ gap: 0.25 }}>
            <Typography variant="h3">{title}</Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Stack>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  )
}
