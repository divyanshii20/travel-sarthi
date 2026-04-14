/**
 * Tier 1 Image Seeder — pre-cache images for top destinations.
 *
 * Fetches 10 images per destination (1 hero + 9 gallery) from Pexels (primary)
 * and Unsplash (fallback), stores results in `destination_image_assets`.
 *
 * Rate limits respected:
 *   - Pexels  : 200 req/hour → ~18 s gap per destination (conservative: 20 s)
 *   - Unsplash: 50  req/hour → only used as fallback, minimal calls
 *
 * Usage:
 *   npx tsx src/db/seedDestinationImages.ts            # all destinations without images
 *   npx tsx src/db/seedDestinationImages.ts --limit 50 # only first 50
 */
import 'dotenv/config';
import {
  fetchImagesForDestination,
  getDestinationIdsWithoutImages,
  saveImagesToDb,
} from '../shared/imageSeeder';

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1] ?? '0', 10) : 0;
const IMAGES_PER_DESTINATION = 10;
const DELAY_MS = 20_000; // 20 s between requests → safe for Pexels 200/hr

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Tier 1 Destination Image Seeder ===\n');

  let destinations = await getDestinationIdsWithoutImages();
  console.log(`Found ${destinations.length} destination(s) without images.`);

  if (limit > 0) {
    destinations = destinations.slice(0, limit);
    console.log(`Limiting to first ${limit} destination(s).\n`);
  }

  if (destinations.length === 0) {
    console.log('Nothing to seed. All destinations already have images.');
    process.exit(0);
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < destinations.length; i++) {
    const dest = destinations[i]!;
    const prefix = `[${i + 1}/${destinations.length}]`;
    process.stdout.write(`${prefix} ${dest.name} (${dest.country}) ... `);

    try {
      const images = await fetchImagesForDestination(dest, IMAGES_PER_DESTINATION);
      if (images.length === 0) {
        console.log('SKIP (no images returned)');
        failed++;
      } else {
        await saveImagesToDb(dest.id, images);
        console.log(`OK (${images.length} images saved)`);
        success++;
      }
    } catch (err: any) {
      console.log(`ERROR: ${err?.message}`);
      failed++;
    }

    // Rate-limit delay (skip after last item)
    if (i < destinations.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Success: ${success}  |  Failed/Skipped: ${failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exitCode = 1;
});
