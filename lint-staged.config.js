export default {
	"*.{js,ts}": "eslint --fix",
	"*.{js,ts,css}": "prettier --write",
	"*.css": "stylelint --fix",
	'**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
	"**/*.json": () => "sh helpers/format_json.sh",
};
