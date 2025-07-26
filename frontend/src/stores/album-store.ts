import { create } from 'zustand';
import { api } from '../services/api-client';

export interface Album {
  id: string;
  coordinate: {
    lng: number;
    lat: number;
  };
  imageUrls: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface AlbumState {
  albums: Album[];
  selectedCoordinate: { lng: number; lat: number } | null;
  showPinnedMarker: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AlbumActions {
  fetchAlbums: () => Promise<void>;
  createAlbum: (data: {
    coordinate: { lng: number; lat: number };
    imageUrls: string[];
  }) => Promise<Album>;
  deleteAlbum: (id: string) => Promise<void>;
  setSelectedCoordinate: (
    coordinate: { lng: number; lat: number } | null
  ) => void;
  setShowPinnedMarker: (show: boolean) => void;
  clearError: () => void;
}

export const useAlbumStore = create<AlbumState & AlbumActions>((set) => ({
  albums: [],
  selectedCoordinate: null,
  showPinnedMarker: false,
  isLoading: false,
  error: null,

  fetchAlbums: async () => {
    set({ isLoading: true, error: null });

    try {
      const albums = await api.albums.getAll();
      set({
        albums,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch albums',
      });
    }
  },

  createAlbum: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const newAlbum = await api.albums.create(data);
      set((state) => ({
        albums: [...state.albums, newAlbum],
        isLoading: false,
        error: null,
        selectedCoordinate: null,
        showPinnedMarker: false,
      }));
      return newAlbum;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to create album',
      });
      throw error;
    }
  },

  deleteAlbum: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await api.albums.delete(id);
      set((state) => ({
        albums: state.albums.filter((album) => album.id !== id),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete album',
      });
      throw error;
    }
  },

  setSelectedCoordinate: (coordinate) => {
    set({ selectedCoordinate: coordinate });
  },

  setShowPinnedMarker: (show) => {
    set({ showPinnedMarker: show });
  },

  clearError: () => {
    set({ error: null });
  },
}));
