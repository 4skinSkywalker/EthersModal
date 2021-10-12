let path = require("path");

module.exports = {
    entry: {
        main: "./src/index.js"
    },
    output: {
        filename: "./main.js",
        library: ["EthersModal"],
        path: path.resolve(__dirname, "docs")
    }
};