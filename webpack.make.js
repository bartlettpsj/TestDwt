/**
 * CONFIGURABLE WEBPACK MAKEFILE
 *
 * A basic Webpack config that you can configure to use in projects based off
 * the Angular 1x core.
 *
 * Exports a function that accepts an Options object and returns a
 * Webpack config (see https://webpack.github.io/docs/configuration.html).
 *
 * You can run the `webpack` binary using the output from this JS as the
 * --config (see sample in scripts/build.sh or scripts/dev.sh).
 *
 * You can *also* extend this config in your own projects by generating the
 * Webpack config in JS and then modifying it or appending to it:
 *
 *
 * // my-local-webpack-config.js
 *
 * const options = { * allll the config stuff * }
 * const config = require('angular-1x-core/webpack.make.js')(options)
 * // Example extension: add another plugin
 * config.module.plugins.push(* some plugin *)
 * module.exports = config;
 *
 *
 * You can then use *this* JS file as the config for your Wepback binary:
 * webpack --config path/to/my-local-webpack-config.js
 */
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StringReplacePlugin = require('string-replace-webpack-plugin');
const path = require('path');
const BowerWebpackPlugin = require('bower-webpack-plugin');
const debugGenerator = require('debug');
const chalk = require('chalk');
const _ = require('lodash');
const combineLoaders = require('webpack-combine-loaders');

const pluginsDebug = debugGenerator('webpack:config:plugins:');
const stringReplaceDebug = debugGenerator('webpack:config:plugins:');
const injectedTenantDebug = debugGenerator('webpack:config:loaders:StringReplace:WEBPACK_INJECT_APP_VERSION');
const preLoaderDebug = debugGenerator('webpack:config:preLoaders:');
const processEnvDebug = debugGenerator('webpack:config:loaders:StringReplace:process.env');
const lbngInjectDebug = debugGenerator('webpack:config:loaders:StringReplace:LBNG_INJECT');
const devServerDebug = debugGenerator('webpack:config:devServer:');
const anyNodeModuleExceptVrsUi = '(^node_modules\/(?!vrs-ui\/).*)';

function failWith(message) {
  console.log();
  console.log();
  console.log(chalk.red('Build failed: ' + message));
  process.exit(1);
}


/**
 * generateFilters - Generates regex filters for finding files that need to
 * be transpiled/processed.
 *
 * @param {Array} es6NodeModulesWhitelist An array of node_module names that
 * contain ES2015+/ES6+/Node 5+ code.  Most node_modules are written in
 * ES5, which means they don't need to be transpiled by Babel before being
 * used in the browser (giving us a big compilation speed boost).  Any time
 * we have a node_module (internal or external) that is using a newer JavaScript
 * spec than ES5, we can include it in this list to make sure it gets transpiled
 * back to ES5 by Babel.
 * @param {Function} instrumentIgnore     Optional - a custom function that
 * takes in the absolute path of a file and returns _true_ if that path should
 * be ignored when instrumenting code for test coverage.
 *
 * @return {Object} A map of three filters
 *  - excludeThirdPartyStuff: Use this as an 'exclude' filter in a loader.
 *    Will return everything EXCEPT:
 *      - Bower components
 *      - Node modules that are NOT in the es6NodeModulesWhitelist
 *  - excludeNonBabelStuff: Use this as an 'exclude' filter in a loader.
 *    Allows *only* code that can / should be transpiled by Babel.
 *    Will tell the loader to exclude:
 *      - Bower components
 *      - Node modules that are NOT in the es6NodeModulesWhitelist
 *      - Anything that has 'vendors' in the path (used for the /vendors)
 *        folder of some UI projects that has precompiled non-NPM/Bower
 *        third-party code.
 *      - Any code that ends with .es5.js
 *  - excludeNonInstrumentStuff: Use this as an 'exclude' filter in a loader.
 *    Allows *only* code that can be instrumented when running unit tests for
 *    calculating test coverage. The *subtantial* assumption in this filter
 *    is that we are only testing SERVICES, *not* controllers (which may
 *    or may not be true depending on your project).
 *    TODO: Simplify this filter to make it more universally usable if other
 *    projects end up needing to follow different test coverage requirements.
 *    Will tell the loader to exclude:
 *      - Bower components
 *      - Node modules that are NOT in the es6NodeModulesWhitelist
 *      - Unit test files (paths containing .spec.js)
 *      - Controllers (paths containing controller.js)
 *      - The Karma init file that loads the app for tests (paths
 *        containing karma.bootstrap.js)
 *      - Any path that returns _true_ when run through the instrumentIgnore
 *        function (if provided)
 */
