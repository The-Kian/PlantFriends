import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TabNavigator from './TabNavigator';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@screens/tabs/home', () => () => null);
jest.mock('@screens/tabs/MyPlants', () => () => null);
jest.mock('./ProfileButton', () => () => null);
describe('TabNavigator', () => {
    it('renders tab screens with correct labels', () => {
        render(
            <NavigationContainer>
                <TabNavigator />
            </NavigationContainer>
        );
        expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'My Plants' })).toBeTruthy();
    });
});