export const CDN_IMAGES = {
  // Hero & backgrounds
  hero: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&q=80',
  heroMobile: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',

  // Destinations
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80',
  rajasthan: 'https://images.unsplash.com/photo-1477587458883-47145ed68763?w=800&q=80',
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
  himachal: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
  mumbai: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=800&q=80',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
  varanasi: 'https://images.unsplash.com/photo-1561361058-c24e017f3a3d?w=800&q=80',
  andaman: 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=800&q=80',

  // Activity thumbnails
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75',
  mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=75',
  temple: 'https://images.unsplash.com/photo-1568895914-ba84a800bea4?w=400&q=75',
  food: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=75',
  adventure: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=75',
  culture: 'https://images.unsplash.com/photo-1599030399571-b83f0f452817?w=400&q=75',
  wildlife: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&q=75',
  wellness: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=75',

  // Airline logos (placeholder)
  airIndia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Air_India_Logo.svg/200px-Air_India_Logo.svg.png',
  indigo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/IndiGo_Airlines_logo.svg/200px-IndiGo_Airlines_logo.svg.png',
  spicejet: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/SpiceJet_Logo.svg/200px-SpiceJet_Logo.svg.png',
  vistara: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Vistara_logo.svg/200px-Vistara_logo.svg.png',

  // Fallbacks
  placeholder: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
  avatarPlaceholder: 'https://ui-avatars.com/api/?name=User&background=FF6B35&color=fff&size=256',
} as const;

export type CdnImageKey = keyof typeof CDN_IMAGES;

export function getDestinationImage(slug: string): string {
  const map: Record<string, string> = {
    goa: CDN_IMAGES.goa,
    rajasthan: CDN_IMAGES.rajasthan,
    kerala: CDN_IMAGES.kerala,
    himachal: CDN_IMAGES.himachal,
    'himachal-pradesh': CDN_IMAGES.himachal,
    mumbai: CDN_IMAGES.mumbai,
    delhi: CDN_IMAGES.delhi,
    varanasi: CDN_IMAGES.varanasi,
    andaman: CDN_IMAGES.andaman,
    'andaman-nicobar': CDN_IMAGES.andaman,
  };
  return map[slug.toLowerCase()] ?? CDN_IMAGES.placeholder;
}

export function getActivityImage(category: string): string {
  const map: Record<string, string> = {
    beach: CDN_IMAGES.beach,
    mountain: CDN_IMAGES.mountain,
    trekking: CDN_IMAGES.mountain,
    temple: CDN_IMAGES.temple,
    spiritual: CDN_IMAGES.temple,
    food: CDN_IMAGES.food,
    culinary: CDN_IMAGES.food,
    adventure: CDN_IMAGES.adventure,
    culture: CDN_IMAGES.culture,
    heritage: CDN_IMAGES.culture,
    wildlife: CDN_IMAGES.wildlife,
    nature: CDN_IMAGES.wildlife,
    wellness: CDN_IMAGES.wellness,
    yoga: CDN_IMAGES.wellness,
  };
  return map[category.toLowerCase()] ?? CDN_IMAGES.placeholder;
}
