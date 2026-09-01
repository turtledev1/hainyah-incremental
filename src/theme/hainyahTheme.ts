import { createTheme } from '@mui/material/styles'

/** Hai holds the sun: warm gold. Yah holds the ledger: cold violet. */
const HAI_GOLD = '#d8a13a'
const YAH_VIOLET = '#7c6cf0'

export const hainyahTheme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
  defaultColorScheme: 'dark',
  colorSchemes: {
    dark: {
      palette: {
        primary: { main: HAI_GOLD, contrastText: '#1a1408' },
        secondary: { main: YAH_VIOLET },
        background: { default: '#0e0d13', paper: '#17161f' },
        success: { main: '#4caf7d' },
        warning: { main: '#e0a33e' },
        error: { main: '#e05c5c' },
        divider: 'rgba(255,255,255,0.09)',
      },
    },
    light: {
      palette: {
        primary: { main: '#9a6f16', contrastText: '#fffaf0' },
        secondary: { main: '#5645c9' },
        background: { default: '#f7f5f0', paper: '#ffffff' },
        divider: 'rgba(0,0,0,0.1)',
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    h1: { fontSize: '2.6rem', fontWeight: 600, letterSpacing: '0.02em' },
    h2: { fontSize: '1.7rem', fontWeight: 600 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    subtitle2: { fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.72rem' },
    body2: { fontSize: '0.86rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 300 },
    },
    MuiButton: {
      defaultProps: { size: 'small' },
    },
    MuiTab: {
      styleOverrides: { root: { minHeight: 44 } },
    },
  },
})

/** Numbers change every tick, so they are read in a tabular monospace face. */
export const NUMERIC_FONT_FAMILY =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
