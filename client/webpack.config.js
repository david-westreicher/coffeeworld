var path = require('path');
var dir_js = path.resolve(__dirname, 'src');
var dir_build = path.resolve(__dirname, 'public');

module.exports = {
    entry: {
        client: "./src/game/client.js",
        localserver: "./src/localserver.js",
    },
    output: {
        path: dir_build,
        filename: "[name].js"
    },
	module: {
		loaders: [
			{ test: dir_js, loader: "babel-loader" }
		]
	},
    resolveLoader: {
        root: path.join(__dirname, 'node_modules')
    },
    // Create Sourcemaps for the bundle
    devtool: 'source-map',
    devServer: {
        contentBase: dir_build,
    }
};
