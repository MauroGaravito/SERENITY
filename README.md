# Serenity

Serenity deja de ser solamente una plataforma de "ejecucion, evidencia y revision".

La nueva direccion propuesta es:

**Serenity es el sistema operativo de la red de cuidado domiciliario.**

Conecta y coordina a tres actores que hoy trabajan con friccion, baja visibilidad y poca trazabilidad:

- Centros de cuidado y organizaciones que necesitan cobertura, calidad y cumplimiento.
- Empresas prestadoras que gestionan equipos, contratos, cobertura y facturacion.
- Cuidadores independientes que prestan el servicio y necesitan operar su actividad como una microempresa formal.

## Problema que resolvemos

El mercado de homecare suele estar fragmentado en tres capas:

- La demanda del servicio.
- La coordinacion operativa del servicio.
- La ejecucion real en terreno.

Cada capa usa herramientas distintas, y eso genera:

- Cobertura incompleta o tardia.
- Mala asignacion de personal.
- Documentacion inconsistente.
- Dificultad para auditar lo que realmente ocurrio.
- Facturacion lenta y disputas sobre horas, evidencias o incidencias.
- Cuidadores independientes con bajo soporte administrativo y financiero.

Serenity unifica ese circuito completo.

## Tesis de producto

La unidad central de Serenity no es el paciente ni el turno.

La unidad central es la **prestacion de servicio verificable**:

- alguien solicita cuidado,
- alguien se compromete a prestarlo,
- alguien lo ejecuta,
- alguien lo valida,
- y el sistema deja evidencia operativa y financiera lista para cierre.

## Propuesta de valor por actor

### 1. Centro de cuidado

- Solicita servicios y define requerimientos.
- Obtiene cobertura con trazabilidad.
- Verifica cumplimiento y calidad.
- Controla incidentes, sustituciones y documentacion.

### 2. Empresa prestadora

- Administra convenios, capacidad operativa y personal.
- Asigna servicios segun reglas de elegibilidad.
- Supervisa ejecucion, incidencias y aprobaciones.
- Consolida facturacion y rendimiento operativo.

### 3. Cuidador independiente

- Recibe oportunidades compatibles con su perfil.
- Gestiona disponibilidad, credenciales y tareas.
- Registra visitas, evidencias, gastos y kilometraje.
- Opera su actividad como una empresa unipersonal con orden administrativo.

## Lo que Serenity si es

- Plataforma vertical para homecare y servicios de cuidado en terreno.
- Sistema de coordinacion, ejecucion, evidencia y cierre.
- Herramienta multi-actor B2B2C con reglas operativas claras.

## Lo que Serenity no es

- EMR clinico.
- Marketplace abierto sin control de calidad.
- ERP generalista.
- App para familiares o pacientes en la primera fase.
- Sistema contable completo.

## Dominios funcionales

- Demanda y ordenes de servicio.
- Matching y cobertura.
- Agenda y ejecucion de visitas.
- Evidencia, checklist e incidencias.
- Revision y control de calidad.
- Cierre operativo y financiero.
- Backoffice ligero para cuidadores independientes.

## Documentos base

- `docs/product-direction.md`: enfoque, posicionamiento y modulos.
- `docs/business-rules.md`: reglas de negocio iniciales.
- `docs/workflows.md`: flujo operativo end-to-end.
- `docs/roadmap.md`: propuesta de roadmap por fases.
- `docs/architecture.md`: base tecnica inicial.
- `docs/domain-model.md`: modelo de dominio inicial.
- `docs/user-manual.md`: manual de usuario basado en la semilla demo actual.
- `docs/current-demo-state-and-qa.md`: mapa actual de la demo local y pruebas manuales recomendadas.
- `docs/dev-log.md`: registro breve de entregas, decisiones y validaciones.
- `docs/app-scope-2026-04-12.md`: alcance actual de la app para demos.
- `docs/external-export-spec-2026-04-12.md`: especificacion inicial de exportacion externa.
- `docs/integration-closure-plan-2026-04-14.md`: plan para cerrar la capa de integracion externa con Xero como primer partner.
- `SECURITY.md`: postura minima de seguridad para dependencias e installs.

## Decision de enfoque

La recomendacion es no construir Serenity como una "suite amplia de salud".

La recomendacion es construirlo primero como:

**plataforma de coordinacion y cumplimiento para homecare con backoffice ligero para workforce independiente.**

Ese enfoque tiene mejor coherencia, menor dispersion y una narrativa comercial mas fuerte.

## Base tecnica inicial

