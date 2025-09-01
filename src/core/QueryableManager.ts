import { GenericCRUDManager, Identifiable } from './GenericCRUDManager';
import { WorldModel } from '@/core/worldModel';
import { Agenda } from '@/core/agenda';

/**
 * Query options for filtering and sorting results
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Abstract base class for queryable managers
 * Provides common querying functionality for collections of items
 */
export abstract class QueryableManager<T extends Identifiable> extends GenericCRUDManager<T> {
  
  constructor(worldModel: WorldModel, agenda: Agenda) {
    super(worldModel, agenda);
  }

  /**
   * Generic filter method with options
   */
  protected filterItems(filterFn: (item: T) => boolean, options?: QueryOptions): T[] {
    let results = Array.from(this.items.values()).filter(filterFn);
    
    if (options) {
      // Sort if requested
      if (options.sortBy) {
        results.sort((a, b) => {
          const aVal = (a as any)[options.sortBy!];
          const bVal = (b as any)[options.sortBy!];
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return options.sortOrder === 'desc' ? -comparison : comparison;
        });
      }
      
      // Apply offset and limit
      if (options.offset) {
        results = results.slice(options.offset);
      }
      
      if (options.limit) {
        results = results.slice(0, options.limit);
      }
    }
    
    return results;
  }

  /**
   * Find items by a key-value pair
   */
  findBy(key: keyof T, value: any, options?: QueryOptions): T[] {
    return this.filterItems(item => item[key] === value, options);
  }

  /**
   * Find a single item by a key-value pair
   */
  findOneBy(key: keyof T, value: any): T | null {
    const items = this.findBy(key, value, { limit: 1 });
    return items.length > 0 ? items[0] : null;
  }

  /**
   * Abstract methods for specialized querying that subclasses must implement
   */
  abstract queryBySemantic(embedding: number[], options?: QueryOptions): T[];
  abstract queryBySymbolic(pattern: any, options?: QueryOptions): T[];
  abstract queryByStructure(pattern: any, options?: QueryOptions): T[];
  abstract queryByMeta(key: string, value: any, options?: QueryOptions): T[];
}