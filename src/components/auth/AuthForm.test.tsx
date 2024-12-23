import React from 'react';

import { AuthProps } from '@context/auth/AuthTypes';
import { NavigationContainer } from '@react-navigation/native';
import { render, fireEvent, screen } from '@testing-library/react-native';

import AuthForm from './AuthForm';

describe('AuthForm Component', () => {
  const mockOnSubmit = jest.fn();

  const defaultProps: AuthProps = {
    authScreenType: 'login',
    onSubmit: mockOnSubmit,
  };

  const renderComponent = (props = {}) => {
    return render(
      <NavigationContainer>
        <AuthForm {...defaultProps} {...props} />
      </NavigationContainer>
    );
  };

  it('renders correctly for login', () => {
    renderComponent();
    expect(screen.getByText('Email Address')).toBeVisible();
    expect(screen.getByText('Password')).toBeVisible();
    expect(screen.getByText('Log In')).toBeVisible();
  });

  it('renders correctly for signUp', () => {
    renderComponent({ authScreenType: 'signUp' });
    expect(screen.getByText('Email Address')).toBeVisible();
    expect(screen.getByText('Confirm Email Address')).toBeVisible();
    expect(screen.getByText('Password')).toBeVisible();
    expect(screen.getByText('Confirm Password')).toBeVisible();
    expect(screen.getByText('Date of Birth')).toBeVisible();
    expect(screen.getByText('Sign Up')).toBeVisible();
  });

  it('renders correctly for update', () => {
    renderComponent({ authScreenType: 'update' });
    expect(screen.getByText('Display Name')).toBeVisible();
    expect(screen.getByText('Update Details')).toBeVisible();
  });

  it('updates input values correctly', () => {
    renderComponent({ authScreenType: 'signUp' });

    fireEvent.changeText(screen.getByText('Email Address'), 'new@example.com');
    fireEvent.changeText(screen.getByText('Confirm Email Address'), 'new@example.com');
    fireEvent.changeText(screen.getByText('Password'), 'newpassword');
    fireEvent.changeText(screen.getByText('Confirm Password'), 'newpassword');
    fireEvent.changeText(screen.getByText('Display Name'), 'New User');

    // Update dateOfBirth
    const newDate = new Date('2000-01-01');
    const datePicker = screen.getByText('Date of Birth');
    fireEvent(datePicker, 'onDateChange', newDate);

    fireEvent.press(screen.getByText('Sign Up'));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'newpassword',
      displayName: 'New User',
      dateOfBirth: new Date("2000-01-01"),
      confirmEmail: 'new@example.com',
      confirmPassword: 'newpassword',
    });


  });

  it('calls onSubmit with correct credentials for login', () => {
    renderComponent();
    fireEvent.changeText(screen.getByText('Email Address'), 'test@test.com');
    fireEvent.changeText(screen.getByText('Password'), 'password');
    fireEvent.press(screen.getByText('Log In'));

    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@test.com',
        password: 'password',
    }));
  });
});