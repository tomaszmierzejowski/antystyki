-- Add OriginalAntisticId to Antistics table for draft/edit functionality
ALTER TABLE "Antistics" ADD COLUMN "OriginalAntisticId" uuid NULL;

ALTER TABLE "Antistics" 
    ADD CONSTRAINT "FK_Antistics_Antistics_OriginalAntisticId" 
    FOREIGN KEY ("OriginalAntisticId") 
    REFERENCES "Antistics" ("Id");

CREATE INDEX "IX_Antistics_OriginalAntisticId" ON "Antistics" ("OriginalAntisticId");

