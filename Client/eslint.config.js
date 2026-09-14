import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['dist'] },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['**/*.{ts,tsx}'] })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['vite.config.js', 'tailwind.config.js', 'postcss.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        __APP_VERSION__: "readonly",
        __BUILD_DATE__: "readonly",
        __VERSION_CODE__: "readonly",
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^([A-Z_]|motion$)',
        argsIgnorePattern: '^[A-Z_]',
        caughtErrorsIgnorePattern: '^_',
      }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // ไฟล์เหล่านี้ export hook/context ร่วมกับ component โดยตั้งใจ:
    //  - components/ui/form,sidebar = shadcn/ui canonical (useFormField/useSidebar อยู่ไฟล์เดียวกับ component ตาม upstream)
    //  - TourContext/NavigationHistoryProvider = context provider ที่ hook ถูก import กว้าง (~27 ไฟล์) การแยกไฟล์ churn สูงเกินคุ้ม
    // ยอมรับการเสีย Fast Refresh HMR เล็กน้อยเฉพาะไฟล์เหล่านี้
    files: [
      'src/components/ui/form.jsx',
      'src/components/ui/sidebar.jsx',
      'src/shared/components/tour/TourContext.jsx',
      'src/shared/navigation/NavigationHistoryProvider.jsx',
    ],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]
