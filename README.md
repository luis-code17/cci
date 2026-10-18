# CCI Sabadell — web

Nueva web de CCI Sabadell: **Astro** (frontend) + **Payload CMS** (contenido), en un workspace pnpm.

```
cci/
├── content/site.json   Contenido base: lo usa el seed del CMS y es el respaldo de la web si el CMS no responde
├── cms/                Payload 3 (Next.js) + SQLite · admin en http://localhost:3001/admin
└── web/                Astro 7 SSR (Node) + Tailwind 4 · http://localhost:4321
```

## Puesta en marcha

```bash
pnpm install
cp cms/.env.example cms/.env   # cambia PAYLOAD_SECRET y FORM_SECRET
cp web/.env.example web/.env   # FORM_SECRET igual que en cms/.env, YOUTUBE_API_KEY, Redsys…
pnpm seed                      # carga el contenido base en el CMS (idempotente)
pnpm dev                       # CMS (3001) + web (4321)
```

La primera vez que abras `/admin` Payload te pedirá crear el usuario administrador.

## Qué gestiona el CMS

| En el panel | Dónde se ve |
| --- | --- |
| **Ajustes del sitio**: dirección, email, redes, horarios de reuniones, barra de aviso, coordenadas del mapa | Cabecera, pie, portada, Visítanos |
| **Portada**: hero, declaración, "Nuestra cultura", "Para ti", bloque online | `/` |
| **Iglesia**: misión, valores, creencias, pastores | `/iglesia` |
| **Ministerios** | Portada e `/iglesia#ministerios` |
| **Eventos** (los marcados como pasados desaparecen solos) | Portada y `/eventos` |
| **Blog** (con borradores) | `/blog` |
| **Mensajes**: formularios de contacto, oración y primera visita | Solo en el panel |

La web cachea las respuestas del CMS 60 s en memoria. Si el CMS está apagado, la web sigue funcionando con `content/site.json`.

## Integraciones (traídas de `cci-monorepo`)

- **YouTube Data API v3** (`YOUTUBE_API_KEY`): últimas predicaciones en portada y biblioteca completa en `/predicaciones` con series, búsqueda, orden, paginación y visor de Shorts. Caché de 1 h.
- **Versículo**: OurManna da la referencia y esbiblia.net el texto en español (RVA). Versículo del día (caché 12 h) y botón "Otro versículo" (`GET /api/verse?random=1`). Se corrigieron 26 códigos de libro que esbiblia.net no reconocía (p. ej. Salmos = `SAL`, Efesios = `EFE`, Marcos = `MR`) y ahora se muestran los rangos completos de versículos.
- **Redsys** (`REDSYS_*`): donaciones con tarjeta en `/ofrendas`. Sin credenciales, la opción aparece como "Próximamente" y la web no falla. Webhook: `POST /api/payments/webhook/redsys`.
- **Transferencia** (`BANK_TRANSFER_*`): solo se muestra si el IBAN es válido.
- **Contacto** (`POST /api/contact`): guarda el mensaje en el CMS y, si hay SMTP configurado, también lo envía por email.

## Despliegue en Vercel (stage)

Un solo proyecto de Vercel con dos servicios (`vercel.json`) en el mismo dominio:

- `web` (Astro) atiende todo el sitio y sus APIs `/api/contact`, `/api/verse`, `/api/payments/*`.
- `cms` (Payload) se publica en `/admin` (panel) y `/api/*` (API e imágenes). La web lo llama por la URL interna que inyecta el binding `CMS_URL`.

Pasos:

1. Importa el repo en Vercel (raíz del repo, sin cambiar el *Root Directory*).
2. **Storage → Neon (Postgres)** y **Storage → Blob**: crean `DATABASE_URL` y `BLOB_READ_WRITE_TOKEN`.
3. Variables de entorno: `PAYLOAD_SECRET`, `FORM_SECRET`, `YOUTUBE_API_KEY`, `REDSYS_*`, `SMTP_*`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_NAME`. **No** definas `CMS_URL`. Con dominio propio, añade `PUBLIC_SITE_URL` y `PAYLOAD_PUBLIC_SERVER_URL`.
4. Despliega. El CMS crea las tablas al arrancar (migraciones de `cms/src/migrations-postgres`).
5. Contenido inicial (una vez): `vercel env pull cms/.env.vercel` y luego `cd cms && set -a && . ./.env.vercel && set +a && NODE_ENV=production pnpm seed`.
6. Entra en `https://<tu-proyecto>.vercel.app/admin` y crea el usuario administrador.

En local se sigue usando SQLite. Si cambias colecciones o campos, crea migraciones para los dos motores: `pnpm payload migrate:create <nombre>` (SQLite) y lo mismo con `DATABASE_URL=postgres://…` (Postgres).

## Servidor propio (Node)

```bash
pnpm build
cd cms && pnpm start                         # aplica las migraciones al arrancar
cd web && node --env-file=.env dist/server/entry.mjs
```

## Pendiente de revisar con la iglesia

- Horas del culto del domingo y del encuentro de jóvenes (ahora solo está confirmado el miércoles a las 19:45).
- Nombres y biografías de los pastores, y textos de creencias y ministerios (son un punto de partida).
- Coordenadas del mapa: ahora apuntan al centro de Carrer de Brutau; ajústalas en *Ajustes del sitio → Contacto*.
- Guardar las donaciones confirmadas por el webhook de Redsys (está marcado como TODO).
