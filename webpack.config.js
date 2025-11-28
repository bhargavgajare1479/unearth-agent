const path = require('path');

module.exports = {
  entry: {
    content: './src/extension/content.js',
    background: './src/extension/background.js',
  },
  output: {
    path: path.resolve(__dirname, 'public/extension'),
    filename: '[name].js',
  },
  mode: 'production',
  devtool: 'source-map'
};
