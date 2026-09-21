import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '@/types/catalog';
import { formatPEN } from '@/lib/formatCurrency';
import { KIDS_SIZES } from '@/lib/sizes';

function sizeLabel(value: string): string {
  return KIDS_SIZES.find((s) => s.value === value)?.label ?? value;
}

type MediaItem = { type: 'image' | 'video'; url: string };

export function ProductCard({ product }: { product: Product }) {
  const totalStock = product.variants.reduce((sum, v) => sum + v.availableQuantity, 0);
  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const media: MediaItem[] = [
    ...product.images.map((img) => ({ type: 'image' as const, url: img.url })),
    ...(product.videoUrl ? [{ type: 'video' as const, url: product.videoUrl }] : []),
  ];
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = media[index];

  // Reproduce el video en cuanto el mouse está sobre la tarjeta y el
  // slide activo es el video; lo pausa y rebobina al salir.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || current?.type !== 'video') return;
    if (hovering) {
      el.play().catch(() => {}); // el navegador puede rechazar el autoplay; no es crítico
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [hovering, current]);

  // Los controles del slide van dentro de un <Link>: hay que frenar la
  // navegación al tocar flechas/puntos, para que solo cambien la foto.
  function goTo(i: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex(i);
  }
  function step(delta: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + media.length) % media.length);
  }

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div
        className="relative aspect-square w-full overflow-hidden bg-ink-100"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {current ? (
          current.type === 'video' ? (
            <div className="relative h-full w-full">
              <video ref={videoRef} src={current.url} muted loop playsInline className="h-full w-full object-cover" />
              <span
                className={`absolute inset-0 flex items-center justify-center bg-ink-900/20 transition-opacity duration-200 ${
                  hovering ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-ink-800">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </div>
          ) : (
            <img
              src={current.url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 16l5-5 4 4 5-6 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {media.length > 1 && (
          <>
            <button
              onClick={(e) => step(-1, e)}
              aria-label="Anterior"
              className="absolute inset-y-0 left-0 flex w-8 items-center justify-start pl-1 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-soft">
                <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5"><path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </button>
            <button
              onClick={(e) => step(1, e)}
              aria-label="Siguiente"
              className="absolute inset-y-0 right-0 flex w-8 items-center justify-end pr-1 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-soft">
                <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5"><path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {media.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => goTo(i, e)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}

        {product.isFeatured && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-soft">
            Destacado
          </span>
        )}
        {totalStock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <span className="rounded-full bg-ink-900/80 px-3 py-1 text-xs font-semibold text-white">Agotado</span>
          </div>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="truncate text-sm font-semibold text-ink-800 md:text-base">{product.name}</h3>
        <p className="mt-1 font-extrabold text-brand-600">{formatPEN(product.basePrice)}</p>
        {sizes.length > 0 && (
          <p className="mt-1 truncate text-xs text-ink-400">
            Talla{sizes.length > 1 ? 's' : ''}: {sizes.map(sizeLabel).join(', ')}
          </p>
        )}
      </div>
    </Link>
  );
}
