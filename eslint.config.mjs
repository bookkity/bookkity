import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    files: ['src/**/*.{js,jsx}'],
    rules: {
      'no-restricted-syntax': ['error', {selector: 'JSXOpeningElement[name.name="a"]', message: 'Use next/link for app links, including MDX renderers.'}],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**']),
]);
