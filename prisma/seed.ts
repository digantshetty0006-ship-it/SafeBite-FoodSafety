import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";
import { calculateRiskScore } from "../src/lib/risk";

function dbUrl(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!url.startsWith("file:")) return url;
  let file = url.slice("file:".length);
  if (file.startsWith("./")) {
    file = path.resolve(process.cwd(), file.slice(2));
  }
  return file;
}

function isPostgres(url: string): boolean {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

const seedUrl = process.env.DATABASE_URL ?? "file:./dev.db";

const prisma = new PrismaClient({
  adapter: isPostgres(seedUrl)
    ? new PrismaPg({ connectionString: seedUrl })
    : new PrismaBetterSqlite3({ url: dbUrl() }),
});

const DISTRICTS = [
  { name: "Mumbai", center: [19.076, 72.8777] },
  { name: "Thane", center: [19.2183, 72.9781] },
  { name: "Navi Mumbai", center: [19.033, 73.0297] },
  { name: "Pune", center: [18.5204, 73.8567] },
  { name: "Nashik", center: [19.9975, 73.7898] },
  { name: "Nagpur", center: [21.1458, 79.0882] },
];

const CATEGORIES = [
  "restaurant",
  "restaurant",
  "restaurant",
  "street_vendor",
  "street_vendor",
  "manufacturer",
  "manufacturer",
  "warehouse",
  "warehouse",
  "meat_poultry",
  "meat_poultry",
  "bakery",
  "catering",
  "packaged_retail",
];

const NAME_TEMPLATES = [
  "Hotel {x}",
  "{x} Bhojanalaya",
  "{x} Family Restaurant",
  "{x} Sweets & Snacks",
  "{x} Fresh Mart",
  "The {x} Grill",
  "{x} Food Corner",
  "{x} Spice House",
  "Shree {x} Foods",
  "{x} Caterers",
  "{x} Cold Storage",
  "{x} Bake House",
  "{x} Meat Shop",
  "{x} Food Products",
  "{x} Kitchen",
  "{x} Dairy & Store",
  "{x} Halwai",
  "{x} Delivery Kitchen",
];

const NAME_SEEDS = [
  "Anand", "Shree Sai", "Blue Diamond", "Maharashtra", "Ganesh", "Sagar", "Udupi", "Bombay",
  "Rajdhani", "Chai Point", "Guru Kripa", "Swad", "Golden", "Sai Prasad", "Kamal", "Rameshwar",
  "Durga", "Shivaji", "Om", "Punjab", "Taj", "Krishna", "Laxmi", "Amrut", "Sarovar", "Vandana",
  "Green Leaf", "Royal", "Indrayani", "Bhagwati", "Annapurna", "Maa", "Vijay", "Sanjay",
];

const SUPPLIERS = [
  "FreshPro Produce",
  "Maharashtra Dairy Co-op",
  "Sunrise Cold Storage",
  "Pune Agro Supplies",
  "Coastal Seafood Exports",
  "SpiceLink Wholesalers",
  "GreenValley Vegetables",
  "Krishna Flour Mills",
  "Western Meat Packers",
  "Godavari Poultry",
];

// Shared supplier pool used to seed the Supplier Network. Multiple
// businesses reference the same supplier so the inspector view can show
// "Used by N restaurants".
const SUPPLIER_DEFS: { name: string; category: string; products: string; location: string; licence: string }[] = [
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

// Real, operating food businesses (name, category, district, address, lat, lng)
// so the demo map and lookup show actual places citizens would recognise.
const REAL_RESTAURANTS: { name: string; category: string; district: string; address: string; lat: number; lng: number }[] = [
  { name: "Britannia & Co.", category: "restaurant", district: "Mumbai", address: "16 Wakefield House, Ballard Estate, Fort, Mumbai 400001", lat: 18.9336, lng: 72.8338 },
  { name: "Bademiya", category: "restaurant", district: "Mumbai", address: "Tulloch Road, Apollo Bandar, Colaba, Mumbai 400039", lat: 18.9139, lng: 72.8311 },
  { name: "Leopold Cafe", category: "restaurant", district: "Mumbai", address: "Shahid Bhagat Singh Road, Colaba Causeway, Mumbai 400001", lat: 18.9168, lng: 72.8319 },
  { name: "Kyani & Co.", category: "bakery", district: "Mumbai", address: "Jer Mahal, Dhobi Talao, Mumbai 400002", lat: 18.9495, lng: 72.8298 },
  { name: "Trishna", category: "restaurant", district: "Mumbai", address: "Rustom Sidhwa Marg, Kalaghoda, Mumbai 400001", lat: 18.9278, lng: 72.8314 },
  { name: "Mahesh Lunch Home", category: "restaurant", district: "Mumbai", address: "8-B, Cawasji Patel Street, Fort, Mumbai 400001", lat: 18.9341, lng: 72.8335 },
  { name: "Gajalee", category: "restaurant", district: "Mumbai", address: "Link Road, Vile Parle West, Mumbai 400056", lat: 19.1023, lng: 72.8259 },
  { name: "K. Rustom Ice Cream", category: "packaged_retail", district: "Mumbai", address: "Jeroo Building, M. G. Road, Churchgate, Mumbai 400020", lat: 18.9281, lng: 72.8273 },
  { name: "Sardar Pav Bhaji", category: "street_vendor", district: "Mumbai", address: "48-B, Tardeo Road, Mumbai 400007", lat: 18.9712, lng: 72.8152 },
  { name: "Guru Kripa", category: "restaurant", district: "Mumbai", address: "Subhash Chandra Bose Marg, Sion, Mumbai 400022", lat: 19.0419, lng: 72.8581 },
  { name: "Cafe Mysore", category: "restaurant", district: "Mumbai", address: "Dr. Ambedkar Road, Matunga East, Mumbai 400019", lat: 19.0262, lng: 72.8512 },
  { name: "Aaram Vada Pav", category: "street_vendor", district: "Mumbai", address: "Opposite CST Station, Fort, Mumbai 400001", lat: 18.9401, lng: 72.834 },
  { name: "Louis Burgers", category: "restaurant", district: "Mumbai", address: "Wodehouse Road, Colaba, Mumbai 400005", lat: 18.9123, lng: 72.8298 },
  { name: "Jimi's Burger", category: "restaurant", district: "Mumbai", address: "Linking Road, Bandra West, Mumbai 400050", lat: 19.0597, lng: 72.8297 },
  { name: "Elco Popsicle", category: "packaged_retail", district: "Mumbai", address: "Hill Road, Bandra West, Mumbai 400050", lat: 19.0555, lng: 72.828 },
  { name: "Candies", category: "restaurant", district: "Mumbai", address: "Pali Hill, Bandra West, Mumbai 400050", lat: 19.0605, lng: 72.8253 },
  { name: "Gulshan-e-Iran", category: "bakery", district: "Mumbai", address: "Linking Road, Bandra West, Mumbai 400050", lat: 19.0603, lng: 72.8306 },
  { name: "Vaishali", category: "restaurant", district: "Pune", address: "Fergusson College Road, Shivajinagar, Pune 411004", lat: 18.524, lng: 73.8377 },
  { name: "Marz-O-Rin", category: "bakery", district: "Pune", address: "1A, Moledina Road, Camp, Pune 411001", lat: 18.512, lng: 73.8767 },
  { name: "Cafe Goodluck", category: "restaurant", district: "Pune", address: "Fergusson College Road, Shivajinagar, Pune 411004", lat: 18.5236, lng: 73.8379 },
  { name: "Haldiram's", category: "restaurant", district: "Nagpur", address: "Sitabuldi Main Road, Nagpur 440012", lat: 21.1515, lng: 79.0837 },
  { name: "Tarri Poha Center", category: "street_vendor", district: "Nagpur", address: "Near SFS School, Fetri, Nagpur 440030", lat: 21.0968, lng: 79.0156 },
  { name: "Hotel Trikal", category: "restaurant", district: "Nashik", address: "College Road, Nashik 422005", lat: 20.007, lng: 73.786 },
  { name: "Sadhana Misal", category: "street_vendor", district: "Nashik", address: "Sharanpur Road, Nashik 422002", lat: 20.005, lng: 73.79 },
];

const VIOLATION_TYPES = ["expired_stock", "pest_control", "temperature", "licensing", "hygiene", "food_handling", "water_quality", "labeling", "adulteration"];

// Deterministic PRNG so reseeding gives identical data.
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260805);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const range = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 3600 * 1000);
const daysAhead = (days: number) => new Date(Date.now() + days * 24 * 3600 * 1000);

