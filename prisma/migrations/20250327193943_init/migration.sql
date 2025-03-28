-- CreateTable
CREATE TABLE "CsvFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "s3Url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CsvFile_pkey" PRIMARY KEY ("id")
);
