import {Agenda} from './agenda';
import {WorldModel} from './worldModel';
import {CognitiveItemFactory} from '../modules/cognitiveItemFactory';

export class ReflectionLoop {
    private worldModel: WorldModel;
    private agenda: Agenda;
    private readonly interval: number;
    private lastRun: number = 0;
    private schemaUsage: Map<string, number> = new Map(); // schema_id -> last_used_timestamp
    private kpiHistory: { timestamp: number; kpi: string; value: number }[] = [];
    private performanceMetrics: {
        cyclesRun: number;
        errorsEncountered: number;
        lastError: string | null;
        averageCycleTime: number;
    } = {
        cyclesRun: 0,
        errorsEncountered: 0,
        lastError: null,
        averageCycleTime: 0
    };
    private cycleTimes: number[] = [];

    constructor(worldModel: WorldModel, agenda: Agenda, interval: number = 60000) {
        this.worldModel = worldModel;
        this.agenda = agenda;
        this.interval = interval;
    }

    start(): NodeJS.Timeout {
        // Add initial KPIs to track system health
        this.recordKPI('agenda_size', 0);
        this.recordKPI('contradiction_rate', 0);
        this.recordKPI('schema_usage_count', 0);

        return setInterval(() => {
            this.runCycle();
        }, this.interval);
    }

    runCycle(): void {
        const cycleStart = Date.now();
        try {
            const now = Date.now();
            this.lastRun = now;

            // Update KPIs
            this.updateKPIs();

            // Trigger schema learning periodically
            this.triggerSchemaLearning();

            // Check KPIs for anomalies
            const kpis = this.worldModel.query_by_symbolic("kpi", 100);

            // Check for high contradiction rate
            const contradictionKPI = kpis.find(kpi => {
                const item = kpi as any;
                return item.label &&
                    item.label.includes('contradiction_rate') &&
                    this.extractNumericValue(item.label) > 0.05;
            });

            if (contradictionKPI) {
                // High contradiction rate - trigger audit
                const auditGoal = CognitiveItemFactory.createGoal(
                    'audit-atom-' + now,
                    {priority: 0.95, durability: 0.8}
                );
                auditGoal.label = "(run belief_audit)";
                this.agenda.push(auditGoal);
            }

            // Check for unused schemas
            const unusedSchemas = this.findUnusedSchemas(now);
            if (unusedSchemas.length > 0) {
                const reviewGoal = CognitiveItemFactory.createQuery(
                    'schema-review-atom-' + now,
                    {priority: 0.7, durability: 0.6}
                );
                reviewGoal.label = `(should_deprecate_schema ${unusedSchemas[0]}?)`;
                this.agenda.push(reviewGoal);
            }

            // Check memory size
            const memorySize = this.estimateMemorySize();
            if (memorySize > 1000000) { // 1M items
                const compactGoal = CognitiveItemFactory.createGoal(
                    'compact-atom-' + now,
                    {priority: 0.8, durability: 0.9}
                );
                compactGoal.label = "(compact memory)";
                this.agenda.push(compactGoal);
            }

            // Check agenda size
            const agendaSize = this.agenda.size();
            if (agendaSize > 10000) { // 10K items
                const manageAgendaGoal = CognitiveItemFactory.createGoal(
                    'agenda-management-atom-' + now,
                    {priority: 0.75, durability: 0.7}
                );
                manageAgendaGoal.label = "(manage agenda overflow)";
                this.agenda.push(manageAgendaGoal);
            }

            // Check for performance degradation
            if (this.detectPerformanceDegradation()) {
                const optimizeGoal = CognitiveItemFactory.createGoal(
                    'optimization-atom-' + now,
                    {priority: 0.85, durability: 0.8}
                );
                optimizeGoal.label = "(optimize cognitive processes)";
                this.agenda.push(optimizeGoal);
            }

            // Update performance metrics
            const cycleTime = Date.now() - cycleStart;
            this.cycleTimes.push(cycleTime);
            // Keep only the last 100 cycle times
            if (this.cycleTimes.length > 100) {
                this.cycleTimes = this.cycleTimes.slice(-100);
            }

            this.performanceMetrics.cyclesRun++;
            this.performanceMetrics.averageCycleTime = this.cycleTimes.reduce((a, b) => a + b, 0) / this.cycleTimes.length;
        } catch (error) {
            console.error("Reflection loop error:", error);
            this.performanceMetrics.errorsEncountered++;
            this.performanceMetrics.lastError = error instanceof Error ? error.message : String(error);

            // Update performance metrics even on error
            const cycleTime = Date.now() - cycleStart;
            this.cycleTimes.push(cycleTime);
            if (this.cycleTimes.length > 100) {
                this.cycleTimes = this.cycleTimes.slice(-100);
            }
            this.performanceMetrics.averageCycleTime = this.cycleTimes.reduce((a, b) => a + b, 0) / this.cycleTimes.length;
        }
    }

