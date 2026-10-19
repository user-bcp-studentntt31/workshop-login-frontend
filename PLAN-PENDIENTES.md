# Plan para resolver H-03 a H-08

## Alcance

Este plan complementa `PLAN.md` sin modificarlo. Cubre únicamente los
hallazgos pendientes H-03, H-04, H-05, H-06, H-07 y H-08 de
`HALLAZGOS.md`.

Los items se implementarán en el orden de este documento. No se avanzará al
siguiente hasta que:

1. exista una prueba de caracterización ejecutada sobre el estado anterior;
2. el cambio del item esté implementado;
3. la prueba de corrección esté verde;
4. el código modificado alcance al menos 85% de cobertura;
5. la fila correspondiente de `HALLAZGOS.md` esté actualizada.

## Contratos que deben preservarse

- `POST http://localhost:8080/auth/login`.
- Body de login con `username`, `password` y
  `client: 'angular-workshop'`.
- Timeout de login de 5000 ms.
- `GET http://localhost:8000/api/tasks?owner={username}`.
- Autorización de tareas mediante esquema Bearer.
- Navegación `/login` -> `/dashboard`.
- Redirección a `/login` cuando no existe token.
- Filtrado de tareas `ARCHIVED`.
- Etiquetado y traducción de estados descritos en `docs/ENDPOINTS.md`.
- Logout local que elimina token y usuario, conserva preferencias y navega a
  `/login`.
- Mensajes de login como texto plano, sin `[innerHTML]`.

## Riesgos funcionales generales

- Cambiar involuntariamente endpoints, payloads, headers o timeout.
- Modificar el orden o filtrado actual de tareas.
- Perder sesión o preferencias durante la extracción de servicios.
- Exponer detalles internos del backend al unificar errores.
- Introducir una configuración de ambiente que no sea incluida por el build.
- Actualizar dependencias sin regenerar y validar el lockfile.
- Declarar resuelto un hallazgo usando solo evidencia documental desactualizada.

---

## Item 1 — H-03: separar HTTP, configuración y responsabilidades

### Hallazgo

`H-03`, componentes que concentran URLs, HTTP, sesión y navegación.

### Estado actual

- `LoginComponent` todavía llama `axios.post` y contiene la URL de login.
- `DashboardComponent` todavía llama `axios.get`, contiene la URL de tareas y
  transforma la respuesta.
- La sesión ya está delegada a `SessionService`.

La evidencia de `HALLAZGOS.md` debe actualizarse porque sus líneas corresponden
al código anterior.

### Prueba de caracterización previa

Ejecutar y conservar verdes:

- `src/app/auth-flow.spec.ts`;
- `src/app/login/login.component.spec.ts`;
- `src/app/dashboard/dashboard.component.spec.ts`.

Estas pruebas fijan:

- endpoint, payload y timeout de login;
- Bearer y query param de tareas;
- mensajes y navegación;
- filtrado, etiquetas, orden y errores.

Comando previo:

```text
npm test -- src/app/auth-flow.spec.ts src/app/login/login.component.spec.ts src/app/dashboard/dashboard.component.spec.ts
```

### Cambio propuesto

1. Crear `AuthService` para la llamada de login.
2. Crear `TasksService` para la consulta de tareas.
3. Usar `HttpClient` de Angular, ya disponible mediante `@angular/common`; no
   agregar una dependencia nueva.
4. Registrar `provideHttpClient()` en el bootstrap de la aplicación.
5. Crear `src/environments/environment.ts` con las URLs base actuales.
6. Mantener las rutas `/auth/login` y `/api/tasks`, payload, query param,
   Bearer y timeout.
7. Mover el mapeo de errores HTTP a funciones o tipos reutilizables, sin
   exponer nuevos detalles al login.
8. Mantener en los componentes solo estado de presentación, navegación y
   coordinación de servicios.
9. Mantener la transformación de tareas fuera de la plantilla. Si se extrae
   del componente, ubicarla en una función pura probada, no dentro del servicio
   HTTP.

### Archivos previstos