const generateFilters = (es6NodeModulesWhitelist, instrumentIgnore) => {
  const isAnExcludedNodeModule = (absolutePath) => {
    // If we're not in node_modules at all, skip
    if (absolutePath.indexOf('node_modules') === -1) {
      return false;
    }

    for (const moduleName of es6NodeModulesWhitelist) {
      // If an ES6 module (and not a child dependency within that module), skip
      if (absolutePath.indexOf(`node_modules/${moduleName}`) > -1 &&
        absolutePath.indexOf(`node_modules/${moduleName}/node_modules`) === -1) {
        return false;
      }
    }

    /*
     * If we've gotten here, we're a node_module that is either a standard ES5
     * module or an ES5 dependency of an ES6 module.  Mark as skippable.
     */
    return true;

  };

  const excludeThirdPartyStuff = (absolutePath) => {
    const isABowerComponent = absolutePath.indexOf('bower_components') > -1;
    const isDynamsoft = absolutePath.indexOf('dynamsoft') > -1;

    if (isAnExcludedNodeModule(absolutePath) || isABowerComponent || isDynamsoft) {
      return true;
    }
    return false;

  };


  const excludeNonBabelStuff = (absolutePath) => {
    const isThirdParty = excludeThirdPartyStuff(absolutePath);
    const isVendor = absolutePath.indexOf('vendors') > -1;
    const isEs5 = absolutePath.indexOf('.es5.js') > -1;
    if (isThirdParty || isEs5 || isVendor) {
      return true;
    }
    return false;

  };

  const excludeNonInstrumentStuff = (absolutePath) => {
    const isThirdParty = excludeThirdPartyStuff(absolutePath);
    const isSpecFile = absolutePath.indexOf('.spec.js') > -1;
    const isController = absolutePath.indexOf('controller.js') > -1;
    const isKarmaBootstrap = absolutePath.indexOf('karma.bootstrap.js') > -1;
    const isCustomIgnore = (instrumentIgnore) ? instrumentIgnore(absolutePath) : false;
    const isDynamsoft = absolutePath.indexOf('dynamsoft') > -1;
    if (isThirdParty || isSpecFile || isController || isKarmaBootstrap || isCustomIgnore || isDynamsoft) {
      return true;
    }
    return false;

  };

  return {
    excludeThirdPartyStuff,
    excludeNonBabelStuff,
    excludeNonInstrumentStuff
  };
};

