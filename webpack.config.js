const path = require("path");

module.exports = {
  externals: {
    "parsegraph-log":{
      commonjs:"parsegraph-log",
      commonjs2:"parsegraph-log",
      amd:"parsegraph-log",
      root:"parsegraph_log"
    },
    "parsegraph-checkglerror":{
      commonjs:"parsegraph-checkglerror",
      commonjs2:"parsegraph-checkglerror",
      amd:"parsegraph-checkglerror",
      root:"parsegraph_checkglerror"
    }
  },
  entry: {
    lib: path.resolve(__dirname, "src/index.ts"),
    demo: path.resolve(__dirname, "src/demo.ts"),
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "weetcubes.[name].js",
    globalObject: "this",
    library: "parsegraph_weetcubes",
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx?)$/,
        exclude: /node_modules/,
        use: ["babel-loader", "ts-loader"]
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ["ts-shader-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".glsl"],
    modules: [path.resolve(__dirname, "src"), "node_modules"],
  },
  mode: "development",
  devtool: "eval-source-map",
};
