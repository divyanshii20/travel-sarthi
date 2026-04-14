import axios from 'axios';
import sharp from 'sharp';
import { and, asc, eq } from 'drizzle-orm';
import { env } from '../../config/env';
import { db } from '../../config/database';
import { destinationImageAssets, destinations } from '../../db/schema/hotels';
import { logger } from '../../shared/logger';

type DestinationRow = typeof destinations.$inferSelect;
type DestinationImageAssetRow = typeof destinationImageAssets.$inferSelect;

export interface ResolvedDestinationImages {
  hero: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
    blurHash?: string;
  };
  images: Array<{
    url: string;
    alt: string;
    width?: number;
    height?: number;
    blurHash?: string;
  }>;
  galleryUrls: string[];
}

export async function resolveDestinationImages(destination: DestinationRow): Promise<ResolvedDestinationImages> {
  const existing = await db
    .select()
    .from(destinationImageAssets)
    .where(eq(destinationImageAssets.destinationId, destination.id))
    .orderBy(asc(destinationImageAssets.assetType), asc(destinationImageAssets.sortOrder));

  if (existing.length > 0) {
    return mapAssetRows(existing, destination.name, destination.heroImageUrl);
  }

  const seeded = await seedImagesFromDestinationRow(destination);
  if (seeded.length > 0) {
    return mapAssetRows(seeded, destination.name, destination.heroImageUrl);
  }

  const discovered = await fetchAndPersistFallbackHero(destination);
  if (discovered != null) {
    return {
      hero: toImageAsset(discovered, destination.name, destination.heroImageUrl),
      images: [],
      galleryUrls: [discovered.publicUrl],
    };
  }

  return {
    hero: {
      url: destination.heroImageUrl,
      alt: destination.name,
      width: 1600,
      height: 1000,
      blurHash: createSvgBlurDataUrl(destination.name),
    },
    images: [],
    galleryUrls: destination.galleryImages,
  };
}

async function seedImagesFromDestinationRow(destination: DestinationRow) {
  const candidates = [
    { url: destination.heroImageUrl, assetType: 'hero', sortOrder: 0, altText: destination.name },
    ...destination.galleryImages.map((url, index) => ({
      url,
      assetType: 'gallery',
      sortOrder: index,
      altText: `${destination.name} gallery ${index + 1}`,
    })),
  ].filter((item) => typeof item.url === 'string' && item.url.length > 0);

  if (candidates.length === 0) return [] as DestinationImageAssetRow[];

  const inserted = await db.insert(destinationImageAssets).values(
    candidates.map((item) => ({
      destinationId: destination.id,
      assetType: item.assetType,
      sourceProvider: 'database_seed',
      sourceUrl: item.url,
      publicUrl: item.url,
      altText: item.altText,
      width: item.assetType === 'hero' ? 1600 : 1400,
      height: item.assetType === 'hero' ? 1000 : 900,
      blurDataUrl: createSvgBlurDataUrl(item.altText),
      sortOrder: item.sortOrder,
      status: 'ready',
    })),
  ).returning();

  return inserted;
}

async function fetchAndPersistFallbackHero(destination: DestinationRow) {
  const providerImage = await discoverProviderImage(destination);
  if (providerImage == null) return null;

  try {
    const uploaded = await mirrorRemoteImageToStorage(providerImage.url, destination);
    const [saved] = await db.insert(destinationImageAssets).values({
      destinationId: destination.id,
      assetType: 'hero',
      sourceProvider: providerImage.provider,
      sourceUrl: providerImage.url,
      storagePath: uploaded.storagePath,
      publicUrl: uploaded.publicUrl,
      altText: providerImage.altText,
      width: uploaded.width,
      height: uploaded.height,
      blurDataUrl: uploaded.blurDataUrl,
      creditName: providerImage.creditName,
      creditUrl: providerImage.creditUrl,
      license: providerImage.license,
      sortOrder: 0,
      status: 'ready',
    }).returning();

    return saved ?? null;
  } catch (error) {
    logger.warn({ error, destination: destination.slug }, 'Destination image fallback mirror failed');
    return null;
  }
}

async function discoverProviderImage(destination: DestinationRow) {
  const query = `${destination.name} ${destination.country} travel destination`;

  const providers = [
    () => fetchUnsplashImage(query, destination.name),
    () => fetchPexelsImage(query, destination.name),
    () => fetchPixabayImage(query, destination.name),
  ];

  for (const provider of providers) {
    try {
      const result = await provider();
      if (result != null) return result;
    } catch (error) {
      logger.warn({ error, destination: destination.slug }, 'Destination image provider failed');
    }
  }

  return null;
}

