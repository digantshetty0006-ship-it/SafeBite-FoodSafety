/**
 * Wires every business in src/lib/business-data.json to its local
 * /images/businesses/<slug>.jpg photo, preserving all other fields.
 *
 * Usage: node scripts/wire-restaurant-images.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "src/lib/business-data.json");
const data = JSON.parse(readFileSync(file, "utf8"));

const files = {
  "Aaram Vada Pav": "aaram-vada-pav.jpg",
  "Bademiya": "bademiya.jpg",
  "Barbeque Nation - Nerul": "barbeque-nation-nerul.jpg",
  "Britannia & Co.": "britannia-co.jpg",
  "Cafe Goodluck": "cafe-goodluck.jpg",
  "Cafe Mysore": "cafe-mysore.jpg",
  "Candies": "candies.jpg",
  "Copper Chimney - Seawoods": "copper-chimney-seawoods.jpg",
  "Courtyard Pavilion": "courtyard-pavilion.jpg",
  "Courtyard by Marriott Navi Mumbai": "courtyard-by-marriott-navi-mumbai.jpg",
  "Foodway Inn Family Restaurant": "foodway-inn-family-restaurant.jpg",
  "Fusion Dine In": "fusion-dine-in.jpg",
  "Gajalee": "gajalee.jpg",
  "Grace Restaurant": "grace-restaurant.jpg",
  "Gulshan-e-Iran": "gulshan-e-iran.jpg",
  "Guru Kripa": "guru-kripa.jpg",
  "Haldiram's": "haldirams.jpg",
  "K. Rustom Ice Cream": "k-rustom-ice-cream.jpg",
  "Kyani & Co.": "kyani-and-co.jpg",
  "Legends Cafe": "legends-cafe.jpg",
  "Leopold Cafe": "leopold-cafe.jpg",
  "MAISON DE CAFÉ": "maison-de-caf.jpg",
  "MALANG": "malang.jpg",
  "Maharashtra Lunch Home - Nerul": "maharashtra-lunch-home-nerul.jpg",
  "Mahesh Lunch Home": "mahesh-lunch-home.jpg",
  "Marz-O-Rin": "marz-o-rin.jpg",
  "Masala Central": "masala-central.jpg",
  "NERUL BITES": "nerul-bites.jpg",
  "Prithvish Restro Bar": "prithvish-restro-bar.jpg",
  "Rangoli Family Restaurant & Bar": "rangoli-family-restaurant-bar.jpg",
  "Rasoi Restaurant & Bar": "rasoi-restaurant-bar.jpg",
  "Sadhana Misal": "sadhana-misal.jpg",
  "Sardar Pav Bhaji": "sardar-pav-bhaji.jpg",
  "Shree Nerul Cafe": "shree-nerul-cafe.jpg",
  "The Golden Grill": "the-golden-grill.jpg",
  "The Stone Age Cafe": "the-stone-age-cafe.jpg",
  "Trishna": "trishna.jpg",
  "Vaishali": "vaishali.jpg",
  "Vintage Coffee Cafe": "vintage-coffee-cafe.jpg",
  "Zaitoon The Restaurant": "zaitoon-the-restaurant.jpg",
};

let updated = 0;
for (const key of Object.keys(data)) {
  const name = key.split("|")[0];
  const file = files[name];
  if (!file) {
    console.log(`NO FILE for ${key}`);
    continue;
  }
  data[key].imageUrl = `/images/businesses/${file}`;
  data[key].imageCredit = "Wikimedia Commons";
  updated++;
}

writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(`Wired ${updated} businesses to local images.`);