- `Next.js` con App Router
- `TypeScript`
- `Prisma`
- `PostgreSQL`

## Quick Start

1. Instalar dependencias:
   `npm install`
2. Levantar PostgreSQL local:
   `npm run db:start`
3. Crear archivo de entorno:
   copiar `.env.example` a `.env`
   El archivo ahora incluye `AUTH_SECRET` para firmar la sesion.
4. Aplicar esquema y seed:
   `npm run db:push`
   `npm run db:seed`
5. Levantar la app:
   `npm run dev`

### Demo seeds

La semilla soporta dos perfiles:

- `npm run db:seed` o `npm run db:seed:colombia`: demo local por defecto con nombres familiares y sedes en Bello, Antioquia.
- `npm run db:seed:australia`: demo original de Australia, alineada con la narrativa usada en produccion/VPS.

Ambas semillas mantienen la misma estructura operativa: 1 prestadora, 3 centros, 3 recipients, 7 carers, 3 ordenes, 7 visitas, closing periods, settlements, export jobs y audit events.

## Demo Access

- Password compartido local: `SerenityDemo!2026`
- Colombia provider coordinator: `mauricio@serenity.local`
- Colombia provider reviewer: `diana@serenity.local`
- Colombia center manager: `laura@serenity.local`
- Colombia carer: `gabriel@serenity.local`
- Australia provider coordinator: `coordination@serenity.local`
- Australia provider reviewer: `review@serenity.local`
- Australia center manager: `harbour.manager@serenity.local`
- Australia carer: `liam@serenity.local`

## Deployment

- Dokploy env base: `.env.dokploy.example`
- Dokploy notes and current reverse proxy shape: `docs/dokploy-deployment.md`
- Dokploy compose file: `docker-compose.prod.yml`
- Container build: `Dockerfile`
- Internal sync runner endpoint: `POST /api/internal/export-jobs/run`

## Estado actual

Ya existe un scaffold tecnico inicial con:

- homepage de producto,
- rutas por actor (`/centers`, `/providers`, `/carers`),
- catalogos cerrados iniciales para `service types` y `skills`,
- provider workspace reorganizado en dashboard operativo, ordenes, closing, external export y audit trail,
- dashboard provider con panorama general, links filtrados por estado/riesgo/prioridad y cola priorizada,
- ordenes provider con formulario de nueva orden en modal para mantener visible la lista de demanda activa,
- formulario provider de ordenes organizado por detalles de demanda, agenda, requisitos, instrucciones y notas internas,
- `closing` enfocado solo en periodo actual, settlement y excepciones operativas,
- `external export` separado para paquetes, handoff externo y jobs de sincronizacion,
- `audit trail` separado para trazabilidad critica,
- capa de sync externa con `export jobs`, cola programable por tiempo, endpoint interno seguro, chequeo remoto y ciclo visible `queued -> processing -> sent -> acknowledged/failed`,
- capa operativa reforzada con estados de cobertura, reemplazo manual, escalamiento operativo, matching explicable y readiness del carer,
- narrativa de ejecucion por visita con checklist, evidencia e incidencias visible para carer, provider y center,
- readiness del carer estructurado en senales positivas, advertencias y bloqueos alineadas con matching provider,
- `closing` con visitas excluidas del settlement y motivos visibles,
- foundation de `xero_custom_connection` con modos `sandbox`, `auth_only` y `direct_post`,
- esquema de dominio inicial en `prisma/schema.prisma`,
- arquitectura y modelo documentados.

## Operational Readiness

La capa operativa ya cubre:

- cobertura visible por orden y visita,
- reemplazo manual desde provider,
- escalamiento operativo con auditoria,
- assignment pool con razones de inelegibilidad,
- readiness del carer con alertas y limites,
- readiness del carer con impacto operativo, senales escaneables y estados `ready`, `attention_needed` y `restricted`,
- excepciones demo `cancelled` y `no_show`.

Plan detallado de esta capa:

- `docs/operational-readiness-plan-2026-04-13.md`

## Catalogos cerrados iniciales

La demo actual ya usa un primer catalogo operativo compartido por la semilla y los formularios.

### Service types

- `Domestic Assistance`
- `Community Access`
- `Personal Care`
- `Companionship`

### Skills

- `Domestic cleaning`
- `Meal preparation`
- `Transport escort`
- `Community participation`
- `Personal hygiene support`
- `Manual handling`
- `Medication prompt`
- `Social engagement`

Estos catalogos se usan como base para:

- tipos de servicio visibles en ordenes,
- skills requeridas en provider y center,
- matching inicial de carers en la demo.
