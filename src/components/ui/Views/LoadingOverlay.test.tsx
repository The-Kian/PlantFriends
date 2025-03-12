import { render, screen } from '@testing-library/react-native';

import React from 'react';


import LoadingOverlay from './LoadingOverlay';



describe('LoadingOverlay', () => {
    it('renders correctly with a message', () => {
        const message = 'Loading...';
        render(<LoadingOverlay message={message} />);

        expect(screen.getByText(message)).toBeTruthy();
        expect(screen.getByTestId('activity-indicator')).toBeTruthy();
    });
});
