module.exports = {
    env: { browser: true, es2020: true, es2022: true },
    root: true,
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    overrides: [
        {
            files: ['**/*.cjs'],
            env: {
                node: true
            }
        }
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {},
    globals: {
        NodeJS: true
    }
};
