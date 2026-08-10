const NOOP = () => {};
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;
const runOnUIAsync = async (fn) => fn();
const runOnUISync = (fn) => fn();
const scheduleOnRN = jest.fn();
const scheduleOnRuntime = jest.fn();
const runOnRuntime = jest.fn();

module.exports = {
  init: jest.fn(),
  bundleModeInit: jest.fn(),
  isShareableRef: jest.fn(() => false),
  makeShareable: jest.fn((value) => value),
  makeShareableCloneRecursive: jest.fn((value) => value),
  makeShareableCloneOnUIRecursive: jest.fn((value) => value),
  shareableMappingCache: new Map(),
  createSerializable: jest.fn((value) => value),
  serializableMappingCache: new Map(),
  createSynchronizable: jest.fn((value) => value),
  getRuntimeKind: jest.fn(() => 'JS'),
  RuntimeKind: { JS: 'JS' },
  runOnJS,
  runOnUI,
  runOnUIAsync,
  runOnUISync,
  scheduleOnRN,
  scheduleOnRuntime,
  runOnRuntime,
  setDynamicFeatureFlag: jest.fn(),
  getStaticFeatureFlag: jest.fn(() => false),
  getDynamicFeatureFlag: jest.fn(() => false),
  callMicrotasks: jest.fn(),
  executeOnUIRuntimeSync: jest.fn((fn) => fn()),
  scheduleOnUI: jest.fn(),
};