module.exports = function makeWebpackConfig(options) {
  /**
   * Config
   * Reference: http://webpack.github.io/docs/configuration.html
   * This is the object where all configuration gets set
   */
  const config = {};
  let cssLoader;
  let sassLoader;

  /**
   * Entry
   * Reference: http://webpack.github.io/docs/configuration.html#entry
   */
  if (options.ENTRY_PATH) {
    config.entry = {
      app: options.ENTRY_PATH
    };
  }

  // By default, we assume *all* node_modules are ES5/standards compliant code.
  // ES6+ code
  let babelNodeModulesEs6Whitelist = ['angular-1x-core'];
  if (options.ES6_MODULES) {
    babelNodeModulesEs6Whitelist = babelNodeModulesEs6Whitelist.concat(options.ES6_MODULES);
  }

  // Generate a set of different search filters for babel transpilation
  const filters = generateFilters(babelNodeModulesEs6Whitelist, options.INSTRUMENT_IGNORE_FUNCTION);

  // Ignore non-essential modules that ajv mentions (but doesn't use)
  config.node = {
    fs: 'empty'
  };

  /**
   * Output
   * Reference: http://webpack.github.io/docs/configuration.html#output
   * Should be an empty object if it's generating a test build
   * Karma will handle setting it up for you when it's a test build
   */
  config.output = {

    // Absolute output directory
    path: options.OUTPUT_PATH,

    // Filename for entry points
    // Only adds hash in build mode
    filename: options.HASH_OUTPUT_FILES ? '[name].[hash].js' : '[name].bundle.js',

    // Filename for non-entry points
    // Only adds hash in build mode
    chunkFilename: options.HASH_OUTPUT_FILES ? '[name].[hash].js' : '[name].bundle.js'
  };

  /**
   * Devtool
   * Reference: http://webpack.github.io/docs/configuration.html#devtool
   * If set, will generate a sourcemap for your JavaScript so that you can
   * "browse" code by the original source code file-structure
   */
  if (options.GENERATE_JS_SOURCEMAP) {
    config.devtool = 'inline-source-map';
  }

  /**
   * Loaders
   * Reference: http://webpack.github.io/docs/configuration.html#module-loaders
   * List: http://webpack.github.io/docs/list-of-loaders.html
   * This handles most of the magic responsible for converting modules
   */
  config.module = {
    preLoaders: [],
    loaders: [{
      // JS LOADER
      // Reference: https://github.com/babel/babel-loader
      // Transpile .js files using babel-loader
      // Compiles ES6 and ES7 into ES5 code
      test: /\.js$/,
      exclude: filters.excludeNonBabelStuff,
      loader: combineLoaders([{
        loader: 'ng-annotate'
      }, {
        loader: 'babel',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }])
    }, {
      /*
       * FAVICON LOADER
       * Favicons need to be written into the root of the project, with
       * their original name, to be recognized.
       */
      test: /favicon\.ico$/,
      loader: 'file?name=[name].[ext]'
    }, {

      // ASSET LOADER
      // Reference: https://github.com/webpack/file-loader
      // Copy png, jpg, jpeg, gif, svg, woff, woff2, ttf, eot files to output
      // Rename the file using the asset hash
      // Pass along the updated reference to your code
      // You can add here any file extension you want to get copied to your output
      test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|pdf)/,
      loader: 'file'
    }, {

      // HTML LOADER
      // Reference: https://github.com/webpack/raw-loader
      // Separate files out into distinct HTML to be loaded async
      test: /\.html$/,
      exclude: /\.bundled\.html$/,
      loader: 'file'
    }, {

      // HTML LOADER
      // Reference: https://github.com/webpack/raw-loader
      // Separate files out into distinct HTML to be loaded async
      test: /\.bundled\.html$/,
      loader: 'raw'
    }, {

      // JSON LOADER
      // Reference: https://github.com/webpack/raw-loader
      // Allow loading html through js
      test: /\.json$/,
      loader: 'json'
    }, {
      // CSS LOADER
      // Reference: https://github.com/webpack/css-loader
      // Allow loading css through js
      test: /\.css$/,

      // Reference: https://github.com/webpack/extract-text-webpack-plugin
      // Extract css files in production builds
      //
      // Reference: https://github.com/webpack/style-loader
      // Use style-loader in development for hot-loading
      loader: options.EXTRACT_CSS ?
        ExtractTextPlugin.extract('style', 'css?sourceMap!postcss!resolve-url') : 'style!css?sourceMap!postcss!resolve-url'
    }, {
      // SASS loader
      test: /\.scss$/,
      loader: options.EXTRACT_CSS ?
        ExtractTextPlugin.extract('style', 'css?sourceMap!postcss!resolve-url!sass') : 'style!css?sourceMap!postcss!resolve-url!sass'
    }]
  };

  /**
   * PostCSS
   * Reference: https://github.com/postcss/autoprefixer-core
   * Add vendor prefixes to your css
   */
  config.postcss = [
    autoprefixer({
      browsers: ['last 2 version']
    })
  ];

  /*
   * Define all of the possible root path aliases for a require() or import.
   *
   * Setting up aliases allows us to avoid using relative paths, which
   * are hard to refactor and easy to break.  They also allow us to
   * reference code in the current module in a way that makes it easy to
   * copy-paste the code into another project that extends the current
   * project.
   *
   * For example:
   *   Normal (relative) require in VRS-UI might look like:
   *     import thing from '../../../some/thing'
   *
   *   Absolute require (with an alias 'vrs-ui'):
   *     import thing from 'vrs-ui/client/app/some/thing'
   *
   *   In project 'vrs-ui-mvf' that has a dependency on vrs-ui, you can use
   *   the same line of code:
   *     import thing from 'vrs-ui/client/app/some/thing'
   *
   * Define new aliases by adding key-value pairs to options.REQUIRE_ALIASES.
   * It's useful to use __dirname to point to the root directory where your
   * webpack.config is:
   *
   * options = {
   *   REQUIRE_ALIASES: [
   *     'vrs-ui': __dirname // if this file is in the root of your project,
   *                         // vrs-ui will now point to the root of your
   *                         // project.
   *   ]
   * }
   */
  config.resolve = {
    alias: {
      'angular-1x-core': path.resolve(__dirname)
    },
    modulesDirectories: [
      `${__dirname}/node_modules`,
      `${__dirname}/bower_components`
    ]
  };

  // Override resolves if overrides are provided
  if (options.REQUIRE_ALIASES) {
    Object.assign(config.resolve.alias, options.REQUIRE_ALIASES);
  }

  if (options.ROOT) {
    config.resolve.root = options.ROOT;
  }

  config.module.sassLoader = {
    includePaths: []
  };

  /*
   * Treat every alias as a possible root for SASS resolves
   * and node_modules/bower_component imports
   */
  _.forOwn(config.resolve.alias, rootAlias => {
    config.module.sassLoader.includePaths.push(rootAlias);
    config.resolve.modulesDirectories.push(`${rootAlias}/node_modules`);
    config.resolve.modulesDirectories.push(`${rootAlias}/bower_components`);
  });

  /*
   * Append to module directories if there are new places to find node_modules
   * or bower_components
   */
  if (options.MODULE_DIRECTORIES) {
    config.resolve.modulesDirectories = config.resolve.modulesDirectories.concat(options.MODULE_DIRECTORIES);
  }


  /**
   * Plugins
   * Reference: http://webpack.github.io/docs/configuration.html#plugins
   * List: http://webpack.github.io/docs/list-of-plugins.html
   */
  config.plugins = [
    new webpack.ResolverPlugin([
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
    ], ['normal', 'loader']),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jquery: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    // Ignore warnings for plugins that ajv mentions, but doesn't actually need
    new webpack.IgnorePlugin(/regenerator|nodent|js\-beautify/, /ajv/)
  ];

  // "Optimize" plugins are good to use in a production build
  if (options.OPTIMIZE) {
    pluginsDebug(`Uglifying and de-duping code for production`);
    config.plugins.push(
      // Reference: http://webpack.github.io/docs/list-of-plugins.html#noerrorsplugin
      // Only emit files when there are no errors
      new webpack.NoErrorsPlugin(),

      // Reference: http://webpack.github.io/docs/list-of-plugins.html#dedupeplugin
      // Dedupe modules in the output
      new webpack.optimize.DedupePlugin(),

      // Reference: http://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
      // Minify all javascript, switch loaders to minimizing mode
      new webpack.optimize.UglifyJsPlugin()
    );
  }

  /*
   * All packages listed here will be grouped into a 'vendor.js' file
   * that will be accessible to all pages.
   *
   * This may not be necessary in most circumstances, since the shared
   * code between modules via CommonsChunk is put into 'app.js' already.
   */
  if (options.VENDOR_BUNDLE) {
    // TODO: Make this extensible via options object
    const bundledVendors = ['angular', 'oclazyload'];
    pluginsDebug(`CommonsChunk: Bundling ${bundledVendors} as common vendor module.`);
    config.entry.vendor = bundledVendors;
    debugGenerator('webpack:config:plugins:CommonsChunk')(`Extracting 'vendor' modules to 'vendor.bundle.js'`);
    config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.bundle.js'
    }));
  }

  // Inject <script> tags for bundles in the index template
  // We do this in all cases except unit tests
  if (options.INJECT_SCRIPT_TAGS) {
    debugGenerator('webpack:config:plugins:HtmlWebpackPlugin')('Injecting script tags into base HTML');
    // Reference: https://github.com/ampedandwired/html-webpack-plugin
    // Render index.bundled.html
    let baseHtmlPath = `${__dirname}/client/index.bundled.html`;
    if (options.BASE_HTML) {
      baseHtmlPath = options.BASE_HTML;
    }
    config.plugins.push(new HtmlWebpackPlugin({
      template: baseHtmlPath,
      inject: 'body'
    }));
  }

  // Reference: https://github.com/webpack/extract-text-webpack-plugin
  // Extract css files
  if (options.EXTRACT_CSS) {
    pluginsDebug('Extracting CSS styles to external CSS file');
    config.plugins.push(new ExtractTextPlugin('[name].[hash].css'));
  }

  if (options.REGEX_STRING_REPLACE) {
    _.forOwn(options.REGEX_STRING_REPLACE, (resolveObject, prefix) => {
      stringReplaceDebug(`Registering string replace for ${prefix}.* in JavaScript`);
      config.module.loaders.push({
        test: /.js/,
        loader: StringReplacePlugin.replace({
          replacements: [{
            pattern: new RegExp(prefix + '\.([A-Za-z_]+)', 'ig'),
            replacement: function replaceEnvString(match, p1, offset, string) {
              if (!resolveObject.hasOwnProperty(p1)) {
                failWith(`Environment variable ${p1} is required for build but is not set (${prefix}.*)
${offset}`);
              }
              stringReplaceDebug(`Replacing ${prefix}.${p1} with ${resolveObject[p1]}`);
              return resolveObject[p1];
            }
          }]
        })
      });
    });
  }

  config.module.loaders.push({
    test: /.html/,
    exclude: filters.excludeThirdPartyStuff,
    loader: StringReplacePlugin.replace({
      replacements: [{
        pattern: /WEBPACK_INJECT_APP_VERSION/ig,
        replacement: function replaceEnvString(match, p1, offset, string) {
          const version = options.VERSION;
          injectedTenantDebug(`Replacing WEBPACK_INJECT_APP_VERSION with ${version}`);
          return version;
        }
      }]
    })
  });

  config.plugins.push(new StringReplacePlugin());


  /*
   * When testing, we can calculate code coverage by adding a preloader
   * This only instruments service.js files, as that is what we are
   * testing with unit tests
   */
  if (options.INSTRUMENT_COVERAGE) {
    preLoaderDebug(`Instrumenting code for calculating test coverage`);
    config.module.preLoaders.push({
      /*
       * Instrument coverage on any non-controllers and non-test files
       */
      test: /\.js$/,
      exclude: filters.excludeNonInstrumentStuff,
      loader: 'isparta-instrumenter',
      query: {
        babel: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }
    });
  }

  if (options.DEV_SERVER) {
    /*
     * Dev server configuration
     * Reference: http://webpack.github.io/docs/configuration.html#devserver
     * Reference: http://webpack.github.io/docs/webpack-dev-server.html
     */
    devServerDebug(`Configuring development server`);
    config.devServer = {
      contentBase: `${__dirname}/dist`,
      stats: {
        modules: false,
        cached: false,
        colors: true,
        chunk: false
      }
    };
  }

  return config;
};
