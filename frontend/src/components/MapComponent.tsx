import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Marker } from 'react-map-gl';
import { useAlbumStore, Album } from '../stores/album-store';
import { useAuthStore } from '../stores/auth-store';
import AlbumMarker from './AlbumMarker';
import { Loader2 } from 'lucide-react';

interface MapComponentProps {
  albums: Album[];
  isLoading: boolean;
}

export default function MapComponent({ albums, isLoading }: MapComponentProps) {
  const { 
    selectedCoordinate, 
    showPinnedMarker, 
    setSelectedCoordinate, 
    setShowPinnedMarker 
  } = useAlbumStore();
  const { isAuthenticated } = useAuthStore();

  const handleMapClick = (event: any) => {
    const { lng, lat } = event.lngLat;
    setSelectedCoordinate({ lng, lat });
    setShowPinnedMarker(true);
  };

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-2">Mapbox access token is required</p>
          <p className="text-sm text-gray-600">
            Please set VITE_MAPBOX_ACCESS_TOKEN in your environment variables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        id="photo-map"
        initialViewState={{
          longitude: 137.760725,
          latitude: 38.152981,
          zoom: 5,
        }}
        style={{ width: '100%', height: '100%' }}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        interactiveLayerIds={[]} // Prevent default popup behavior
      >
        {/* Render album markers */}
        {albums.map((album) => (
          <AlbumMarker key={album.id} album={album} />
        ))}

        {/* Render selected coordinate marker (only if authenticated) */}
        {isAuthenticated && showPinnedMarker && selectedCoordinate && (
          <Marker
            longitude={selectedCoordinate.lng}
            latitude={selectedCoordinate.lat}
            anchor="bottom"
          >
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md animate-pulse" />
          </Marker>
        )}
      </Map>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-700">Loading albums...</span>
          </div>
        </div>
      )}

      {/* Map controls info */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs text-gray-600 max-w-xs">
        <p className="font-medium mb-1">Map Controls:</p>
        <ul className="space-y-1">
          <li>• Drag to pan</li>
          <li>• Scroll to zoom</li>
          <li>• Click to select location</li>
        </ul>
      </div>
    </div>
  );
}