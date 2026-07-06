module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: { "@": "./src" },
        },
      ],
      // Reanimated 4 moved its worklets Babel plugin into react-native-worklets.
      "react-native-worklets/plugin",
    ],
  };
};