    recordSchemaUsage(schemaId: string): void {
        // Record that a schema was used
        this.schemaUsage.set(schemaId, Date.now());
    }

    /**
     * Get performance metrics for the reflection loop
     * @returns Performance metrics
     */
    getPerformanceMetrics(): any {
        return {...this.performanceMetrics};
    }

    private updateKPIs(): void {
        // Update system KPIs
        this.recordKPI('agenda_size', this.agenda.size());
        this.recordKPI('schema_usage_count', this.schemaUsage.size);

        // In a real implementation, we would calculate actual contradiction rates
        // For now, we'll use a placeholder
        this.recordKPI('contradiction_rate', Math.random() * 0.1);
    }

    private recordKPI(name: string, value: number): void {
        // Create or update a KPI belief
        const kpiContent = `(kpi ${name} ${value})`;
        const kpiItem = CognitiveItemFactory.createBelief(
            `kpi-${name}-${Date.now()}`,
            {frequency: 1.0, confidence: 0.99},
            {priority: 0.3, durability: 0.9} // Low priority but high durability
        );
        kpiItem.label = kpiContent;

        this.worldModel.add_item(kpiItem);

        // Store in history for trend analysis
        this.kpiHistory.push({
            timestamp: Date.now(),
            kpi: name,
            value: value
        });

        // Keep only recent history (last 100 entries)
        if (this.kpiHistory.length > 100) {
            this.kpiHistory = this.kpiHistory.slice(-100);
        }
    }

    private estimateMemorySize(): number {
        // In a real implementation, we would have access to the actual size
        // This is a simplified estimation based on the number of items
        // For now, we'll use a more realistic placeholder
        return this.worldModel.query_by_symbolic({}, 1000).length * 100; // Rough estimate
    }

    private findUnusedSchemas(now: number): string[] {
        // Find schemas that haven't been used in the last hour
        const oneHourAgo = now - (1000 * 60 * 60);
        const unused: string[] = [];

        for (const [schemaId, lastUsed] of this.schemaUsage.entries()) {
            if (lastUsed < oneHourAgo) {
                unused.push(schemaId);
            }
        }

        return unused;
    }

    private extractNumericValue(text: string): number {
        // Extract the first numeric value from text
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    }

    private detectPerformanceDegradation(): boolean {
        // Simple performance degradation detection
        // In a real implementation, this would be more sophisticated
        if (this.kpiHistory.length < 10) return false;

        // Check if agenda size is consistently growing
        const recentHistory = this.kpiHistory.slice(-10);
        const agendaSizes = recentHistory
            .filter(entry => entry.kpi === 'agenda_size')
            .map(entry => entry.value);

        if (agendaSizes.length < 5) return false;

        // Calculate trend
        const trend = this.calculateTrend(agendaSizes);
        return trend > 0.1; // Growing trend
    }

    private calculateTrend(values: number[]): number {
        if (values.length < 2) return 0;

        // Simple linear regression slope
        const n = values.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumXX += i * i;
        }

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    /**
     * Trigger schema learning process
     * This method would be called by the cognitive core to enable schema learning
     */
    private triggerSchemaLearning(): void {
        // In a full implementation, this would call the schema learning module
        // For now, we'll just log that schema learning was triggered
        console.log("Schema learning cycle triggered");
    }
}
