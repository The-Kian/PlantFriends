import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Collapsible } from './Collapsible';
import { ThemedText } from '@components/ui/Text/ThemedText';

describe("Collapsible", () => {
    const renderCollapsible = () => {
        return render(
            <Collapsible title="Test Title">
                <ThemedText>Test Content</ThemedText>
            </Collapsible>
        );
    };

    it("renders the title correctly", () => {
        renderCollapsible();
        expect(screen.getByText("Test Title")).toBeTruthy();
    });
    
    it("toggles content visibility on press", () => {
        renderCollapsible();
        const titleElement = screen.getByText("Test Title");

        // Initially, content should not be visible
        expect(screen.queryByText("Test Content")).toBeNull();

        // Press to open
        fireEvent.press(titleElement);
        expect(screen.getByText("Test Content")).toBeTruthy();

        // Press to close
        fireEvent.press(titleElement);
        expect(screen.queryByText("Test Content")).toBeNull();
    });


    it("changes icon based on open state", () => {
        renderCollapsible();
        const titleElement = screen.getByText("Test Title");

        // Initially, the icon should be 'chevron-forward-outline'
        expect(screen.getByTestId('collapsible-icon').props.name).toBe('chevron-forward-outline');

        // Press to open
        fireEvent.press(titleElement);
        expect(screen.getByTestId('collapsible-icon').props.name).toBe('chevron-down');

        // Press to close
        fireEvent.press(titleElement);
        expect(screen.getByTestId('collapsible-icon').props.name).toBe('chevron-forward-outline');
    });
})
