class TabManager extends Component {
    constructor(element, app) {
        super(element);
        this.app = app; // Pass the main app instance for callbacks
        this.tabs = this.element.querySelectorAll('.tab');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.activateTab(tab));
        });
    }

    activateTab(tab) {
        this.tabs.forEach(t => t.classList.remove('active'));
        this.tabContents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const tabName = tab.getAttribute('data-tab');
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        // Callback to the main app if the system tab is activated
        if (tabName === 'system' && this.app && typeof this.app.requestSystemStatus === 'function') {
            this.app.requestSystemStatus();
        }
    }
}
