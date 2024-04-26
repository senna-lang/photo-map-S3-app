import { create } from 'zustand';
import { LngLat } from '../types/types';

type State = {
  coordinate: LngLat;
  showPinnedMarker: boolean;
};

type Action = {
  updateCoordinate: (coordinate: State['coordinate']) => void;
  updateShowPinnedMarker: (showPinnedMarker: State['showPinnedMarker']) => void;
};

export const useStore = create<Action & State>(set => ({
  coordinate: {
    lng: null,
    lat: null,
  },
  showPinnedMarker: false,
  updateCoordinate: newCoordinate => set(() => ({ coordinate: newCoordinate })),
  updateShowPinnedMarker: newShowPinnedMarker =>
    set(() => ({ showPinnedMarker: newShowPinnedMarker })),
}));
