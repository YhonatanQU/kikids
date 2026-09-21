import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

const COLLECTIONS = [
  { label: 'Colección Verano', to: '/catalogo?temporada=verano', emoji: '☀️', className: 'from-amber-100 to-orange-50' },
  { label: 'Colección Invierno', to: '/catalogo?temporada=invierno', emoji: '❄️', className: 'from-sky-100 to-blue-50' },
  { label: 'Niños', to: '/catalogo?genero=nino', emoji: '🧒', className: 'from-emerald-100 to-teal-50' },
  { label: 'Niñas', to: '/catalogo?genero=nina', emoji: '👧', className: 'from-pink-100 to-rose-50' },
];

export function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-ink-50 px-4 py-14 text-center md:py-20">
        <img src="/logo.png" alt="KIKIDS" className="mx-auto h-28 w-auto md:h-36" />
        <span className="mt-4 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-600 shadow-soft">
          Moda infantil en Perú
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-ink-900 md:text-5xl">
          Ropa cómoda y divertida para cada temporada
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ink-500 md:text-lg">
          Encuentra la talla perfecta para tus niños, con stock actualizado al instante.
        </p>
        <Link to="/catalogo" className="mt-7 inline-block">
          <Button size="lg">Ver catálogo</Button>
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h2 className="mb-5 text-lg font-bold text-ink-900">Explora por colección</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {COLLECTIONS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${c.className} px-4 py-8 text-center shadow-card transition-transform hover:-translate-y-0.5`}
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-sm font-bold text-ink-800">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
