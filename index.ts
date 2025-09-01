import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
if (Platform.OS === 'web') {
  const rootTag = document.getElementById('root');
  const RootComponent = registerRootComponent(App);
  
  // For web, we need to manually render the app
  if (rootTag) {
    const { AppRegistry } = require('react-native');
    const { name: appName } = require('./app.json');
    AppRegistry.registerComponent(appName, () => RootComponent);
    AppRegistry.runApplication(appName, {
      rootTag,
      initialProps: {},
    });
  }
} else {
  // For mobile, use the standard registration
  registerRootComponent(App);
}
