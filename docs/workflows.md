# Workflows

El flujo canonico de roles, propiedad de datos y happy path esta definido en [operating-model.md](./operating-model.md).

## 1. Flujo de setup administrativo

El sistema debe empezar antes de la primera orden. Serenity necesita un admin que prepare la red operativa:

1. Crear o confirmar la prestadora Serenity.
2. Crear centros cliente.
3. Crear sedes de cada centro.
4. Crear contactos del centro.
5. Crear pacientes o recipients en la sede correcta.
6. Crear carers de Serenity y definir si son `EMPLOYEE` o `INDEPENDENT`.
7. Revisar credenciales, disponibilidad y datos de contacto.
8. Revisar tipos de servicio y checklist esperado para el care record.

Salida esperada:

- Mauricio no coordina sobre datos improvisados.
- Los centros existen aunque no haya ordenes.
- Los carers pertenecen a Serenity y son visibles antes de asignar.
- El flujo de orden empieza con cliente, sede y paciente claros.
- Permanente/casual no se decide durante setup MVP; queda para una politica futura de roster/contrato.

## 2. Flujo operativo principal

El flujo central recomendado para Serenity es este:

1. El coordinator crea una orden para un centro cliente ya configurado.
2. La orden define paciente, sede, requisitos, ventana horaria, frecuencia y condiciones.
3. Serenity muestra agenda, disponibilidad y carers elegibles.
4. El coordinator asigna o reemplaza carers.
5. El cuidador acepta o ejecuta la visita segun el flujo habilitado.
6. El dia de la visita, el cuidador hace check-in, ejecuta checklist y carga evidencia.
7. Si hay incidencia, la reporta durante o al cierre de la visita.
8. La visita entra a revision.
9. El reviewer aprueba, observa o rechaza.
10. Las visitas aprobadas pasan al cierre del periodo.

## 3. Estados sugeridos

### Orden de servicio

- `draft`
- `open`
- `partially_assigned`
- `assigned`
- `active`
- `completed`
- `closed`
- `cancelled`

### Visita

- `scheduled`
- `confirmed`
- `in_progress`
- `completed`
- `under_review`
- `approved`
- `rejected`
- `cancelled`
- `no_show`

## 4. Flujo del centro de cuidado

1. Mantener contexto de centro, sede y pacientes dentro de su alcance.
2. Crear requerimiento cuando la politica lo permita.
3. Definir restricciones y notas de servicio visibles para provider.
4. Seguir cobertura y excepciones.
5. Ver care records aprobados y cumplimiento por periodo.
6. Pedir cambios cuando una solicitud ya tiene cobertura o ejecucion en curso.

Salida esperada:

- menos llamadas manuales,
- mas trazabilidad,
- mejor visibilidad de cumplimiento.

Decision SER-33:

- El centro crea solicitudes y monitorea outcomes.
- El centro puede editar datos de solicitud solo en etapa temprana; despues de cobertura confirmada los cambios pasan a coordinacion provider.
- El centro puede mantener pacientes por politica, pero nuevas sedes quedan admin-owned en el MVP.
- El centro no asigna carers, no aprueba care records y no opera closing/export.
- El portal center se organiza por Centro, Sedes, Pacientes y Solicitudes.

## 5. Flujo de la empresa prestadora

1. Admin configura la red operativa.
2. Coordinator recibe o carga demanda desde datos configurados.
3. Coordinator ve capacidad disponible.
4. Coordinator asigna, cubre y gestiona reemplazos.
5. Carer ejecuta y documenta.
6. Reviewer revisa y aprueba.
7. Provider operations consolida cierre y export.

Salida esperada:

- menor tiempo de coordinacion,
- menos visitas disputadas,
- mejor margen operativo.

### Superficie provider actual

El flujo provider queda para operacion diaria, no para configuracion maestra:

1. `Dashboard`: responde "que esta pasando ahora". Muestra carga actual, presion de cobertura, pendientes de review, ready for closing y links filtrados para abrir ordenes por estado, riesgo o prioridad.
2. `Orders`: responde "que orden tengo que tocar". Lista la demanda activa y permite crear una nueva orden desde un modal sin empujar la tabla fuera de pantalla.
3. `Closing`: responde "que puede cerrarse". Se enfoca en periodos, visitas aprobadas, settlement y exclusiones operativas.
4. `External export`: responde "que salio de Serenity". Agrupa descarga de paquetes, targets externos, export jobs y acknowledgement remoto.
5. `Audit trail`: responde "que paso y quien lo hizo". Mantiene eventos criticos fuera del flujo operativo diario.

El criterio es que cada pantalla tenga una mision unica y que las tarjetas funcionen como acceso a trabajo, no como repeticion de la misma lista.

### Flujo post-zero-start para review, closing, export y audit

En Colombia, el producto arranca sin ordenes, visitas, periodos, export jobs ni audit operativo. Por eso el tramo final no debe simular actividad vieja:

1. `Orders` empieza vacio y explica que review necesita una visita real completada y enviada.
2. `Review` ocurre dentro del detalle de la orden, sobre visitas en `under_review`.
3. Al aprobar una visita, Serenity crea o reutiliza un closing period `open` para la fecha de la visita.
4. `Closing` aparece como trabajo operativo solo cuando hay visitas aprobadas dentro de un periodo.
5. El periodo `open` permite settlement, gastos y revision de exclusiones, pero no export.
6. `External export` aparece solo cuando el periodo esta `locked`.
7. `Audit trail` del periodo empieza vacio y se llena con aprobacion, settlement, lock/export y sync jobs.

Regla clave: nada en closing/export/audit depende de actividad pre-seeded. Todo debe nacer de la primera solicitud real y de la visita aprobada.

## 6. Flujo del cuidador independiente

1. Mantener disponibilidad y documentos al dia.
2. Recibir propuesta o asignacion.
3. Aceptar o rechazar.
4. Ver instrucciones de la visita.
5. Ejecutar y documentar.
6. Registrar gastos o kilometraje.
7. Consultar historial e ingresos asociados.

Salida esperada:

- menos ambiguedad operativa,
- mas profesionalizacion,
- mejor orden administrativo.

## 7. Manejo de excepciones

### No-show

1. El sistema detecta ausencia de check-in.
2. Se marca riesgo operativo.
3. Coordinacion activa reemplazo.
4. Queda registro del evento y su resolucion.

### Cancelacion tardia

1. Se registra motivo.
2. Se recalcula cobertura.
3. Se genera alerta para coordinacion.

### Incidencia severa

1. El cuidador reporta.
2. La visita queda senalada.
3. Revision prioritaria.
4. El cierre se bloquea hasta definicion.

## 8. Ritual operativo semanal

### Diario

- cubrir servicios,
- resolver reemplazos,
- aprobar visitas pendientes.

### Semanal

- revisar incidencias,
- revisar documentos por vencer,
- cerrar periodo operativo,
- preparar external export cuando el periodo este locked,
- medir cobertura y reprocesos.

### Mensual

- consolidar cierre economico,
- evaluar calidad por prestadora y cuidador,
- ajustar reglas de asignacion.
