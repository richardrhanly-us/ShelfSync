-- CreateTable
CREATE TABLE "InventoryRecord" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "synchronizedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryRecord_assignmentId_idx" ON "InventoryRecord"("assignmentId");

-- CreateIndex
CREATE INDEX "InventoryRecord_barcode_idx" ON "InventoryRecord"("barcode");

-- CreateIndex
CREATE INDEX "InventoryRecord_recordedAt_idx" ON "InventoryRecord"("recordedAt");
