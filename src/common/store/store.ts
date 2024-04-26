import { create } from 'zustand';
import { LngLat } from '../types/types';

type State = {
  coordinate: LngLat
};

type Action = {
  updateCoordinate: (coordinate: State['coordinate']) => void;
};

export const useStore = create<Action & State>(set => ({
  coordinate: {
    lng: null,
    lat: null,
  },
  updateCoordinate: newCoordinate => set(() => ({ coordinate: newCoordinate })),
}));
