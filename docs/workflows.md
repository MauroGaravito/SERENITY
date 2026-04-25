# Workflows

## 1. Flujo operativo principal

El flujo central recomendado para Serenity es este:

1. El centro o la prestadora crea una orden de servicio.
2. La orden define requisitos, ventana horaria, frecuencia y condiciones.
3. Serenity calcula cuidadores elegibles.
4. La prestadora asigna o invita a uno o varios cuidadores.
5. El cuidador acepta el servicio.
6. El dia de la visita, el cuidador hace check-in, ejecuta checklist y carga evidencia.
7. Si hay incidencia, la reporta durante o al cierre de la visita.
8. La visita entra a revision.
9. La prestadora aprueba, observa o rechaza.
10. Las visitas aprobadas pasan al cierre del periodo.

## 2. Estados sugeridos

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

## 3. Flujo del centro de cuidado

1. Crear requerimiento.
2. Definir reglas y restricciones.
3. Seguir cobertura.
4. Ver excepciones.
5. Validar cumplimiento por periodo.

Salida esperada:

- menos llamadas manuales,
- mas trazabilidad,
- mejor visibilidad de cumplimiento.

## 4. Flujo de la empresa prestadora

1. Recibir o cargar demanda.
2. Ver capacidad disponible.
3. Asignar y cubrir.
4. Gestionar reemplazos.
5. Supervisar ejecucion.
6. Revisar y aprobar.
7. Consolidar cierre.

Salida esperada:

- menor tiempo de coordinacion,
- menos visitas disputadas,
- mejor margen operativo.

### Superficie provider actual

El flujo provider quedo separado en cinco pantallas para reducir friccion:

1. `Dashboard`: responde "que esta pasando ahora". Muestra carga actual, presion de cobertura, pendientes de review, ready for closing y links filtrados para abrir ordenes por estado, riesgo o prioridad.
2. `Orders`: responde "que orden tengo que tocar". Lista la demanda activa y permite crear una nueva orden desde un modal sin empujar la tabla fuera de pantalla.
3. `Closing`: responde "que puede cerrarse". Se enfoca en periodos, visitas aprobadas, settlement y exclusiones operativas.
4. `External export`: responde "que salio de Serenity". Agrupa descarga de paquetes, targets externos, export jobs y acknowledgement remoto.
5. `Audit trail`: responde "que paso y quien lo hizo". Mantiene eventos criticos fuera del flujo operativo diario.

El criterio es que cada pantalla tenga una mision unica y que las tarjetas funcionen como acceso a trabajo, no como repeticion de la misma lista.

## 5. Flujo del cuidador independiente

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

## 6. Manejo de excepciones

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

## 7. Ritual operativo semanal

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
