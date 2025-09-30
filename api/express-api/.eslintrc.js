module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    'arrow-spacing': 'error',
    'comma-dangle': ['error', 'never'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'indent': ['error', 2],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    'max-len': ['error', { code: 100, ignoreUrls: true }],
    'camelcase': ['error', { properties: 'never' }],
    'consistent-return': 'error',
    'no-else-return': 'error',
    'no-return-assign': 'error',
    'no-useless-return': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-body-style': ['error', 'as-needed']
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      rules: {
        'no-console': 'off',
        'max-len': 'off'
      }
    }
  ]
};

