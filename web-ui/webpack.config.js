module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: {
            // Enables processing inside the <noscript> tag
            scriptingEnabled: false,
          },
        },
      },
    ],
  },
};