const CHECKLIST_DEF: { key: string; label: string }[] = [
  { key: "hygiene", label: "General hygiene & cleanliness" },
  { key: "storage_temperature", label: "Storage temperature control" },
  { key: "licensing", label: "Valid FSSAI license displayed" },
  { key: "pest_control", label: "Pest control measures in place" },
  { key: "expiry_dates", label: "No expired / stale stock" },
  { key: "staff_hygiene", label: "Staff hygiene (gloves, headgear)" },
  { key: "food_handling", label: "Safe food handling & separation" },
  { key: "water_quality", label: "Potable water supply" },
  { key: "waste_management", label: "Waste management & disposal" },
  { key: "allergen_management", label: "Allergen labeling & management" },
];

const VIOLATION_TO_CHECKLIST: Record<string, string[]> = {
  expired_stock: ["expiry_dates"],
  pest_control: ["pest_control"],
  temperature: ["storage_temperature"],
  licensing: ["licensing"],
  hygiene: ["hygiene", "staff_hygiene", "waste_management"],
  food_handling: ["food_handling"],
  water_quality: ["water_quality"],
  labeling: ["allergen_management"],
  adulteration: ["expiry_dates", "allergen_management"],
};

const PHOTOS = ["/uploads/photo-kitchen.svg", "/uploads/photo-storage.svg", "/uploads/photo-stall.svg", "/uploads/photo-packaging.svg"];

