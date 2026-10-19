# Informe de pruebas

Fecha de ejecución: 2026-10-19

## Resumen ejecutivo

El repositorio contiene un único archivo de pruebas con un único caso. La prueba
existente pasa, pero solo valida el caso nominal de la utilidad
`formatTaskLabel`. Los componentes de login y dashboard, que implementan el
flujo principal de autenticación, consulta de tareas y cierre de sesión, no
tienen pruebas.

| Indicador | Resultado |
|---|---:|
| Archivos de prueba encontrados | 1 |
| Archivos aprobados | 1 |
| Archivos fallidos | 0 |
| Pruebas ejecutadas | 1 |
| Pruebas aprobadas | 1 |
| Pruebas fallidas | 0 |
| Pruebas omitidas | 0 |
| Cobertura global de sentencias | 3.65% |
| Cobertura global de ramas | 22.22% |
| Cobertura global de funciones | 33.33% |
| Cobertura global de líneas | 3.65% |

## Comandos ejecutados

| Comando | Estado | Resultado |
|---|---|---|
| `npm test` | Aprobado | 1 archivo aprobado y 1 prueba aprobada |
| `npm run test:coverage` | Aprobado | 1 archivo aprobado, 1 prueba aprobada y reporte de cobertura generado |

## Pruebas existentes

| id | prueba | alcance | evidencia | estado |
|---|---|---|---|---|
| T-01 | Formatea prioridad y propietario | Comprueba que `formatTaskLabel({ priority: 'high', owner: 'student' })` devuelva `HIGH · STUDENT`. | `src/app/utils/legacy-format.spec.ts:5` | Aprobado |

## Cobertura observada

| archivo o área | sentencias | ramas | funciones | líneas | observación |
|---|---:|---:|---:|---:|---|
| Total del proyecto | 3.65% | 22.22% | 33.33% | 3.65% | Cobertura insuficiente para el flujo principal. |
| `src/app/utils/legacy-format.ts` | 75% | 25% | 100% | 75% | Solo está cubierto el caso con prioridad y propietario presentes. |
| `src/app/login/login.component.ts` | 0% | 0% | 0% | 0% | No hay pruebas de validación, autenticación, sesión ni errores. |
| `src/app/dashboard/dashboard.component.ts` | 0% | 0% | 0% | 0% | No hay pruebas de carga, filtrado, ordenamiento, errores ni logout. |
| `src/app/app.component.ts` | 0% | 0% | 0% | 0% | Sin prueba de creación o renderizado base. |
| `src/main.ts` | 0% | 0% | 0% | 0% | Bootstrap no cubierto. |

La configuración actual usa el entorno `node`. Para probar componentes Angular
y sus plantillas será necesario configurar un entorno DOM compatible y las
utilidades de pruebas de Angular.

## Pruebas faltantes propuestas

### Prioridad alta: autenticación y sesión

| id | prueba propuesta | tipo | comportamiento esperado | estado |
|---|---|---|---|---|
| T-02 | Rechazar usuario vacío | Unitaria de componente | No invoca el backend, muestra el mensaje de usuario requerido y mantiene `busy` en `false`. | Pendiente |
| T-03 | Rechazar contraseña vacía | Unitaria de componente | No invoca el backend y muestra el mensaje de contraseña requerida. | Pendiente |
| T-04 | Login exitoso | Integración de componente | Envía usuario, contraseña y cliente a `/auth/login`; guarda token, usuario y preferencias; navega a `/dashboard`. | Pendiente |
| T-05 | Respuesta de login sin token | Integración de componente | No crea sesión, informa que la respuesta no contiene token y no navega. | Pendiente |
| T-06 | Error de autenticación del backend | Integración de componente | Muestra el mensaje de error disponible, registra el error y restablece `busy`. | Pendiente |
| T-07 | Error de red durante el login | Integración de componente | Usa el mensaje de error de red, no crea sesión y restablece `busy`. | Pendiente |
| T-08 | Token ausente al abrir dashboard | Unitaria de componente | No consulta tareas y redirige a `/login`. | Pendiente |
| T-09 | Cierre de sesión | Unitaria de componente | Elimina token y usuario, conserva preferencias y navega a `/login`. | Pendiente |
| T-10 | Flujo completo login-dashboard-logout | End-to-end | Autentica, entra al dashboard, consulta tareas con el token y vuelve al login al cerrar sesión. | Pendiente |

