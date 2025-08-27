import {AttentionValue, CognitiveItem, Transducer, TruthValue} from '../interfaces/types';
import {CognitiveItemFactory} from './cognitiveItemFactory';
import {v4 as uuidv4} from 'uuid';

export class TextTransducer implements Transducer {
    async process(data: any): Promise<CognitiveItem[]> {
        if (typeof data === 'string') {
            // Simple text processing - in a real implementation, this would use NLP
            return data
                .split(/[.!?]+/)
                .filter(s => s.trim().length > 0)
                .map(sentence => {
                    const trimmed = sentence.trim();
                    const truth: TruthValue = {
                        frequency: 1.0, // Assume user input is factual
                        confidence: 0.8 // But not completely certain
                    };

                    const attention: AttentionValue = {
                        priority: 0.6 + Math.random() * 0.4, // Vary priority
                        durability: 0.5 + Math.random() * 0.5
                    };

                    const item = CognitiveItemFactory.createBelief(
                        'text-atom-' + uuidv4(),
                        truth,
                        attention
                    );
                    item.label = trimmed;
                    return item;
                });
        }

        if (typeof data === 'object' && data !== null) {
            // Process structured data
            const truth: TruthValue = {
                frequency: 1.0,
                confidence: 0.9
            };

            const attention: AttentionValue = {
                priority: 0.7,
                durability: 0.7
            };

            const item = CognitiveItemFactory.createBelief(
                'structured-atom-' + uuidv4(),
                truth,
                attention
            );
            item.label = JSON.stringify(data);

            return [item];
        }

        return [];
    }
}

export class SensorStreamTransducer implements Transducer {
    async process(data: any): Promise<CognitiveItem[]> {
        if (!Array.isArray(data)) return [];

        // Process sensor/event stream data
        return data
            .filter(event => this.isSignificantEvent(event))
            .map(event => {
                const truth: TruthValue = {
                    frequency: 1.0,
                    confidence: 0.95
                };

                const attention: AttentionValue = {
                    priority: 0.8, // High priority for events
                    durability: 0.6
                };

                const item = CognitiveItemFactory.createBelief(
                    'event-atom-' + uuidv4(),
                    truth,
                    attention
                );
                item.label = `Event: ${JSON.stringify(event)}`;
                return item;
            });
    }

    private isSignificantEvent(event: any): boolean {
        // Simple significance detection
        // In a real implementation, this would be more sophisticated
        if (typeof event !== 'object' || event === null) return false;

        // Check for threshold violations or anomalies
        return Object.values(event).some(value =>
            typeof value === 'number' && Math.abs(value) > 100
        );
    }
}