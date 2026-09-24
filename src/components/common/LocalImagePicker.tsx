import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, CloudUpload } from 'lucide-react';
import { StorageBucketService } from '../../services/StorageBucketService';

interface LocalImagePickerProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  label?: string;
  className?: string;
  bucket?: 'media' | 'avatars';
}

export const LocalImagePicker: React.FC<LocalImagePickerProps> = ({
  value,
  onChange,
  label = 'Browse local images',
  className = '',
  bucket = 'media'
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    setIsUploading(true);
    try {
      // 1. Attempt upload to Supabase storage bucket
      const bucketUrl = await StorageBucketService.uploadFileToMediaBucket(file, bucket);
      if (bucketUrl) {
        onChange(bucketUrl);
        setIsUploading(false);
        event.target.value = '';
        return;
      }
    } catch (e) {
      console.warn('Storage bucket upload fallback:', e);
    }

    // 2. Fallback to local DataURL if offline or bucket unavailable
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => setIsUploading(false);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleSelect} className="hidden" />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[11px] font-semibold transition-colors disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
        ) : (
          <ImagePlus className="w-3.5 h-3.5 text-primary" />
        )}
        <span>{isUploading ? 'Uploading...' : label}</span>
      </button>
      {value && !isUploading && (
        <span className="ml-2 text-[10px] text-emerald-400 font-medium inline-flex items-center gap-1">
          <CloudUpload className="w-3 h-3" />
          {value.startsWith('http') ? 'Cloud saved' : 'Image ready'}
        </span>
      )}
    </div>
  );
};
