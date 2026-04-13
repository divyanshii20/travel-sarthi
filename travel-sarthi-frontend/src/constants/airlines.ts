export const AIRLINE_NAMES: Record<string, string> = {
  '6E': 'IndiGo',
  SG: 'SpiceJet',
  AI: 'Air India',
  UK: 'Vistara',
  G8: 'Go First',
  IX: 'Air India Express',
  I5: 'Air Asia India',
  QP: 'Akasa Air',
  EK: 'Emirates',
  EY: 'Etihad',
  QR: 'Qatar Airways',
  SQ: 'Singapore Airlines',
  TK: 'Turkish Airlines',
  BA: 'British Airways',
  LH: 'Lufthansa',
  AF: 'Air France',
};

export const LCC_AIRLINES = new Set(['6E', 'SG', 'G8', 'IX', 'I5', 'QP']);

export function getAirlineName(iata: string): string {
  return AIRLINE_NAMES[iata.toUpperCase()] ?? iata;
}

export function isLCC(iata: string): boolean {
  return LCC_AIRLINES.has(iata.toUpperCase());
}
