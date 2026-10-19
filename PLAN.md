# Plan de corrección de H-01 y H-02

## Alcance y contratos que se preservan

Este plan cubre únicamente los hallazgos `H-01` y `H-02`, ambos con estado
`Pendiente` en `HALLAZGOS.md`.

La implementación propuesta debe preservar:

- `POST http://localhost:8080/auth/login`;
- el payload `{ username, password, client: 'angular-workshop' }`;
- el timeout de 5000 ms;
- el consumo de `response.data.token` y `response.data.user`;
- `GET http://localhost:8000/api/tasks?owner={username}`;
- el envío del token mediante autorización Bearer;
- la navegación `/login` -> `/dashboard`;
- la redirección a `/login` cuando no existe sesión;
- el cierre de sesión sin endpoint HTTP;
- la conservación de las preferencias al cerrar sesión.

No se modificarán `docs/ENDPOINTS.md` ni los contratos HTTP. Tampoco se
agregarán dependencias: Vitest y las capacidades existentes de Angular son
suficientes para las pruebas propuestas.

## Riesgos funcionales comunes

- Interrumpir la navegación al dashboard después de un login válido.
- Enviar un token vacío o con un formato distinto al consultar tareas.
- Eliminar las preferencias al cerrar sesión.
- Cambiar los textos que orientan al usuario ante validaciones o errores.
- Exponer detalles internos del backend al intentar conservar los mensajes
  actuales.
- Crear dos implementaciones de sesión durante la migración y dejar lecturas o
  escrituras desalineadas.

## H-01 — Token de autenticación almacenado en `localStorage`

### Hallazgo de origen

`H-01`, tipo `Vulnerabilidad`, severidad `alta`, estado `Pendiente`.

Evidencia actual:

- `src/app/login/login.component.ts:47`;
- `src/app/dashboard/dashboard.component.ts:36`.

### Problema

El token se guarda directamente en `localStorage` desde `LoginComponent` y se
lee directamente desde `DashboardComponent`. Cualquier script que se ejecute
en el origen puede leerlo. Además, la lógica de sesión y las claves mágicas
están distribuidas entre componentes.

Una cookie `HttpOnly`, `Secure` y con política `SameSite` sería la solución más
fuerte frente al robo del token desde JavaScript, pero requiere coordinación
con el backend para emitir la cookie y autenticar las solicitudes. Ese cambio
queda fuera de este alcance porque alteraría el mecanismo descrito por el
contrato actual.

### Cambio propuesto

Aplicar una mitigación cliente incremental mediante un `SessionService`:

1. Centralizar en el servicio las claves de almacenamiento y todas las
   operaciones de lectura, escritura y borrado de la sesión.
2. Mantener el almacenamiento requerido por el flujo actual, pero conservar el
   token en memoria después de la primera lectura para reducir accesos
   dispersos a `localStorage`.
3. Exponer operaciones con propósito explícito, por ejemplo:
   `saveSession`, `getToken`, `getUser` y `clearSession`.
4. Hacer que `LoginComponent` entregue al servicio el token y el usuario
   recibidos, sin escribir claves directamente.
5. Hacer que `DashboardComponent` obtenga token y usuario únicamente mediante
   el servicio y cierre la sesión mediante `clearSession`.
6. Asegurar que `clearSession` elimine token y usuario, pero no las
   preferencias.
7. Mantener el token fuera de logs, mensajes de error y datos visibles en la
   plantilla.
8. Documentar como riesgo residual que el token seguirá siendo accesible para
   JavaScript mientras `docs/ENDPOINTS.md` exija persistirlo en
   `localStorage`.

Esta propuesta reduce duplicación, concentra los valores mágicos y prepara un
cambio futuro a cookie `HttpOnly` sin volver a modificar los componentes. No
debe declararse como eliminación completa de H-01: con el contrato vigente es
una mitigación. El hallazgo se actualizará en `HALLAZGOS.md` a `Mitigado` solo
después de implementar y verificar las pruebas; no se marcará `Resuelto`
mientras el token permanezca en almacenamiento accesible por JavaScript.

### Separación de responsabilidades y Clean Code

- `SessionService` será el único responsable de persistir y recuperar sesión.
- `LoginComponent` conservará la responsabilidad de coordinar la interacción
  del formulario y la navegación.
- `DashboardComponent` consumirá la sesión sin conocer claves de
  almacenamiento.
- Las claves `workshop_token` y `workshop_user` se definirán una sola vez en el
  servicio.
- No se introducirán condicionales anidados; el servicio usará retornos
  anticipados para sesión inexistente o datos inválidos.
- Se definirán tipos para los datos mínimos de usuario y sesión que toque el
  cambio, sin usar `any`.

### Archivos a tocar durante la implementación

- Crear `src/app/services/session.service.ts`.
- Crear `src/app/services/session.service.spec.ts`.
- Modificar `src/app/login/login.component.ts`.
- Modificar `src/app/dashboard/dashboard.component.ts`.
- Crear o ampliar `src/app/login/login.component.spec.ts`.
- Crear o ampliar `src/app/dashboard/dashboard.component.spec.ts`.
- Actualizar únicamente el estado y la evidencia de H-01 en `HALLAZGOS.md`
  después de validar la implementación.

No se propone modificar `docs/ENDPOINTS.md`, plantillas HTML, rutas ni
dependencias para este hallazgo.

### Pruebas de caracterización previas

Antes de modificar la sesión se escribirán pruebas que fijen el comportamiento
observable actual:

1. Un login exitoso guarda exactamente el token recibido, el usuario
   serializado y las preferencias, y navega a `/dashboard`.
2. El dashboard sin token navega a `/login` y no solicita tareas.
3. El dashboard con sesión usa el nombre del usuario como `owner` y envía el
   token con el esquema Bearer.
