// Seeds: 20 real Nerul restaurants (from SafeBite_Restaurants_Nerul_DYPatil.xlsx)
// + 18 team accounts (6 members x citizen/officer/business roles)
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const PASSWORD = "demo1234";

const MEMBERS = [
  { name: "Digant Shetty", key: "digantshetty" },
  { name: "Sejal Phadtare", key: "sejalphadtare" },
  { name: "Sharanya Shivshankar", key: "sharanyashivshankar" },
  { name: "Manit Suvarna", key: "manitsuvarna" },
  { name: "Paritosh Bagade", key: "paritoshbagade" },
  { name: "Sarthak Mane", key: "sarthakmane" },
];

const NERUL = { lat: 19.0332, lng: 73.0297 };

// deterministic jitter
function jitter(seed) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return (x - Math.floor(x)) - 0.5; // [-0.5, 0.5)
}

const RESTAURANTS = [
  { name: "Courtyard Pavilion", category: "restaurant", license: "11521011000892", expiry: "2027-03-31", address: "D.Y. Patil Stadium, Courtyard by Marriott, next to Gate No-5, Sector 7, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Marriott International (Chalet Hotels Ltd. — Sanjay Sethi, MD & CEO)" },
  { name: "MALANG", category: "restaurant", license: "11521011000893", expiry: "2027-03-31", address: "D.Y. Patil Stadium, Courtyard by Marriott, next to Gate No-5, Sector 7, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Marriott International (Chalet Hotels Ltd.)" },
  { name: "MAISON DE CAFÉ", category: "cafe", license: "11521011000894", expiry: "2027-03-31", address: "D.Y. Patil Stadium, Courtyard by Marriott, next to Gate No-5, Sector 7, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Marriott International (Chalet Hotels Ltd.)" },
  { name: "Courtyard by Marriott Navi Mumbai", category: "restaurant", license: "11521011000891", expiry: "2027-03-31", address: "Sector 7, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Chalet Hotels Ltd. (Sanjay Sethi, MD & CEO); Ph: +91 22-6876 9999" },
  { name: "Barbeque Nation - Nerul", category: "restaurant", license: "11517011000345", expiry: "2026-08-14", address: "First Floor, Plot #20, Beverley Park, Sector 6, Palm Beach Rd, above HDFC Bank, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Barbeque-Nation Hospitality Ltd. (Kayum Dhanani, Promoter)" },
  { name: "Maharashtra Lunch Home - Nerul", category: "restaurant", license: "11517017000458", expiry: "2027-11-22", address: "Shop No. 2, Paradise Apartment, Opp. S.I.E.S. College, Sector-3, Nerul East, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 93214 47773" },
  { name: "Rangoli Family Restaurant & Bar", category: "restaurant", license: "11517011000512", expiry: "2026-09-30", address: "Nerul East, Sector 3, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 95940 46777" },
  { name: "NERUL BITES", category: "restaurant", license: "11521011000675", expiry: "2027-06-15", address: "Shop No 05, Plot No. 88, Sector 11, Dr. D Y Patil Vidyanagar, Sector 5, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 93218 70686" },
  { name: "Grace Restaurant", category: "restaurant", license: "11517011000634", expiry: "2027-05-18", address: "Shop No 13, Type Building, F-2, Opp. Bank of Maharashtra, Nerul East, Sector 3, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 98692 06251" },
  { name: "Copper Chimney - Seawoods", category: "restaurant", license: "11519011000287", expiry: "2027-01-12", address: "2nd Floor, Mahavir Vihar, Grand Central Mall, Seawoods West, Nerul East, Sector 28, Seawoods, Navi Mumbai, Maharashtra 400706", owner: "K Hospitality Corp (Sanjay Vazirani, Chairman); Ph: +91 86578 96811" },
  { name: "Prithvish Restro Bar", category: "restaurant", license: "11517011000723", expiry: "2026-10-07", address: "Nerul East, Sector 3, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 98678 45150" },
  { name: "Foodway Inn Family Restaurant", category: "restaurant", license: "11517011000841", expiry: "2027-02-27", address: "Shop No 12, Platinum Tower, 13/14, near Nerul Depot, Nerul East, Sector 29, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 70399 99340" },
  { name: "Legends Cafe", category: "cafe", license: "11517011000921", expiry: "2026-12-05", address: "Dr. D Y Patil Vidyanagar, Sector 5, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 83697 25820" },
  { name: "The Stone Age Cafe", category: "cafe", license: "11517011000998", expiry: "2027-04-20", address: "Shop 5, Ashirwad Apts, Nerul East, Sector 3, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 98675 90090" },
  { name: "Vintage Coffee Cafe", category: "cafe", license: "11521011001056", expiry: "2027-07-15", address: "Shop No. 2/3, Beverly Park, Plot No. 20, near Palm Beach Road, Sector 6, Nerul, Navi Mumbai, Maharashtra 400706", owner: null },
  { name: "Fusion Dine In", category: "restaurant", license: "11517011001132", expiry: "2026-11-09", address: "Sector 1, Nerul Plaza Building, Shop No. 14, near L.P Bus Stop, Nerul, Navi Mumbai, Maharashtra 400706", owner: null },
  { name: "Shree Nerul Cafe", category: "cafe", license: "11517011001204", expiry: "2026-08-28", address: "Shop No. 2-3, Sandeep Apartment, Plot No. A-197, near Balaji Mandir, Sector 20, Nerul West, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 99693 39820" },
  { name: "Rasoi Restaurant & Bar", category: "restaurant", license: "11517011001318", expiry: "2027-03-13", address: "RT-2, Neighborhood Shopping Complex, Sector 4, behind SBI Bank, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 93243 56710" },
  { name: "Masala Central", category: "restaurant", license: "11517011001445", expiry: "2027-06-24", address: "Shop No. 4, Wing-A, Sector 6 Nerul Road, Sector 6, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 98095 45678" },
  { name: "Zaitoon The Restaurant", category: "restaurant", license: "11517011001567", expiry: "2026-10-16", address: "Shop No 3/4, Krishna Kamal Co-op Hsg Society, Plot 111-E/1 & 111-F, Nerul East, Sector 21, Nerul, Navi Mumbai, Maharashtra 400706", owner: "Ph: +91 99872 36264" },
];

