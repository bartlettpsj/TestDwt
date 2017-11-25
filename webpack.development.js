/**
 * Webpack config for development
 */
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: {
    app: `${__dirname}/code.js`
  },
  output: {
    path: './lib',
    filename: 'yourlib.js',
    libraryTarget: 'var',
    library: 'EntryPoint'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: `${__dirname}/index.bundled.html`,
      inject: 'body'
    }),
    new CopyWebpackPlugin([{from:'myresources',to:'Resources'}])
  ],
  loaders: [
    {
      loader: 'file-loader',
      options: {
        name (file) {
          if (env === 'development') {
            return '[path][name].[ext]'
          }
          return '[hash].[ext]'
        }
      }
    }
  ],
  resolve: {
  alias: {
      'angular-1x-core': path.resolve(__dirname)
    },
    modulesDirectories: [
      `${__dirname}/node_modules`,
      `${__dirname}/bower_components`,
      `${__dirname}/Resources`
    ]
  },
  devServer: {
    disableHostCheck: true,
    stats: {
      modules: false,
      cached: false,
      colors: true,
      chunk: false
    }
  }
};
