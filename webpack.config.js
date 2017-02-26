"use strict"

const debug = process.env.NODE_ENV !== 'production';

var path = require('path');
var glob = require('glob');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

let entries = getEntry('src/js/*.js', 'src/');
let chunks = Object.keys(entries);
let config = {
    entry: entries,
    output: {
        path: path.join(__dirname, 'dist'),
        publicPath: '',
        filename: 'js/[name].js',
        chunkFilename: 'scripts/[id].chunk.js?[chunkhash]'
    },
    module: {
        rules: [ //加载器
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({fallback: 'style-loader', use: 'css-loader'})
            }, {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract({use: 'css-loader!less-loader'})
            },
            {
                test: /\.html$/,
                loader: "html-loader?interpolate"    //避免压缩html,https://github.com/webpack/html-loader/issues/50
            },
            {
                test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader?name=fonts/[name].[ext]'
            }, {
                test: /\.(png|jpe?g|gif)$/,
                loader: 'url-loader?limit=8192&name=imgs/[name]-[hash].[ext]'
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery'
        }),
        new CommonsChunkPlugin({
            name: 'vendors', // 将公共模块提取，生成名为`vendors`的chunk
            chunks: chunks,
            minChunks: chunks.length // 提取所有entry共同依赖的模块
        }),
        new ExtractTextPlugin('css/[name].css'), //单独使用link标签加载css并设置路径
        debug ? function () {
        } : new UglifyJsPlugin({ //压缩代码
            compress: {
                warnings: false
            },
            except: ['$super', '$', 'exports', 'require'] //排除关键字
        }),
    ]
};

let pages = Object.keys(getEntry('src/*.html', 'src/'));
pages.forEach(function (pathname) {
    let conf = {
        filename: pathname + '.html', //生成的html存放路径，相对于path
        template: 'src/' + pathname + '.html', //html模板路径
        inject: false,  //js插入的位置，true/'head'/'body'/false
        /*
         * 压缩这块，调用了html-minify，会导致压缩时候的很多html语法检查问题，
         * 如在html标签属性上使用{{...}}表达式，所以很多情况下并不需要在此配置压缩项，
         * 另外，UglifyJsPlugin会在压缩代码的时候连同html一起压缩。
         * 为避免压缩html，需要在html-loader上配置'html?-minimize'，见loaders中html-loader的配置。
         */
        // minify: { //压缩HTML文件
        //  removeComments: true, //移除HTML中的注释
        //  collapseWhitespace: false //删除空白符与换行符
        // }`
    };
    if (pathname in config.entry) {
        conf.favicon = 'favicon.ico';
        conf.inject = 'body';
        conf.chunks = ['vendors', pathname];
        conf.hash = true;
    }
    config.plugins.push(new HtmlWebpackPlugin(conf));
});

module.exports = config;

function getEntry(globPath, pathDir) {
    let files = glob.sync(globPath);
    let entries = {};

    for (var i = 0; i < files.length; i++) {
        let file = files[i];
        let pathObj = path.parse(file); // root dir base ext name
        entries[pathObj.name] = ['./' + file];
    }
    return entries;
}