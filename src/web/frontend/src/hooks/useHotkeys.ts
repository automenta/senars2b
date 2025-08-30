import {useEffect} from 'react';

type HotkeyMap = {
    [key: string]: (e: KeyboardEvent) => void;
};

export const useHotkeys = (hotkeys: HotkeyMap, deps: any[] = []) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const callback = hotkeys[e.key];
            if (callback) {
                e.preventDefault();
                callback(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [hotkeys, ...deps]);
};