function makeChecklist(violations: string[]): any[] {
  const failed = new Set(violations.flatMap((v) => VIOLATION_TO_CHECKLIST[v] ?? []));
  return CHECKLIST_DEF.map((item) => ({
    key: item.key,
    label: item.label,
    passed: !failed.has(item.key),
    notes: failed.has(item.key)
      ? pick(["Observed non-compliance", "Minor lapses noted", "Repeat finding", "Needs corrective action"])
      : "Compliant",
  }));
}

function severityRoll(r: number): string {
  if (r < 0.12) return "critical";
  if (r < 0.4) return "high";
  if (r < 0.8) return "medium";
  return "low";
}

async function main() {
  console.log("Resetting database...");
  await prisma.supplier.deleteMany();
  await prisma.violation.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.document.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  // ---- Users ----
  const officer = await prisma.user.create({
    data: { name: "Anita Deshmukh", email: "officer@demo.in", password: "demo1234", role: "food_officer", district: "Maharashtra" },
  });
  const officer1 = await prisma.user.create({
    data: { name: "Rahul Patil", email: "inspector@demo.in", password: "demo1234", role: "food_officer", district: "Mumbai" },
  });
  const officer2 = await prisma.user.create({
    data: { name: "Sneha Kulkarni", email: "inspector.pune@demo.in", password: "demo1234", role: "food_officer", district: "Pune" },
  });
  const officer3 = await prisma.user.create({
    data: { name: "Vikram Rao", email: "inspector.nagpur@demo.in", password: "demo1234", role: "food_officer", district: "Nagpur" },
  });
  const demoCitizen = await prisma.user.create({
    data: { name: "Meera Joshi", email: "citizen@demo.in", password: "demo1234", role: "citizen", district: "Mumbai" },
  });
  const citizens: any[] = [];
  for (const nm of ["Arnav Patel", "Sana Sheikh", "Kunal Desai", "Ritika Verma", "Aditya Kumar"]) {
    citizens.push(
      await prisma.user.create({
        data: { name: nm, email: `${nm.split(" ")[0].toLowerCase()}${citizens.length + 1}@citizen.in`, password: "demo1234", role: "citizen" },
      })
    );
  }
  const demoOwner = await prisma.user.create({
    data: { name: "Rajesh Sharma", email: "owner@demo.in", password: "demo1234", role: "business_owner", district: "Mumbai" },
  });

  const officers = [officer1, officer2, officer3];
  const owners: any[] = [demoOwner];
  const OWNER_NAMES = [
    "Suresh Iyer", "Farida Khan", "Manish Gupta", "Deepa Nair", "Arjun Singh",
    "Pooja Reddy", "Imran Shaikh", "Ganesh Bapat", "Kavita Menon", "Sunil Jadhav",
    "Rohit Verma", "Nisha Pillai",
  ];
  for (const nm of OWNER_NAMES) {
    owners.push(
      await prisma.user.create({
        data: { name: nm, email: `${nm.split(" ")[0].toLowerCase()}${owners.length}@business.in`, password: "demo1234", role: "business_owner" },
      })
    );
  }

  // ---- Businesses ----
  const businesses: any[] = [];

  // Real restaurants first (real names, addresses, coordinates).
  let serial = 100001;
  for (const r of REAL_RESTAURANTS) {
    const owner = owners[Math.floor(rng() * owners.length)];
    const biz = await prisma.business.create({
      data: {
        name: r.name,
        category: r.category,
        licenseNumber: `12724002${String(serial++).padStart(6, "0")}`,
        address: r.address,
        district: r.district,
        lat: r.lat + (rng() - 0.5) * 0.004,
        lng: r.lng + (rng() - 0.5) * 0.004,
        supplier: rng() < 0.6 ? pick(SUPPLIERS) : null,
        ownerId: owner.id,
        registeredAt: daysAgo(range(120, 2400)),
      },
    });
    businesses.push({ biz, category: r.category, riskProfile: rng() });
  }

  // Generated businesses round out the remaining districts.
  let templateIdx = 0;
  for (const dist of DISTRICTS) {
    const count = dist.name === "Mumbai" ? 6 : dist.name === "Pune" ? 6 : dist.name === "Thane" ? 7 : dist.name === "Navi Mumbai" ? 6 : dist.name === "Nashik" ? 3 : 4;
    for (let i = 0; i < count; i++) {
      const category = pick(CATEGORIES);
      const tpl = NAME_TEMPLATES[templateIdx % NAME_TEMPLATES.length];
      templateIdx++;
      const name = tpl.replace("{x}", pick(NAME_SEEDS) + (rng() > 0.5 ? ` ${pick(["Inn", "House", "Express", "Supreme", "Corner"])}` : ""));
      const lat = dist.center[0] + (rng() - 0.5) * 0.12;
      const lng = dist.center[1] + (rng() - 0.5) * 0.14;
      const owner = owners[Math.floor(rng() * owners.length)];
      const hasSupplier = rng() < 0.65;
      const riskProfile = rng();
      const biz = await prisma.business.create({
        data: {
          name,
          category,
          licenseNumber: `12724002${String(serial++).padStart(6, "0")}`,
          address: `${range(1, 400)}, ${pick(["MG Road", "Station Road", "Linking Road", "Market Chowk", "MIDC Area", "Main Bazaar"])}, ${dist.name}`,
          district: dist.name,
          lat,
          lng,
          supplier: hasSupplier ? pick(SUPPLIERS) : null,
          ownerId: owner.id,
          registeredAt: daysAgo(range(60, 1100)),
        },
      });
      businesses.push({ biz, category, riskProfile });
    }
  }

  console.log(`Created ${businesses.length} businesses.`);

  // ---- Suppliers ----
  let supplierCount = 0;
  for (const { biz } of businesses) {
    const n = range(2, 5);
    const chosen = new Map<string, typeof SUPPLIER_DEFS[number]>();
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
      supplierCount++;
    }
  }
  console.log(`Created ${supplierCount} suppliers.`);

  // ---- Documents ----
  for (const { biz, riskProfile } of businesses) {
    const isHotspot = riskProfile > 0.8;
    const nDocs = isHotspot ? 2 : range(0, 2);
    const expiredChance = riskProfile < 0.4 ? 0.12 : riskProfile < 0.75 ? 0.28 : 0.55;
    for (let d = 0; d < nDocs; d++) {
      const type = pick(["license", "lab_certificate", "health_certificate"]);
      await prisma.document.create({
        data: {
          businessId: biz.id,
          type,
          fileUrl: `/uploads/doc-${type}.svg`,
          uploadedAt: daysAgo(range(10, 300)),
          expiresAt: rng() < expiredChance ? daysAgo(range(1, 60)) : daysAhead(range(30, 500)),
        },
      });
    }
  }

  // ---- Inspections + Violations ----
  const inspectionNotes = [
    "Overall compliance adequate, minor hygiene lapses.",
    "Refrigeration units running above safe limits.",
    "Found expired stock on open shelves. Immediate disposal advised.",
    "No visible pest control records.",
    "License displayed, staff trained. Good compliance.",
    "Raw and cooked items stored in same fridge.",
    "Water quality test certificates unavailable.",
    "Repeat finding — temperature logs not maintained.",
    "Kitchen in clean condition. Satisfactory.",
  ];

  let createdInspections = 0;
  for (const { biz, category, riskProfile } of businesses) {
    const intent = riskProfile;
    const isHotspot = intent > 0.8;
    const nInsp = intent < 0.3 ? 1 : intent < 0.7 ? range(1, 2) : isHotspot ? 3 : range(2, 3);

    const hotspotPlans: { age: number; vtypes: string[]; severities: string[] }[] = [
      { age: 700, vtypes: ["temperature", "pest_control"], severities: ["high", "medium"] },
      { age: 210, vtypes: ["expired_stock", "hygiene", "temperature"], severities: ["critical", "medium", "high"] },
      { age: 30, vtypes: ["expired_stock", "adulteration", "pest_control", "temperature"], severities: ["critical", "critical", "high", "high"] },
    ];

    for (let idx = 0; idx < nInsp; idx++) {
      const officer = officers[Math.floor(rng() * officers.length)];
      const plan = isHotspot ? hotspotPlans[idx] : null;
      const completed = isHotspot ? true : rng() < 0.85;
      const scheduledAt = plan ? daysAgo(plan.age) : daysAgo(range(10, 400));

      let violationTypes: string[] = [];
      let violationData: { type: string; severity: string; description: string }[] = [];
      if (plan) {
        violationData = plan.vtypes.map((t, i) => ({
          type: t,
          severity: plan.severities[i] ?? severityRoll(rng()),
          description: pick([
            `${t.replace(/_/g, " ")} — observed during inspection`,
            `Repeat finding on ${t.replace(/_/g, " ")}`,
            `Non-compliance on ${t.replace(/_/g, " ")}`,
          ]),
        }));
        violationTypes = plan.vtypes;
      } else {
        const violationCount =
          intent < 0.3 ? 0 : intent < 0.55 ? range(0, 1) : intent < 0.8 ? range(1, 2) : range(2, 4);
        for (let v = 0; v < violationCount; v++) {
          const t = pick(VIOLATION_TYPES);
          if (!violationTypes.includes(t)) violationTypes.push(t);
        }
        const r = intent > 0.75 ? rng() * 0.75 : rng();
        violationData = violationTypes.map((t) => ({
          type: t,
          severity: severityRoll(r),
          description: pick([
            `${t.replace(/_/g, " ")} — observed during inspection`,
            `Repeat finding on ${t.replace(/_/g, " ")}`,
            `Non-compliance on ${t.replace(/_/g, " ")}`,
          ]),
        }));
      }

      const insp = await prisma.inspection.create({
        data: {
          businessId: biz.id,
          officerId: officer.id,
          scheduledAt,
          completedAt: completed ? (plan ? daysAgo(plan.age) : daysAgo(range(5, 390))) : null,
          checklist: makeChecklist(violationTypes),
          notes: violationData.length ? pick(inspectionNotes) : "Fully compliant inspection.",
          photos: rng() < 0.6 ? JSON.stringify([pick(PHOTOS), pick(PHOTOS)]) : JSON.stringify([pick(PHOTOS)]),
          status: completed ? "completed" : rng() < 0.4 ? "missed" : "scheduled",
        },
      });
      for (const v of violationData) {
        await prisma.violation.create({
          data: {
            inspectionId: insp.id,
            type: v.type,
            severity: v.severity,
            description: v.description,
          },
        });
      }
      createdInspections++;
    }
  }
  console.log(`Created ${createdInspections} inspections.`);

  // ---- Complaints ----
  const complaintTemplates = [
    "Found a hair in my food while dining. Concerned about hygiene practices.",
    "The packaged snack I bought had expired date clearly visible. Tasted stale.",
    "Served undercooked chicken — worried about food poisoning.",
    "Kitchen area visible from counter looked dirty with no staff wearing gloves.",
    "Strong chemical smell in the storage area behind the shop.",
    "Suspected adulteration in the milk products purchased last week.",
    "Rats seen near the food storage entrance.",
    "Cold items served lukewarm — refrigeration may be broken.",
    "No FSSAI license displayed at the premises.",
    "Complaint of stomach upset after eating here; suspect stale ingredients.",
  ];
  const complaintStatuses = ["submitted", "under_review", "inspection_scheduled", "resolved"];

  const hotspots = businesses.filter(({ riskProfile }) => riskProfile > 0.8);
  const weightedTargets = businesses.flatMap(({ biz, riskProfile }) => {
    const copies = riskProfile < 0.4 ? 1 : riskProfile < 0.75 ? 2 : 4;
    return Array.from({ length: copies }, () => biz);
  });

  for (let i = 0; i < 16; i++) {
    const biz = pick(weightedTargets);
    const anonymous = rng() < 0.3;
    const withPhoto = rng() < 0.45;
    const citizen = citizens[Math.floor(rng() * citizens.length)];
    await prisma.complaint.create({
      data: {
        businessId: rng() < 0.9 ? biz.id : null,
        citizenId: anonymous ? null : citizen.id,
        anonymous,
        description: pick(complaintTemplates),
        photos: withPhoto ? JSON.stringify([pick(PHOTOS)]) : "[]",
        status: pick(complaintStatuses),
        createdAt: daysAgo(range(0, 120)),
        address: biz.address,
        district: biz.district,
        lat: anonymous ? undefined : biz.lat + (rng() - 0.5) * 0.02,
        lng: anonymous ? undefined : biz.lng + (rng() - 0.5) * 0.02,
      },
    });
  }

  // Hotspot businesses carry multiple, mostly-substantiated complaints.
  const hotspotStatuses = ["under_review", "inspection_scheduled", "resolved", "resolved"];
  for (const { biz } of hotspots) {
    const n = range(2, 4);
    for (let c = 0; c < n; c++) {
      await prisma.complaint.create({
        data: {
          businessId: biz.id,
          citizenId: rng() < 0.7 ? citizens[Math.floor(rng() * citizens.length)].id : null,
          anonymous: rng() < 0.3,
          description: pick(complaintTemplates),
          photos: rng() < 0.5 ? JSON.stringify([pick(PHOTOS)]) : "[]",
          status: pick(hotspotStatuses),
          createdAt: daysAgo(range(1, 95)),
          address: biz.address,
          district: biz.district,
          lat: biz.lat + (rng() - 0.5) * 0.02,
          lng: biz.lng + (rng() - 0.5) * 0.02,
        },
      });
    }
  }
  const demoComplaintBusiness = businesses.find(({ riskProfile }) => riskProfile > 0.8)?.biz ?? null;
  await prisma.complaint.create({
    data: {
      businessId: demoComplaintBusiness?.id ?? null,
      citizenId: demoCitizen.id,
      anonymous: false,
      description: "Reported stale bread from the delivery order — crust was mouldy.",
      photos: JSON.stringify(["/uploads/complaint-food.svg"]),
      status: "under_review",
      createdAt: daysAgo(2),
      address: demoComplaintBusiness?.address ?? null,
      district: demoComplaintBusiness?.district ?? null,
    },
  });
  console.log("Complaints created.");

  // ---- Compute risk scores from actual data (transparent scoring) ----
  const allBusinesses = await prisma.business.findMany({ include: { inspections: { include: { violations: true } }, complaints: true, documents: true } });
  for (const b of allBusinesses) {
    const r = calculateRiskScore(b);
    await prisma.business.update({
      where: { id: b.id },
      data: { riskScore: r.score, riskTier: r.tier },
    });
  }

  const tierCounts = allBusinesses.reduce<Record<string, number>>((acc, b) => {
    const t = scoreToTier(calculateRiskScore(b).score);
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  console.log("Risk tier distribution:", tierCounts);
  console.log("Seed complete.");
}

function scoreToTier(s: number): string {
  if (s <= 25) return "A";
  if (s <= 50) return "B";
  if (s <= 75) return "C";
  return "D";
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
