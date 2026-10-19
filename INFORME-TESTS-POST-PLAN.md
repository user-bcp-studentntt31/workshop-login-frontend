# Informe de pruebas posterior a la ejecución del plan

Fecha de ejecución: 2026-10-19

## Objetivo

Registrar el estado real de pruebas, cobertura y compilación después de
implementar `PLAN.md` para los hallazgos H-01 y H-02.

## Resumen ejecutivo

La ejecución posterior al plan fue satisfactoria:

- 4 archivos de pruebas aprobados;
- 20 pruebas aprobadas;
- 0 pruebas fallidas;
- 0 pruebas omitidas;
- compilación Angular exitosa;
- cobertura superior al 85% en todos los archivos de producción modificados.

La cobertura global de líneas es 83.69%, por debajo del 85% global, debido
principalmente a archivos no modificados y fuera del alcance del plan:
`main.ts`, `app.component.ts`, `app.routes.ts` y ramas pendientes de
`legacy-format.ts`. La regla de `REGLAS.md` exige al menos 85% para el código
modificado, condición que sí se cumple.

## Comandos ejecutados

| comando | estado | resultado real |
|---|---|---|
| `npm test` | Aprobado | 4 archivos aprobados; 20 pruebas aprobadas; 0 fallidas |
| `npm run test:coverage` | Aprobado | Reporte V8 generado; cobertura global de líneas de 83.69% |
| `npm run build` | Aprobado con advertencias | Aplicación compilada en `dist/workshop-login-frontend` |

## Comparación antes y después del plan

| indicador | antes del plan | después del plan | variación |
|---|---:|---:|---:|
| Archivos de prueba | 1 | 4 | +3 |
| Pruebas ejecutadas | 1 | 20 | +19 |
| Pruebas aprobadas | 1 | 20 | +19 |
| Pruebas fallidas | 0 | 0 | 0 |
| Cobertura global de sentencias | 3.65% | 83.69% | +80.04 puntos |
| Cobertura global de ramas | 22.22% | 84.90% | +62.68 puntos |
| Cobertura global de funciones | 33.33% | 76.19% | +42.86 puntos |
| Cobertura global de líneas | 3.65% | 83.69% | +80.04 puntos |

## Estado por suite

| suite | pruebas | aprobadas | fallidas | omitidas | estado |
|---|---:|---:|---:|---:|---|
| `src/app/login/login.component.spec.ts` | 6 | 6 | 0 | 0 | Aprobado |
| `src/app/dashboard/dashboard.component.spec.ts` | 8 | 8 | 0 | 0 | Aprobado |
| `src/app/services/session.service.spec.ts` | 5 | 5 | 0 | 0 | Aprobado |
| `src/app/utils/legacy-format.spec.ts` | 1 | 1 | 0 | 0 | Aprobado |
| **Total** | **20** | **20** | **0** | **0** | **Aprobado** |

## Casos cubiertos después del plan

### Login y mensajes seguros

| caso | resultado |
|---|---|
| Login exitoso envía endpoint, payload y timeout contractuales | Aprobado |
| Login exitoso guarda sesión y preferencias | Aprobado |
| Login exitoso navega a `/dashboard` | Aprobado |
| Usuario vacío evita la solicitud HTTP y muestra validación | Aprobado |
| Contraseña vacía evita la solicitud HTTP y muestra validación | Aprobado |
| Respuesta sin token no crea sesión ni navega | Aprobado |
| Error del backend muestra un mensaje público estable | Aprobado |
| Mensaje público no incluye usuario ni HTML del backend | Aprobado |
| Plantilla usa interpolación de texto y no `[innerHTML]` | Aprobado |

### Sesión

| caso | resultado |
|---|---|
| Sesión se guarda con las claves contractuales | Aprobado |
| Token persistido se lee una vez y se reutiliza en memoria | Aprobado |
| Usuario válido se recupera de la sesión | Aprobado |
| Usuario con JSON inválido se informa y elimina | Aprobado |
| Logout elimina token y usuario | Aprobado |
| Logout conserva preferencias | Aprobado |

### Dashboard y tareas

| caso | resultado |
|---|---|
| Sin token redirige a `/login` y no consulta tareas | Aprobado |
| Consulta usa `owner` y autorización Bearer contractuales | Aprobado |
| Usuario sin nombre consulta con `owner` vacío | Aprobado |
| Tareas archivadas se excluyen de la vista | Aprobado |
| Tareas visibles reciben etiqueta | Aprobado |
| Tareas visibles se ordenan según la regla actual | Aprobado |
| Error con detalle de API se presenta y termina la carga | Aprobado |
| Error de red usa el mensaje disponible y termina la carga | Aprobado |
| Estados conocidos se traducen | Aprobado |
| Estados desconocidos se conservan | Aprobado |

