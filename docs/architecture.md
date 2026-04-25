# Architecture

## Decision

La base tecnica inicial de Serenity sera una sola aplicacion web con `Next.js`, `TypeScript` y `Prisma`.

## Por que esta base

1. Reduce complejidad al inicio.
2. Permite construir panel de prestadora, portal de centro y vista movil del cuidador en una misma base.
3. Mantiene una sola capa de autenticacion, permisos, dominio y auditoria.
4. No cierra la puerta a extraer una app movil nativa mas adelante.

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

## Estructura actual

- `src/app`: rutas y UI
- `src/app/providers`: superficie provider reorganizada en dashboard, orders, closing, export y audit
- `src/components/providers`: componentes compartidos del provider workspace
- `src/lib`: datos base y utilidades
- `prisma/schema.prisma`: modelo inicial del dominio
- `prisma/seed.mjs`: semilla parametrizada con perfiles `colombia` y `australia`
- `docs/`: definiciones de producto, reglas y arquitectura

## Provider workspace actual

La superficie provider separa responsabilidades para evitar pantallas largas y confusas:

- `/providers`: panorama operativo, carga actual, links filtrados y cola priorizada.
- `/providers/orders`: lista operativa de ordenes con filtros por estado, riesgo y prioridad; la creacion de ordenes vive en un modal.
- `/providers/closing`: cierre operativo del periodo, visitas aprobadas, settlement y excepciones.
- `/providers/export`: handoff externo, descarga de paquetes y ejecucion de jobs.
- `/providers/audit`: eventos criticos y trazabilidad.

Esta division mantiene el flujo profesional sin duplicar la misma informacion en multiples tarjetas.

## Demo data profiles

La demo local usa `colombia` por defecto para trabajar con nombres y barrios familiares. La demo `australia` se conserva para presentaciones o despliegues que necesiten la narrativa original.

- `npm run db:seed:colombia`
- `npm run db:seed:australia`

## Proxima evolucion recomendada

Cuando el MVP tenga traccion:

1. extraer componentes de dominio a paquetes internos,
2. agregar autenticacion real,
3. sumar jobs asincronos para alertas y cierre,
4. evaluar app movil dedicada para cuidador.
