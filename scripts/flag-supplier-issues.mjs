/**
 * Flags compliance issues on existing supplier records so the inspector
 * "Supplier Alerts" panel has real data. Deterministic and idempotent.
 *
 * - Western Meat Packers / SpiceLink Wholesalers -> licenceNumber = null
 * - GreenValley Vegetables / Riverside Bakery Supply -> stale lastDeliveryAt
 *
 * Usage: $env:DATABASE_URL="postgres://..." ; node scripts/flag-supplier-issues.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

function dbUrl() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!url.startsWith("file:")) return url;
  let file = url.slice("file:".length);
  if (file.startsWith("./")) file = path.resolve(process.cwd(), file.slice(2));
  return file;
}
function isPostgres(url) {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({
  adapter: isPostgres(url) ? new PrismaPg({ connectionString: url }) : new PrismaBetterSqlite3({ url: dbUrl() }),
});

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260819);
const range = (min, max) => min + Math.floor(rng() * (max - min + 1));
const daysAgo = (days) => new Date(Date.now() - days * 24 * 3600 * 1000);

const MISSING_LICENCE = new Set(["Western Meat Packers", "SpiceLink Wholesalers"]);
const STALE_DELIVERY = new Set(["GreenValley Vegetables", "Riverside Bakery Supply"]);

async function main() {
  const suppliers = await prisma.supplier.findMany();
  let noLicence = 0;
  let stale = 0;
  for (const s of suppliers) {
    const updates = {};
    if (MISSING_LICENCE.has(s.name) && s.licenceNumber) {
      updates.licenceNumber = null;
      noLicence++;
    }
    if (STALE_DELIVERY.has(s.name)) {
      const target = daysAgo(range(45, 150));
      const current = s.lastDeliveryAt ? s.lastDeliveryAt.getTime() : 0;
      if (Date.now() - current > 14 * 24 * 3600 * 1000 && current > target.getTime()) {
        // already older than target; keep oldest
      } else {
        updates.lastDeliveryAt = target;
        stale++;
      }
    }
    if (Object.keys(updates).length) {
      await prisma.supplier.update({ where: { id: s.id }, data: updates });
    }
  }
  console.log(`Flagged: ${noLicence} missing-licence updates, ${stale} stale-delivery updates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
