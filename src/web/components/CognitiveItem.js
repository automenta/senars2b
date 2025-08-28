class CognitiveItem extends Component {
    constructor(itemData, app) {
        const el = document.createElement('div');
        super(el);

        this.item = itemData;
        this.app = app; // Reference to the main web app for API calls
        this.element.className = `output-item ${this.item.type.toLowerCase()}`;
        this.isHistoryVisible = false;
        this.isInsightsVisible = false;

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
        iconButton.title = 'Show History';

        const insightsButton = document.createElement('button');
        insightsButton.className = 'item-icon-button';
        insightsButton.textContent = '💡';
        insightsButton.title = 'Show Insights';

        if (this.item.type !== 'BELIEF') {
            iconButton.disabled = true;
            iconButton.style.cursor = 'default';
            insightsButton.disabled = true;
            insightsButton.style.cursor = 'default';
        }
        this.historyButton = iconButton;
        this.insightsButton = insightsButton;

        const typeEl = document.createElement('div');
        typeEl.className = 'item-type';
        typeEl.appendChild(iconButton);
        typeEl.appendChild(insightsButton);
        typeEl.append(` ${this.item.type}`);

        const contentEl = document.createElement('div');
        contentEl.className = 'item-content';
        contentEl.textContent = this.item.label || 'No content';

        const metaEl = document.createElement('div');
        metaEl.className = 'item-meta';

        if (this.item.truth) {
            const donutContainer = document.createElement('div');
            donutContainer.style.marginRight = '15px';
            new UncertaintyDonut(donutContainer, {
                frequency: this.item.truth.frequency,
                confidence: this.item.truth.confidence
            });
            metaEl.appendChild(donutContainer);
        }
        if (this.item.attention) {
            metaEl.appendChild(this.createVisualization('Priority', this.item.attention.priority));
            metaEl.appendChild(this.createVisualization('Durability', this.item.attention.durability));
        }

        if (this.item.meta) {\n            const metaEntries = Object.entries(this.item.meta);\n            if (metaEntries.length > 0) {\n                const metaTagsContainer = document.createElement('div');\n                metaTagsContainer.style.marginTop = '15px';\n                metaTagsContainer.style.borderTop = '1px solid rgba(255,255,255,0.1)';\n                metaTagsContainer.style.paddingTop = '15px';\n                \n                // Filter out internal metadata\n                const displayMeta = metaEntries.filter(([key]) => \n                    !['type', 'source', 'timestamp', 'trust_score', 'taskId'].includes(key)\n                );\n                \n                // Add task link if this item is related to a task\n                if (this.item.meta.taskId) {\n                    const taskTag = document.createElement('span');\n                    taskTag.className = 'meta-tag';\n                    taskTag.innerHTML = `📋 Related to Task: <a href=\"#\" onclick=\"document.querySelector('.tab[data-tab=\\\"tasks\\\"]').click(); return false;\">View Task</a>`;\n                    metaTagsContainer.appendChild(taskTag);\n                }\n                \n                displayMeta.forEach(([key, value]) => {\n                    const tag = document.createElement('span');\n                    tag.className = 'meta-tag';\n                    tag.textContent = `${key}: ${JSON.stringify(value)}`;\n                    metaTagsContainer.appendChild(tag);\n                });\n                metaEl.appendChild(metaTagsContainer);\n            }\n        }

        this.element.appendChild(typeEl);
        this.element.appendChild(contentEl);
        this.element.appendChild(metaEl);

        // Placeholder for the history chart
        this.historyContainer = document.createElement('div');
        this.historyContainer.className = 'history-container';
        this.historyContainer.style.display = 'none'; // Initially hidden
        this.element.appendChild(this.historyContainer);

        // Placeholder for insights
        this.insightsContainer = document.createElement('div');
        this.insightsContainer.className = 'insights-container';
        this.insightsContainer.style.display = 'none'; // Initially hidden
        this.element.appendChild(this.insightsContainer);
    }

    setupEventListeners() {
        if (this.historyButton && !this.historyButton.disabled) {
            this.historyButton.addEventListener('click', () => this.toggleHistory());
        }
        if (this.insightsButton && !this.insightsButton.disabled) {
            this.insightsButton.addEventListener('click', () => this.toggleInsights());
        }
    }

    toggleInsights() {
        this.isInsightsVisible = !this.isInsightsVisible;
        if (this.isInsightsVisible) {
            this.insightsContainer.style.display = 'block';
            this.loadInsights();
        } else {
            this.insightsContainer.style.display = 'none';
        }
    }

    async loadInsights() {
        this.insightsContainer.innerHTML = '<div class="spinner"></div>';
        try {
            const messageId = `insights-${this.item.id}-${Date.now()}`;
            this.app.sendWebSocketMessage('worldModel', 'getInsightsForBelief', {beliefId: this.item.id}, messageId);

            const response = await this.app.waitForResponse(messageId, 5000);

            if (response.error) {
                throw new Error(response.error.message);
            }

            const insights = response.payload.insights;
            if (insights && insights.length > 0) {
                this.renderInsights(insights);
            } else {
                this.insightsContainer.innerHTML = '<p>No insights found for this item.</p>';
            }
        } catch (error) {
            this.insightsContainer.innerHTML = `<p class="error">Error loading insights: ${error.message}</p>`;
            console.error('Failed to load insights:', error);
        }
    }

    renderInsights(insights) {
        this.insightsContainer.innerHTML = ''; // Clear spinner or old content

        const title = document.createElement('h4');
        title.textContent = 'Meta-Insights';
        title.style.marginTop = '10px';
        title.style.marginBottom = '5px';
        this.insightsContainer.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'insights-list';
        insights.forEach(insight => {
            const listItem = document.createElement('li');
            listItem.textContent = insight.label;
            list.appendChild(listItem);
        });

        this.insightsContainer.appendChild(list);
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
            this.app.sendWebSocketMessage('worldModel', 'getItemHistory', {itemId: this.item.id}, messageId);

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

        const canvas = document.createElement('canvas');
        this.historyContainer.appendChild(canvas);

        const labels = history.map(h => new Date(h.stamp.timestamp));
        const frequencyData = history.map(h => h.truth.frequency);
        const confidenceData = history.map(h => h.truth.confidence);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Frequency',
                    data: frequencyData,
                    borderColor: 'var(--success)',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.4, // For smooth curves
                },
                {
                    label: 'Confidence',
                    data: confidenceData,
                    borderColor: 'var(--primary)',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    fill: true,
                    tension: 0.4,
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'white'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'second',
                        displayFormats: {
                            second: 'h:mm:ss a'
                        }
                    },
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        };

        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: data,
            options: options
        });
    }
}
