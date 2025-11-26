export default {
	"*.{js,ts}": "eslint --fix",
	"*.{js,ts,css,json}": "prettier --write",
	"*.css": "stylelint --fix",
	'**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
};
