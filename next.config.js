const withCss = require("@zeit/next-css");
const withPurgeCss = require("next-purgecss");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: eval(process.env.ANALYZE) === true,
});
module.exports = withBundleAnalyzer({});

// module.exports = withCss(withPurgeCss());
