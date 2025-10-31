import React from 'react';
import { ImageData } from '../types';

interface ImageGridProps {
  images: ImageData[];
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images }) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="font-semibold text-slate-100">Uploaded Images</h3>
      <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {images.map((img, i) => (
          <div key={i} className="aspect-square bg-slate-700 rounded-md overflow-hidden">
            <img src={img.data} alt={img.name} title={img.name} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};