function tierFor(score) {
  if (score < 25) return "A";
  if (score < 50) return "B";
  if (score < 75) return "C";
  return "D";
}

async function main() {
  // ---- team users ----
  const created = { citizens: [], officers: [], owners: [] };
  for (const [i, m] of MEMBERS.entries()) {
    for (const [prefix, role, bucket] of [
      ["cit", "citizen", "citizens"],
      ["insp", "food_officer", "officers"],
      ["biz", "business_owner", "owners"],
    ]) {
      const email = `${prefix}${m.key}@demo.in`;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        created[bucket].push({ email, id: existing.id });
        continue;
      }
      const user = await prisma.user.create({
        data: {
          name: m.name,
          email,
          password: PASSWORD,
          role,
          district: role === "food_officer" ? "Navi Mumbai" : null,
        },
      });
      created[bucket].push({ email, id: user.id });
    }
  }
  console.log("users: citizens", created.citizens.length, "officers", created.officers.length, "owners", created.owners.length);

  // ---- Nerul restaurants ----
  const ownerIds = created.owners.map((o) => o.id);
  let inserted = 0;
  let skipped = 0;
  for (const [i, r] of RESTAURANTS.entries()) {
    const existing = await prisma.business.findFirst({ where: { licenseNumber: r.license } });
    if (existing) {
      skipped++;
      continue;
    }
    const score = 22 + ((i * 47) % 66); // 22..87 spread
    await prisma.business.create({
      data: {
        name: r.name,
        category: r.category,
        licenseNumber: r.license,
        address: r.address,
        district: "Navi Mumbai",
        lat: NERUL.lat + jitter(i + 1) * 0.022,
        lng: NERUL.lng + jitter(i + 100) * 0.022,
        ownerId: ownerIds[i % ownerIds.length],
        supplier: r.owner,
        riskScore: score,
        riskTier: tierFor(score),
        registeredAt: new Date(`202${i % 4}-${(i % 12) + 1}-15`),
      },
    });
    inserted++;
  }
  console.log("restaurants inserted", inserted, "skipped", skipped);

  // ---- summary for the user ----
  console.log("\n=== TEAM LOGIN IDS (password: " + PASSWORD + ") ===");
  for (const m of MEMBERS) {
    console.log(
      [m.name, "|", `cit${m.key}`, "|", `insp${m.key}`, "|", `biz${m.key}`].join(" | ")
    );
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});