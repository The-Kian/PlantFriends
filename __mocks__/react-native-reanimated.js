const React = require('react');
const { View, ScrollView, Text, Image } = require('react-native');

const createSharedValue = (value) => {
  const shared = { value };
  return new Proxy(shared, {
    get(target, prop) {
      if (prop === 'value') {
        return target.value;
      }
      if (prop === 'get') {
        return () => target.value;
      }
      if (prop === 'set') {
        return (newValue) => {
          if (typeof newValue === 'function') {
            target.value = newValue(target.value);
          } else {
            target.value = newValue;
          }
        };
      }
      return target[prop];
    },
    set(target, prop, newValue) {
      if (prop === 'value') {
        target.value = newValue;
        return true;
      }
      target[prop] = newValue;
      return true;
    },
  });
};

const Animated = {
  View,
  ScrollView,
  Text,
  Image,
  createAnimatedComponent: (Component) => Component,
};

const useSharedValue = (initialValue) => createSharedValue(initialValue);
const useAnimatedStyle = (fn) => fn();
const useAnimatedRef = () => ({ current: null });
const useScrollViewOffset = () => ({ value: 0 });
const useAnimatedProps = () => {};
const useAnimatedReaction = () => {};
const useAnimatedScrollHandler = () => () => {};
const useDerivedValue = (fn) => ({ value: fn() });
const interpolate = (value, inputRange, outputRange) => {
  if (Array.isArray(outputRange) && outputRange.length > 0) {
    return outputRange[0];
  }
  return value;
};
const withTiming = (value) => value;
const withRepeat = (value) => value;
const withSequence = (...values) => values[0];
const runOnJS = (fn) => fn;

module.exports = {
  ...Animated,
  default: Animated,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedRef,
  useScrollViewOffset,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useDerivedValue,
  interpolate,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
};
