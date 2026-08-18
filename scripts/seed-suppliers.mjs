/**
 * Additive supplier seeding — creates a Supplier Network dataset for every
 * business that doesn't have suppliers yet. Idempotent: businesses with
 * existing suppliers are skipped.
 *
 * Reads DATABASE_URL from the environment (set it to the Postgres URL for
 * production, or leave the default for the local SQLite dev.db).
 *
 * Usage:
 *   node scripts/seed-suppliers.mjs            # uses .env DATABASE_URL (sqlite)
 *   $env:DATABASE_URL="postgres://..." ; node scripts/seed-suppliers.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Same shared supplier pool as prisma/seed.ts.
const SUPPLIER_DEFS = [
  { name: "FreshWater Co.", category: "Water", products: "Packaged drinking water, cooler refills", location: "Bhiwandi, Thane", licence: "12724002000012" },
  { name: "GreenValley Vegetables", category: "Vegetables", products: "Seasonal vegetables, leafy greens", location: "APMC Vashi Market, Navi Mumbai", licence: "12724002000023" },
  { name: "Maharashtra Dairy Co-op", category: "Dairy", products: "Milk, paneer, butter, curd", location: "Dadar, Mumbai", licence: "12724002000034" },
  { name: "Western Meat Packers", category: "Meat", products: "Chicken, mutton, processed cuts", location: "Deonar Abattoir, Mumbai", licence: "12724002000045" },
  { name: "Coastal Seafood Exports", category: "Seafood", products: "Fresh fish, prawns, frozen seafood", location: "Sassoon Dock, Mumbai", licence: "12724002000056" },
  { name: "Krishna Flour Mills", category: "Grains", products: "Wheat flour, rice, pulses, besan", location: "Sangli, Maharashtra", licence: "12724002000067" },
  { name: "SpiceLink Wholesalers", category: "Spices", products: "Whole & ground spices, masala mixes", location: "Crawford Market, Mumbai", licence: "12724002000078" },
  { name: "Beverage Distributors Hub", category: "Beverages", products: "Soft drinks, juices, syrups", location: "Kandivali, Mumbai", licence: "12724002000089" },
  { name: "PackFresh Foods", category: "Packaged Food", products: "Packaged snacks, sauces, edible oils", location: "MIDC, Thane", licence: "12724002000090" },
  { name: "Riverside Bakery Supply", category: "Packaged Food", products: "Bread, buns, bakery premixes", location: "Grant Road, Mumbai", licence: "12724002000101" },
];

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

const seedUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({
  adapter: isPostgres(seedUrl)
    ? new PrismaPg({ connectionString: seedUrl })
    : new PrismaBetterSqlite3({ url: dbUrl() }),
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
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const range = (min, max) => min + Math.floor(rng() * (max - min + 1));
const daysAgo = (days) => new Date(Date.now() - days * 24 * 3600 * 1000);

async function main() {
  const businesses = await prisma.business.findMany({ include: { suppliers: true } });
  let created = 0;
  let skipped = 0;
  for (const biz of businesses) {
    if (biz.suppliers.length > 0) {
      skipped++;
      continue;
    }
    const n = range(2, 5);
    const chosen = new Map();
    for (let s = 0; s < n && chosen.size < SUPPLIER_DEFS.length; s++) {
      const def = pick(SUPPLIER_DEFS);
      chosen.set(def.name, def);
    }
    for (const def of chosen.values()) {
      await prisma.supplier.create({
        data: {
          businessId: biz.id,
          name: def.name,
          category: def.category,
          products: def.products,
          location: def.location,
          licenceNumber: def.licence,
          lastDeliveryAt: daysAgo(range(0, 30)),
        },
      });
      created++;
    }
  }
  console.log(`Suppliers seeded: ${created} created across ${businesses.length - skipped} businesses (${skipped} already had suppliers).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
