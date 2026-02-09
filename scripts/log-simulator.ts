/**
 * ALIP Continuous Log Simulator
 * Generates realistic log traffic and sends it to the ALIP API.
 * Run with: npx tsx scripts/log-simulator.ts
 */

const API_URL = process.env.ALIP_API_URL || 'http://localhost:3001';
const BATCH_INTERVAL_MS = 5000;

const SERVICES = [
  'auth-service',
  'api-gateway',
  'payment-service',
  'user-service',
  'notification-service',
];

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
  'Service unavailable: upstream timeout',
  'Memory limit exceeded: <ID>MB used',
  'SSL certificate validation failed',
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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateIP(): string {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

function generateEmail(): string {
  const names = ['john', 'jane', 'bob', 'alice', 'charlie', 'diana'];
  const domains = ['example.com', 'test.org', 'demo.net'];
  return `${randomElement(names)}${randomInt(1, 999)}@${randomElement(domains)}`;
}

function generateHex(length: number = 24): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 16).toString(16);
  }
  return result;
}

function fillTemplate(template: string): string {
  return template
    .replace(/<ID>/g, () => String(randomInt(1000, 99999)))
    .replace(/<UUID>/g, () => generateUUID())
    .replace(/<IP>/g, () => generateIP())
    .replace(/<EMAIL>/g, () => generateEmail())
    .replace(/<HEX>/g, () => generateHex())
    .replace(/<TIMESTAMP>/g, () => new Date().toISOString())
    .replace(/<URL>/g, () => `https://api${randomInt(1, 5)}.example.com`);
}

function generateStackTrace(message: string): string {
  const files = [
    'src/controllers/user.controller.ts',
    'src/services/auth.service.ts',
    'src/repositories/payment.repository.ts',
    'src/middleware/validation.middleware.ts',
    'src/utils/database.ts',
    'node_modules/express/lib/router/index.js',
  ];

  const lines: string[] = [`Error: ${message}`];
  for (let i = 0; i < randomInt(3, 7); i++) {
    const file = randomElement(files);
    const line = randomInt(10, 500);
    const col = randomInt(1, 80);
    lines.push(`    at ${file}:${line}:${col}`);
  }
  return lines.join('\n');
}

function generateBatch(): Array<{
  timestamp: string;
  level: string;
  service: string;
  message: string;
  stackTrace?: string;
}> {
  const hour = new Date().getHours();

  // Traffic varies by time of day
  let baseCount = 8;
  if (hour >= 9 && hour <= 17) baseCount = 15;
  else if (hour >= 22 || hour <= 6) baseCount = 3;

  // Random spike (~5% chance)
  const isSpike = Math.random() < 0.05;
  if (isSpike) baseCount *= 3;

  const count = baseCount + randomInt(-2, 5);
  const logs = [];

  for (let i = 0; i < Math.max(1, count); i++) {
    // Determine level
    let level: string;
    const rand = Math.random();
    if (isSpike) {
      level = rand < 0.4 ? 'ERROR' : rand < 0.7 ? 'WARN' : 'INFO';
    } else {
      level = rand < 0.08 ? 'ERROR' : rand < 0.25 ? 'WARN' : 'INFO';
    }

    const templates =
      level === 'ERROR'
        ? ERROR_TEMPLATES
        : level === 'WARN'
        ? WARN_TEMPLATES
        : INFO_TEMPLATES;

    const template = randomElement(templates);
    const message = fillTemplate(template);
    const service = randomElement(SERVICES);

    const log: {
      timestamp: string;
      level: string;
      service: string;
      message: string;
      stackTrace?: string;
    } = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
    };

    if (level === 'ERROR' && Math.random() < 0.7) {
      log.stackTrace = generateStackTrace(message);
    }

    logs.push(log);
  }

  return logs;
}

async function sendBatch(
  logs: Array<{
    timestamp: string;
    level: string;
    service: string;
    message: string;
    stackTrace?: string;
  }>
): Promise<void> {
  const response = await fetch(`${API_URL}/api/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Unknown API error');
  }

  const errors = logs.filter((l) => l.level === 'ERROR').length;
  const warns = logs.filter((l) => l.level === 'WARN').length;
  const infos = logs.filter((l) => l.level === 'INFO').length;

  const time = new Date().toLocaleTimeString();
  console.log(
    `[${time}] Sent ${logs.length} logs (${infos} info, ${warns} warn, ${errors} error) -> ${result.data.processed} processed`
  );
}

async function run(): Promise<void> {
  console.log(`ALIP Log Simulator`);
  console.log(`Sending to: ${API_URL}`);
  console.log(`Interval: ${BATCH_INTERVAL_MS / 1000}s`);
  console.log(`Press Ctrl+C to stop\n`);

  // Check API is reachable
  try {
    const health = await fetch(`${API_URL}/api/health`);
    if (!health.ok) throw new Error(`Status ${health.status}`);
    console.log('API is reachable. Starting simulation...\n');
  } catch {
    console.error(`Cannot reach API at ${API_URL}. Is the API running?`);
    process.exit(1);
  }

  const tick = async () => {
    try {
      const batch = generateBatch();
      await sendBatch(batch);
    } catch (err) {
      console.error(`Failed to send batch: ${(err as Error).message}`);
    }
  };

  // Send first batch immediately
  await tick();

  // Then send on interval
  setInterval(tick, BATCH_INTERVAL_MS);
}

run().catch((err) => {
  console.error('Simulator crashed:', err);
  process.exit(1);
});
