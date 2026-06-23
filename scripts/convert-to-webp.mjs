import sharp from "sharp";
import { readdirSync, unlinkSync, readFileSync, writeFileSync } from "fs";
import { join, extname, basename } from "path";

const IMAGES_DIR = new URL("../public/images", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const CONTENT_DIR = new URL("../content", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

const CONVERTIBLE = [".jpg", ".jpeg", ".png"];

const files = readdirSync(IMAGES_DIR);
const toConvert = files.filter((f) => CONVERTIBLE.includes(extname(f).toLowerCase()));

console.log(`Found ${toConvert.length} images to convert.`);

const renames = [];

for (const file of toConvert) {
  const ext = extname(file).toLowerCase();
  const base = basename(file, ext);
  const src = join(IMAGES_DIR, file);
  const dest = join(IMAGES_DIR, `${base}.webp`);

  try {
    await sharp(src).webp({ quality: 85 }).toFile(dest);
    unlinkSync(src);
    renames.push({ from: `/images/${file}`, to: `/images/${base}.webp` });
    console.log(`  ✓ ${file} → ${base}.webp`);
  } catch (err) {
    console.warn(`  ✗ SKIPPED ${file}: ${err.message}`);
  }
}

// Update all references in content/ files
const contentFiles = [
  join(CONTENT_DIR, "articles", "index.ts"),
  join(CONTENT_DIR, "about.ts"),
];

for (const cf of contentFiles) {
  let src = readFileSync(cf, "utf8");
  for (const { from, to } of renames) {
    src = src.replaceAll(from, to);
  }
  writeFileSync(cf, src, "utf8");
  console.log(`  Updated references in ${basename(cf)}`);
}

console.log("Done.");
