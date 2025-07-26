import { useEffect } from 'react';
import { useAlbumStore } from '../stores/album-store';
import MapComponent from '../components/MapComponent';
import AlbumForm from '../components/AlbumForm';
import { useAuthStore } from '../stores/auth-store';

export default function HomePage() {
  const { albums, fetchAlbums, selectedCoordinate, isLoading, error } =
    useAlbumStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchAlbums}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      <MapComponent albums={albums} isLoading={isLoading} />

      {/* Album creation form - only show if authenticated and coordinate selected */}
      {isAuthenticated && selectedCoordinate && (
        <div className="absolute top-4 right-4 z-10">
          <AlbumForm coordinate={selectedCoordinate} />
        </div>
      )}

      {/* Instructions overlay */}
      {!selectedCoordinate && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <h3 className="font-semibold text-gray-900 mb-2">How to use:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click on the map to select a location</li>
            {isAuthenticated ? (
              <li>• Add photos to create an album at that location</li>
            ) : (
              <li>• Sign in to create photo albums</li>
            )}
            <li>• Click on existing markers to view photos</li>
          </ul>
        </div>
      )}
    </div>
  );
}
