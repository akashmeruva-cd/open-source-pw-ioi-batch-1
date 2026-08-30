import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/** LOCKED FILE — Team 01 (Core Platform). See `web-student` for the rationale. */
const config = [...coreWebVitals, ...typescript, { ignores: ['.next/**', 'node_modules/**'] }]

export default config
