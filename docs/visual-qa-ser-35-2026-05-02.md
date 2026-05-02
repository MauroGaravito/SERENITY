# SER-35 visual QA - 2026-05-02

Objetivo: revisar las superficies admin, provider, center y carer despues del reset del producto, en desktop y mobile, usando la semilla Colombia como escenario limpio.

## Escenario usado

Comandos:

```powershell
docker compose up -d postgres
npm run db:seed:colombia
npm run dev -- --hostname 127.0.0.1 --port 3003
```

Credenciales:

- Admin: `admin@serenity.local`
- Provider coordinator: `mauricio@serenity.local`
- Center manager: `laura@serenity.local`
- Carer: `gabriel@serenity.local`
- Password demo: `SerenityDemo!2026`

Viewports revisados:

- Desktop: `1440x900`
- Mobile: `390x844`

## Rutas revisadas

Admin:

- `/admin`
- `/admin/clients`
- `/admin/care-team`
- `/admin/workflows`

Provider:

- `/providers`
- `/providers/orders`
- `/providers/closing`
- `/providers/export`
- `/providers/audit`

Center:

- `/centers`
- `/centers/orders`

Carer:

- `/carers`
- `/carers/availability`
- `/carers/credentials`

## Resultado

- Login por rol redirige a la superficie correcta cuando se espera explicitamente el redirect.
- No se detecta overflow horizontal real despues del fix aplicado en calendarios mobile.
- Empty states revisados:
  - Provider coverage: `All visits are covered`.
  - Provider closing: `No closing periods yet`.
  - Provider export: `No export packages yet`.
  - Provider audit: `No recorded changes yet`.
  - Center dashboard/orders: no hay service requests al iniciar.
- La jerarquia de acciones es consistente:
  - Acciones primarias usan `primary-link`.
  - Navegacion secundaria usa `ghost-link` o `inline-link`.
  - Sign out mantiene tratamiento secundario.
- Las pantallas no tienen colisiones visibles entre textos, botones y cards en los viewports revisados.

## Fix aplicado

En mobile, `/carers/availability` tenia overflow horizontal fuerte porque el planner mantenia 7 columnas con ancho minimo alto dentro del layout responsive.

Cambio:

- En `src/app/globals.css`, bajo `max-width: 760px`, `availability-planner` y `visit-calendar-grid` pasan a una sola columna.
- `availability-day` y `visit-calendar-day` eliminan altura minima en mobile.

Validacion despues del cambio:

- `/carers/availability` en `390x844` queda sin overflow horizontal.
- El planner conserva la informacion, pero se lee como lista vertical en mobile.

## Observaciones no bloqueantes

- Algunas pantallas mobile son largas por naturaleza:
  - `/admin/clients`
  - `/admin/care-team`
  - `/centers/orders`
  - `/carers/availability`
  - `/carers/credentials`
- No se consideran bloqueantes para SER-35 porque no generan overflow horizontal ni jerarquia rota, pero conviene crear tickets futuros si se quiere reducir scroll con secciones colapsables o tabs internas.
- `/centers/orders` muestra el formulario completo antes de la lista. Es correcto para el primer request demo, pero despues de tener volumen real conviene separar "New request" de "All requests" con composer colapsable.

## Criterios SER-35

- Admin, provider, center y carer revisados en desktop y mobile: completado.
- Empty states claros y utiles: completado.
- Forms sin overflow horizontal ni jerarquia rota: completado con observacion de scroll largo.
- Paginas sin multi-columna innecesaria en mobile: completado despues del fix de calendarios.
- Jerarquia de acciones clara: completado.
- Issues visuales conocidos documentados o corregidos: completado.
