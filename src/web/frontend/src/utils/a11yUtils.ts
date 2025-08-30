// Accessibility utilities
export const a11yUtils = {
    // Generate unique IDs for accessibility attributes
    generateId: (prefix: string = 'a11y'): string => {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Set focus on an element safely
    focusElement: (element: HTMLElement | null): void => {
        if (element && typeof element.focus === 'function') {
            element.focus();
        }
    },
    
    // Announce messages to screen readers
    announceToScreenReader: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
        const announceElement = document.getElementById('screen-reader-announce');
        if (announceElement) {
            announceElement.setAttribute('aria-live', priority);
            announceElement.textContent = message;
            
            // Clear the message after a short delay
            setTimeout(() => {
                announceElement.textContent = '';
            }, 1000);
        }
    },
    
    // Create visually hidden text for screen readers
    createScreenReaderText: (text: string): string => {
        return `<span class="sr-only">${text}</span>`;
    },
    
    // Check if user prefers reduced motion
    prefersReducedMotion: (): boolean => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    
    // Check if user prefers dark mode
    prefersDarkMode: (): boolean => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    },
    
    // Set up keyboard navigation for a list of items
    setupKeyboardNavigation: (
        container: HTMLElement,
        itemSelector: string,
        onEnter?: (element: HTMLElement) => void
    ): void => {
        const items = container.querySelectorAll(itemSelector);
        let currentIndex = -1;
        
        const updateFocusedItem = (index: number) => {
            items.forEach((item, i) => {
                if (item instanceof HTMLElement) {
                    if (i === index) {
                        item.setAttribute('tabindex', '0');
                        item.classList.add('focused');
                    } else {
                        item.setAttribute('tabindex', '-1');
                        item.classList.remove('focused');
                    }
                }
            });
        };
        
        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentIndex = (currentIndex + 1) % items.length;
                updateFocusedItem(currentIndex);
                if (items[currentIndex] instanceof HTMLElement) {
                    (items[currentIndex] as HTMLElement).focus();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentIndex = (currentIndex - 1 + items.length) % items.length;
                updateFocusedItem(currentIndex);
                if (items[currentIndex] instanceof HTMLElement) {
                    (items[currentIndex] as HTMLElement).focus();
                }
            } else if (e.key === 'Home') {
                e.preventDefault();
                currentIndex = 0;
                updateFocusedItem(currentIndex);
                if (items[currentIndex] instanceof HTMLElement) {
                    (items[currentIndex] as HTMLElement).focus();
                }
            } else if (e.key === 'End') {
                e.preventDefault();
                currentIndex = items.length - 1;
                updateFocusedItem(currentIndex);
                if (items[currentIndex] instanceof HTMLElement) {
                    (items[currentIndex] as HTMLElement).focus();
                }
            } else if (e.key === 'Enter' && currentIndex >= 0 && onEnter) {
                e.preventDefault();
                if (items[currentIndex] instanceof HTMLElement) {
                    onEnter(items[currentIndex] as HTMLElement);
                }
            }
        });
        
        // Initialize first item as focusable
        if (items.length > 0 && items[0] instanceof HTMLElement) {
            (items[0] as HTMLElement).setAttribute('tabindex', '0');
        }
    }
};