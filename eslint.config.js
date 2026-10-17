import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import a11y from 'eslint-plugin-jsx-a11y';

export default [
  // Los patrones llevan `**/` adelante a propósito: sin eso solo se ignoraban
  // los directorios de la raíz, y `frontend/.astro/` —que lo genera Astro, no
  // lo escribe nadie— entraba a la revisión con sus propios errores.
  {
    ignores: [
      '**/dist/**',
      '**/.netlify/**',
      '**/node_modules/**',
      '**/.astro/**',
      '**/.vercel/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  {
    // Archivos de configuración, funciones del servidor y scripts de marca:
    // todos corren en Node.
    files: [
      '*.config.{js,mjs}',
      'backend/**/*.ts',
      'design/marca/*.mjs',
      'netlify/functions/*.mjs',
    ],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        Response: 'readonly',
      },
    },
  },
  {
    // Scripts que corren en el navegador, servidos como archivos propios.
    files: ['frontend/public/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        document: 'readonly',
        window: 'readonly',
        URLSearchParams: 'readonly',
        Event: 'readonly',
        FormData: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        sessionStorage: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'jsx-a11y': a11y },
    rules: {
      ...a11y.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
