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

## Demo Access

- Password compartido local: `SerenityDemo!2026`
- Provider coordinator: `coordination@serenity.local`
- Provider reviewer: `review@serenity.local`
- Center manager: `harbour.manager@serenity.local`
- Carer: `liam@serenity.local`

## Deployment

- Dokploy env base: `.env.dokploy.example`
- Dokploy notes and current reverse proxy shape: `docs/dokploy-deployment.md`

## Estado actual

Ya existe un scaffold tecnico inicial con:

- homepage de producto,
- rutas por actor (`/centers`, `/providers`, `/carers`),
- esquema de dominio inicial en `prisma/schema.prisma`,
- arquitectura y modelo documentados.
