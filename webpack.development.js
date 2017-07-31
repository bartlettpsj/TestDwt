/**
 * Webpack config for development
 */
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
    // new webpack.ResolverPlugin([
    //   new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
    // ], ['normal', 'loader']),
    // new webpack.ProvidePlugin({
    //   $: 'jquery',
    //   jquery: 'jquery',
    //   jQuery: 'jquery',
    //   'window.jQuery': 'jquery'
    // }),
    // // Ignore warnings for plugins that ajv mentions, but doesn't actually need
    // new webpack.IgnorePlugin(/regenerator|nodent|js\-beautify/, /ajv/),
    new HtmlWebpackPlugin({
      template: `${__dirname}/index.bundled.html`,
      inject: 'body'
    }),
    new webpack.IgnorePlugin(/xdynamsoft/)
  ]
}

//   require('./webpack.make')({
//   VERSION: require('./package.json').version,
//   ENTRY_PATH: `${__dirname}/code.js`,
//   BASE_HTML: `${__dirname}/index.bundled.html`,
//   OUTPUT_PATH: `${__dirname}/dist`,
//   REGEX_STRING_REPLACE: {
//     'LBNG_INJECT': process.env,
//     'VRS_INJECT': process.env,
//     'VRS_COMPILE_INJECT': {
//       ALLOW_CORS_AUTH: true
//     }
//   },
//   REQUIRE_ALIASES: {
//     'vrs-ui': `${__dirname}`
//   },
//   ES6_MODULES: [ 'mixwith', 'vrs-api/common' ],
//   VENDOR_BUNDLE: true, // chg see if it fixes
//   INJECT_SCRIPT_TAGS: true,
//   GENERATE_JS_SOURCEMAP: true,
//   HASH_OUTPUT_FILES: false,
//   EXTRACT_CSS: true,
//   OPTIMIZE: false,
//   DEV_SERVER: true,
//   INSTRUMENT_COVERAGE: false
// });
