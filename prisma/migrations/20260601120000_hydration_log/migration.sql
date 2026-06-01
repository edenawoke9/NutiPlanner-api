-- CreateTable
CREATE TABLE "HydrationLog" (
    "hydrationLogId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "logDate" DATE NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HydrationLog_pkey" PRIMARY KEY ("hydrationLogId")
);

-- CreateIndex
CREATE INDEX "HydrationLog_userId_idx" ON "HydrationLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HydrationLog_userId_logDate_key" ON "HydrationLog"("userId", "logDate");

-- AddForeignKey
ALTER TABLE "HydrationLog" ADD CONSTRAINT "HydrationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
