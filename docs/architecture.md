# Architecture

## Decision

La base tecnica inicial de Serenity sera una sola aplicacion web con `Next.js`, `TypeScript` y `Prisma`.

La arquitectura funcional debe seguir el contrato de roles y propiedad definido en [operating-model.md](./operating-model.md).

SER-34 define la preparacion para una futura separacion backend/frontend sin ejecutar el split ahora. El plan detallado esta en [backend-boundary-plan.md](./backend-boundary-plan.md).

## Por que esta base

1. Reduce complejidad al inicio.
2. Permite construir panel de prestadora, portal de centro y vista movil del cuidador en una misma base.
3. Mantiene una sola capa de autenticacion, permisos, dominio y auditoria.
4. No cierra la puerta a extraer una app movil nativa mas adelante.
5. Evita separar servicios mientras el operating model y los workflows siguen cambiando.

## Stack inicial

- Frontend y backend web: `Next.js App Router`
- Lenguaje: `TypeScript`
- Persistencia: `PostgreSQL`
- ORM: `Prisma`
- Estilo inicial: `CSS` propio, sin dependencia visual extra
- UI actual: componentes React server/client colocados cerca de cada ruta y estilos globales en `src/app/globals.css`

## Modulos tecnicos

### 1. Identity and Access

- usuarios
- roles
- pertenencia a organizacion
- permisos por actor

### 2. Network and Contracts

- centros
- sedes
- prestadoras
- relacion prestadora-cliente (`ProviderClient`)
- cuidadores
- tipos de servicio

### 3. Service Operations

- ordenes de servicio
- visitas
- asignacion
- excepciones

### 4. Execution Evidence

- checklist
- evidencia
- incidencias
- revisiones

### 5. Closure

- gastos
- kilometraje
- periodos de cierre
- consolidado visitable

### 6. External Export

- paquetes exportables por periodo
- targets externos
- `export jobs`
- estado de entrega y acknowledgement externo

### 7. Audit Trail

- eventos criticos por orden
- trazabilidad de cambios operativos
- evidencia de acciones de cierre y exportacion

## Principios

1. Toda accion critica deja trazabilidad.
2. El estado del sistema debe ser explicito, no inferido.
3. La visita es la unidad operativa.
4. La visita aprobada es la base del cierre.
5. Cada actor ve una superficie distinta sobre el mismo dominio.
6. Setup administrativo y operacion diaria son superficies separadas.
7. La futura separacion backend/frontend debe preservar los boundaries del operating model.

## Estructura actual

- `src/app`: rutas y UI
- `src/app/admin`: superficie administrativa para configurar clientes, care team y workflows
- `src/app/providers`: superficie provider reorganizada en dashboard, orders, closing, export y audit
- `src/app/*/actions.ts`: server actions actuales; deben convertirse gradualmente en adapters del futuro service layer
- `src/components/admin`: shell y componentes de administracion
- `src/components/providers`: componentes compartidos del provider workspace
- `src/lib`: datos base y utilidades; hoy contiene funciones Prisma que deben migrar detras de boundaries internos
- `prisma/schema.prisma`: modelo inicial del dominio
- `prisma/seed.mjs`: semilla parametrizada con perfiles `colombia` y `australia`
- `docs/`: definiciones de producto, reglas y arquitectura

## SER-34 backend boundary inside monolith

La decision es mantener un unico proceso Next.js y preparar boundaries internos por dominio.

Dominios futuros:

| Dominio | Responsabilidad | Codigo actual principal |
| --- | --- | --- |
| Auth | login, sesion, roles, throttling | `src/app/login/actions.ts`, `src/app/auth/actions.ts`, `src/lib/auth.ts`, `src/lib/security.ts` |
| Admin | setup de provider, centros, sedes, patients, carers, workflows | `src/app/admin/actions.ts`, `src/lib/admin-data.ts` |
| Provider operations | ordenes, visitas, asignacion, reemplazo, notas | `src/app/providers/actions.ts`, `src/lib/providers-data.ts` |
| Center portal | demanda y visibilidad scopeada del centro | `src/app/centers/actions.ts`, `src/lib/centers-data.ts` |
| Carer execution | disponibilidad, credenciales, ejecucion, checklist, evidencia, incidentes | `src/app/carers/actions.ts`, `src/lib/carers-data.ts` |
| Review | aprobacion/rechazo y reglas de care record | `reviewVisit`, `src/lib/visit-state.ts` |
| Closing/export | periodos, settlement, expenses, export packages/jobs/connectors | provider closing/export actions, export routes, `src/lib/export-connectors.ts` |
| Audit | eventos criticos y lecturas scopeadas | `src/lib/audit.ts`, `src/lib/audit-data.ts` |

Forma objetivo interna antes de exponer APIs:

```text
src/server/
  auth/
  admin/
  provider/
  center/
  carer/
  review/
  closing/
  export/
  audit/
  shared/
```

Regla tecnica:

- UI components no importan Prisma.
- Server actions parsean `FormData`, resuelven sesion, llaman servicios y hacen `revalidate/redirect`.
- Las reglas de negocio, audit y scope checks viven en service functions.
- API routes futuras deben llamar los mismos services, no duplicar logica.

## Admin workspace actual

La superficie `/admin` existe para separar configuracion de operacion. Su mision no es coordinar visitas sino crear las condiciones para que el coordinador trabaje con claridad.

- `/admin`: estado de setup, fronteras de rol y siguiente accion.
- `/admin/clients`: centros cliente, sedes, contactos y pacientes.
- `/admin/care-team`: carers vinculados a Serenity, tipo de relacion, contacto, disponibilidad y credenciales.
- `/admin/workflows`: catalogo de servicios y care record esperado.

Esta capa corrige una debilidad anterior: antes los centros se inferian por ordenes. Ahora `ProviderClient` permite que Serenity tenga clientes configurados aunque todavia no exista ninguna solicitud.

## Provider workspace actual

La superficie provider separa responsabilidades para evitar pantallas largas y confusas:

- `/providers`: panorama operativo, carga actual, links filtrados y cola priorizada.
- `/providers/orders`: lista operativa de ordenes con filtros por estado, riesgo y prioridad; la creacion de ordenes vive en un modal.
- `/providers/closing`: cierre operativo del periodo, visitas aprobadas, settlement y excepciones.
- `/providers/export`: handoff externo, descarga de paquetes y ejecucion de jobs.
- `/providers/audit`: eventos criticos y trazabilidad.

Esta division mantiene el flujo profesional sin duplicar la misma informacion en multiples tarjetas.

## Demo data profiles

La demo local usa `colombia` por defecto para trabajar con nombres y barrios familiares. Colombia arranca deliberadamente desde cero: una prestadora, un admin, Mauricio como coordinador, Diana como reviewer, un centro cliente Niquia, una paciente Rosalba, tres carers y cero ordenes. La demo `australia` se conserva para presentaciones o despliegues que necesiten la narrativa original con actividad precargada.

- `npm run db:seed:colombia`
- `npm run db:seed:australia`

## Proxima evolucion recomendada

Cuando el MVP tenga traccion:

1. mover logica de dominio hacia servicios server internos por boundary,
2. mantener server actions como adapters mientras la UI siga en Next,
3. agregar API routes que llamen esos mismos services,
4. sumar jobs asincronos para alertas y cierre,
5. extraer backend fisico solo si mobile, jobs o integraciones lo justifican,
6. evaluar app movil dedicada para cuidador.
