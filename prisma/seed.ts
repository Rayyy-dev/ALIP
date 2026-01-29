/**
 * ALIP Database Seed Script
 * Generates realistic demo data for testing and development
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// String constants (SQLite compatible)
const LogLevel = { INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' } as const;
const AlertRuleType = {
  ERROR_COUNT_THRESHOLD: 'ERROR_COUNT_THRESHOLD',
  SPIKE_DETECTION: 'SPIKE_DETECTION',
  NEW_ERROR_TYPE: 'NEW_ERROR_TYPE',
} as const;
const BucketType = { HOUR: 'HOUR', DAY: 'DAY' } as const;

// Configuration
const SERVICES = ['auth-service', 'api-gateway', 'payment-service', 'user-service', 'notification-service'];
const DAYS_OF_DATA = 7;
const LOGS_PER_HOUR_BASE = 50;

// Error message templates (for realistic patterns)
const ERROR_TEMPLATES = [
  'Failed to authenticate user <ID>',
  'Database connection timeout after <ID>ms',
  'Invalid API key provided for request <UUID>',
  'Payment processing failed for order <ID>',
  'User <EMAIL> not found in database',
  'Rate limit exceeded for IP <IP>',
  'Failed to send notification to user <ID>',
  'Connection refused to host <IP>:<ID>',
  'JWT token expired at <TIMESTAMP>',
  'Invalid request body: missing required field',
  'Service unavailable: upstream timeout',
  'Memory limit exceeded: <ID>MB used',
  'Disk space critical: <ID>% remaining',
  'SSL certificate validation failed for <URL>',
  'Queue overflow: <ID> messages dropped',
];

const WARN_TEMPLATES = [
  'High response time detected: <ID>ms',
  'Retry attempt <ID> for request <UUID>',
  'Cache miss for key <HEX>',
  'Deprecated API version used by client <IP>',
  'Connection pool near capacity: <ID>%',
  'Slow database query detected: <ID>ms',
  'Memory usage warning: <ID>% used',
  'Request timeout approaching: <ID>ms elapsed',
];

const INFO_TEMPLATES = [
  'User <ID> logged in successfully',
  'Request <UUID> processed in <ID>ms',
  'Cache updated for key <HEX>',
  'Scheduled job completed: <ID> items processed',
  'Health check passed for service',
  'Configuration reloaded successfully',
  'New connection established from <IP>',
  'Batch processing completed: <ID> records',
];

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function generateIP(): string {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

function generateEmail(): string {
  const names = ['john', 'jane', 'bob', 'alice', 'charlie', 'diana'];
  const domains = ['example.com', 'test.org', 'demo.net'];
  return `${randomElement(names)}${randomInt(1, 999)}@${randomElement(domains)}`;
}

function generateHex(length: number = 32): string {
  return crypto.randomBytes(length / 2).toString('hex');
}

function fillTemplate(template: string): string {
  return template
    .replace(/<ID>/g, () => String(randomInt(1000, 99999)))
    .replace(/<UUID>/g, () => generateUUID())
    .replace(/<IP>/g, () => generateIP())
    .replace(/<EMAIL>/g, () => generateEmail())
    .replace(/<HEX>/g, () => generateHex(24))
    .replace(/<TIMESTAMP>/g, () => new Date().toISOString())
    .replace(/<URL>/g, () => `https://api${randomInt(1, 5)}.example.com`);
}

function normalizeMessage(message: string): string {
  return message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:?\d{2})?/g, '<TIMESTAMP>')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<IP>')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '<EMAIL>')
    .replace(/\b[0-9a-f]{24,}\b/gi, '<HEX>')
    .replace(/\b\d{3,}\b/g, '<ID>')
    .replace(/https?:\/\/[^\s"'<>]+/g, '<URL>')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateFingerprint(normalizedMessage: string, service: string, level: string): string {
  const content = `${service.toLowerCase()}:${level}:${normalizedMessage}`;
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function generateStackTrace(): string {
  const files = [
    'src/controllers/user.controller.ts',
    'src/services/auth.service.ts',
    'src/repositories/payment.repository.ts',
    'src/middleware/validation.middleware.ts',
    'src/utils/database.ts',
    'node_modules/express/lib/router/index.js',
  ];

  const lines: string[] = ['Error: Operation failed'];
  for (let i = 0; i < randomInt(3, 8); i++) {
    const file = randomElement(files);
    const line = randomInt(10, 500);
    const col = randomInt(1, 80);
    lines.push(`    at ${file}:${line}:${col}`);
  }
  return lines.join('\n');
}

async function seedAlertRules(): Promise<void> {
  console.log('Seeding alert rules...');

  const rules = [
    {
      name: 'High Error Count',
      description: 'Triggers when error count exceeds threshold',
      ruleType: AlertRuleType.ERROR_COUNT_THRESHOLD,
      threshold: 50,
      windowMinutes: 60,
      service: null,
      enabled: true,
    },
    {
      name: 'Auth Service Errors',
      description: 'Monitors auth service specifically',
      ruleType: AlertRuleType.ERROR_COUNT_THRESHOLD,
      threshold: 20,
      windowMinutes: 30,
      service: 'auth-service',
      enabled: true,
    },
    {
      name: 'Error Spike Detection',
      description: 'Detects unusual spikes in errors',
      ruleType: AlertRuleType.SPIKE_DETECTION,
      threshold: 200,
      windowMinutes: 60,
      service: null,
      enabled: true,
    },
    {
      name: 'New Error Types',
      description: 'Alerts on new error patterns',
      ruleType: AlertRuleType.NEW_ERROR_TYPE,
      threshold: 3,
      windowMinutes: 60,
      service: null,
      enabled: true,
    },
  ];

  for (const rule of rules) {
    const id = rule.name.toLowerCase().replace(/\s+/g, '-');
    await prisma.alertRule.upsert({
      where: { id },
      update: rule,
      create: { id, ...rule },
    });
  }

  console.log(`Created ${rules.length} alert rules`);
}

async function seedLogs(): Promise<void> {
  console.log('Seeding logs...');

  const now = new Date();
  const startDate = new Date(now.getTime() - DAYS_OF_DATA * 24 * 60 * 60 * 1000);

  // Track error groups for linking
  const errorGroups = new Map<string, string>();

  let totalLogs = 0;
  let totalErrors = 0;

  // Generate logs for each hour
  for (let d = startDate; d <= now; d = new Date(d.getTime() + 60 * 60 * 1000)) {
    const hour = d.getHours();

    // Simulate traffic patterns
    let trafficMultiplier = 1;
    if (hour >= 9 && hour <= 17) trafficMultiplier = 2;
    else if (hour >= 22 || hour <= 6) trafficMultiplier = 0.3;

    // Simulate occasional error spikes
    const isSpike = Math.random() < 0.05;

    const logsThisHour = Math.floor(
      LOGS_PER_HOUR_BASE * trafficMultiplier * (0.8 + Math.random() * 0.4)
    );

    const logs: Array<{
      timestamp: Date;
      level: string;
      service: string;
      message: string;
      normalizedMessage: string;
      stackTrace: string | null;
      fingerprint: string;
      errorGroupId: string | null;
    }> = [];

    for (let i = 0; i < logsThisHour; i++) {
      // Determine log level
      let level: string;
      const rand = Math.random();
      if (isSpike) {
        level = rand < 0.4 ? LogLevel.ERROR : rand < 0.7 ? LogLevel.WARN : LogLevel.INFO;
      } else {
        level = rand < 0.1 ? LogLevel.ERROR : rand < 0.3 ? LogLevel.WARN : LogLevel.INFO;
      }

      const templates =
        level === LogLevel.ERROR
          ? ERROR_TEMPLATES
          : level === LogLevel.WARN
          ? WARN_TEMPLATES
          : INFO_TEMPLATES;

      const template = randomElement(templates);
      const message = fillTemplate(template);
      const normalizedMsg = normalizeMessage(message);
      const service = randomElement(SERVICES);
      const fingerprint = generateFingerprint(normalizedMsg, service, level);

      const timestamp = new Date(
        d.getTime() + randomInt(0, 59) * 60 * 1000 + randomInt(0, 59) * 1000
      );

      const stackTrace = level === LogLevel.ERROR && Math.random() < 0.7
        ? generateStackTrace()
        : null;

      let errorGroupId: string | null = null;

      // Create or update error group for WARN and ERROR
      if (level !== LogLevel.INFO) {
        if (!errorGroups.has(fingerprint)) {
          const group = await prisma.errorGroup.upsert({
            where: { fingerprint },
            create: {
              fingerprint,
              normalizedMessage: normalizedMsg,
              service,
              level,
              occurrenceCount: 1,
              firstSeen: timestamp,
              lastSeen: timestamp,
              status: 'ACTIVE',
            },
            update: {
              occurrenceCount: { increment: 1 },
              lastSeen: timestamp,
            },
          });
          errorGroups.set(fingerprint, group.id);
        } else {
          await prisma.errorGroup.update({
            where: { fingerprint },
            data: {
              occurrenceCount: { increment: 1 },
              lastSeen: timestamp,
            },
          });
        }
        errorGroupId = errorGroups.get(fingerprint) || null;
      }

      logs.push({
        timestamp,
        level,
        service,
        message,
        normalizedMessage: normalizedMsg,
        stackTrace,
        fingerprint,
        errorGroupId,
      });

      if (level === LogLevel.ERROR) totalErrors++;
      totalLogs++;
    }

    // Batch insert logs
    await prisma.log.createMany({ data: logs });

    // Update trend buckets
    const hourStart = new Date(d);
    hourStart.setMinutes(0, 0, 0);

    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);

    const counts = {
      total: logs.length,
      info: logs.filter((l) => l.level === LogLevel.INFO).length,
      warn: logs.filter((l) => l.level === LogLevel.WARN).length,
      error: logs.filter((l) => l.level === LogLevel.ERROR).length,
    };

    // Update hourly trends
    await prisma.errorTrend.upsert({
      where: {
        bucketStart_bucketType_service: {
          bucketStart: hourStart,
          bucketType: BucketType.HOUR,
          service: '',
        },
      },
      create: {
        bucketStart: hourStart,
        bucketType: BucketType.HOUR,
        service: null,
        totalLogs: counts.total,
        infoCount: counts.info,
        warnCount: counts.warn,
        errorCount: counts.error,
        errorRate: counts.total > 0 ? (counts.error / counts.total) * 100 : 0,
      },
      update: {
        totalLogs: { increment: counts.total },
        infoCount: { increment: counts.info },
        warnCount: { increment: counts.warn },
        errorCount: { increment: counts.error },
      },
    });

    // Update daily trends
    await prisma.errorTrend.upsert({
      where: {
        bucketStart_bucketType_service: {
          bucketStart: dayStart,
          bucketType: BucketType.DAY,
          service: '',
        },
      },
      create: {
        bucketStart: dayStart,
        bucketType: BucketType.DAY,
        service: null,
        totalLogs: counts.total,
        infoCount: counts.info,
        warnCount: counts.warn,
        errorCount: counts.error,
        errorRate: counts.total > 0 ? (counts.error / counts.total) * 100 : 0,
      },
      update: {
        totalLogs: { increment: counts.total },
        infoCount: { increment: counts.info },
        warnCount: { increment: counts.warn },
        errorCount: { increment: counts.error },
      },
    });
  }

  // Recalculate error rates for trends
  const trends = await prisma.errorTrend.findMany();
  for (const trend of trends) {
    if (trend.totalLogs > 0) {
      await prisma.errorTrend.update({
        where: { id: trend.id },
        data: { errorRate: (trend.errorCount / trend.totalLogs) * 100 },
      });
    }
  }

  console.log(`Created ${totalLogs} logs (${totalErrors} errors)`);
  console.log(`Created ${errorGroups.size} error groups`);
}

async function main(): Promise<void> {
  console.log('Starting ALIP seed...\n');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.alert.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.log.deleteMany();
  await prisma.errorGroup.deleteMany();
  await prisma.errorTrend.deleteMany();
  console.log('Existing data cleaned\n');

  // Seed data
  await seedAlertRules();
  await seedLogs();

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
