const {dist, src} = require('./paths');
const CompressionPlugin = require("compression-webpack-plugin");

var plugins = [];

if (process.env.compress === 'true') {
    plugins.push(new CompressionPlugin({
        test: /\.js/
    }));
}

module.exports = {
    mode: 'production',
    entry: src,
    output: {
        path: dist,
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    module: {
        rules: [
            {
                test: /(\.jsx|\.js)$/,
                loader: 'babel-loader',
                exclude: /(node_modules|bower_components)/
            }
        ]
    },
    plugins: plugins
};