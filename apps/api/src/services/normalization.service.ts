import crypto from 'crypto';

/**
 * Log message normalization service
 * Removes dynamic values to enable grouping of similar log messages
 */

/**
 * Normalize a log message by replacing dynamic values with placeholders
 * This enables grouping of logs that represent the same underlying error
 *
 * @example
 * Input:  "User 12345 failed to authenticate at 2024-01-15T10:30:00Z"
 * Output: "User <ID> failed to authenticate at <TIMESTAMP>"
 */
export function normalizeMessage(message: string): string {
  return (
    message
      // UUIDs (v4 format: 8-4-4-4-12 hex characters)
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
        '<UUID>'
      )
      // Generic UUIDs (any version)
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        '<UUID>'
      )
      // ISO 8601 timestamps with optional milliseconds and timezone
      .replace(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:?\d{2})?/g,
        '<TIMESTAMP>'
      )
      // Date formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
      .replace(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/g, '<DATE>')
      .replace(/\b\d{2}[-/]\d{2}[-/]\d{4}\b/g, '<DATE>')
      // Time formats: HH:MM:SS, HH:MM
      .replace(/\b\d{2}:\d{2}(:\d{2})?\b/g, '<TIME>')
      // Unix timestamps in milliseconds (13 digits)
      .replace(/\b1[0-9]{12}\b/g, '<TIMESTAMP_MS>')
      // Unix timestamps in seconds (10 digits starting with 1)
      .replace(/\b1[0-9]{9}\b/g, '<TIMESTAMP_S>')
      // IPv4 addresses
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<IP>')
      // IPv6 addresses (simplified pattern)
      .replace(/\b([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}\b/gi, '<IPV6>')
      // Email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '<EMAIL>')
      // URLs (http/https)
      .replace(/https?:\/\/[^\s"'<>]+/g, '<URL>')
      // Hex strings (session tokens, hashes - 24+ hex chars)
      .replace(/\b[0-9a-f]{24,}\b/gi, '<HEX>')
      // JWT tokens (three base64 segments separated by dots)
      .replace(/\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, '<JWT>')
      // MongoDB ObjectIds (24 hex chars)
      .replace(/\b[0-9a-f]{24}\b/gi, '<OBJECT_ID>')
      // Numeric IDs (standalone numbers with 3+ digits)
      // More conservative: only replace numbers that look like IDs
      .replace(/\b\d{3,}\b/g, '<ID>')
      // File paths (Unix-style)
      .replace(/\/[a-zA-Z0-9_\-./]+/g, '<PATH>')
      // Quoted strings (preserve the quotes but normalize content for common patterns)
      // This is intentionally not applied to avoid over-normalization
      // Multiple whitespace to single space
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Generate a fingerprint hash for error grouping
 * The fingerprint uniquely identifies a type of error based on:
 * - Normalized message (with dynamic values removed)
 * - Service name
 * - Log level
 *
 * @returns A 16-character hex string
 */
export function generateFingerprint(
  normalizedMessage: string,
  service: string,
  level: string
): string {
  const content = `${service.toLowerCase()}:${level}:${normalizedMessage}`;
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Check if a message is likely a new unique error type
 * by comparing its fingerprint to existing ones
 */
export function isNewErrorType(
  fingerprint: string,
  existingFingerprints: Set<string>
): boolean {
  return !existingFingerprints.has(fingerprint);
}
