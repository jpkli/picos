const path = require('path');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {
        "picos": "./index.js",
    },
    devtool: "source-map",
    target: 'web',
    resolve: {
        modules: [path.resolve(__dirname, '../..'), '../node_modules'],
        alias: {
            'p.3$': 'p3',
            'p.4$': 'p4'
        }
    },
    output: {
        path: path.resolve(__dirname, "../dist"),
        filename: "[name].js"
    },
    module: {
        exprContextCritical: false,
        rules: [
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader',]
          }
        ]
    },
    devServer: {
        compress: true,
        publicPath: '/dist/',
        clientLogLevel: "none",
        historyApiFallback: true,
    },
    node: {
        fs: "empty"
    }
    // plugins: [
    //     new UglifyJsPlugin({
    //         include: /\.min\.js$/,
    //         sourceMap: true
    //     })
    // ]
};