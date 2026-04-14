import { useMemo, useState } from 'react';

interface PremiumImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: 'eager' | 'lazy';
  blurDataURL?: string;
  fallbackLabel?: string;
  onClick?: () => void;
}

function createFallbackDataUrl(label: string) {
  const initial = label.trim().charAt(0).toUpperCase() || 'T';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E8E0D0" />
          <stop offset="100%" stop-color="#FAF8F4" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#g)" />
      <circle cx="960" cy="180" r="160" fill="rgba(201,150,58,0.20)" />
      <circle cx="210" cy="620" r="190" fill="rgba(45,90,79,0.10)" />
      <text x="50%" y="52%" text-anchor="middle" fill="#1A1208" font-size="220" font-family="Georgia, serif">${initial}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function PremiumImage({
  src,
  alt,
  className,
  width,
  height,
  sizes,
  loading = 'lazy',
  blurDataURL,
  fallbackLabel,
  onClick,
}: PremiumImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const fallbackSrc = useMemo(
    () => createFallbackDataUrl(fallbackLabel ?? alt),
    [alt, fallbackLabel],
  );

  const resolvedSrc = failed
    ? fallbackSrc
    : (src != null && src.length > 0 ? src : fallbackSrc);

  return (
    <div
      className={`relative overflow-hidden bg-[#E8E0D0] ${className ?? ''}`}
      onClick={onClick}
    >
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: loaded ? 0 : 1,
          backgroundImage: `url("${blurDataURL ?? fallbackSrc}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(16px)',
          transform: 'scale(1.06)',
        }}
      />
      <img
        src={resolvedSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={loading}
        className="h-full w-full object-cover transition duration-700"
        style={{ opacity: loaded ? 1 : 0.01, transform: loaded ? 'scale(1)' : 'scale(1.03)' }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
      />
    </div>
  );
}
