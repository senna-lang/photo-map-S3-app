import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAlbumStore } from '../stores/album-store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Upload, MapPin, Loader2 } from 'lucide-react';

const albumFormSchema = z.object({
  files: z.instanceof(FileList).refine(
    (files) => files.length > 0 && files.length <= 10,
    'Please select 1-10 images'
  ),
});

type AlbumFormData = z.infer<typeof albumFormSchema>;

interface AlbumFormProps {
  coordinate: { lng: number; lat: number };
}

export default function AlbumForm({ coordinate }: AlbumFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const { createAlbum, setSelectedCoordinate, setShowPinnedMarker } = useAlbumStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AlbumFormData>({
    resolver: zodResolver(albumFormSchema),
  });

  const watchedFiles = watch('files');

  const handleClose = () => {
    setSelectedCoordinate(null);
    setShowPinnedMarker(false);
    reset();
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    // Mock S3 upload - in real implementation, you'd upload to your S3 bucket
    // For demo purposes, we'll create a blob URL
    return new Promise((resolve) => {
      setTimeout(() => {
        const blobUrl = URL.createObjectURL(file);
        resolve(blobUrl);
      }, 1000);
    });
  };

  const onSubmit = async (data: AlbumFormData) => {
    if (!coordinate) return;

    setIsUploading(true);
    setUploadProgress('Uploading images...');

    try {
      const files = Array.from(data.files);
      const imageUrls: string[] = [];

      // Upload each file to S3
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading image ${i + 1} of ${files.length}...`);
        
        const imageUrl = await uploadToS3(file);
        imageUrls.push(imageUrl);
      }

      setUploadProgress('Creating album...');

      // Create album with uploaded image URLs
      await createAlbum({
        coordinate,
        imageUrls,
      });

      setUploadProgress('Album created successfully!');
      setTimeout(() => {
        handleClose();
        setIsUploading(false);
        setUploadProgress('');
      }, 1000);

    } catch (error) {
      console.error('Failed to create album:', error);
      setUploadProgress('Failed to create album');
      setIsUploading(false);
      
      setTimeout(() => {
        setUploadProgress('');
      }, 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Create Album</h3>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
          disabled={isUploading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Coordinate Display */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <MapPin className="w-4 h-4" />
          <span>
            {coordinate.lat.toFixed(6)}, {coordinate.lng.toFixed(6)}
          </span>
        </div>

        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Images (1-10)
          </label>
          <div className="relative">
            <Input
              type="file"
              multiple
              accept="image/*"
              {...register('files')}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isUploading}
            />
            <Upload className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
          </div>
          {errors.files && (
            <p className="text-red-600 text-sm mt-1">{errors.files.message}</p>
          )}
        </div>

        {/* File Preview */}
        {watchedFiles && watchedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Selected Images ({watchedFiles.length})
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {Array.from(watchedFiles).map((file, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  </span>
                  <span className="truncate">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {isUploading && uploadProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700">{uploadProgress}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isUploading || !watchedFiles || watchedFiles.length === 0}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Album'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}