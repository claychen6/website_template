var config = require("./webpack.config.js");
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');

for (var i in config.entry) {
    config.entry[i].unshift('webpack-dev-server/client?http://localhost:8099', "webpack/hot/dev-server")
}
config.plugins.push(new webpack.HotModuleReplacementPlugin());

var compiler = webpack(config);
var server = new WebpackDevServer(compiler, {
    publicPath: config.output.publicPath,
    stats: {
        colors: true
    }
});
server.listen(8099);