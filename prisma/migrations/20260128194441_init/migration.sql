-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL,
    "level" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "normalizedMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "fingerprint" TEXT NOT NULL,
    "errorGroupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Log_errorGroupId_fkey" FOREIGN KEY ("errorGroupId") REFERENCES "ErrorGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ErrorGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fingerprint" TEXT NOT NULL,
    "normalizedMessage" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" DATETIME NOT NULL,
    "lastSeen" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ErrorTrend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bucketStart" DATETIME NOT NULL,
    "bucketType" TEXT NOT NULL,
    "service" TEXT,
    "totalLogs" INTEGER NOT NULL DEFAULT 0,
    "infoCount" INTEGER NOT NULL DEFAULT 0,
    "warnCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "windowMinutes" INTEGER NOT NULL DEFAULT 60,
    "service" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertRuleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alert_alertRuleId_fkey" FOREIGN KEY ("alertRuleId") REFERENCES "AlertRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Log_timestamp_idx" ON "Log"("timestamp");

-- CreateIndex
CREATE INDEX "Log_fingerprint_idx" ON "Log"("fingerprint");

-- CreateIndex
CREATE INDEX "Log_service_idx" ON "Log"("service");

-- CreateIndex
CREATE INDEX "Log_level_idx" ON "Log"("level");

-- CreateIndex
CREATE INDEX "Log_errorGroupId_idx" ON "Log"("errorGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorGroup_fingerprint_key" ON "ErrorGroup"("fingerprint");

-- CreateIndex
CREATE INDEX "ErrorGroup_service_idx" ON "ErrorGroup"("service");

-- CreateIndex
CREATE INDEX "ErrorGroup_level_idx" ON "ErrorGroup"("level");

-- CreateIndex
CREATE INDEX "ErrorGroup_status_idx" ON "ErrorGroup"("status");

-- CreateIndex
CREATE INDEX "ErrorGroup_lastSeen_idx" ON "ErrorGroup"("lastSeen");

-- CreateIndex
CREATE INDEX "ErrorGroup_occurrenceCount_idx" ON "ErrorGroup"("occurrenceCount");

-- CreateIndex
CREATE INDEX "ErrorTrend_bucketStart_idx" ON "ErrorTrend"("bucketStart");

-- CreateIndex
CREATE INDEX "ErrorTrend_bucketType_idx" ON "ErrorTrend"("bucketType");

-- CreateIndex
CREATE INDEX "ErrorTrend_service_idx" ON "ErrorTrend"("service");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorTrend_bucketStart_bucketType_service_key" ON "ErrorTrend"("bucketStart", "bucketType", "service");

-- CreateIndex
CREATE INDEX "AlertRule_enabled_idx" ON "AlertRule"("enabled");

-- CreateIndex
CREATE INDEX "AlertRule_ruleType_idx" ON "AlertRule"("ruleType");

-- CreateIndex
CREATE INDEX "AlertRule_service_idx" ON "AlertRule"("service");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- CreateIndex
CREATE INDEX "Alert_triggeredAt_idx" ON "Alert"("triggeredAt");

-- CreateIndex
CREATE INDEX "Alert_alertRuleId_idx" ON "Alert"("alertRuleId");
