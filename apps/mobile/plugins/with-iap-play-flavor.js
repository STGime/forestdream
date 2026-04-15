// Config plugin: tell Gradle to pick the `play` flavor of react-native-iap.
// Without this, prebuilt Android fails with variant ambiguity (play vs amazon).
const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withIapPlayFlavor(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes("missingDimensionStrategy 'store'")) return cfg;
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /defaultConfig\s*\{/,
      "defaultConfig {\n        missingDimensionStrategy 'store', 'play'"
    );
    return cfg;
  });
};
