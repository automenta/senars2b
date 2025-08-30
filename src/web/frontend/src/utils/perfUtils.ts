// Performance monitoring utilities
export const perfUtils = {
    // Measure execution time of a function
    measureExecutionTime: <T>(fn: () => T, label: string): T => {
        const start = performance.now();
        try {
            const result = fn();
            const end = performance.now();
            console.log(`${label} executed in ${end - start} milliseconds`);
            return result;
        } catch (error) {
            const end = performance.now();
            console.error(`${label} failed after ${end - start} milliseconds`, error);
            throw error;
        }
    },
    
    // Create a performance observer for component rendering
    observeComponentRender: (componentName: string): PerformanceObserver => {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                console.log(`${componentName} rendered in ${entry.duration} milliseconds`);
            }
        });
        
        observer.observe({ entryTypes: ['measure'] });
        return observer;
    },
    
    // Start a performance mark
    markStart: (name: string): void => {
        performance.mark(`${name}-start`);
    },
    
    // End a performance mark and measure
    markEnd: (name: string): void => {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
    },
    
    // Monitor memory usage (if available)
    getMemoryUsage: (): MemoryInfo | null => {
        if ('memory' in performance) {
            return (performance as any).memory as MemoryInfo;
        }
        return null;
    },
    
    // Log memory usage
    logMemoryUsage: (): void => {
        const memory = perfUtils.getMemoryUsage();
        if (memory) {
            console.log(`Memory usage: ${Math.round(memory.usedJSHeapSize / 1048576)} MB used out of ${Math.round(memory.jsHeapSizeLimit / 1048576)} MB available`);
        }
    }
};

interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}