// Date formatting utilities
export const dateUtils = {
    // Format date as relative time (e.g., "2 hours ago")
    formatRelativeTime: (date: Date | number | string): string => {
        const d = new Date(date);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
        
        if (diffInSeconds < 60) {
            return 'just now';
        }
        
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        }
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        }
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        }
        
        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) {
            return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
        }
        
        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
        }
        
        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    },
    
    // Format date as short string (e.g., "Jan 1, 2023")
    formatShortDate: (date: Date | number | string): string => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },
    
    // Format date as time string (e.g., "2:30 PM")
    formatTime: (date: Date | number | string): string => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    },
    
    // Format date as full string (e.g., "January 1, 2023 at 2:30 PM")
    formatFullDate: (date: Date | number | string): string => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    },
    
    // Format duration in milliseconds to human readable format
    formatDuration: (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        }
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        
        return `${seconds}s`;
    },
    
    // Get date in YYYY-MM-DD format
    toISOStringDate: (date: Date | number | string): string => {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }
};