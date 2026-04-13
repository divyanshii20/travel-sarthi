import { create } from 'zustand';
import type { TravelClass, TripType, ComfortLevel, TravelerCount } from 'travel-sarthi-shared-types';

export type SearchMode = 'A' | 'B';

interface ModeASearch {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  travelClass: TravelClass;
  tripType: TripType;
  travelers: TravelerCount;
}

interface ModeBSearch {
  origin: string;
  budget: number;
  currency: string;
  durationDays: number;
  comfortLevel: ComfortLevel;
  travelMood: string;
  travelers: TravelerCount;
}

interface SearchState {
  mode: SearchMode;
  modeA: ModeASearch;
  modeB: ModeBSearch;

  setMode: (mode: SearchMode) => void;
  setModeA: (fields: Partial<ModeASearch>) => void;
  setModeB: (fields: Partial<ModeBSearch>) => void;
  resetSearch: () => void;
}

const defaultModeA: ModeASearch = {
  origin: '',
  destination: '',
  departDate: '',
  returnDate: '',
  travelClass: 'economy',
  tripType: 'round_trip',
  travelers: { adults: 1, children: 0, infants: 0 },
};

const defaultModeB: ModeBSearch = {
  origin: '',
  budget: 30000,
  currency: 'INR',
  durationDays: 5,
  comfortLevel: 'comfort',
  travelMood: '',
  travelers: { adults: 1, children: 0, infants: 0 },
};

export const useSearchStore = create<SearchState>()((set) => ({
  mode: 'A',
  modeA: defaultModeA,
  modeB: defaultModeB,

  setMode: (mode) => set({ mode }),

  setModeA: (fields) =>
    set((state) => ({ modeA: { ...state.modeA, ...fields } })),

  setModeB: (fields) =>
    set((state) => ({ modeB: { ...state.modeB, ...fields } })),

  resetSearch: () =>
    set({ modeA: defaultModeA, modeB: defaultModeB }),
}));
