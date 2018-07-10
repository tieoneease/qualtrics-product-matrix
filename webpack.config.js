const path = require('path');

module.exports = {
  watch: true,
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                "env",
                {
                  "targets": {
                    "browsers": ["last 2 versions"]
                  }
                }
              ]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {test:/\.svg$/,loader:'url-loader',query:{mimetype:'image/svg+xml',name:'./public/css/semantic/themes/default/assets/fonts/icons.svg'}},

      {test:/\.woff$/,loader:'url-loader',query:{mimetype:'application/font-woff',name:'./public/css/semantic/themes/default/assets/fonts/icons.woff'}},

      {test:/\.woff2$/,loader:'url-loader',query:{mimetype:'application/font-woff2',name:'./public/css/semantic/themes/default/assets/fonts/icons.woff2'}},

      {test:/\.[ot]tf$/,loader:'url-loader',query:{mimetype:'application/octet-stream',name:'./public/css/semantic/themes/default/assets/fonts/icons.ttf'}},   

      {test:/\.eot$/,loader:'url-loader',query:{mimetype:'application/vnd.ms-fontobject',name:'./public/css/semantic/themes/default/assets/fonts/icons.eot'}}
    ]
  },
  output: {
    filename: 'matrix-bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
