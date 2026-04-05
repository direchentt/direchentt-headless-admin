'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';
import { normalizeStoreImageUrl } from '@/lib/store-image-url';

type StoreImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** LCP / above the fold */
  priority?: boolean;
  sizes?: string;
  loading?: 'eager' | 'lazy';
} & (
  | { fill: true; width?: never; height?: never }
  | { fill?: false; width: number; height: number }
);

/**
 * Imagen optimizada (Next/Image) para CDNs de tienda.
 * Si la URL no es válida, no renderiza nada.
 */
export default function StoreImage(props: StoreImageProps) {
  const url = normalizeStoreImageUrl(props.src);
  if (!url) return null;

  const { alt, className, style, priority, sizes, loading } = props;

  if (props.fill) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        className={className}
        style={style}
        sizes={sizes ?? '100vw'}
        priority={priority}
        loading={loading ?? (priority ? 'eager' : 'lazy')}
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      width={props.width}
      height={props.height}
      className={className}
      style={style}
      sizes={sizes}
      priority={priority}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      decoding="async"
    />
  );
}
