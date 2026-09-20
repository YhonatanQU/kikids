# KIKIDS

E-commerce y gestión comercial de ropa para niños (Perú). Catálogo público en tiempo real + panel de administración privado + cierre de venta semiautomatizado por WhatsApp.

## Stack

- **Frontend**: React (Vite) + TypeScript + Tailwind CSS — [`frontend/`](./frontend)
- **Backend**: Node.js + Express + TypeScript — [`backend/`](./backend)
- **Base de datos**: PostgreSQL vía Supabase (Auth, Realtime, Storage) — [`database/`](./database)
- **Arquitectura y flujo de venta**: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

## Estructura del repositorio

```
kikids/
├── database/
│   ├── schema.sql          # DDL completo: tablas, RPC, triggers, RLS, Realtime
│   └── README.md           # Cómo aplicar el esquema y decisiones de diseño
├── docs/
│   └── ARCHITECTURE.md     # Flujo de venta end-to-end y justificación técnica
├── frontend/                # App Vite+React+TS+Tailwind (cliente + admin)
└── backend/                  # API Express (PDFs, cron de reservas)
```

## Puesta en marcha rápida

1. Crear proyecto en Supabase y ejecutar `database/schema.sql`.
2. `frontend/`: `npm install`, copiar `.env.example` a `.env` con las credenciales públicas de Supabase, `npm run dev`.
3. `backend/`: `npm install`, copiar `.env.example` a `.env` con la Service Role Key, `npm run dev`.

Detalles completos en [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).
