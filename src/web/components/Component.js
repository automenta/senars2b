/**
 * A base class for UI components.
 * It provides a basic structure that other components can extend.
 */
class Component {
    /**
     * @param {HTMLElement} element The root element for the component.
     */
    constructor(element) {
        if (!element) {
            throw new Error('Component must have a root element.');
        }
        this.element = element;
    }

    /**
     * Renders the component. This method is meant to be overridden by subclasses.
     */
    render() {
        // This method should be overridden by subclasses
        throw new Error('Render method must be implemented by subclass.');
    }
}
