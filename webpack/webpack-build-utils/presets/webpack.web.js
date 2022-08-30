const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => ({
	entry: {
		main: path.resolve(__dirname, './../../index.js'),
	},
	output: {
		path: path.resolve(__dirname, './../../dist'),
		filename: '[name].js',
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					' ',
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							publicPath: '../',
						},
					},
					'css-loader',
				],
			},
		],
	},

	plugins: [
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './public/index.html',
		}),
	],
	optimization: {},
	devServer: {
		static: {
			directory: path.join(__dirname, './../../public'),
		},
		compress: true,
		port: 9000,
		open: true,
	},
});
