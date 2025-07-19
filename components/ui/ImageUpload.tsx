
import React, { useState, ChangeEvent, useRef } from 'react';
import PhotoIcon from '../icons/PhotoIcon';
import Button from './Button';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';

interface ImageUploadProps {
  onImageSelected: (base64Image: string | null) => void;
  currentImageUrl?: string | null;
  label?: string;
  id?: string;
  shape?: 'circle' | 'square';
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageSelected, 
  currentImageUrl, 
  label = "Seleccionar Imagen", 
  id = "image-upload",
  shape = 'circle'
}) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onImageSelected(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onImageSelected(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const shapeClasses = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const dimensionClasses = shape === 'circle' ? 'w-32 h-32' : 'w-40 h-40';


  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-1.5">{label}</label>}
      <div className="mt-2 flex flex-col items-center space-y-3">
        <div 
          className={`${dimensionClasses} ${shapeClasses} overflow-hidden bg-[var(--color-secondary-bg)] flex items-center justify-center border-2 border-dashed border-[var(--color-border)] group relative cursor-pointer hover:border-[var(--color-accent)] transition-colors`}
          onClick={triggerFileInput}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileInput();}}
          aria-label={preview ? "Cambiar imagen" : "Subir imagen"}
        >
          {preview ? (
            <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
          ) : (
            <PhotoIcon className="w-1/2 h-1/2 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
          )}
           <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PencilIcon className="w-8 h-8 text-white"/>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <Button type="button" variant="secondary" shape="rounded" size="sm" onClick={triggerFileInput}>
                {preview ? "Cambiar" : "Subir Imagen"}
            </Button>
            {preview && (
            <Button type="button" variant="danger" shape="rounded" size="sm" onClick={handleRemoveImage} leftIcon={<TrashIcon className="w-4 h-4"/>}>
                Eliminar
            </Button>
            )}
        </div>
        <input 
            id={id} 
            name={id} 
            type="file" 
            className="sr-only" 
            accept="image/png, image/jpeg, image/gif, image/webp" 
            onChange={handleFileChange} 
            ref={fileInputRef}
        />
      </div>
    </div>
  );
};

export default ImageUpload;
