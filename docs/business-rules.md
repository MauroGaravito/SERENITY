# Business Rules

Las reglas de permisos y propiedad de datos deben leerse junto con [operating-model.md](./operating-model.md), que es el contrato canonico de SER-27.

## 1. Reglas de elegibilidad

Regla previa: una prestadora debe tener centros cliente configurados mediante `ProviderClient` antes de crear ordenes. Una orden solo puede usar centros, sedes y pacientes vinculados a la prestadora de la sesion.
1. Ningun cuidador puede ser asignado a un servicio si tiene credenciales vencidas o faltantes para ese tipo de servicio.
2. Ninguna visita puede confirmarse sin una ventana horaria, duracion y ubicacion definidas.
3. Todo servicio debe pertenecer a un centro y a una prestadora responsable.
4. Un cuidador no puede tener dos visitas superpuestas.
5. El readiness del cuidador debe explicar impacto operativo mediante tres estados: `ready`, `attention_needed` y `restricted`.
6. Las razones de matching visibles para provider deben estar alineadas con las señales que el cuidador ve en su workspace.
7. Una credencial `valid` deja de contar como skill verificada si su `expiresAt` ya paso o si vence antes de la ventana de la visita que se esta asignando.
8. Las credenciales que vencen en los proximos 45 dias deben mostrarse como advertencia operativa sin bloquear matching hasta que expiren.
9. Una visita no puede asignarse si la ventana se solapa con otra asignacion activa del cuidador.
10. Una visita no puede asignarse si se solapa con un bloque declarado como no disponible.
11. Una visita solo puede asignarse cuando un bloque laboral declarado cubre toda la ventana de servicio.

## 2. Reglas de cobertura

1. Toda orden de servicio debe tener un estado operativo visible: `draft`, `open`, `partially_assigned`, `assigned`, `in_progress`, `completed`, `under_review`, `approved`, `rejected`, `cancelled`.
2. Si una visita no tiene cuidador confirmado dentro del tiempo minimo definido, debe escalar a coordinacion.
3. Si un cuidador cancela dentro de la ventana critica, Serenity debe abrir flujo de reemplazo inmediato.
4. Todo reemplazo debe mantener trazabilidad del motivo y del responsable del cambio.
5. Una orden creada por provider debe incluir centro, sede, recipient, tipo de servicio, titulo, prioridad, ventana inicial, duracion, recurrencia y al menos un skill requerido.
6. La ventana de servicio debe tener fin posterior al inicio y la duracion planificada no puede exceder la ventana programada.
7. La creacion de una orden provider genera una primera visita `scheduled` lista para cobertura y asignacion.
8. Si se edita la ventana de una orden con una visita `scheduled` sin asignar, esa visita pendiente debe mantenerse alineada con la nueva ventana.

## 3. Reglas de ejecucion

1. Toda visita requiere check-in y check-out para poder pasar a revision.
2. Si el tipo de servicio exige checklist, no puede cerrarse la visita sin checklist completo o sin motivo de excepcion.
3. Toda incidencia relevante debe clasificarse al menos por tipo, severidad y comentario.
4. Toda evidencia adjunta debe quedar vinculada a la visita, al autor y a la hora de carga.
5. Si una visita queda incompleta, el sistema debe exigir una causa explicita.

### Matriz actual de transiciones de visita

La demo no permite saltos arbitrarios entre estados. Las transiciones actuales son:

| Estado actual | Actor | Siguiente estado permitido |
| --- | --- | --- |
| `scheduled` | provider | `confirmed`, `cancelled` |
| `confirmed` | provider | `in_progress`, `cancelled`, `no_show` |
| `confirmed` | carer | `in_progress` |
| `in_progress` | provider o carer | `completed` |
| `completed` | provider o carer | `under_review` |
| `under_review` | provider reviewer | `approved`, `rejected` |
| `rejected` | provider | `completed` |
| `approved`, `cancelled`, `no_show` | sistema | estados terminales para el flujo normal |

Reglas adicionales:

- `confirmed`, `in_progress`, `completed`, `under_review`, `approved` y `no_show` requieren cuidador asignado.
- `completed` requiere `actualStart`.
- `under_review` y `approved` requieren `actualStart` y `actualEnd`.
- `approved` y `rejected` solo se ejecutan desde el flujo de review.
- Un reemplazo puede resetear visitas que aun no llegaron a ejecucion, review o aprobacion.

## 4. Reglas de revision

