-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT,
    "citizenId" TEXT,
    "assignedInspectorId" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lat" REAL,
    "lng" REAL,
    CONSTRAINT "Complaint_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Complaint_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Complaint_assignedInspectorId_fkey" FOREIGN KEY ("assignedInspectorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Complaint" ("anonymous", "businessId", "citizenId", "createdAt", "description", "id", "lat", "lng", "photos", "status") SELECT "anonymous", "businessId", "citizenId", "createdAt", "description", "id", "lat", "lng", "photos", "status" FROM "Complaint";
DROP TABLE "Complaint";
ALTER TABLE "new_Complaint" RENAME TO "Complaint";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
