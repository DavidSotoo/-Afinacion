import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `server/` is a separate CommonJS Node.js project (require/module/process),
  // not part of this Vite/React app — linting it with browser+ESM globals
  // produced ~830 false-positive no-undef errors. `admin-app/` has its own
  // eslint.config.js and lint script.
  globalIgnores(['dist', 'server', 'admin-app']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // This app's data-fetching effects (App.jsx, YMMSearch.jsx, ProductPage.jsx)
      // legitimately set loading/reset state at the top of the effect before
      // fetching — the documented valid use of useEffect for syncing with an
      // external system (network, URL params). The rule can't distinguish that
      // from genuine "you might not need an effect" misuse, so it's disabled
      // here rather than restructuring correct, working fetch logic to satisfy it.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