- Crear `src/app/services/auth.service.ts`.
- Crear `src/app/services/auth.service.spec.ts`.
- Crear `src/app/services/tasks.service.ts`.
- Crear `src/app/services/tasks.service.spec.ts`.
- Crear `src/environments/environment.ts`.
- Modificar `src/main.ts`.
- Modificar `src/app/login/login.component.ts`.
- Modificar `src/app/dashboard/dashboard.component.ts`.
- Adaptar los specs de componentes y `src/app/auth-flow.spec.ts`.
- Actualizar la fila H-03 de `HALLAZGOS.md`.

### Prueba posterior

- Los specs de ambos servicios verifican URL, método, body, query, header y
  timeout.
- Los specs de componentes verifican que delegan y conservan navegación/UI.
- El flujo integrado sigue verde.
- `npm run build` confirma que la configuración de ambiente se empaqueta.

### Criterio para marcar H-03 resuelto

Ningún componente importa Axios/HttpClient ni contiene URLs de backend. La
sesión permanece en `SessionService` y la navegación permanece en componentes.

---

## Item 2 — H-04: eliminar `any` y validar formas externas

### Hallazgo

`H-04`, uso extensivo de `any`.

### Estado actual

`LoginComponent` ya eliminó sus `any`, pero `DashboardComponent` y
`formatTaskLabel` todavía los usan. La respuesta de tareas tampoco se valida en
tiempo de ejecución.

### Prueba de caracterización previa

Ejecutar:

```text
npm test -- src/app/dashboard/dashboard.component.spec.ts src/app/utils/legacy-format.spec.ts
```

Conservar explícitamente los casos documentados:

- arreglo válido;
- arreglo vacío;
- tareas archivadas;
- campos opcionales de etiqueta;
- respuesta `null`;
- respuesta objeto no arreglo;
- errores con `detail`, `message` y fallback.

La aceptación silenciosa de un objeto no arreglo se registrará como
comportamiento defectuoso previo; la prueba posterior deberá esperar un error
controlado, no perpetuar el bug.

### Cambio propuesto

1. Crear tipos para:
   - request y response de login;
   - usuario de sesión;
   - tarea recibida;
   - tarea visible con `label`;
   - errores HTTP consumidos por la UI.
2. Reubicar tipos compartidos en `src/app/models/` o archivos de tipos con
   nombres de dominio.
3. Tipar `tasks`, `visibleTasks`, `loading`, `error`, respuestas y comparadores.
4. Cambiar `catch (error: any)` por `unknown` y aplicar guards o
   `HttpErrorResponse`.
5. Tipar `formatTaskLabel` con el subconjunto real de campos que consume.
6. Validar que la respuesta de tareas sea un arreglo antes de procesarla.
7. Ante una respuesta no arreglo, producir el mensaje público documentado de
   respaldo y finalizar la carga; no guardar el objeto inválido en `tasks`.
8. No usar aserciones que eviten la validación real de datos externos.

### Archivos previstos

- Crear tipos bajo `src/app/models/`.
- Modificar `src/app/services/auth.service.ts`.
- Modificar `src/app/services/tasks.service.ts`.
- Modificar `src/app/services/session.service.ts`.
- Modificar `src/app/login/login.component.ts`.
- Modificar `src/app/dashboard/dashboard.component.ts`.
- Modificar `src/app/utils/legacy-format.ts`.
- Adaptar specs relacionados.
- Actualizar `docs/ENDPOINTS.md` únicamente en la reacción ante respuesta no
  arreglo, porque este item corrige deliberadamente ese defecto documentado.
- Actualizar la fila H-04 de `HALLAZGOS.md`.

### Prueba posterior

- Búsqueda `rg '\bany\b' src/app --glob '*.ts'` sin coincidencias en producción.
- Prueba de respuesta no arreglo espera un error controlado.
- Pruebas de valores predeterminados de `formatTaskLabel`.
- Build TypeScript/Angular verde.

### Criterio para marcar H-04 resuelto

No existe `any` en código de producción bajo `src/app`, las respuestas externas
están tipadas y la colección de tareas se valida antes de procesarse.

---

## Item 3 — H-05: centralizar todo acceso persistente restante

### Hallazgo

`H-05`, acceso a sesión y claves de almacenamiento duplicados.

### Estado actual

Token y usuario ya están centralizados en `SessionService`, por lo que la
descripción y evidencia actuales están desactualizadas. Sin embargo,
`LoginComponent` todavía conoce `localStorage` y la clave mágica
`workshop_preferences`.

