const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'expo-modules-core', 'src', 'registerWebModule.ts');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');

  // Check if already patched
  if (!content.includes('optionalModuleName')) {
    console.log('[patch-expo] Applying registerWebModule production minification patch...');
    
    // Replace function signature
    content = content.replace(
      'export function registerWebModule<\n  EventsMap extends Record<never, never>,\n  ModuleType extends typeof NativeModule<EventsMap>,\n>(moduleImplementation: ModuleType): ModuleType {',
      'export function registerWebModule<\n  EventsMap extends Record<never, never>,\n  ModuleType extends typeof NativeModule<EventsMap>,\n>(moduleImplementation: ModuleType, optionalModuleName?: string): ModuleType {'
    );

    // Replace moduleName and instantiation logic
    const oldLogic = `  const moduleName = moduleImplementation.name;
  if (!moduleName) {
    throw new Error('Module implementation must be a class');
  }
  if (!globalThis?.expo?.modules) {
    globalThis.expo.modules = {};
  }
  if (globalThis.expo.modules[moduleName]) {
    return globalThis.expo.modules[moduleName];
  }
  globalThis.expo.modules[moduleName] = new moduleImplementation();
  return globalThis.expo.modules[moduleName];`;

    const newLogic = `  const moduleName =
    optionalModuleName ||
    moduleImplementation.name ||
    (moduleImplementation as any)?.displayName ||
    'ExpoModule';
  if (!moduleName) {
    throw new Error('Module implementation must be a class');
  }
  if (!globalThis?.expo?.modules) {
    globalThis.expo.modules = {};
  }
  if (globalThis.expo.modules[moduleName]) {
    return globalThis.expo.modules[moduleName];
  }
  let instance: any;
  try {
    instance = new (moduleImplementation as any)();
  } catch {
    instance = (moduleImplementation as any)();
  }
  globalThis.expo.modules[moduleName] = instance;
  return globalThis.expo.modules[moduleName];`;

    content = content.replace(oldLogic, newLogic);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-expo] Patch applied successfully to registerWebModule.ts.');
  } else {
    console.log('[patch-expo] registerWebModule.ts is already patched.');
  }
} else {
  console.log('[patch-expo] Target file not found, skipping patch.');
}
