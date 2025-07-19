import { useState } from 'react';
import { Popup, Marker } from 'react-map-gl';
import { Album, useAlbumStore } from '../stores/album-store';
import { useAuthStore } from '../stores/auth-store';
import { Camera, Trash2, User, Calendar } from 'lucide-react';

interface AlbumMarkerProps {
  album: Album;
}

export default function AlbumMarker({ album }: AlbumMarkerProps) {
  const [showPopup, setShowPopup] = useState(false);
  const { deleteAlbum } = useAlbumStore();
  const { user, isAuthenticated } = useAuthStore();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this album?')) {
      try {
        await deleteAlbum(album.id);
        setShowPopup(false);
      } catch (error) {
        console.error('Failed to delete album:', error);
      }
    }
  };

  const canDelete = isAuthenticated && user?.id === album.userId;

  return (
    <>
      <Marker
        longitude={album.coordinate.lng}
        latitude={album.coordinate.lat}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          setShowPopup(true);
        }}
      >
        <div className="cursor-pointer">
          <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </div>
      </Marker>

      {showPopup && (
        <Popup
          longitude={album.coordinate.lng}
          latitude={album.coordinate.lat}
          anchor="top"
          offset={10}
          onClose={() => setShowPopup(false)}
          closeButton={false}
          className="min-w-0"
        >
          <div className="p-4 max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(album.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {album.imageUrls.slice(0, 4).map((imageUrl, index) => (
                <div 
                  key={index} 
                  className="aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  <img
                    src={imageUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                </div>
              ))}
            </div>

            {/* Show count if more than 4 images */}
            {album.imageUrls.length > 4 && (
              <p className="text-sm text-gray-500 mb-3">
                +{album.imageUrls.length - 4} more photos
              </p>
            )}

            {/* Coordinates */}
            <div className="text-xs text-gray-500 mb-3">
              <p>
                📍 {album.coordinate.lat.toFixed(6)}, {album.coordinate.lng.toFixed(6)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span>Album</span>
              </div>

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}