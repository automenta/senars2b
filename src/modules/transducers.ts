import { Transducer, CognitiveItem, TruthValue, AttentionValue } from '../interfaces/types';
import { CognitiveItemFactory } from './cognitiveItemFactory';
import { v4 as uuidv4 } from 'uuid';

export class TextTransducer implements Transducer {
    async process(data: any): Promise<CognitiveItem[]> {
        // Process text data into CognitiveItems
        const items: CognitiveItem[] = [];
        
        if (typeof data === 'string') {
            // Simple text processing - in a real implementation, this would use NLP
            const sentences = data.split(/[.!?]+/).filter(s => s.trim().length > 0);
            
            for (const sentence of sentences) {
                const trimmed = sentence.trim();
                if (trimmed.length > 0) {
                    // Create a belief for each sentence
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
                    
                    items.push(item);
                }
            }
        } else if (typeof data === 'object' && data !== null) {
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
            
            items.push(item);
        }
        
        return items;
    }
}

export class SensorStreamTransducer implements Transducer {
    async process(data: any): Promise<CognitiveItem[]> {
        // Process sensor/event stream data
        const items: CognitiveItem[] = [];
        
        // Detect events in the data stream
        if (Array.isArray(data)) {
            for (const event of data) {
                if (this.isSignificantEvent(event)) {
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
                    
                    items.push(item);
                }
            }
        }
        
        return items;
    }
    
    private isSignificantEvent(event: any): boolean {
        // Simple significance detection
        // In a real implementation, this would be more sophisticated
        if (typeof event === 'object' && event !== null) {
            // Check for threshold violations or anomalies
            for (const key in event) {
                if (typeof event[key] === 'number') {
                    // Simple threshold check
                    if (Math.abs(event[key]) > 100) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
}