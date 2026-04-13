import type { DestinationContinent } from 'travel-sarthi-shared-types';

export const POPULAR_DESTINATIONS = [
  { slug: 'goa', name: 'Goa', tagline: 'Sun, Sand & Seafood' },
  { slug: 'rajasthan', name: 'Rajasthan', tagline: 'Land of Kings' },
  { slug: 'kerala', name: 'Kerala', tagline: "God's Own Country" },
  { slug: 'himachal', name: 'Himachal Pradesh', tagline: 'Dev Bhoomi' },
  { slug: 'mumbai', name: 'Mumbai', tagline: 'City of Dreams' },
  { slug: 'delhi', name: 'Delhi', tagline: 'Heart of India' },
  { slug: 'varanasi', name: 'Varanasi', tagline: 'City of Moksha' },
  { slug: 'andaman', name: 'Andaman', tagline: 'Emerald Islands' },
] as const;

export const CONTINENT_OPTIONS: Array<{ label: string; value: DestinationContinent | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Asia', value: 'asia' },
  { label: 'Europe', value: 'europe' },
  { label: 'North America', value: 'north_america' },
  { label: 'South America', value: 'south_america' },
  { label: 'Africa', value: 'africa' },
  { label: 'Oceania', value: 'oceania' },
  { label: 'Middle East', value: 'middle_east' },
];
