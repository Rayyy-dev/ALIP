/**
 * ALIP SDK - Send logs to the Automated Log Intelligence Platform
 *
 * Usage:
 *   import { AlipLogger } from '@alip/sdk';
 *
 *   const logger = new AlipLogger({
 *     endpoint: 'http://localhost:3001',
 *     service: 'my-app',
 *   });
 *
 *   logger.info('User logged in');
 *   logger.warn('High memory usage');
 *   logger.error('Payment failed', { orderId: '123' }, error);
 *
 *   // On shutdown:
 *   await logger.flush();
 */

export interface AlipLoggerOptions {
  /** ALIP API base URL (e.g. 'http://localhost:3001') */
  endpoint: string;
  /** Service name that will appear in the dashboard */
  service: string;
  /** Number of logs to buffer before sending (default: 10) */
  batchSize?: number;
  /** Max time in ms to hold logs before sending (default: 5000) */
  flushInterval?: number;
}

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  message: string;
  stackTrace?: string;
}

export class AlipLogger {
  private endpoint: string;
  private service: string;
  private batchSize: number;
  private flushInterval: number;
  private buffer: LogEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing: Promise<void> | null = null;

  constructor(options: AlipLoggerOptions) {
    this.endpoint = options.endpoint.replace(/\/+$/, '');
    this.service = options.service;
    this.batchSize = options.batchSize ?? 10;
    this.flushInterval = options.flushInterval ?? 5000;

    this.timer = setInterval(() => {
      this.flush().catch(() => {});
    }, this.flushInterval);

    // Don't keep the process alive just for the flush timer
    if (this.timer && typeof this.timer === 'object' && 'unref' in this.timer) {
      this.timer.unref();
    }
  }

  /** Log an INFO message */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.push('INFO', message, metadata);
  }

  /** Log a WARN message */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.push('WARN', message, metadata);
  }

  /** Log an ERROR message */
  error(
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    this.push('ERROR', message, metadata, error);
  }

  /** Flush all buffered logs to the API. Call this before process exit. */
  async flush(): Promise<void> {
    // If already flushing, wait for it
    if (this.flushing) {
      await this.flushing;
      return;
    }

    if (this.buffer.length === 0) return;

    const logs = this.buffer.splice(0);
    this.flushing = this.send(logs);

    try {
      await this.flushing;
    } finally {
      this.flushing = null;
    }
  }

  /** Stop the flush timer and send remaining logs */
  async destroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }

  private push(
    level: 'INFO' | 'WARN' | 'ERROR',
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): void {
    let fullMessage = message;
    if (metadata && Object.keys(metadata).length > 0) {
      fullMessage += ` ${JSON.stringify(metadata)}`;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message: fullMessage,
    };

    if (error?.stack) {
      entry.stackTrace = error.stack;
    }

    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      this.flush().catch(() => {});
    }
  }

  private async send(logs: LogEntry[]): Promise<void> {
    const url = `${this.endpoint}/api/logs`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs }),
        });

        if (response.ok) return;

        // Non-retryable status
        if (response.status >= 400 && response.status < 500) return;
      } catch {
        // Network error — retry once
        if (attempt === 0) continue;
      }
    }
    // Drop logs silently after 2 attempts — don't crash the host app
  }
}