async function fetchUnsplashImage(query: string, altText: string) {
  if (env.UNSPLASH_ACCESS_KEY.length === 0) return null;
  const response = await axios.get('https://api.unsplash.com/search/photos', {
    params: { query, per_page: 1, orientation: 'landscape' },
    headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` },
    timeout: 20000,
  });

  const item = response.data?.results?.[0];
  if (item == null || typeof item.urls?.regular !== 'string') return null;
  return {
    provider: 'unsplash',
    url: item.urls.regular as string,
    altText,
    creditName: typeof item.user?.name === 'string' ? item.user.name : null,
    creditUrl: typeof item.user?.links?.html === 'string' ? item.user.links.html : null,
    license: 'unsplash',
  };
}

async function fetchPexelsImage(query: string, altText: string) {
  if (env.PEXELS_API_KEY.length === 0) return null;
  const response = await axios.get('https://api.pexels.com/v1/search', {
    params: { query, per_page: 1, orientation: 'landscape' },
    headers: { Authorization: env.PEXELS_API_KEY },
    timeout: 20000,
  });

  const item = response.data?.photos?.[0];
  if (item == null || typeof item.src?.large2x !== 'string') return null;
  return {
    provider: 'pexels',
    url: item.src.large2x as string,
    altText,
    creditName: typeof item.photographer === 'string' ? item.photographer : null,
    creditUrl: typeof item.url === 'string' ? item.url : null,
    license: 'pexels',
  };
}

async function fetchPixabayImage(query: string, altText: string) {
  if (env.PIXABAY_API_KEY.length === 0) return null;
  const response = await axios.get('https://pixabay.com/api/', {
    params: { key: env.PIXABAY_API_KEY, q: query, image_type: 'photo', per_page: 3 },
    timeout: 20000,
  });

  const item = response.data?.hits?.[0];
  if (item == null || typeof item.largeImageURL !== 'string') return null;
  return {
    provider: 'pixabay',
    url: item.largeImageURL as string,
    altText,
    creditName: typeof item.user === 'string' ? item.user : null,
    creditUrl: null,
    license: 'pixabay',
  };
}

async function mirrorRemoteImageToStorage(url: string, destination: DestinationRow) {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  const originalBuffer = Buffer.from(response.data);
  const image = sharp(originalBuffer);
  const metadata = await image.metadata();
  const heroBuffer = await image.resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer();
  const blurBuffer = await sharp(heroBuffer).resize({ width: 32 }).blur().jpeg({ quality: 40 }).toBuffer();
  const blurDataUrl = `data:image/jpeg;base64,${blurBuffer.toString('base64')}`;

  const extension = metadata.format === 'png' ? 'png' : 'jpg';
  const storagePath = `destinations/${destination.slug}/hero.${extension}`;
  const uploadUrl = `${env.SUPABASE_URL}/storage/v1/object/${env.STORAGE_BUCKET_DESTINATIONS}/${storagePath}`;

  await axios.post(uploadUrl, heroBuffer, {
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': extension === 'png' ? 'image/png' : 'image/jpeg',
      'x-upsert': 'true',
    },
    timeout: 30000,
  });

  return {
    storagePath,
    publicUrl: `${env.SUPABASE_URL}/storage/v1/object/public/${env.STORAGE_BUCKET_DESTINATIONS}/${storagePath}`,
    width: metadata.width ?? 1600,
    height: metadata.height ?? 1000,
    blurDataUrl,
  };
}

function mapAssetRows(rows: DestinationImageAssetRow[], destinationName: string, fallbackHeroUrl: string) {
  const heroRow = rows.find((row) => row.assetType === 'hero') ?? null;
  const galleryRows = rows.filter((row) => row.assetType !== 'hero');

  return {
    hero: heroRow != null
      ? toImageAsset(heroRow, destinationName, fallbackHeroUrl)
      : {
        url: fallbackHeroUrl,
        alt: destinationName,
        width: 1600,
        height: 1000,
        blurHash: createSvgBlurDataUrl(destinationName),
      },
    images: galleryRows.map((row) => toImageAsset(row, destinationName, fallbackHeroUrl)),
    galleryUrls: galleryRows.map((row) => row.publicUrl),
  };
}

function toImageAsset(row: DestinationImageAssetRow, destinationName: string, fallbackHeroUrl: string) {
  return {
    url: row.publicUrl || fallbackHeroUrl,
    alt: row.altText || destinationName,
    width: row.width ?? 1400,
    height: row.height ?? 900,
    blurHash: row.blurDataUrl ?? createSvgBlurDataUrl(row.altText || destinationName),
  };
}

function createSvgBlurDataUrl(label: string) {
  const initial = label.trim().charAt(0).toUpperCase() || 'T';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="64" viewBox="0 0 96 64">
      <rect width="96" height="64" fill="#E8E0D0" />
      <circle cx="70" cy="18" r="16" fill="rgba(201,150,58,0.20)" />
      <circle cx="18" cy="54" r="18" fill="rgba(45,90,79,0.10)" />
      <text x="50%" y="54%" text-anchor="middle" fill="#1A1208" font-size="22" font-family="Georgia, serif">${initial}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
