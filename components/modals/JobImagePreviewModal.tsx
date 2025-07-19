import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { UploadedFile } from '../../types';
import PhotoIcon from '../icons/PhotoIcon';

interface JobImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobName: string;
  photosBefore: UploadedFile[];
  photosDuring: UploadedFile[];
  photosAfter: UploadedFile[];
}

type ImageCategory = 'Antes' | 'Durante' | 'Después';

const JobImagePreviewModal: React.FC<JobImagePreviewModalProps> = ({
  isOpen,
  onClose,
  jobName,
  photosBefore,
  photosDuring,
  photosAfter,
}) => {
  const [activeCategory, setActiveCategory] = useState<ImageCategory>('Antes');

  const categories: { name: ImageCategory; photos: UploadedFile[] }[] = [
    { name: 'Antes', photos: photosBefore },
    { name: 'Durante', photos: photosDuring },
    { name: 'Después', photos: photosAfter },
  ];

  const currentPhotos = categories.find(cat => cat.name === activeCategory)?.photos || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Imágenes de: ${jobName}`} size="xl">
      <div className="flex flex-col h-full">
        <div className="flex space-x-2 border-b border-[var(--color-border)] pb-3 mb-4">
          {categories.map(cat => (
            <Button
              key={cat.name}
              variant={activeCategory === cat.name ? 'primary' : 'secondary'}
              onClick={() => setActiveCategory(cat.name)}
              size="sm"
            >
              {cat.name} ({cat.photos.length})
            </Button>
          ))}
        </div>

        {currentPhotos.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-[var(--color-text-secondary)] py-10">
            <PhotoIcon className="w-16 h-16 mb-4 text-[var(--color-surface-3)]"/>
            <p>No hay imágenes en la categoría "{activeCategory}".</p>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto styled-scrollbar-image-preview pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentPhotos.filter(p => p.type === 'photo').map(photo => (
                <div key={photo.id} className="aspect-square bg-[var(--color-surface-2)] rounded-lg overflow-hidden group relative">
                  <img
                    src={photo.urlOrBase64}
                    alt={photo.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                   <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1.5 text-center">
                    <p className="text-xs text-white truncate" title={photo.name}>{photo.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
         <div className="pt-4 mt-auto border-t border-[var(--color-border)]">
            <Button onClick={onClose} fullWidth variant="outline">Cerrar Visor</Button>
        </div>
      </div>
    </Modal>
  );
};

export default JobImagePreviewModal;