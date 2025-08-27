class UncertaintyDonut extends Component {
    constructor(element, {frequency, confidence, thresholds = {}}) {
        super(element);
        this.frequency = frequency;
        this.confidence = confidence;
        this.thresholds = thresholds;
        this.chart = null;

        this.render();
    }

    render() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 50;
        this.element.appendChild(canvas);
        this.element.style.position = 'relative';
        this.element.style.width = `${canvas.width}px`;
        this.element.style.height = `${canvas.height}px`;

        const freqPercent = (this.frequency * 100).toFixed(1);
        const confPercent = (this.confidence * 100).toFixed(1);

        // Use a color from the theme, and vary its alpha with confidence
        const baseColor = 'var(--success)'; // Green for beliefs
        const color = `rgba(16, 185, 129, ${0.2 + this.confidence * 0.8})`; // Make it visible even at 0 confidence

        const data = {
            datasets: [{
                data: [this.frequency, 1 - this.frequency],
                backgroundColor: [color, 'rgba(255, 255, 255, 0.1)'],
                borderColor: ['transparent', 'transparent'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: () => `Frequency: ${freqPercent}%`,
                        afterLabel: () => `Confidence: ${confPercent}%`
                    }
                },
                legend: {
                    display: false
                }
            },
            // Disable all events except tooltip
            events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
        };

        this.chart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: data,
            options: options
        });

        // Add a central text label
        const textContainer = document.createElement('div');
        textContainer.style.position = 'absolute';
        textContainer.style.top = '75%';
        textContainer.style.left = '50%';
        textContainer.style.transform = 'translate(-50%, -50%)';
        textContainer.style.textAlign = 'center';
        textContainer.style.color = 'var(--light)';
        textContainer.style.pointerEvents = 'none';

        const freqLabel = document.createElement('div');
        freqLabel.style.fontSize = '1em';
        freqLabel.style.fontWeight = 'bold';
        freqLabel.textContent = `${(this.frequency * 100).toFixed(0)}%`;

        textContainer.appendChild(freqLabel);
        this.element.appendChild(textContainer);
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
        }
        super.destroy();
    }
}
