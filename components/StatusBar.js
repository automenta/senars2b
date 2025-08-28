class StatusBar extends Component {
    constructor(element) {
        super(element);
        this.connectionStatusEl = this.element.querySelector('#connection-status');
        this.agendaSizeEl = this.element.querySelector('#agenda-size');
    }

    updateConnectionStatus(connected) {
        if (connected) {
            this.connectionStatusEl.innerHTML = '<span class="status-indicator status-connected"></span> Connected';
        } else {
            this.connectionStatusEl.innerHTML = '<span class="status-indicator status-disconnected"></span> Disconnected';
        }
    }

    updateAgendaSize(size) {
        this.agendaSizeEl.textContent = size;
    }
}
