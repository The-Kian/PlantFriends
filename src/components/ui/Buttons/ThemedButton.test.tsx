import React from 'react';

import { render, fireEvent, screen } from '@testing-library/react-native';

import ThemedButton from './ThemedButton';
import { useThemedButtonStyles } from './ThemedButton.styles';

// Mock the styles hook
jest.mock('./ThemedButton.styles', () => ({
  useThemedButtonStyles: jest.fn(),
}));

const mockUseThemedButtonStyles = useThemedButtonStyles as jest.Mock;

describe('ThemedButton', () => {
  const mockStyles = {
    button: { backgroundColor: 'blue' },
    acceptButton: { backgroundColor: 'green' },
    cancelButton: { backgroundColor: 'red' },
    buttonPressed: { opacity: 0.5 },
  };

  beforeEach(() => {
    mockUseThemedButtonStyles.mockReturnValue(mockStyles);
  });

  it('renders with default variant', () => {
    render(<ThemedButton title="Default" onPress={() => {}} />);
    const button = screen.getByText('Default');
    expect(button).toBeTruthy();
  });

  it('renders with accept variant', () => {
    render(
      <ThemedButton title="Accept" onPress={() => {}} variant="accept" />
    );
    const button = screen.getByTestId('themed-button');
    expect(button.props.style).toContain(mockStyles.acceptButton);
  });

  it('renders with decline variant', () => {
    render(
      <ThemedButton title="Decline" onPress={() => {}} variant="decline" />
    );
    const button = screen.getByTestId('themed-button');
    expect(button.props.style).toContain(mockStyles.cancelButton);
  });

  it('applies additional styles', () => {
    const additionalStyle = { margin: 10 };
    render(
      <ThemedButton title="Styled" onPress={() => {}} additionalStyle={additionalStyle} />
    );
    const button = screen.getByTestId('themed-button');
    expect(button.props.style).toContain(additionalStyle);
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    render(<ThemedButton title="Press Me" onPress={onPress} />);
    const button = screen.getByText('Press Me');
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
