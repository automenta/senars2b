import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../../src/web/frontend/src/components/Header';

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
});