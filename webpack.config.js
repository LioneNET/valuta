const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  devtool: 'inline-source-map',
  devServer: {
    static: './dist'
  },
  optimization: {
    minimize: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './src/app.html'),
      filename: 'index.html'
    }),
    new MiniCssExtractPlugin()
  ],
  module: {
    rules: [
      { 
        test: /\.css$/, 
        use: [MiniCssExtractPlugin.loader, "css-loader"], 
      }
    ]
  }
}