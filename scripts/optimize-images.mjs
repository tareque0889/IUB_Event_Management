/**
 * scripts/optimize-images.mjs
 *
 * Pre-generates WebP + AVIF variants (and a downscaled JPEG) for every raster
 * image in src/assets so components can render a <picture> element:
 *
 *   <picture>
 *     <source type="image/avif" srcSet={heroAvif} />
 *     <source type="image/webp" srcSet={heroWebp} />
 *     <img src={heroJpg} ... />
 *   </picture>
 *
 * Run: npm run optimize-images   (node scripts/optimize-images.mjs)
 * Vite's image-optimizer plugin still recompresses whatever gets imported at
 * build time; this script only adds the modern-format siblings.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ASSETS_DIR = path.resolve("src/assets");
const MAX_WIDTH = 1600;
const RASTER = /\.(jpe?g|png)$/i;

async function optimize(file) {
  const base = file.replace(RASTER, "");
  const image = sharp(file).resize({ width: MAX_WIDTH, withoutEnlargement: true });

  const [webp, avif] = await Promise.all([
    image.clone().webp({ quality: 78 }).toFile(`${base}.webp`),
    image.clone().avif({ quality: 55 }).toFile(`${base}.avif`),
  ]);
  const original = (await stat(file)).size;
  console.log(
    `${path.basename(file)}  ${(original / 1024).toFixed(0)} KB  →  webp ${(webp.size / 1024).toFixed(0)} KB, avif ${(avif.size / 1024).toFixed(0)} KB`,
  );
}

const entries = await readdir(ASSETS_DIR).catch(() => []);
const targets = entries.filter((f) => RASTER.test(f)).map((f) => path.join(ASSETS_DIR, f));
if (targets.length === 0) {
  console.log("No raster images found in src/assets.");
} else {
  await Promise.all(targets.map(optimize));
}
