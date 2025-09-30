# FulbITo Web (Frontend)

SPA (Vue 3 + TypeScript + Pinia + Vue Router + Tailwind) para gestionar partidos de fulbito entre grupos de jugadores con un sistema de ratings colaborativos.

## Características Principales

- Autenticación con JWT (login, registro y recuperación de contraseña por código de 6 dígitos).
- Gestión de jugadores: creación, habilidades (0–10), reclamación / desvinculación de un jugador por usuario.
- Gestión de grupos: creación, listado, membresías y control de permisos (owner vs miembros) vía flags desde backend.
- Partidos:
  - Creación asociada a un grupo seleccionando participantes y fecha opcional.
  - Generación automática de equipos (con opción AI/seed en servicio interno).
  - Finalización con resultado y registro de fecha de cierre.
  - Votación por desempeño jugador a jugador (👍 😐 👎) por usuario.
  - Aplicación de cambios de rating una vez completadas las votaciones (solo owner / permisos específicos).
- Visualización de cambios de rating aplicados (before/after/Δ) tras cierre.
- Sistema de toasts global ligero para feedback (errores como email duplicado, etc.).
- Loaders centralizados (overlay) en vistas clave.
- Diseño responsive (mobile-first) con navegación adaptativa (hamburguesa en mobile).

## Estructura de Carpetas

```text
src/
  api/                Envolturas simples de endpoints legacy.
  lib/                Servicios HTTP y lógicas específicas (auth, matches, players, groups).
  stores/             Pinia stores (auth, players, groups, matches).
  views/              Páginas de routing.
  components/         Componentes reutilizables (CenteredLoader, toasts en App).
  router/             Configuración de Vue Router.
  constants/          Constantes de dominio (habilidades, etc.).
  utils/              Helpers (localStorage keys, parsing, errors).
  types.ts            Tipos compartidos (Players, Matches, Voting, Ratings...).
  main.ts             Bootstrap de la app.
  App.vue             Shell (layout, nav, toasts).
```

## Tipos y Flags Importantes

- `Group`: flags `isOwner`, `isMember`, `canEdit`, `canCreate` (en meta de matches por grupo).
- `Match`: `canEdit`, `ratingApplied`, `ratingChanges`, `myVotes`, `participants`, `teams`.
- `MatchesGroupResponse.meta`: permisos de creación y acciones sobre partidos.
- `MyVotesResponse`: estado granulado de votos del usuario (completitud, pendientes y cambios si ya se aplicaron ratings).

## Flujo de Votación y Ratings

1. Partido se finaliza (requiere equipos generados y marcador).
2. Cada usuario vota a los jugadores participantes (👍 😐 👎).
3. Cuando no quedan pendientes para el owner (o rol con permiso) aparece botón “Aplicar ratings”.
4. Backend devuelve `ratingChanges` y se refleja instantly.

## Autenticación

- JWT en `localStorage` y enviado en `Authorization`.
- Logout limpia token y redirige a `/login`.
- Recuperación: request code → verify → reset password (en dev se expone `devCode`).

## Toasts

Sistema mínimo en `App.vue` usando `provide('pushToast')`.

```ts
const pushToast = inject('pushToast') as (msg: string, type?: 'info'|'success'|'error') => void;
pushToast('Ya existe un usuario con ese email', 'error');
```

## Loaders

`CenteredLoader` en Matches, Players, Groups, PlayerDetails. `MatchDetailPage` usa overlay propio (se puede unificar).

## Permisos Clave

- Crear partido: `meta.canCreate`.
- Generar equipos / eliminar / finalizar: `match.canEdit`.
- Aplicar ratings: `canApply = match.canEdit || meta.isOwner || match.isOwnerMatch` (si no aplicado y sin pendientes).

## Scripts

```
npm install
npm run dev
```

## Deploy (Vercel)

`vercel.json` reescribe cualquier ruta no `/api/*` a `index.html` para soportar refresh sin 404.

## Ideas Futuras

- Unificar loaders (`MatchDetailPage`).
- Tests unitarios básicos (stores / utilidades).
- Dark mode.
- Accesibilidad reforzada (roles ARIA en toasts y tabla de cambios).
- Tiempo real (WebSocket/SSE) para progreso de votación.

## Licencia

Pendiente.
