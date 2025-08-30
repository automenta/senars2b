import { useState, useCallback } from 'react';

interface ErrorState {
    message: string;
    code?: string;
    timestamp: number;
}

export interface UseErrorHandlerReturn {
    error: ErrorState | null;
    setError: (message: string, code?: string) => void;
    clearError: () => void;
    hasError: boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
    const [error, setErrorState] = useState<ErrorState | null>(null);
    
    const setError = useCallback((message: string, code?: string) => {
        setErrorState({
            message,
            code,
            timestamp: Date.now()
        });
    }, []);
    
    const clearError = useCallback(() => {
        setErrorState(null);
    }, []);
    
    const hasError = !!error;
    
    return {
        error,
        setError,
        clearError,
        hasError
    };
};

// Utility function to handle API errors
export const handleApiError = (error: any, setError: (message: string, code?: string) => void) => {
    if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        const message = data?.message || `Server error (${status})`;
        setError(message, `API_ERROR_${status}`);
    } else if (error.request) {
        // Request was made but no response received
        setError('Network error - please check your connection', 'NETWORK_ERROR');
    } else {
        // Something else happened
        setError(error.message || 'An unknown error occurred', 'UNKNOWN_ERROR');
    }
};

// Utility function to create error messages for common scenarios
export const createErrorMessage = {
    network: 'Network error - please check your connection',
    timeout: 'Request timeout - server is taking too long to respond',
    unauthorized: 'Unauthorized access - please log in again',
    forbidden: 'Access forbidden - you do not have permission to perform this action',
    notFound: 'Resource not found',
    server: 'Server error - please try again later',
    validation: 'Invalid input - please check your data',
    unknown: 'An unknown error occurred'
};