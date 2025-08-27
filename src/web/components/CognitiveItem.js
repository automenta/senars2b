class CognitiveItem extends Component {
    constructor(itemData, app) {
        const el = document.createElement('div');
        super(el);

        this.item = itemData;
        this.app = app; // Reference to the main web app for API calls
        this.element.className = `output-item ${this.item.type.toLowerCase()}`;
        this.isHistoryVisible = false;

        this.render();
        this.setupEventListeners();
    }

    createVisualization(label, value) {
        const container = document.createElement('div');
        container.className = 'visualization-container';

        const labelEl = document.createElement('div');
        labelEl.className = 'visualization-label';
        const percentage = (value * 100).toFixed(2);
        labelEl.textContent = `${label}: ${percentage}%`;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        const filler = document.createElement('div');
        filler.className = 'progress-bar-filler';
        filler.style.width = `${percentage}%`;
        const progressColor = label === 'Frequency' ? 'var(--success)' :
                              label === 'Confidence' ? 'var(--primary)' :
                              label === 'Priority' ? 'var(--danger)' :
                              'var(--warning)';
        filler.style.backgroundColor = progressColor;

        progressBar.appendChild(filler);
        container.appendChild(labelEl);
        container.appendChild(progressBar);

        container.title = `Value: ${value.toFixed(4)}`;

        return container;
    }

    render() {
        this.element.innerHTML = ''; // Clear existing content

        const iconButton = document.createElement('button');
        iconButton.className = 'item-icon-button';
        const typeIcon = this.item.type === 'BELIEF' ? '🧠' :
                         this.item.type === 'GOAL' ? '🎯' :
                         this.item.type === 'QUERY' ? '❓' :
                         this.item.type === 'EVENT' ? '⚡' : '❓';
        iconButton.textContent = typeIcon;

        if (this.item.type !== 'BELIEF') {
            iconButton.disabled = true;
            iconButton.style.cursor = 'default';
        }
        this.historyButton = iconButton; // Save a reference for later

        const typeEl = document.createElement('div');
        typeEl.className = 'item-type';
        typeEl.appendChild(iconButton);
        typeEl.append(` ${this.item.type}`);

        const contentEl = document.createElement('div');
        contentEl.className = 'item-content';
        contentEl.textContent = this.item.label || 'No content';

        const metaEl = document.createElement('div');
        metaEl.className = 'item-meta';

        if (this.item.truth) {
            metaEl.appendChild(this.createVisualization('Frequency', this.item.truth.frequency));
            metaEl.appendChild(this.createVisualization('Confidence', this.item.truth.confidence));
        }
        if (this.item.attention) {
            metaEl.appendChild(this.createVisualization('Priority', this.item.attention.priority));
            metaEl.appendChild(this.createVisualization('Durability', this.item.attention.durability));
        }

        if (this.item.meta) {
            const metaEntries = Object.entries(this.item.meta);
            if (metaEntries.length > 0) {
                const metaTagsContainer = document.createElement('div');
                metaTagsContainer.style.marginTop = '15px';
                metaTagsContainer.style.borderTop = '1px solid rgba(255,255,255,0.1)';
                metaTagsContainer.style.paddingTop = '15px';
                metaEntries.forEach(([key, value]) => {
                    const tag = document.createElement('span');
                    tag.className = 'meta-tag';
                    tag.textContent = `${key}: ${JSON.stringify(value)}`;
                    metaTagsContainer.appendChild(tag);
                });
                metaEl.appendChild(metaTagsContainer);
            }
        }

        this.element.appendChild(typeEl);
        this.element.appendChild(contentEl);
        this.element.appendChild(metaEl);

        // Placeholder for the history chart
        this.historyContainer = document.createElement('div');
        this.historyContainer.className = 'history-container';
        this.historyContainer.style.display = 'none'; // Initially hidden
        this.element.appendChild(this.historyContainer);
    }

    setupEventListeners() {
        if (this.historyButton && !this.historyButton.disabled) {
            this.historyButton.addEventListener('click', () => this.toggleHistory());
        }
    }

    toggleHistory() {
        this.isHistoryVisible = !this.isHistoryVisible;
        if (this.isHistoryVisible) {
            this.historyContainer.style.display = 'block';
            this.loadHistory();
        } else {
            this.historyContainer.style.display = 'none';
        }
    }

    async loadHistory() {
        this.historyContainer.innerHTML = '<div class="spinner"></div>';
        try {
            // This is a custom implementation of a request that expects a response
            const messageId = `history-${this.item.id}-${Date.now()}`;
            this.app.sendWebSocketMessage('worldModel', 'getItemHistory', { itemId: this.item.id }, messageId);

            const response = await this.app.waitForResponse(messageId, 5000); // 5s timeout

            if (response.error) {
                throw new Error(response.error.message);
            }

            const history = response.payload.history;
            if (history && history.length > 0) {
                this.renderHistoryChart(history);
            } else {
                this.historyContainer.innerHTML = '<p>No history found for this item.</p>';
            }
        } catch (error) {
            this.historyContainer.innerHTML = `<p class="error">Error loading history: ${error.message}</p>`;
            console.error('Failed to load history:', error);
        }
    }

    renderHistoryChart(history) {
        this.historyContainer.innerHTML = ''; // Clear spinner

        const width = 400;
        const height = 200;
        const padding = 40;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        svg.style.borderRadius = '8px';

        // --- Data preparation ---
        const timestamps = history.map(h => h.stamp.timestamp);
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const timeRange = maxTime - minTime || 1; // Avoid division by zero

        const xScale = (t) => padding + ((t - minTime) / timeRange) * (width - padding * 2);
        const yScale = (v) => (height - padding) - v * (height - padding * 2);

        // --- Axes ---
        const createLine = (x1, y1, x2, y2, color) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.style.stroke = color;
            line.style.strokeWidth = '1';
            return line;
        };
        svg.appendChild(createLine(padding, padding, padding, height - padding, '#888')); // Y-axis
        svg.appendChild(createLine(padding, height - padding, width - padding, height - padding, '#888')); // X-axis

        // --- Axis Labels ---
        const createText = (x, y, text, fill = '#ccc', fontSize = '10px', anchor = 'middle') => {
            const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', x);
            txt.setAttribute('y', y);
            txt.style.fill = fill;
            txt.style.fontSize = fontSize;
            txt.style.textAnchor = anchor;
            txt.textContent = text;
            return txt;
        };
        svg.appendChild(createText(width / 2, height - 5, 'Time', '#888'));
        svg.appendChild(createText(10, height / 2, 'Value', '#888', '10px', 'start')).setAttribute('transform', `rotate(-90 15 ${height/2})`);
        svg.appendChild(createText(padding, height - padding + 15, new Date(minTime).toLocaleTimeString(), '#888'));
        svg.appendChild(createText(width - padding, height - padding + 15, new Date(maxTime).toLocaleTimeString(), '#888'));
        svg.appendChild(createText(padding - 5, padding, '1.0', '#888', '10px', 'end'));
        svg.appendChild(createText(padding - 5, height - padding, '0.0', '#888', '10px', 'end'));

        // --- Polylines ---
        const createPolyline = (data, yField, color) => {
            const points = data.map(h => `${xScale(h.stamp.timestamp)},${yScale(h.truth[yField])}`).join(' ');
            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyline.setAttribute('points', points);
            polyline.style.stroke = color;
            polyline.style.strokeWidth = '2';
            polyline.style.fill = 'none';
            return polyline;
        };
        svg.appendChild(createPolyline(history, 'frequency', 'var(--success)'));
        svg.appendChild(createPolyline(history, 'confidence', 'var(--primary)'));

        // --- Legend ---
        const createLegendItem = (x, y, color, text) => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', 10);
            rect.setAttribute('height', 10);
            rect.style.fill = color;
            group.appendChild(rect);
            group.appendChild(createText(x + 15, y + 9, text, '#eee', '12px', 'start'));
            return group;
        };
        svg.appendChild(createLegendItem(padding + 10, 10, 'var(--success)', 'Frequency'));
        svg.appendChild(createLegendItem(padding + 110, 10, 'var(--primary)', 'Confidence'));

        this.historyContainer.appendChild(svg);
    }
}
