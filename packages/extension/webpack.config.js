const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  devtool: false,
  entry: {
    "service-worker": "./src/background/service-worker.ts",
    popup: "./src/popup/index.tsx",
    options: "./src/options/index.tsx",
    "content/element-selector": "./src/content/element-selector.ts",
    "content/extract-element": "./src/content/extract-element.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, "css-loader"] },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "public/icons", to: "icons", noErrorOnMissing: true },
      ],
    }),
    new HtmlWebpackPlugin({ template: "public/popup.html", filename: "popup.html", chunks: ["popup"] }),
    new HtmlWebpackPlugin({ template: "public/options.html", filename: "options.html", chunks: ["options"] }),
    new MiniCssExtractPlugin(),
  ],
};
