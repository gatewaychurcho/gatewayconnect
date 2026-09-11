import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';

interface LocalImagePickerProps {
  value?: string;
  onChange: (imageDataUrl: string) => void;
  label?: string;
  className?: string;
}

export const LocalImagePicker: React.FC<LocalImagePickerProps> = ({
  value,
  onChange,
  label = 'Browse local images',
  className = ''
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleSelect} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] font-semibold transition-colors"
      >
        <ImagePlus className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>{label}</span>
      </button>
      {value?.startsWith('data:image/') && (
        <span className="ml-2 text-[10px] text-emerald-300">Local image selected</span>
      )}
    </div>
  );
};
