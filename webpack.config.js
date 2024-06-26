const path = require('path');

module.exports = {
  entry: './main.ts',
  context: path.resolve(__dirname, 'ts'),
  mode: 'development',
  module: {
    rules: [
      {
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public', 'dist'),
    publicPath: "/dist/"
  },
  devServer: {
    hot: true,
  }
};
