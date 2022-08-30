import path from 'path';
import fs from 'fs';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import progressPlugin from 'rollup-plugin-progress';
import ignore from 'rollup-plugin-ignore';
import alias from '@rollup/plugin-alias';
import _ from 'lodash';
import pkg from './package.json';
import isCI from 'is-ci';
import externalGlobals from 'rollup-plugin-external-globals';
import serve from 'rollup-plugin-serve'
import replace from '@rollup/plugin-replace';

const excludeCoverage = [
  'test/**',
  'node_modules/**',
  'package.json',
  /^data-files!/
];

const CI_TEST_TYPE = process.env.CI_TEST_TYPE || '';
const compiledLicense = _.template(fs.readFileSync('./build/license-header.txt', 'utf8'));
const bannerData = _.pick(pkg, ['version', 'copyright']);
const banner = compiledLicense(Object.assign({process: {env: 'development'}}, bannerData));

const watch = {
  clearScreen: false
};

const onwarn = (warning) => {
  // ignore unknow option for --no-progress
  if (warning.code === 'UNKNOWN_OPTION' && warning.message.indexOf('progress') !== -1) {
    return;
  }

  if ( warning.code === 'THIS_IS_UNDEFINED' ) { return; }

  // eslint-disable-next-line no-console
  console.warn(warning.message);
};

const primedIgnore = ignore(['videojs-vtt.js']);
const primedResolve = resolve({
  mainFields: ['jsnext:main', 'module', 'main'],
  browser: true
});
const primedCjs = commonjs();
const primedReactBabel = babel({
  babelHelpers: "runtime",
  babelrc: false,
  exclude: 'node_modules',
  compact: false,
  presets: [
    "@babel/preset-react"
  ],
  plugins: [
    '@babel/plugin-transform-object-assign',
    ['@babel/plugin-transform-runtime', {regenerator: false}]
  ]
})
const primedBabel = babel({
  babelHelpers: "runtime",
  babelrc: false,
  exclude: 'node_modules',
  compact: false,
  presets: [
    "@babel/preset-env",
  ],
  plugins: [
    '@babel/plugin-transform-object-assign',
    ['@babel/plugin-transform-runtime', {regenerator: false}]
  ]
});
const primedExternalGlobals = externalGlobals({
  'global': 'window',
  'global/window': 'window',
  'global/document': 'document'
});

const progress = () => {
  if (isCI) {
    return {};
  }

  return progressPlugin();
};

const globals = {
  browser: {
  },
  module: {
  },
  test: {
    qunit: 'QUnit',
    qunitjs: 'QUnit',
    sinon: 'sinon'
  }
};

const moduleExternals = [
  'global',
  '@babel/runtime'
];
const externals = {
  browser: [],
  module(id) {
    const result = moduleExternals.some((ext) => id.indexOf(ext) !== -1);

    return result;
  },
  test: Object.keys(globals.test).concat([
  ])
};

export default cliargs => [
  // standard umd file
  {
    input: 'src/index.js',
    output: {
      format: 'umd',
      file: 'dist/designer.js',
      name: 'designerjs',
      banner,
      globals: globals.browser
    },
    external: externals.browser,
    plugins: [
      alias({
        'designer.js': path.resolve(__dirname, './src/designer.js')
      }),
      primedReactBabel,
      primedCjs,
      primedBabel,
      primedResolve,
      json(),
      primedExternalGlobals,
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      cliargs.progress !== false ? progress() : {},
    ],
    onwarn,
    watch,
  },
];