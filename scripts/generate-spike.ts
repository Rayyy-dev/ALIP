/**
 * ALIP Error Spike Generator
 * Generates a burst of error logs to test alerting
 */

import { PrismaClient, LogLevel } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ERROR_MESSAGES = [
  'Database connection pool exhausted',
  'Authentication service timeout',
  'Payment gateway returned error 500',
  'Rate limit exceeded for API endpoint',
  'SSL handshake failed with upstream',
  'Memory allocation failed',
  'Disk I/O error on write operation',
  'Queue consumer crashed unexpectedly',
];

const SERVICES = ['auth-service', 'payment-service', 'api-gateway'];

async function generateSpike(count: number = 50): Promise<void> {
  console.log(`Generating ${count} error logs to simulate a spike...\n`);

  const logs = [];

  for (let i = 0; i < count; i++) {
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    const message = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];

    logs.push({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service,
      message: `${message} [Request ID: ${crypto.randomUUID()}]`,
      stackTrace: `Error: ${message}\n    at processRequest (src/handlers.ts:${100 + i}:15)\n    at handleError (src/errors.ts:50:10)`,
    });
  }

  // Send logs via API
  try {
    const response = await fetch(`${API_URL}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`Successfully ingested ${result.data.processed} logs`);
      if (result.data.failed > 0) {
        console.log(`Failed to ingest ${result.data.failed} logs`);
      }
    } else {
      console.error('Failed to ingest logs:', result.error);
    }
  } catch (err) {
    console.error('Error sending logs to API:', err);
    console.log('\nFalling back to direct database insertion...');

    // Fallback: insert directly into database
    for (const log of logs) {
      const normalizedMessage = log.message.replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        '<UUID>'
      );
      const fingerprint = crypto
        .createHash('sha256')
        .update(`${log.service.toLowerCase()}:${log.level}:${normalizedMessage}`)
        .digest('hex')
        .substring(0, 16);

      await prisma.log.create({
        data: {
          timestamp: new Date(log.timestamp),
          level: LogLevel.ERROR,
          service: log.service,
          message: log.message,
          normalizedMessage,
          stackTrace: log.stackTrace,
          fingerprint,
        },
      });
    }

    console.log(`Inserted ${logs.length} logs directly into database`);
  }

  console.log('\nSpike generation complete!');
  console.log('Check the dashboard to see the impact on trends and alerts.');
}

// Parse command line arguments
const count = parseInt(process.argv[2] || '50', 10);

generateSpike(count)
  .catch((e) => {
    console.error('Spike generation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
