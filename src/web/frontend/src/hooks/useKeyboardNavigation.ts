import { useCallback, useEffect, useRef } from 'react';

interface KeyboardNavigationOptions {
    enableArrowNavigation?: boolean;
    enableSelection?: boolean;
    enableExpansion?: boolean;
    onUp?: () => void;
    onDown?: () => void;
    onSelect?: () => void;
    onExpand?: () => void;
    onCollapse?: () => void;
}

export const useKeyboardNavigation = (
    itemIds: string[],
    selectedId: string | null,
    options: KeyboardNavigationOptions = {}
) => {
    const {
        enableArrowNavigation = true,
        enableSelection = true,
        enableExpansion = true,
        onUp,
        onDown,
        onSelect,
        onExpand,
        onCollapse
    } = options;
    
    const selectedIndexRef = useRef<number>(-1);
    
    // Update selected index ref when selectedId changes
    useEffect(() => {
        if (selectedId) {
            const index = itemIds.indexOf(selectedId);
            selectedIndexRef.current = index;
        } else {
            selectedIndexRef.current = -1;
        }
    }, [selectedId, itemIds]);
    
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Only handle keys if we have items
        if (itemIds.length === 0) return;
        
        switch (e.key) {
            case 'ArrowUp':
                if (enableArrowNavigation) {
                    e.preventDefault();
                    if (selectedIndexRef.current > 0) {
                        selectedIndexRef.current--;
                        onUp?.();
                    }
                }
                break;
                
            case 'ArrowDown':
                if (enableArrowNavigation) {
                    e.preventDefault();
                    if (selectedIndexRef.current < itemIds.length - 1) {
                        selectedIndexRef.current++;
                        onDown?.();
                    }
                }
                break;
                
            case 'Enter':
                if (enableSelection && selectedIndexRef.current >= 0) {
                    e.preventDefault();
                    onSelect?.();
                }
                break;
                
            case 'ArrowRight':
                if (enableExpansion && selectedIndexRef.current >= 0) {
                    e.preventDefault();
                    onExpand?.();
                }
                break;
                
            case 'ArrowLeft':
                if (enableExpansion && selectedIndexRef.current >= 0) {
                    e.preventDefault();
                    onCollapse?.();
                }
                break;
                
            default:
                break;
        }
    }, [itemIds, enableArrowNavigation, enableSelection, enableExpansion, onUp, onDown, onSelect, onExpand, onCollapse]);
    
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
    
    // Return helper functions
    const selectItem = useCallback((id: string) => {
        const index = itemIds.indexOf(id);
        if (index >= 0) {
            selectedIndexRef.current = index;
        }
    }, [itemIds]);
    
    const selectFirst = useCallback(() => {
        if (itemIds.length > 0) {
            selectedIndexRef.current = 0;
        }
    }, [itemIds]);
    
    const selectLast = useCallback(() => {
        if (itemIds.length > 0) {
            selectedIndexRef.current = itemIds.length - 1;
        }
    }, [itemIds]);
    
    return {
        selectedIndex: selectedIndexRef.current,
        selectItem,
        selectFirst,
        selectLast
    };
};