1. Ninguna visita pasa a aprobada sin revision humana o regla explicita de autoaprobacion.
2. Una visita rechazada debe volver a estado corregible con observaciones visibles.
3. Toda correccion posterior a la revision debe dejar historial.
4. Las incidencias severas deben bloquear el cierre hasta resolucion o excepcion autorizada.
5. Una visita no puede enviarse a review sin checklist completo cuando existe template operativo.
6. Una visita no puede enviarse a review sin al menos una evidencia capturada.
7. Provider reviewer no puede aprobar una visita si falta checklist completo o evidencia minima.

## 5. Reglas economicas

1. Solo horas aprobadas pueden formar parte del cierre economico.
2. Gastos y kilometraje requieren evidencia o politica habilitante.
3. Toda tarifa debe depender al menos de tipo de servicio, duracion y actor pagador.
4. Las diferencias entre horas planificadas y horas ejecutadas deben quedar justificadas.
5. Una orden no se cierra economicamente de forma directa: sus visitas aprobadas entran a un `closing period`.
6. Un `closing period` en estado `open` acepta cambios operativos; en estado `locked` queda listo para export; en estado `exported` ya fue entregado externamente.
7. Las visitas `cancelled`, `no_show` o sin aprobacion quedan fuera del settlement y deben mostrar motivo y siguiente paso operativo.

## 6. Reglas de external export

1. El export externo es un handoff: Serenity prepara y entrega el paquete, pero no ejecuta pagos ni contabilidad final.
2. Un periodo solo puede marcarse `exported` despues de al menos un `export job` aceptado o reconocido externamente.
3. Cada `export job` debe tener un estado unico visible: `queued`, `processing`, `sent`, `acknowledged` o `failed`.
4. Un `failed job` debe poder reintentarse sin perder historial.
5. El acknowledgement externo requiere una referencia externa estable o una regla explicita del target.

## 7. Reglas del cuidador como microempresa

1. El cuidador mantiene un perfil profesional unico con datos operativos y administrativos.
2. Serenity debe avisar vencimientos de documentos y credenciales antes de bloquear elegibilidad.
3. El cuidador puede registrar gastos y kilometraje por visita o por jornada.
4. El historial de servicios del cuidador debe poder usarse como respaldo de ingresos y rendimiento.

## 8. Reglas de permisos

### Admin Serenity

- Puede crear centros cliente, sedes, contactos, pacientes y carers.
- Puede revisar workflows de servicio y el care record esperado.
- No debe operar reemplazos, reviews o cierres diarios salvo que tambien tenga rol operativo.
- Es responsable de que exista red operativa antes de la primera solicitud.

### Centro de cuidado

- Puede crear y monitorear ordenes.
- Puede ver cumplimiento, incidencias y aprobaciones.
- No puede editar registros operativos cerrados sin trazabilidad.
- Solo ve informacion dentro de su propio centro.
- No ve datos privados de otros centros ni operaciones internas del pool completo de carers.

### Prestadora

- Puede asignar, reemplazar, revisar y cerrar.
- Es responsable final de la calidad operativa ante el centro.
- El coordinator opera la demanda; el reviewer aprueba resultados. La configuracion maestra queda en admin.
- El coordinator no aprueba care records.
- El reviewer no usa closing para saltarse validaciones de review.

### Cuidador

- Puede aceptar o rechazar servicios.
- Puede ejecutar la visita y cargar evidencia.
- No puede autoaprobar su propia visita.
- En el modelo actual el cuidador puede ser `EMPLOYEE` o `INDEPENDENT`; permanente/casual no esta modelado aun.
- No puede autoasignarse trabajo ni modificar settlement.

## 9. Reglas de datos

1. Toda accion critica debe almacenar autor, fecha y contexto.
2. No se debe sobrescribir evidencia historica sin conservar version previa.
3. Los documentos del cuidador deben tener fecha de vencimiento y estado.
4. Toda entidad operativa debe tener un identificador unico y trazable.
5. El audit trail no reemplaza el trabajo operativo; funciona como historial verificable para explicar decisiones y cambios.

## 10. KPIs recomendados

- Cobertura a tiempo.
- Tasa de reemplazo.
- No-show del cuidador.
- Visitas aprobadas sin correccion.
- Tiempo medio de aprobacion.
- Diferencia entre horas planificadas y ejecutadas.
- Incidencias por 100 visitas.
- Utilizacion por cuidador y por prestadora.
