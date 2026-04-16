-- CreateTable
CREATE TABLE "PurchaseHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchasedAt" DATETIME NOT NULL,
    "shop" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "revenue" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "isSubscription" BOOLEAN NOT NULL DEFAULT false,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdMetrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "channel" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "spend" REAL NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "ctr" REAL NOT NULL,
    "conversions" INTEGER NOT NULL,
    "cpa" REAL NOT NULL,
    "roas" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "SnsMetrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weekStart" DATETIME NOT NULL,
    "channel" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "reach" INTEGER NOT NULL,
    "saves" INTEGER NOT NULL,
    "followersDelta" INTEGER NOT NULL,
    "engagementRate" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "LineMetrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sentAt" DATETIME NOT NULL,
    "product" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "sent" INTEGER NOT NULL,
    "opens" INTEGER NOT NULL,
    "openRate" REAL NOT NULL,
    "clicks" INTEGER NOT NULL,
    "ctr" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Action" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "relatedKpi" TEXT NOT NULL,
    "effectRating" TEXT,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AiReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weekStart" DATETIME NOT NULL,
    "promptText" TEXT NOT NULL,
    "resultText" TEXT,
    "resultJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "KpiTarget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "warningThreshold" REAL NOT NULL,
    "alertThreshold" REAL NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseHistory_orderId_key" ON "PurchaseHistory"("orderId");