4. El logout elimina `workshop_token` y `workshop_user`, conserva
   `workshop_preferences` y navega a `/login`.

Después de introducir `SessionService`, se agregarán pruebas unitarias del
servicio:

1. `saveSession` persiste token y usuario con las claves contractuales.
2. `getToken` devuelve el token guardado y reutiliza el valor en memoria.
3. `getUser` devuelve el usuario válido y maneja explícitamente un JSON
   inválido.
4. `clearSession` elimina solo los datos de sesión.
5. Los componentes delegan en el servicio y no acceden directamente a
   `localStorage`.

## H-02 — Mensaje dinámico renderizado con `[innerHTML]`

### Hallazgo de origen

`H-02`, tipo `Vulnerabilidad`, severidad `alta`, estado `Pendiente`.

Evidencia actual:

- `src/app/login/login.component.ts:55`;
- `src/app/login/login.component.html:39`.

### Problema

`LoginComponent` construye fragmentos HTML mediante concatenación. El nombre de
usuario y el mensaje procedente del error pueden formar parte de ese contenido,
y la plantilla lo inserta mediante `[innerHTML]`. Aunque Angular sanitiza esa
vinculación por defecto, el diseño mezcla contenido y presentación y depende de
que dicha protección permanezca activa.

El mensaje también puede exponer detalles internos devueltos por el backend, en
contra de la convención de manejo consistente de errores.

### Cambio propuesto

Eliminar por completo la necesidad de HTML dinámico:

1. Representar `message` como texto plano tipado.
2. Sustituir `[innerHTML]="message"` por interpolación `{{ message }}`.
3. Cambiar los mensajes de validación para que no incluyan etiquetas
   `<strong>`.
4. Para errores de autenticación, mostrar un mensaje estable y orientado al
   usuario, sin concatenar el nombre ingresado ni detalles internos del
   backend.
5. Conservar el detalle técnico únicamente en `console.error`, sin incluir
   credenciales ni token.
6. Extraer los mensajes repetibles a constantes con nombres de propósito para
   evitar cadenas mágicas.
7. Mantener retornos anticipados para las validaciones cuando se implemente el
   cambio, evitando aumentar el anidamiento actual.

No se usará `DomSanitizer`: el login no necesita formato HTML para comunicar
estos errores, y la interpolación de texto es la alternativa más simple y
segura indicada por `docs/GOOD_PRACTICES.md`.

### Separación de responsabilidades y Clean Code

- El componente decide qué mensaje de interfaz mostrar, pero no interpreta ni
  renderiza HTML recibido.
- La plantilla solo presenta texto.
- Los mensajes públicos serán consistentes y no revelarán la forma de los
  errores del backend.
- `message` tendrá tipo `string`.
- Las validaciones usarán retornos anticipados, sin nuevos niveles de
  anidamiento.
- No se incorporará una segunda función de sanitización ni lógica duplicada.

### Archivos a tocar durante la implementación

- Modificar `src/app/login/login.component.ts`.
- Modificar `src/app/login/login.component.html`.
- Crear o ampliar `src/app/login/login.component.spec.ts`.
- Actualizar únicamente el estado y la evidencia de H-02 en `HALLAZGOS.md`
  después de validar la implementación.

No se propone modificar servicios HTTP, endpoints, rutas, estilos,
`docs/ENDPOINTS.md` ni dependencias para este hallazgo.

### Prueba de caracterización previa

Antes de cambiar los mensajes se escribirán pruebas que capturen la intención
funcional sin fijar el HTML inseguro:

1. Usuario vacío: no llama a autenticación y comunica que el usuario es
   obligatorio.
2. Contraseña vacía: no llama a autenticación y comunica que la contraseña es
   obligatoria.
3. Respuesta sin token: no crea sesión, no navega y comunica que no fue posible
   completar la autenticación.
4. Error del backend: termina el estado ocupado, no crea sesión y muestra un
   error al usuario.

Después del cambio se agregarán comprobaciones de seguridad:

1. La plantilla no contiene `[innerHTML]`.
2. Un nombre de usuario con sintaxis HTML se presenta como texto y no crea
   elementos en el DOM.
3. Un mensaje de error del backend con sintaxis HTML no se incorpora al mensaje
   público.
4. El mensaje visible no expone el detalle interno del backend.
5. El flujo exitoso permanece sin mensajes de error y conserva la navegación a
   `/dashboard`.

## Orden de implementación y validación

1. Escribir y ejecutar las pruebas de caracterización de login, sesión,
   dashboard y logout.
2. Implementar `SessionService` y migrar ambos componentes.
3. Ejecutar las pruebas de H-01 y verificar el flujo contractual.
4. Convertir los mensajes del login a texto plano y retirar `[innerHTML]`.
5. Ejecutar las pruebas de H-02.
6. Ejecutar `npm test`, `npm run test:coverage` y `npm run build`.
7. Confirmar al menos 85% de cobertura sobre el código modificado.
8. Actualizar en `HALLAZGOS.md` solo los estados y evidencias validados:
   H-01 como `Mitigado` mientras persista el riesgo residual y H-02 como
   `Resuelto` si todas las comprobaciones pasan.

## Criterios de salida

- Los endpoints, payloads, timeout y navegación permanecen iguales.
- Login, consulta de tareas y logout conservan su comportamiento funcional.
- Ningún componente accede directamente a las claves de sesión.
- La plantilla de login no utiliza `[innerHTML]`.
- Ningún mensaje público concatena contenido del usuario o detalles internos
  del backend como HTML.
- No se agregan dependencias.
- Las pruebas y el build pasan.
- El código modificado alcanza la meta de cobertura establecida por
  `REGLAS.md`.