### Prioridad alta: consulta y presentación de tareas

| id | prueba propuesta | tipo | comportamiento esperado | estado |
|---|---|---|---|---|
| T-11 | Consulta autenticada de tareas | Integración de componente | Solicita `/api/tasks` con el propietario y una cabecera de autorización con esquema Bearer y el token de sesión. | Pendiente |
| T-12 | Filtrado de tareas archivadas | Unitaria de componente | Excluye de `visibleTasks` las tareas con estado `ARCHIVED`. | Pendiente |
| T-13 | Etiquetado de tareas visibles | Unitaria de componente | Agrega a cada tarea visible la etiqueta producida por `formatTaskLabel`. | Pendiente |
| T-14 | Ordenamiento por prioridad | Unitaria de componente | Ordena las tareas visibles según la regla actual sin perder elementos. | Pendiente |
| T-15 | Respuesta vacía de tareas | Integración de componente | Finaliza la carga, no informa error y muestra el estado vacío. | Pendiente |
| T-16 | Error al consultar tareas | Integración de componente | Muestra el detalle del backend o el mensaje disponible y finaliza la carga. | Pendiente |
| T-17 | Traducción de estados conocidos | Unitaria | Traduce `TODO`, `IN_PROGRESS`, `DONE`, `RESUELTO` y `COMPLETED`. | Pendiente |
| T-18 | Estado desconocido | Unitaria | Conserva el valor original si no existe una etiqueta configurada. | Pendiente |

### Prioridad media: utilidad de formato

| id | prueba propuesta | tipo | comportamiento esperado | estado |
|---|---|---|---|---|
| T-19 | Tarea inexistente | Unitaria | Devuelve `SIN-DATOS` cuando la tarea es nula o indefinida. | Pendiente |
| T-20 | Prioridad ausente | Unitaria | Usa `NORMAL` como prioridad predeterminada. | Pendiente |
| T-21 | Propietario ausente | Unitaria | Usa `SIN-ASIGNAR` como propietario predeterminado. | Pendiente |
| T-22 | Normalización a mayúsculas | Unitaria | Convierte prioridad y propietario a texto en mayúsculas. | Pendiente |

### Prioridad media: preferencias y robustez

| id | prueba propuesta | tipo | comportamiento esperado | estado |
|---|---|---|---|---|
| T-23 | Carga de preferencias guardadas | Unitaria de componente | Combina las preferencias almacenadas con los valores predeterminados. | Pendiente |
| T-24 | Preferencias con JSON inválido | Unitaria de componente | Conserva los valores predeterminados y registra el error sin impedir el uso del login. | Pendiente |
| T-25 | Datos de usuario ausentes o incompletos | Unitaria de componente | Evita fallos al construir la consulta y mantiene el comportamiento documentado para `owner`. | Pendiente |
| T-26 | Renderizado seguro de mensajes | Prueba de seguridad de componente | Los valores controlados por usuario o backend se muestran como texto y no crean elementos HTML ejecutables. | Pendiente |

## Orden recomendado de implementación

1. Completar las ramas de `formatTaskLabel` con T-19 a T-22.
2. Configurar el entorno de pruebas de componentes Angular y crear dobles para
   `Router`, `localStorage` y Axios.
3. Cubrir primero las reglas críticas del login con T-02 a T-07.
4. Cubrir sesión, carga y transformación del dashboard con T-08, T-09 y T-11 a
   T-18.
5. Agregar el flujo end-to-end T-10 cuando los servicios locales puedan
   sustituirse por respuestas deterministas.
6. Medir nuevamente la cobertura y verificar la meta de al menos 85% para el
   código que se modifique durante la refactorización.

## Conclusión

El estado actual de ejecución es exitoso, pero no representa una validación
suficiente de la aplicación: el único caso aprobado cubre una utilidad pequeña,
mientras que el flujo funcional completo permanece sin pruebas. Las pruebas de
autenticación, sesión y consulta de tareas deben considerarse primero por su
impacto funcional y de seguridad.