### Utilidad de formato

| caso | resultado |
|---|---|
| Prioridad y propietario se convierten a mayúsculas | Aprobado |

## Cobertura posterior al plan

### Código de producción modificado

| archivo | sentencias | ramas | funciones | líneas | cumple 85% |
|---|---:|---:|---:|---:|---|
| `src/app/login/login.component.ts` | 96.72% | 90.90% | 100% | 96.72% | Sí |
| `src/app/dashboard/dashboard.component.ts` | 100% | 90% | 100% | 100% | Sí |
| `src/app/services/session.service.ts` | 100% | 100% | 100% | 100% | Sí |

`src/app/login/login.component.html` cambió para eliminar `[innerHTML]`. Su
corrección se comprueba mediante una prueba que lee la plantilla y verifica la
ausencia de esa vinculación y la presencia de interpolación de texto.

### Cobertura global

| métrica | resultado |
|---|---:|
| Sentencias | 83.69% |
| Ramas | 84.90% |
| Funciones | 76.19% |
| Líneas | 83.69% |

### Archivos con cobertura pendiente

| archivo o área | cobertura de líneas | observación |
|---|---:|---|
| `src/main.ts` | 0% | Bootstrap de la aplicación sin prueba. |
| `src/app/app.component.ts` | 0% | Componente raíz sin prueba. |
| `src/app/app.routes.ts` | 0% | Declaración de rutas sin prueba directa. |
| `src/app/utils/legacy-format.ts` | 75% | Falta cubrir tarea nula y valores predeterminados. |
| `src/app/testing/memory-storage.ts` | 71.42% | Utilidad exclusiva de pruebas; faltan métodos no usados por los casos actuales. |

## Validación de H-01

Estado en `HALLAZGOS.md`: **Mitigado**.

Evidencia de corrección:

- la sesión se administra desde un único servicio;
- los componentes no conocen las claves de token y usuario;
- el token se mantiene en memoria después de la primera lectura;
- el logout elimina sesión y conserva preferencias;
- todas las pruebas de sesión, login y dashboard pasan.

Riesgo residual:

El token continúa persistido en `localStorage` para preservar el contrato
vigente. Un script ejecutado en el mismo origen todavía podría leerlo. La
resolución completa requeriría que el backend emitiera una cookie `HttpOnly`,
`Secure` y con una política `SameSite` adecuada.

## Validación de H-02

Estado en `HALLAZGOS.md`: **Resuelto**.

Evidencia de corrección:

- la plantilla no utiliza `[innerHTML]`;
- los mensajes se renderizan mediante interpolación de texto;
- no se concatena el nombre del usuario en mensajes de error;
- los detalles internos del backend no se muestran;
- las pruebas con contenido de apariencia HTML pasan.

## Resultado del build

La compilación terminó correctamente y produjo los artefactos en
`dist/workshop-login-frontend`.

Se mantienen dos advertencias:

1. `axios` no es consumido como módulo ESM.
2. `lodash/merge` no es consumido como módulo ESM.

Estas advertencias no impiden la compilación y corresponden a dependencias
preexistentes. Su corrección pertenece a hallazgos pendientes fuera del alcance
de H-01 y H-02.

## Pruebas adicionales recomendadas

### Prioridad alta

| prueba pendiente | justificación |
|---|---|
| Flujo end-to-end login -> dashboard -> logout | Las pruebas actuales caracterizan clases y contratos, pero no ejecutan el flujo completo en un navegador. |
| Cookie `HttpOnly` cuando exista soporte del backend | Permitirá verificar la resolución completa del riesgo residual de H-01. |

### Prioridad media

| prueba pendiente | justificación |
|---|---|
| `formatTaskLabel` con tarea nula | Cubrir el resultado `SIN-DATOS`. |
| `formatTaskLabel` sin prioridad | Cubrir el valor predeterminado `NORMAL`. |
| `formatTaskLabel` sin propietario | Cubrir el valor predeterminado `SIN-ASIGNAR`. |
| Preferencias con JSON inválido | Verificar que el login conserve valores predeterminados. |
| Error de tareas sin detalle ni mensaje | Cubrir el mensaje final de respaldo del dashboard. |
| Pruebas del componente raíz y rutas | Elevar cobertura global y validar redirecciones declarativas. |

## Conclusión

La ejecución posterior al plan es satisfactoria. Las 20 pruebas pasan, el build
es exitoso y todo el código de producción modificado supera el 85% de cobertura.
H-02 quedó resuelto y H-01 quedó mitigado con un riesgo residual explícito. Las
brechas de cobertura global restantes corresponden principalmente a código no
modificado y a pruebas adicionales fuera del alcance de `PLAN.md`.
