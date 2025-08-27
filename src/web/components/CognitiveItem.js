class CognitiveItem extends Component {
    constructor(itemData) {
        const el = document.createElement('div');
        super(el);

        this.item = itemData;
        this.element.className = `output-item ${this.item.type.toLowerCase()}`;
        this.render();
    }

    createVisualization(label, value) {
        const percentage = (value * 100).toFixed(2);
        const progressColor = label === 'Frequency' ? 'var(--success)' :
                              label === 'Confidence' ? 'var(--primary)' :
                              label === 'Priority' ? 'var(--danger)' :
                              'var(--warning)';
        return `
            <div class="visualization-container">
                <div class="visualization-label">${label}: ${percentage}%</div>
                <div class="progress-bar">
                    <div class="progress-bar-filler" style="width: ${percentage}%; background-color: ${progressColor};"></div>
                </div>
            </div>
        `;
    }

    render() {
        let truthInfo = '';
        if (this.item.truth) {
            truthInfo += this.createVisualization('Frequency', this.item.truth.frequency);
            truthInfo += this.createVisualization('Confidence', this.item.truth.confidence);
        }

        let attentionInfo = '';
        if (this.item.attention) {
            attentionInfo += this.createVisualization('Priority', this.item.attention.priority);
            attentionInfo += this.createVisualization('Durability', this.item.attention.durability);
        }

        let metaInfo = '';
        if (this.item.meta) {
            const metaEntries = Object.entries(this.item.meta);
            if (metaEntries.length > 0) {
                metaInfo = metaEntries.map(([key, value]) =>
                    `<span class="meta-tag">${key}: ${value}</span>`
                ).join(' ');
                metaInfo = `<div class="item-meta" style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">${metaInfo}</div>`;
            }
        }

        const typeIcon = this.item.type === 'BELIEF' ? '🧠' :
                         this.item.type === 'GOAL' ? '🎯' :
                         this.item.type === 'QUERY' ? '❓' : '';

        this.element.innerHTML = `
            <div class="item-type">
                ${typeIcon} ${this.item.type}
            </div>
            <div class="item-content">${this.item.label || 'No content'}</div>
            <div class="item-meta">
                ${truthInfo}
                ${attentionInfo}
            </div>
            ${metaInfo}
        `;
    }
}
