# Dev Log

Registro breve de decisiones y entregas relevantes. No reemplaza Plane; sirve como memoria tecnica y de producto dentro del repo.

## 2026-04-25 - SER-1 Provider demo flow stabilization

Objetivo:

- Hacer mas claro el flujo provider.
- Reducir transiciones confusas.
- Mejorar la narrativa demo end-to-end.

Resultado:

- Dashboard provider simplificado como panorama operativo.
- Orders reorganizado con formulario de nueva orden en modal.
- Closing enfocado en cierre operativo.
- External export separado para handoff externo y sync jobs.
- Audit trail separado para trazabilidad.
- Seed local Colombia y seed Australia parametrizados.
- Documento de QA creado para validar la demo local.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`
- `npm run db:seed:colombia`
- `npm run db:seed:australia`

## 2026-04-25 - SER-2 Harden visit state transitions

Objetivo:

- Evitar que una visita pueda saltar a estados incoherentes.
- Alinear la UI con reglas reales de transicion.
- Proteger la demo contra clicks accidentales durante pruebas.

Resultado:

- Matriz central de transiciones en `src/lib/visit-state.ts`.
- Validacion server-side en acciones provider y carer.
- Botones de estado filtrados segun transiciones validas.
- Review restringida a visitas en `under_review`.
- Reemplazo bloqueado para visitas que ya entraron a ejecucion, review, aprobacion o rechazo.
- Matriz documentada en `docs/business-rules.md`.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`

Pendiente:

- Pruebas manuales en browser con seed Colombia antes de marcar cierre total de QA.
