import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  Image as ImageIcon, 
  Camera, 
  Link as LinkIcon, 
  Trash2, 
  Sparkles,
  CheckCircle2,
  Loader2,
  CloudUpload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageBucketService } from '../../services/StorageBucketService';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  currentImage?: string;
  title?: string;
  subtitle?: string;
  allowGalleryPresets?: boolean;
}

export const MINISTRY_GALLERY_PRESETS = [
  {
    id: 'preach',
    url: '/assets/apostle_joe_daniels_preach.jpg',
    label: 'Preaching Altar',
    category: 'Sunday Ministry & Prophetic Altar'
  },
  {
    id: 'grad',
    url: '/assets/apostle_joe_daniels_grad.jpg',
    label: 'Academic Gown',
    category: 'Leadership & Academic Consecration'
  },
  {
    id: 'podcast',
    url: '/assets/apostle_joe_daniels_podcast.jpg',
    label: 'Studio Podcast',
    category: 'Broadcast & Studio Teachings'
  },
  {
    id: 'main',
    url: '/assets/apostle_joe_daniels_main.jpg',
    label: 'Main Portrait',
    category: 'Official Ministry Cover'
  }
];

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  currentImage,
  title = 'Change / Update Photo',
  subtitle = 'Upload a photo from your local device storage or pick an authentic photo from the ministry gallery.',
  allowGalleryPresets = true
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');
  const [selectedImage, setSelectedImage] = useState<string>(currentImage || '/assets/apostle_joe_daniels_main.jpg');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file (JPEG, PNG, WebP).');
        setTimeout(() => setUploadError(null), 3000);
        return;
      }
      setFileName(file.name);
      setIsUploading(true);
      setUploadError(null);

      // 1. Upload to Supabase 'avatars' storage bucket
      try {
        const bucketUrl = await StorageBucketService.uploadFileToMediaBucket(file, 'avatars');
        if (bucketUrl) {
          setSelectedImage(bucketUrl);
          setIsUploading(false);
          try {
            const recent = JSON.parse(localStorage.getItem('gcz_recent_local_uploads') || '[]');
            const updated = [bucketUrl, ...recent.filter((u: string) => u !== bucketUrl)].slice(0, 6);
            localStorage.setItem('gcz_recent_local_uploads', JSON.stringify(updated));
          } catch {}
          return;
        }
      } catch (err) {
        console.warn('Storage bucket avatar upload notice:', err);
      }

      // 2. Fallback to local canvas compression
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const rawUrl = event.target.result as string;
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 320;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setSelectedImage(compressed);
            setIsUploading(false);

            try {
              const recent = JSON.parse(localStorage.getItem('gcz_recent_local_uploads') || '[]');
              const updated = [compressed, ...recent.filter((u: string) => u !== compressed)].slice(0, 6);
              localStorage.setItem('gcz_recent_local_uploads', JSON.stringify(updated));
            } catch {}
          };
          img.onerror = () => {
            setSelectedImage(rawUrl);
            setIsUploading(false);
          };
          img.src = rawUrl;
        }
      };
      reader.onerror = () => setIsUploading(false);
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (!selectedImage) return;
    onSelectImage(selectedImage);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.6 }
    });
    onClose();
  };

  const handleRemove = () => {
    onSelectImage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-church font-bold text-foreground text-base leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-primary">
                Photo Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {subtitle}
          </p>

          {/* Live Preview Box */}
          <div className="bg-secondary/30 rounded-2xl border border-border p-3 flex flex-col items-center justify-center">
            <div className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <span>Live Image Preview</span>
              {selectedImage && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
            </div>
            
            <div className="relative w-full max-h-56 sm:max-h-64 rounded-xl overflow-hidden bg-background flex items-center justify-center border border-border shadow-inner">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-full max-h-64 object-contain"
                />
              ) : (
                <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="w-10 h-10" />
                  <span className="text-xs">No image selected</span>
                </div>
              )}
            </div>

            {fileName && (
              <p className="text-[10px] text-emerald-500 font-mono mt-1.5 truncate max-w-xs">
                Selected from device: {fileName}
              </p>
            )}
          </div>

          {/* Source Tabs */}
          <div className="flex rounded-xl bg-secondary p-1 border border-border gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'upload'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera & Device Photos</span>
            </button>
            {allowGalleryPresets && (
              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ministry Gallery</span>
              </button>
            )}
          </div>

          {/* TAB 1: Ministry Photo Gallery (Pick & Tick) */}
          {activeTab === 'gallery' && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                Tick Any Photo To Select
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {MINISTRY_GALLERY_PRESETS.map((item) => {
                  const isChecked = selectedImage === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedImage(item.url);
                        setFileName(null);
                      }}
                      className={`relative group rounded-xl overflow-hidden border text-left p-1.5 transition-all bg-secondary/30 flex flex-col gap-1.5 ${
                        isChecked
                          ? 'border-primary shadow-sm bg-primary/10'
                          : 'border-border hover:border-foreground/20'
                      }`}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-background">
                        <img
                          src={item.url}
                          alt={item.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isChecked && (
                          <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="px-1">
                        <p className="text-xs font-semibold text-foreground leading-none truncate">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {item.category}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Upload from Device Local Storage */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {uploadError && (
                <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium text-center">
                  {uploadError}
                </div>
              )}
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed ${isUploading ? 'border-primary/20 opacity-70' : 'border-primary/40 hover:border-primary cursor-pointer'} rounded-2xl p-6 text-center bg-secondary/30 hover:bg-secondary/50 transition-all flex flex-col items-center justify-center gap-2 group`}
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-all shadow-xs">
                  {isUploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Camera className="w-7 h-7" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isUploading ? 'Uploading to Cloud Bucket...' : 'Choose Photo from Device / Camera'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isUploading ? 'Compressing & uploading to database bucket' : 'Supports JPG, PNG, WebP, GIF from mobile gallery or PC'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs mt-2 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading ? <CloudUpload className="w-3.5 h-3.5 animate-pulse" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  <span>{isUploading ? 'Uploading...' : 'Browse Photos'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-border bg-secondary/40 flex items-center justify-between gap-2">
          {selectedImage && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold flex items-center gap-1.5 border border-destructive/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider shadow-xs hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Image</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
