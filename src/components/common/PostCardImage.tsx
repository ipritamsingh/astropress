import React, { useState, useEffect } from 'react';
import { getPersistedMediaBlob } from '../../data/mediaStorage';

interface PostCardImageProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallbackCategory?: string;
  fallbackIcon?: React.ReactNode;
}

export const PostCardImage: React.FC<PostCardImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover object-center',
  loading = 'lazy',
  fallbackCategory,
  fallbackIcon,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || '');

  useEffect(() => {
    setImgSrc(src || '');
    if (src) {
      if (
        src.startsWith('/uploads/') ||
        src.startsWith('uploads/') ||
        src.startsWith('/public/uploads/') ||
        src.startsWith('public/uploads/') ||
        !src.startsWith('http')
      ) {
        getPersistedMediaBlob(src)
          .then((blob) => {
            if (blob) setImgSrc(blob);
          })
          .catch(() => {});
      }
    }
  }, [src]);

  if (!src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 p-4 text-center">
        {fallbackIcon}
        <span className="text-[11px] font-bold text-slate-500">{fallbackCategory || 'Article'}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc || src}
      alt={alt}
      className={className}
      loading={loading}
      onError={async () => {
        if (src) {
          const fallback = await getPersistedMediaBlob(src);
          if (fallback) setImgSrc(fallback);
        }
      }}
    />
  );
};
