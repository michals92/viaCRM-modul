const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");
const path = require('path');

module.exports = {
	entry: path.resolve(__dirname, 'wrapper.jsx'),
	output: {
		libraryTarget: 'window',
		libraryExport: 'default',
		library: 'renderEasyEmailEditor',
		path: __dirname,
		filename: 'easy-email.min.js',
	},
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin({
			extractComments: false,
			terserOptions: {
				format: {
					comments: false,
				},
			}
		})],
	},
	resolve: {
		extensions: ['.js', '.jsx']
	},
	cache: {
		type: 'filesystem'
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ["@babel/preset-env", "@babel/preset-react"],
						cacheCompression: false,
						cacheDirectory: true,
					}
				}
			},
			{
				test: /\.css$/i,
				use: [
					{
						loader: 'style-loader',
					},
					{
						loader: 'css-loader',
					},
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: {
									'postcss-prefix-selector': {
										transform(_prefix, selector, _prefixedSelector, filePath, _rule) {
											const containers = [
												'.easy-email-editor-wrapper',
												'#FIXED_CONTAINER_ID',
												'.arco-trigger',
												'.arco-drawer-wrapper'
											];

											if (filePath.endsWith('arco.css')) {
												if (selector === 'body') {
													return containers.join(',');
												} else if (selector === 'body[arco-theme=\'dark\']') {
													return containers.map(c => `body[arco-theme='dark'] ${c}`).join(',');
												}
											}

											return selector;
										}
									}
								}
							}
						}
					}
				],
			}
		],
	},
	plugins: [
		new webpack.LoaderOptionsPlugin({options: {}}),
		new webpack.optimize.AggressiveMergingPlugin(),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1,
		})
	],
	mode: 'production',
};
