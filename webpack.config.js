const {webpackConfig, relDir} = require("./webpack.common");

module.exports = {
  entry: {
    lib: relDir("src/index.ts"),
    demo: relDir("src/demo.ts"),
  },
  ...webpackConfig(false),
};
