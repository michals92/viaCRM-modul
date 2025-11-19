import { build } from "esbuild";
import postcss from "postcss";
import prefixer from "postcss-prefix-selector";
import fs from "fs-extra";

const containers = [
	".easy-email-editor-wrapper",
	"#FIXED_CONTAINER_ID",
	".arco-trigger",
	".arco-drawer-wrapper",
];

/** @type {import("esbuild").Plugin} */
const postcssPlugin = {
	name: "postcss",
	setup({ onLoad }) {
		onLoad({ filter: /\.css$/ }, async ({ path }) => {
			let css = await fs.readFile(path, 'utf8');

			if (!path.endsWith("arco.css")) {
				return { contents: css, loader: "css" };
			}

			// Fix CSS syntax error: add space before -clear-icon selector
			css = css.replace(/:not\(\.arco-input-tag-focus\)-clear-icon/g, ':not(.arco-input-tag-focus) .arco-clear-icon');

			const result = await postcss([
				prefixer({
					transform(_prefix, selector) {
						if (selector === "body") {
							return containers.join(",");
						} else if (selector === "body[arco-theme='dark']") {
							return containers
								.map(c => `body[arco-theme='dark'] ${c}`)
								.join(",");
						}

						return selector;
					},
				}),
			]).process(css, { from: path });

			return { contents: result.css, loader: "css" };
		});
	},
};

/** @param {string} outfile */
export default async outfile => {
	await build({
		outfile,
		entryPoints: ["src/easy-email/wrapper.jsx"],
		bundle: true,
		minify: true,
		format: "iife",
		globalName: "EasyEmailEditor",
		platform: "browser",
		jsx: "automatic",
		jsxImportSource: "react",
		plugins: [postcssPlugin],
	});
};
