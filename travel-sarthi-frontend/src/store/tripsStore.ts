import { create } from 'zustand';
import type { Trip, TripSummary } from 'travel-sarthi-shared-types';

interface TripsState {
  trips: TripSummary[];
  activeTrip: Trip | null;

  setTrips: (trips: TripSummary[]) => void;
  setActiveTrip: (trip: Trip | null) => void;
  updateTripInList: (id: string, partial: Partial<TripSummary>) => void;
  removeTripFromList: (id: string) => void;
}

export const useTripsStore = create<TripsState>()((set) => ({
  trips: [],
  activeTrip: null,

  setTrips: (trips) => set({ trips }),

  setActiveTrip: (trip) => set({ activeTrip: trip }),

  updateTripInList: (id, partial) =>
    set((state) => ({
      trips: state.trips.map((t) => (t.id === id ? { ...t, ...partial } : t)),
    })),

  removeTripFromList: (id) =>
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
    })),
}));
