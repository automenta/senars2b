import { 
  AttentionModule, 
  CognitiveItem, 
  AttentionValue, 
  CognitiveSchema, 
  Agenda, 
  WorldModel,
  UUID
} from './types';

// Enhanced attention module with more sophisticated dynamics
export class EnhancedAttentionModule implements AttentionModule {
  private accessHistory: Map<UUID, number[]> = new Map(); // Track access times for each item
  private decayRates: Map<string, number> = new Map(); // Domain-specific decay rates
  
  constructor() {
    // Initialize default decay rates for common domains
    this.decayRates.set('general', 0.01);
    this.decayRates.set('medical', 0.005);
    this.decayRates.set('legal', 0.002);
    this.decayRates.set('financial', 0.008);
    this.decayRates.set('scientific', 0.007);
  }
  
  calculate_initial(item: CognitiveItem): AttentionValue {
    // Enhanced initial attention calculation based on multiple factors
    let priority = 0.5;
    let durability = 0.5;
    
    // Factor 1: Source trust
    const atom = (item as any).atom; // Assuming atom is accessible
    if (atom && atom.meta.trust_score) {
      priority += atom.meta.trust_score * 0.3;
    }
    
    // Factor 2: Item type
    if (item.type === 'GOAL') {
      priority += 0.2;
    } else if (item.type === 'QUERY') {
      priority += 0.1;
    }
    
    // Factor 3: Domain importance
    if (atom && atom.meta.domain) {
      // Medical and safety-related domains get higher priority
      if (atom.meta.domain.includes('medical') || atom.meta.domain.includes('safety')) {
        priority += 0.2;
      }
    }
    
    // Factor 4: Recency (newer items get higher priority)
    const ageInHours = (Date.now() - item.stamp.timestamp) / (1000 * 60 * 60);
    if (ageInHours < 1) {
      priority += 0.1;
    }
    
    // Cap values between 0 and 1
    priority = Math.min(1.0, Math.max(0.0, priority));
    durability = Math.min(1.0, Math.max(0.0, durability));
    
    return { priority, durability };
  }
  
  calculate_derived(
    parents: CognitiveItem[],
    schema: CognitiveSchema,
    source_trust?: number
  ): AttentionValue {
    // Enhanced derived attention calculation
    let priority = 0;
    let durability = 0;
    
    // Aggregate parent attention values
    for (const parent of parents) {
      priority += parent.attention.priority;
      durability += parent.attention.durability;
    }
    
    // Average the values
    priority /= parents.length;
    durability /= parents.length;
    
    // Boost based on schema trust
    const schemaTrust = source_trust || 0.5;
    priority = Math.min(1.0, priority + (schemaTrust * 0.2));
    
    // Boost based on derivation depth (items derived from many steps get lower priority)
    // This is a simplified approach - in a real system, we'd track the full derivation chain
    priority = Math.max(0.1, priority - 0.1);
    
    return { priority, durability };
  }
  
  update_on_access(items: CognitiveItem[]): void {
    // Enhanced attention update when items are accessed
    const now = Date.now();
    
    for (const item of items) {
      // Update access history
      if (!this.accessHistory.has(item.id)) {
        this.accessHistory.set(item.id, []);
      }
      this.accessHistory.get(item.id)!.push(now);
      
      // Keep only the last 10 access times
      const history = this.accessHistory.get(item.id)!;
      if (history.length > 10) {
        history.shift();
      }
      
      // Boost priority based on access frequency
      const accessCount = history.length;
      const newPriority = Math.min(1.0, item.attention.priority + (accessCount * 0.05));
      
      // Update the item's attention value
      item.attention.priority = newPriority;
    }
  }
  
  run_decay_cycle(world_model: WorldModel, agenda: Agenda): void {
    // Enhanced attention decay cycle
    const items = Array.from(this.accessHistory.keys());
    
    for (const itemId of items) {
      const item = agenda.get(itemId);
      if (!item) continue;
      
      // Get decay rate based on domain
      const atom = world_model.get_atom(item.atom_id);
      const domain = atom?.meta.domain || 'general';
      const decayRate = this.decayRates.get(domain) || this.decayRates.get('general') || 0.01;
      
      // Calculate time since last access
      const history = this.accessHistory.get(itemId) || [];
      const lastAccess = history.length > 0 ? history[history.length - 1] : item.stamp.timestamp;
      const timeSinceAccess = (Date.now() - lastAccess) / (1000 * 60 * 60); // in hours
      
      // Apply decay
      const decayFactor = Math.exp(-decayRate * timeSinceAccess);
      const newPriority = Math.max(0.1, item.attention.priority * decayFactor);
      
      // Update item attention
      item.attention.priority = newPriority;
      
      // Update agenda with new attention value
      agenda.updateAttention(itemId, item.attention);
    }
  }
  
  // Additional methods for enhanced attention management
  
  setDomainDecayRate(domain: string, rate: number): void {
    this.decayRates.set(domain, rate);
  }
  
  getAccessFrequency(itemId: UUID): number {
    const history = this.accessHistory.get(itemId) || [];
    if (history.length < 2) return 0;
    
    // Calculate average time between accesses
    const intervals = [];
    for (let i = 1; i < history.length; i++) {
      intervals.push(history[i] - history[i-1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    // Return frequency as accesses per hour
    return 3600000 / avgInterval;
  }
  
  identifyHighInterestItems(threshold: number = 0.8): UUID[] {
    // Identify items with consistently high attention
    const highInterestItems: UUID[] = [];
    
    for (const [itemId, history] of this.accessHistory.entries()) {
      if (history.length >= 3) { // Need at least 3 accesses
        const frequency = this.getAccessFrequency(itemId);
        // Items accessed frequently and recently are of high interest
        if (frequency > 1.0) { // More than once per hour
          highInterestItems.push(itemId);
        }
      }
    }
    
    return highInterestItems;
  }
}