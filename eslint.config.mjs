import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    files: ['src/**/*.{js,jsx}'],
    // Existing patterns remain visible without changing behavior during the dependency upgrade.
    rules: {
      'no-restricted-syntax': ['error', {selector: 'JSXOpeningElement[name.name="a"]', message: 'Use next/link for app links, including MDX renderers.'}],
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react/no-unescaped-entities': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**']),
]);
