import { SYSTEM_VERSION } from '../utils/constants';

export interface WorkerStats {
  itemsProcessed: number;
  errors: number;
  totalProcessingTime: number;
}

export class StatisticsManager {
  private workerStatistics: Map<number, WorkerStats> = new Map();
  private startTime: number = 0;
  private workerCount: number;

  constructor(workerCount: number) {
    this.workerCount = workerCount;
    this.initializeWorkerStatistics();
    this.startTime = Date.now();
  }

  private initializeWorkerStatistics(): void {
    for (let i = 0; i < this.workerCount; i++) {
      this.workerStatistics.set(i, {
        itemsProcessed: 0,
        errors: 0,
        totalProcessingTime: 0,
      });
    }
  }

  public updateWorkerProcessing(workerId: number, duration: number): void {
    const stats = this.workerStatistics.get(workerId)!;
    stats.itemsProcessed++;
    stats.totalProcessingTime += duration;
  }

  public recordWorkerError(workerId: number): void {
    const stats = this.workerStatistics.get(workerId)!;
    stats.errors++;
  }

  public getWorkerStatistics(): Map<number, WorkerStats> {
    return this.workerStatistics;
  }

  public getPerformanceStats(): any {
    const totalItems = Array.from(this.workerStatistics.values()).reduce(
      (acc, stats) => acc + stats.itemsProcessed,
      0
    );
    const totalTime = Array.from(this.workerStatistics.values()).reduce(
      (acc, stats) => acc + stats.totalProcessingTime,
      0
    );
    const averageItemProcessingTime = totalItems > 0 ? totalTime / totalItems : 0;

    const uptimeSeconds =
      this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;
    const itemsProcessedPerSecond =
      uptimeSeconds > 0 ? totalItems / uptimeSeconds : 0;

    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const uptimeStr = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const activeWorkers = Array.from(this.workerStatistics.values()).filter(
      (stats) => stats.itemsProcessed > 0
    ).length;
    const systemLoad = this.workerCount > 0 ? activeWorkers / this.workerCount : 0;

    return {
      uptime: uptimeStr,
      totalItemsProcessed: totalItems,
      itemsProcessedPerSecond: parseFloat(itemsProcessedPerSecond.toFixed(2)),
      averageItemProcessingTime: parseFloat(averageItemProcessingTime.toFixed(2)),
      systemLoad: parseFloat(systemLoad.toFixed(2)),
    };
  }

  public getSystemInfo(): any {
    return {
      workerCount: this.workerCount,
      version: SYSTEM_VERSION,
      startTime: this.startTime,
      platform: process.platform,
      arch: process.arch,
    };
  }
}
