const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/splash-page/js/splash-renderer.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'splash-renderer.bundle.js'
  }
};
