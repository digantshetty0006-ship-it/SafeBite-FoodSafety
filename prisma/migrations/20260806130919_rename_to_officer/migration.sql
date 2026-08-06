-- Rename legacy "inspector" columns to "officer" (Food Safety Officer role merge)
ALTER TABLE "Inspection" RENAME COLUMN "inspectorId" TO "officerId";
ALTER TABLE "Complaint" RENAME COLUMN "assignedInspectorId" TO "assignedOfficerId";
