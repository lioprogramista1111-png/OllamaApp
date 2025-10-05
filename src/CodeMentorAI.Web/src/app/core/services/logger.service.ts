import { Injectable } from '@angular/core';
import { FEATURE_FLAGS } from '../constants/app.constants';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  source?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private currentLogLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    // Set log level based on environment
    this.currentLogLevel = this.isProduction() ? LogLevel.WARN : LogLevel.DEBUG;
    
    // Enable debug mode if feature flag is set
    if (FEATURE_FLAGS.ENABLE_DEBUG_MODE) {
      this.currentLogLevel = LogLevel.DEBUG;
    }
  }

  /**
   * Log debug message
   * @param message - Message to log
   * @param data - Optional data
   * @param source - Optional source identifier
   */
  debug(message: string, data?: any, source?: string): void {
    this.log(LogLevel.DEBUG, message, data, source);
  }

  /**
   * Log info message
   * @param message - Message to log
   * @param data - Optional data
   * @param source - Optional source identifier
   */
  info(message: string, data?: any, source?: string): void {
    this.log(LogLevel.INFO, message, data, source);
  }

  /**
   * Log warning message
   * @param message - Message to log
   * @param data - Optional data
   * @param source - Optional source identifier
   */
  warn(message: string, data?: any, source?: string): void {
    this.log(LogLevel.WARN, message, data, source);
  }

  /**
   * Log error message
   * @param message - Message to log
   * @param data - Optional data
   * @param source - Optional source identifier
   */
  error(message: string, data?: any, source?: string): void {
    this.log(LogLevel.ERROR, message, data, source);
  }

  /**
   * Core logging method
   * @param level - Log level
   * @param message - Message to log
   * @param data - Optional data
   * @param source - Optional source identifier
   */
  private log(level: LogLevel, message: string, data?: any, source?: string): void {
    // Check if we should log this level
    if (level < this.currentLogLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      source
    };

    // Store log entry
    this.storeLogs(entry);

    // Output to console
    this.outputToConsole(entry);

    // Send to external service in production
    if (this.isProduction() && level >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Store log entry in memory
   * @param entry - Log entry
   */
  private storeLogs(entry: LogEntry): void {
    this.logs.push(entry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Output log to console
   * @param entry - Log entry
   */
  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${this.getLogLevelName(entry.level)}]`;
    const timestamp = entry.timestamp.toISOString();
    const source = entry.source ? `[${entry.source}]` : '';
    const message = `${timestamp} ${prefix} ${source} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data || '');
        break;
    }
  }

  /**
   * Send log to external service
   * @param entry - Log entry
   */
  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement external logging service integration
    // Examples: Sentry, LogRocket, Application Insights, etc.
  }

  /**
   * Get log level name
   * @param level - Log level
   * @returns Level name
   */
  private getLogLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Check if running in production
   * @returns True if production
   */
  private isProduction(): boolean {
    return false; // TODO: Get from environment
  }

  /**
   * Get all stored logs
   * @returns Array of log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   * @param level - Log level
   * @returns Filtered logs
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by source
   * @param source - Source identifier
   * @returns Filtered logs
   */
  getLogsBySource(source: string): LogEntry[] {
    return this.logs.filter(log => log.source === source);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Set log level
   * @param level - New log level
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Get current log level
   * @returns Current log level
   */
  getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  /**
   * Export logs as JSON
   * @returns JSON string of logs
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Download logs as file
   */
  downloadLogs(): void {
    const dataStr = this.exportLogs();
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `logs_${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  /**
   * Log performance metric
   * @param name - Metric name
   * @param duration - Duration in milliseconds
   * @param data - Optional additional data
   */
  logPerformance(name: string, duration: number, data?: any): void {
    this.info(`Performance: ${name} took ${duration}ms`, data, 'Performance');
  }

  /**
   * Start performance timer
   * @param name - Timer name
   * @returns Timer ID
   */
  startTimer(name: string): string {
    const timerId = `${name}_${Date.now()}`;
    performance.mark(`${timerId}_start`);
    return timerId;
  }

  /**
   * End performance timer and log
   * @param timerId - Timer ID from startTimer
   * @param data - Optional additional data
   */
  endTimer(timerId: string, data?: any): void {
    performance.mark(`${timerId}_end`);
    performance.measure(timerId, `${timerId}_start`, `${timerId}_end`);
    
    const measure = performance.getEntriesByName(timerId)[0];
    if (measure) {
      this.logPerformance(timerId, measure.duration, data);
    }
    
    // Clean up
    performance.clearMarks(`${timerId}_start`);
    performance.clearMarks(`${timerId}_end`);
    performance.clearMeasures(timerId);
  }
}

