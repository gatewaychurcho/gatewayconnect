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
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
    category: 'Leadership & Degree Milestone'
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
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'url'>(
    allowGalleryPresets ? 'gallery' : 'upload'
  );
  const [selectedImage, setSelectedImage] = useState<string>(currentImage || '/assets/apostle_joe_daniels_main.jpg');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resultUrl = event.target.result as string;
          setSelectedImage(resultUrl);
        }
      };
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
    <div className="fixed inset-0 z-50 bg-[#001122]/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-[#001F3F] border border-[#D4AF37]/50 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#001F3F] to-[#001122]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-church font-bold text-white text-base leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-[#D4AF37]/80">
                FB / Instagram-Style Photo Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-white/70 leading-relaxed">
            {subtitle}
          </p>

          {/* Live Preview Box */}
          <div className="bg-[#001122] rounded-2xl border border-white/10 p-3 flex flex-col items-center justify-center">
            <div className="text-[11px] font-bold text-white/60 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <span>Live Image Preview</span>
              {selectedImage && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
            </div>
            
            <div className="relative w-full max-h-56 sm:max-h-64 rounded-xl overflow-hidden bg-black/60 flex items-center justify-center border border-white/10 shadow-inner">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-full max-h-64 object-contain"
                />
              ) : (
                <div className="py-12 flex flex-col items-center gap-2 text-white/40">
                  <ImageIcon className="w-10 h-10" />
                  <span className="text-xs">No image selected</span>
                </div>
              )}
            </div>

            {fileName && (
              <p className="text-[10px] text-emerald-400 font-mono mt-1.5 truncate max-w-xs">
                Selected from device: {fileName}
              </p>
            )}
          </div>

          {/* Source Tabs */}
          <div className="flex rounded-xl bg-[#001122] p-1 border border-white/10 gap-1 text-xs font-semibold">
            {allowGalleryPresets && (
              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-[#D4AF37] text-[#001F3F] font-bold shadow'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apostle Photos</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'upload'
                  ? 'bg-[#D4AF37] text-[#001F3F] font-bold shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Device Storage</span>
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'url'
                  ? 'bg-[#D4AF37] text-[#001F3F] font-bold shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Web Link</span>
            </button>
          </div>

          {/* TAB 1: Ministry Photo Gallery (Pick & Tick) */}
          {activeTab === 'gallery' && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider block">
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
                      className={`relative group rounded-xl overflow-hidden border-2 text-left p-1.5 transition-all bg-[#001122] flex flex-col gap-1.5 ${
                        isChecked
                          ? 'border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 bg-[#D4AF37]/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40">
                        <img
                          src={item.url}
                          alt={item.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isChecked && (
                          <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#D4AF37] text-[#001F3F] flex items-center justify-center shadow-md">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="px-1">
                        <p className="text-xs font-bold text-white leading-none truncate">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">
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
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-2xl p-6 text-center cursor-pointer bg-[#001122]/60 hover:bg-[#001122] transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 group-hover:bg-[#D4AF37] text-[#D4AF37] group-hover:text-[#001F3F] flex items-center justify-center transition-all shadow-md">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Click to pick an image from local storage
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    Supports JPG, PNG, WebP, GIF from mobile gallery or PC
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#001F3F] font-bold text-xs mt-2 shadow"
                >
                  Browse Device Photos
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Custom Web Link */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Paste Direct Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://images.example.com/photo.jpg"
                    className="flex-1 bg-[#001122] border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customUrl.trim()) {
                        setSelectedImage(customUrl.trim());
                        setFileName(null);
                      }
                    }}
                    className="px-3 py-2 bg-[#D4AF37] text-[#001F3F] font-bold text-xs rounded-xl hover:brightness-110"
                  >
                    Load
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#001122] flex items-center justify-between gap-2">
          {selectedImage && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold flex items-center gap-1.5 border border-red-500/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#c49f2f] text-[#001F3F] text-xs font-black uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5"
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