### Prueba de caracterización previa

Conservar verdes:

- sesión guardada con las claves contractuales;
- logout elimina token y usuario;
- logout conserva preferencias;
- preferencias válidas se combinan con valores predeterminados;
- preferencias con JSON inválido no impiden usar el login.

Agregar antes del cambio los dos últimos casos si aún no existen.

### Cambio propuesto

1. Crear `PreferencesService`.
2. Centralizar en él la clave `workshop_preferences`, lectura, escritura,
   parseo y combinación con valores predeterminados.
3. Hacer que `LoginComponent` no acceda directamente a `localStorage`.
4. Mantener `SessionService` como único dueño de token y usuario.
5. Mantener el logout sin eliminar preferencias.
6. Usar tipos y errores explícitos; JSON inválido debe registrarse y recuperar
   los valores predeterminados.

### Archivos previstos

- Crear `src/app/services/preferences.service.ts`.
- Crear `src/app/services/preferences.service.spec.ts`.
- Modificar `src/app/login/login.component.ts`.
- Adaptar `src/app/login/login.component.spec.ts`.
- Verificar `src/app/services/session.service.ts`.
- Actualizar la fila H-05 de `HALLAZGOS.md`.

### Prueba posterior

- `rg 'localStorage' src/app --glob '*.ts'` solo encuentra servicios de
  persistencia y archivos de prueba.
- Specs de sesión y preferencias verdes.
- Flujo login/logout verde.

### Criterio para marcar H-05 resuelto

Los componentes no conocen claves ni APIs de almacenamiento. Token/usuario
pertenecen a `SessionService` y preferencias a `PreferencesService`.

---

## Item 4 — H-06: retirar dependencias directas vulnerables

### Hallazgo

`H-06`, `lodash 4.17.21` y `axios 0.31.0` pendientes de auditoría.

### Estado actual

Ambas dependencias directas permanecen en `package.json`. Una auditoría previa
reportó advisories para ambas. No se deben ocultar los resultados ni usar
excepciones de scanner para declararlas resueltas.

### Prueba de caracterización previa

1. Ejecutar `npm audit --audit-level=moderate` y guardar código de salida y
   resumen.
2. Ejecutar suite completa y build.
3. Confirmar que el contrato HTTP está cubierto por los specs de servicios.

### Cambio propuesto

1. Después de que H-03 use `HttpClient`, eliminar la dependencia directa
   `axios`.
2. Reemplazar `lodash/merge` por una combinación nativa y tipada dentro de
   `PreferencesService`; solo aceptar las claves de preferencias conocidas.
3. Eliminar `lodash` y `@types/lodash`.
4. Regenerar `package-lock.json` mediante npm.
5. No ejecutar `npm audit fix --force`.
6. Ejecutar auditoría posterior y documentar separadamente cualquier advisory
   restante de Angular o herramientas. No atribuirlo a Axios/Lodash si esas
   dependencias ya no existen.

### Archivos previstos

- Modificar `package.json`.
- Regenerar `package-lock.json`.
- Modificar `src/app/services/preferences.service.ts`.
- Eliminar imports de Axios y Lodash remanentes.
- Actualizar `docs/TESTING.md` con los comandos reales.
- Actualizar la fila H-06 de `HALLAZGOS.md`.

### Prueba posterior

- `npm ls axios lodash` no muestra dependencias instaladas directas o
  transitivas con esos nombres.
- `rg 'axios|lodash' src package.json` no encuentra uso en producción o
  manifiesto.
- `npm audit --audit-level=moderate` se ejecuta y su resultado se documenta sin
  silencios.
- Suite y build verdes.

### Criterio para marcar H-06 resuelto

Axios y Lodash ya no forman parte del código ni del árbol instalado. Cualquier
advisory restante queda registrado como hallazgo separado y no se oculta.

---

## Item 5 — H-07: consolidar cobertura del flujo y quality gate

### Hallazgo

`H-07`, cobertura limitada a una utilidad.

### Estado actual

El hallazgo original ya no describe el repositorio: existen pruebas de login,
dashboard, sesión y flujo integrado. La suite actual tiene 28 pruebas. Falta
convertir la meta en un gate automatizado para evitar regresiones.

