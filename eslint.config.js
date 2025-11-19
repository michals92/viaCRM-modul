import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
	{
		ignores: [
			'node_modules/**',
			'dist/**',
			'build/**',
			'vendor/**',
			'src/easy-email/**',
			'src/client/lib/**',
			'**/*.min.js',
			'autocomplete/**',
			'helpers/**',
			'phpstan/**',
			'progress-reports/**',
			'tests/**'
		]
	},
	{
		files: ['**/*.js', '**/*.ts'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				// Browser globals
				window: 'readonly',
				document: 'readonly',
				console: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				navigator: 'readonly',
				fetch: 'readonly',
				Request: 'readonly',
				Response: 'readonly',
				URL: 'readonly',
				Blob: 'readonly',
				FormData: 'readonly',
				Headers: 'readonly',
				alert: 'readonly',
				
				// jQuery
				$: 'readonly',
				jQuery: 'readonly',
				
				// Node.js globals
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly',
				global: 'readonly',
				Buffer: 'readonly'
			}
		},
		rules: {
			'indent': ['error', 'tab', { 'SwitchCase': 1 }],
			'no-mixed-spaces-and-tabs': 'error',
			'linebreak-style': ['error', 'unix'],
			'semi': ['error', 'always'],
			'arrow-body-style': ['error', 'as-needed']
		}
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			globals: {
				// EspoCRM globals
				_: 'readonly',
				Espo: 'readonly',
				Bull: 'readonly',
				define: 'readonly',
				extend: 'readonly',
				Backbone: 'readonly',
				GridStack: 'readonly'
			}
		},
		rules: {
			...js.configs.recommended.rules,
			'no-unused-vars': [
				'error',
				{
					'vars': 'all',
					'args': 'all',
					'argsIgnorePattern': '^_|^e$',
					'caughtErrors': 'none'
				}
			]
		}
	},
	...tseslint.config(
		{
			files: ['**/*.ts'],
			extends: [
				js.configs.recommended,
				...tseslint.configs.recommended
			],
			languageOptions: {
				parserOptions: {
					project: true,
					tsconfigRootDir: import.meta.dirname,
				},
			},
			rules: {
				'no-unused-vars': 'off',
				'@typescript-eslint/no-unused-vars': [
					'error',
					{
						'vars': 'all',
						'args': 'all',
						'argsIgnorePattern': '^_|^e$|^error$',
						'caughtErrors': 'none'
					}
				],
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/no-unused-expressions': [
					'error',
					{
						'allowTernary': true,
						'allowShortCircuit': true
					}
				],
				'@typescript-eslint/ban-ts-comment': [
					'error',
					{
						'ts-ignore': 'allow-with-description'
					}
				],
				// Disable no-undef for TypeScript files as TypeScript handles this
				'no-undef': 'off'
			}
		}
	)
];