import nextConfig from 'eslint-config-next'

export default [
  ...nextConfig.map((config) => ({
    ...config,
    rules: {
      ...config.rules,
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  })),
  { ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**'] },
]