### Prueba de caracterización previa

Ejecutar:

```text
npm run test:coverage
```

Registrar cobertura global y por archivo. La evidencia actual muestra que
login, dashboard y sesión superan 85%, pero el global todavía queda por debajo
en algunas métricas.

### Cambio propuesto

1. Completar ramas de `legacy-format.ts`.
2. Agregar pruebas mínimas de `AppComponent` y rutas.
3. Evaluar `main.ts` mediante un test de bootstrap con dependencias simuladas;
   si no es estable, excluir únicamente el entry point con justificación
   explícita, nunca código de negocio.
4. Cubrir todos los métodos de `MemoryStorage` o excluir la utilidad de pruebas
   del cálculo de producción con justificación.
5. Configurar thresholds de Vitest de al menos 85% para statements, branches,
   functions y lines sobre código de producción medido.
6. Mantener las pruebas de camino feliz, bordes y errores de
   `docs/TESTING.md`.

### Archivos previstos

- Modificar `vitest.config.ts`.
- Ampliar `src/app/utils/legacy-format.spec.ts`.
- Crear specs para componente raíz, rutas y bootstrap si corresponde.
- Ampliar tests de la utilidad `MemoryStorage` o ajustar el alcance de cobertura
  con justificación.
- Actualizar `docs/TESTING.md`.
- Actualizar la fila H-07 de `HALLAZGOS.md`.

### Prueba posterior

- `npm test` verde.
- `npm run test:coverage` verde con thresholds efectivos de 85%.
- Una verificación controlada confirma que bajar artificialmente la cobertura
  por debajo del threshold hace fallar el comando; no se conservará ese cambio.

### Criterio para marcar H-07 resuelto

El flujo principal tiene pruebas de camino feliz, bordes y errores, y el runner
aplica automáticamente el quality gate de 85% sobre código de producción.

---

## Item 6 — H-08: verificar validaciones sin anidamiento

### Hallazgo

`H-08`, validación del login con condicionales anidados.

### Estado actual

El código ya usa retornos anticipados para usuario y contraseña. El hallazgo
parece resuelto por el diff previo, pero su fila y evidencia están
desactualizadas.

### Prueba de caracterización previa

Ejecutar los casos existentes:

- usuario vacío;
- usuario compuesto por espacios;
- contraseña vacía;
- contraseña compuesta por espacios;
- credenciales válidas continúan hacia autenticación.

### Cambio propuesto

No reescribir lógica correcta. Este item es de verificación:

1. Confirmar que no existe anidamiento de validaciones.
2. Confirmar que cada validación retorna antes de llamar al servicio.
3. Agregar únicamente el caso de espacios que falte.
4. Actualizar evidencia y estado en `HALLAZGOS.md`.

### Archivos previstos

- Ampliar `src/app/login/login.component.spec.ts` solo si falta un caso.
- Actualizar la fila H-08 de `HALLAZGOS.md`.

### Prueba posterior

```text
npm test -- src/app/login/login.component.spec.ts
```

### Criterio para marcar H-08 resuelto

Las validaciones usan retornos anticipados, no llaman al backend con valores
vacíos y los casos están cubiertos por pruebas verdes.

---

## Validación final

Después de completar los seis items:

1. Ejecutar `npm test`.
2. Ejecutar `npm run test:coverage`.
3. Ejecutar `npm run build`.
4. Ejecutar `npm audit --audit-level=moderate`.
5. Ejecutar `git diff --check`.
6. Buscar `any`, Axios, Lodash, URLs de backend en componentes y accesos a
   `localStorage` fuera de servicios.
7. Revisar que `docs/ENDPOINTS.md` siga describiendo el comportamiento real.
8. Confirmar que H-03 a H-08 estén `Resuelto` con una nota breve de diff y
   prueba.

## Resultado esperado

- Componentes sin HTTP directo, URLs, claves de almacenamiento ni `any`.
- Servicios tipados para autenticación, tareas, sesión y preferencias.
- Axios y Lodash retirados.
- Respuestas externas validadas.
- Quality gate automatizado de al menos 85%.
- Validaciones de login simples y cubiertas.
- Contrato funcional preservado salvo la corrección explícita de una respuesta
  de tareas no arreglo, que se documentará.
