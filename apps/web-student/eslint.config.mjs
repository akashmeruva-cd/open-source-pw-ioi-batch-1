import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/**
 * LOCKED FILE — Team 01 (Core Platform).
 *
 * `eslint-config-next` 16 ships flat config directly, so there is no FlatCompat
 * shim here. Disabling a rule repo-wide needs an issue and a lead's review;
 * silencing one line with `// eslint-disable-next-line` plus a reason comment is
 * usually the better fix.
 */
const config = [...coreWebVitals, ...typescript, { ignores: ['.next/**', 'node_modules/**'] }]

export default config
