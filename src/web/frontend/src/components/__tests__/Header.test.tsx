import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

// Mock message handler
const mockSendMessage = jest.fn();

describe('Header', () => {
    it('renders loading state when isConnected is false', () => {
        render(<Header isConnected={false} sendMessage={mockSendMessage}/>);
        expect(screen.getByText('Connecting to cognitive core...')).toBeInTheDocument();
    });

    it('renders system status correctly when connected', () => {
        render(<Header isConnected={true} sendMessage={mockSendMessage}/>);
        expect(screen.getByText('Cognitive Core Status')).toBeInTheDocument();
        expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should toggle content visibility on header click', () => {
        render(<Header isConnected={true} sendMessage={mockSendMessage}/>);
        const headerButton = screen.getByRole('button', {name: /Cognitive Core Status/i});

        // Content should be visible initially
        expect(screen.getByText('System is operational')).toBeInTheDocument();

        // Click to hide
        headerButton.click();
        expect(screen.queryByText('System is operational')).not.toBeInTheDocument();

        // Click to show again
        headerButton.click();
        expect(screen.getByText('System is operational')).toBeInTheDocument();
    });

    it('should have correct aria attributes for accessibility', () => {
        render(<Header isConnected={true} sendMessage={mockSendMessage}/>);
        const headerButton = screen.getByRole('button', {name: /Cognitive Core Status/i});
        const content = document.getElementById('header-content');

        expect(headerButton).toHaveAttribute('aria-expanded', 'true');
        expect(headerButton).toHaveAttribute('aria-controls', 'header-content');
        expect(content).toBeInTheDocument();
    });
});