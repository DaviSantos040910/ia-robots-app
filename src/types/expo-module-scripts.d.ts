// This is a workaround for expo-localization TypeScript error
declare module 'expo-module-scripts/tsconfig.base' {
  const config: any;
  export default config;
}
