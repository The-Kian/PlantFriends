// First, declare simple mocks without references to external variables

import React from 'react';
import { View } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { HelloWave } from '@components/ui/HelloWave';
import ParallaxScrollView from '@components/ui/Views/ParallaxScrollView';

import { Colors } from '@theme/Colors';


import HomeScreen from './index';


jest.mock('@components/ui/HelloWave');
jest.mock('@components/ui/Views/ParallaxScrollView');

// After imports, implement the mocks
(HelloWave as jest.Mock).mockImplementation(() => (
    <View testID="hello-wave">HelloWave Mock</View>
  ));
  
  (ParallaxScrollView as jest.Mock).mockImplementation(({ children, headerBackgroundColor, headerImage }) => (
    <>
      <View testID="parallax-header-image">{headerImage}</View>
      <View testID="parallax-content">{children}</View>
    </>
  ));

describe('HomeScreen', () => {
  it('displays the correct title text', () => {
    render(<HomeScreen />);
    
    expect(screen.getByText('Plant Friends!')).toBeTruthy();
  });


  it('provides correct theme colors to ParallaxScrollView', () => {
    render(<HomeScreen />);
    
    expect(ParallaxScrollView).toHaveBeenCalledWith(
      expect.objectContaining({
        headerBackgroundColor: {
          light: Colors['light'].headerBackground,
          dark: Colors['dark'].headerBackground
        }
      }),
      expect.anything()
    );
  });
});