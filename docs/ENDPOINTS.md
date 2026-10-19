# Contratos de endpoints externos

Este documento describe el comportamiento verificable del frontend actual. Los
ejemplos proceden de los datos usados por la aplicación y sus pruebas. Cuando
el código no permite confirmar una parte del contrato del backend, se indica
como pregunta abierta.

## Flujo general

1. La aplicación abre la ruta `/login`.
2. `LoginComponent` valida que usuario y contraseña no estén vacíos.
3. El componente llama al endpoint de login.
4. Si la respuesta contiene un token, `SessionService` guarda el token y el
   usuario, y `LoginComponent` guarda las preferencias.
5. La aplicación navega a `/dashboard`.
6. `DashboardComponent` obtiene token y usuario mediante `SessionService`.
7. Si no hay token, navega a `/login`; si lo hay, consulta las tareas.
8. Al cerrar sesión no se llama a un endpoint externo: `SessionService` elimina
   token y usuario, conserva las preferencias y la aplicación navega a
   `/login`.

---

## Endpoint 1: autenticación

### `POST http://localhost:8080/auth/login`

### 1. Quién lo llama

`LoginComponent` delega la llamada a `AuthService`, que usa `HttpClient.post`.

Antes de llamar:

- limpia el mensaje anterior;
- exige que `username` tenga contenido distinto de espacios;
- exige que `password` tenga contenido distinto de espacios;
- activa el estado `busy`, que deshabilita el botón y muestra
  `Ingresando...`.

El componente coordina la UI y navegación; el servicio encapsula HTTP y la URL
base proviene de `environment.ts`.

### 2. Qué envía

#### Headers

El código no configura headers propios para esta solicitud.

| header | valor enviado por el código | obligatorio según el frontend |
|---|---|---|
| Ninguno explícito | No aplica | No |

`HttpClient` recibe un objeto JavaScript como body. El código no declara
manualmente el tipo de contenido.

#### Query params

No envía query params.

#### Body

| campo | tipo enviado | origen | obligatorio | observaciones |
|---|---|---|---|---|
| `username` | `string` | Campo de usuario del formulario | Sí | El frontend rechaza una cadena vacía o compuesta solo por espacios. Envía el valor original, sin aplicar `trim` al payload. |
| `password` | `string` | Campo de contraseña del formulario | Sí | El frontend rechaza una cadena vacía o compuesta solo por espacios. Envía el valor original. |
| `client` | `string` | Constante del componente | Sí | Siempre vale `angular-workshop`. |

Ejemplo verificable:

```json
{
  "username": "student",
  "password": "Workshop123!",
  "client": "angular-workshop"
}
```

Configuración adicional de la solicitud:

| opción | valor |
|---|---:|
| Timeout | 5000 ms |

### 3. Qué espera recibir en éxito

#### Código de estado

El frontend no inspecciona `response.status` ni exige un código concreto. La
solicitud se considera procesable cuando `HttpClient` la resuelve; con su configuración
predeterminada esto corresponde normalmente a una respuesta HTTP 2xx.

**Pregunta abierta:** el código no permite confirmar si el backend garantiza
`200 OK` u otro código 2xx en un login exitoso.

#### Body de respuesta

El frontend lee `response.data` con esta forma:

| campo | tipo esperado | requerido por el comportamiento | uso |
|---|---|---|---|
| `token` | `string` | Sí | Si es truthy, se guarda como token de sesión. Si falta o es vacío, el login se considera fallido. |
| `user` | `object` | Sí para una sesión utilizable | Se entrega a `SessionService` y se persiste como JSON. |
| `user.username` | `string` | Sí para consultar tareas del propietario | Se usa como query param `owner` en el dashboard. |
| `user.displayName` | `string` | No | Si existe, se usa en el saludo; de lo contrario se muestra `username`. |

Ejemplo verificable:

```json
{
  "token": "token-123",
  "user": {
    "username": "student",
    "displayName": "Student"
  }
}
```

Ante esa respuesta, la aplicación:

1. guarda `token-123` bajo la clave `workshop_token`;
2. guarda el usuario serializado bajo `workshop_user`;
3. guarda las preferencias bajo `workshop_preferences`;
4. navega a `/dashboard`;
5. desactiva `busy` al terminar.

### 4. Cómo reacciona ante errores y respuestas inesperadas

| situación | detección en el frontend | reacción de la UI y del estado |
|---|---|---|
| Usuario vacío o solo espacios | Validación anterior a la solicitud | No llama al endpoint. Muestra `Ingrese un usuario.` y permanece en `/login`. |
| Contraseña vacía o solo espacios | Validación anterior a la solicitud | No llama al endpoint. Muestra `Ingrese una contraseña.` y permanece en `/login`. |
| Credenciales inválidas representadas por una respuesta HTTP rechazada por `HttpClient` | Entra al `catch` | Muestra `No se pudo completar la autenticación.`, registra el error técnico en consola, no guarda sesión, no navega y vuelve a habilitar el botón. |
| Timeout al superar 5000 ms | `HttpClient` rechaza la promesa y entra al `catch` | Muestra el mismo mensaje público de autenticación, registra el error en consola, no guarda sesión, no navega y desactiva `busy`. |
| Error de red | `HttpClient` rechaza la promesa y entra al `catch` | Misma reacción que el timeout. |
| Respuesta resuelta sin `token`, con token vacío o falsy | Comprobación `!response.data.token` | Muestra `No se pudo completar la autenticación.`, no guarda sesión, no navega y desactiva `busy`. |
| Respuesta con token pero sin `user` válido | No existe validación estructural previa a `saveSession` | El frontend intenta guardar la sesión y navega a `/dashboard`. Al recuperar un usuario serializado inválido, `SessionService` registra el error, elimina `workshop_user` y el dashboard usa un usuario con `username` vacío. El token permanece guardado. |
| Error cuyo backend incluye un mensaje detallado o HTML | Entra al `catch` | El detalle no se muestra en la UI. Solo se presenta el mensaje público estable; el objeto de error se registra en consola. |

**Pregunta abierta:** el frontend no distingue por código HTTP entre credenciales
inválidas, cuenta bloqueada, falta de autorización u otros errores del backend.
Todos siguen el mismo camino visible.

### 5. Notas de seguridad

- Los mensajes se renderizan mediante interpolación de texto (`{{ message }}`).
  Ya no se utiliza `[innerHTML]` para datos dinámicos.
- El nombre de usuario y el detalle devuelto por el backend no se concatenan al
  mensaje visible.
- El token y el usuario se administran mediante `SessionService`; las claves no
  están distribuidas entre los componentes.
- El token continúa persistido en `localStorage` bajo `workshop_token`. La
  centralización reduce duplicación, pero no elimina el riesgo de lectura por
  scripts ejecutados en el mismo origen.
- El token también se conserva en memoria después de la primera lectura del
  servicio.
- La contraseña no se persiste en almacenamiento por este frontend.
- Las preferencias todavía son leídas y escritas directamente por
  `LoginComponent`, bajo `workshop_preferences`.
- Los errores técnicos se escriben en consola; no deben incluirse credenciales
  ni tokens en los objetos enviados por el backend.

---

## Endpoint 2: consulta de tareas

### `GET http://localhost:8000/api/tasks?owner={username}`

### 1. Quién lo llama

`DashboardComponent` delega la llamada a `TasksService`, que usa
`HttpClient.get`, durante `ngOnInit`.

Antes de llamar:

1. obtiene el token mediante `SessionService.getToken()`;
2. obtiene el usuario mediante `SessionService.getUser()`;
3. si no existe token, navega a `/login` y no llama al endpoint.

La sesión y HTTP están centralizados en servicios. La transformación visual de
tareas permanece en el componente.

### 2. Qué envía

#### Headers

| header | tipo | valor | origen | obligatorio según el frontend |
|---|---|---|---|---|
| `Authorization` | `string` | `Bearer {token}` | `SessionService.getToken()` | Sí; sin token el endpoint no se llama. |

Ejemplo verificable:

```text
Authorization: Bearer token-123
```

#### Query params

| parámetro | tipo enviado | origen | obligatorio | comportamiento si falta el dato |
|---|---|---|---|---|
| `owner` | `string` | `SessionService.getUser()?.username` | Siempre se incluye en la URL | Si no hay usuario o `username` es falsy, se envía una cadena vacía. |

Ejemplo verificable:

```text
GET http://localhost:8000/api/tasks?owner=student
```

Con token pero sin nombre de usuario, el comportamiento verificable es:

```text
GET http://localhost:8000/api/tasks?owner=
```

#### Body

No envía body.

### 3. Qué espera recibir en éxito

#### Código de estado

El frontend no inspecciona `response.status` ni exige un código concreto. La
respuesta se procesa cuando `HttpClient` resuelve la solicitud; con la configuración
predeterminada corresponde normalmente a un código HTTP 2xx.

**Pregunta abierta:** el código no permite confirmar si el backend garantiza
`200 OK`, ni si utiliza otro código 2xx para una colección vacía.

#### Body de respuesta

El frontend espera que `response.data` sea un arreglo. Para cada elemento
consume estos campos:

| campo | tipo esperado | requerido para la UI | uso |
|---|---|---|---|
| `title` | `string` | Sí para mostrar un título útil | Se muestra como encabezado de la tarjeta. |
| `description` | `string` | Sí para mostrar detalle útil | Se muestra como descripción. |
| `status` | `string` | Sí para filtrado, etiqueta y clase visual | `ARCHIVED` se excluye; otros estados se traducen si son conocidos. |
| `priority` | Valor convertible a `string` | No | Se usa para ordenar y crear la etiqueta. Si falta, la etiqueta usa `NORMAL`. |
| `owner` | Valor convertible a `string` | No | Se usa para la etiqueta. Si falta, la etiqueta usa `SIN-ASIGNAR`. |

El componente agrega localmente un campo `label`; no se espera que el backend
lo envíe.

Ejemplo verificable:

```json
[
  {
    "title": "Low",
    "status": "TODO",
    "priority": "low",
    "owner": "student"
  },
  {
    "title": "Archived",
    "status": "ARCHIVED",
    "priority": "high",
    "owner": "student"
  },
  {
    "title": "High",
    "status": "DONE",
    "priority": "high",
    "owner": "student"
  }
]
```

Ante una respuesta válida, el frontend:

1. conserva el arreglo completo en `tasks`;
2. excluye de `visibleTasks` los elementos con `status === 'ARCHIVED'`;
3. agrega a cada tarea visible una etiqueta `{PRIORITY} · {OWNER}` en
   mayúsculas;
4. ordena las tareas visibles comparando `priority` en orden descendente según
   la comparación de cadenas implementada;
5. traduce los estados conocidos:

| estado recibido, sin distinguir mayúsculas/minúsculas | texto mostrado |
|---|---|
| `TODO` | `Por hacer` |
| `IN_PROGRESS` | `En progreso` |
| `DONE` | `Completado` |
| `RESUELTO` | `Resuelto` |
| `COMPLETED` | `Completado` |

Los estados desconocidos se muestran sin traducción.

Si el arreglo está vacío, termina la carga y muestra
`No hay tareas para mostrar todavía.`

### 4. Cómo reacciona ante errores y respuestas inesperadas

| situación | detección en el frontend | reacción de la UI y del estado |
|---|---|---|
| No existe token local | Comprobación anterior a la solicitud | No llama al endpoint y navega a `/login`. |
| Token inválido o expirado y el backend rechaza la solicitud | `HttpClient` rechaza la solicitud y entra al `catch` | No elimina la sesión ni redirige. Detiene el estado de carga y muestra el detalle disponible; si no, usa el mensaje; como último recurso usa `No se pudo cargar el dashboard`. La grilla de tareas queda oculta. |
| Error HTTP con `detail` | Entra al `catch` | Muestra el valor de `detail` textualmente, detiene la carga y mantiene al usuario en `/dashboard`. |
| Error de red con `message` | Entra al `catch` | Muestra `error.message`, detiene la carga y mantiene al usuario en `/dashboard`. |
| Error sin `detail` ni `message` | Entra al `catch` | Muestra `No se pudo cargar el dashboard`, detiene la carga y mantiene al usuario en `/dashboard`. |
| Usuario ausente, JSON inválido o sin `username` pero con token | `SessionService` devuelve `null` o el nombre resulta falsy | Consulta el endpoint con `owner=`. Si el JSON almacenado es inválido, elimina `workshop_user` y registra el error en consola; no elimina el token. |
| Respuesta válida con arreglo vacío | El procesamiento termina sin elementos visibles | Detiene la carga y muestra el estado vacío; no se considera error. |
| Respuesta con tareas `ARCHIVED` únicamente | Todas se excluyen de `visibleTasks` | Detiene la carga y muestra el estado vacío. |
| `response.data` es `null` o provoca una excepción al iterar | La excepción entra al `catch` | Muestra el mensaje disponible o el respaldo, detiene la carga y oculta la grilla. |
| La respuesta no es un arreglo, incluido `null` u objeto | `TasksService` valida la colección antes de devolverla | Rechaza la respuesta con un error controlado, muestra `No se pudo cargar el dashboard`, detiene la carga y no guarda datos inválidos en `tasks`. |
| Una tarea omite `title` o `description` | No hay validación | Angular renderiza el valor ausente como contenido vacío. |
| Una tarea omite `status` | No hay validación previa | No se filtra como archivada; la traducción devuelve un valor vacío y la clase visual usa el sufijo vacío. |
| Una tarea omite `priority` u `owner` | `formatTaskLabel` aplica valores predeterminados | La etiqueta usa `NORMAL` o `SIN-ASIGNAR`, respectivamente. |

**Pregunta abierta:** el frontend no distingue explícitamente un `401` de un
`403` ni conoce un mecanismo de renovación de token. Tampoco está definido en
el código si un token inválido debe provocar logout automático.

### 5. Notas de seguridad

- El header de autorización se construye con el token recuperado por
  `SessionService`; `DashboardComponent` ya no lee directamente la clave de
  token.
- El token sigue persistido en `localStorage`, por lo que continúa el riesgo
  residual de acceso desde scripts ejecutados en el mismo origen.
- El cierre de sesión es local: elimina `workshop_token` y `workshop_user`, no
  llama a un endpoint de revocación y conserva `workshop_preferences`.
- Los valores de tareas y errores se muestran mediante interpolación de Angular,
  no mediante `[innerHTML]`.
- A diferencia del login, el dashboard sí muestra directamente `detail` o
  `message` recibidos en un error. El código no filtra detalles internos antes
  de presentarlos.
- La URL base vive en `environment.ts` y `TasksService` encapsula la llamada
  HTTP.
- `TasksService` valida en tiempo de ejecución que la respuesta sea un arreglo.
  Los campos de cada tarea están tipados, aunque no existe validación de esquema
  campo por campo.

## Preguntas abiertas consolidadas

1. ¿Qué código HTTP exacto devuelve el backend para un login exitoso?
2. ¿Qué códigos y estructura de error usa el backend para credenciales
   inválidas, cuenta bloqueada u otros fallos de autenticación?
3. ¿Qué código HTTP exacto devuelve la API para una colección de tareas válida
   o vacía?
4. ¿Debe un `401` o `403` de tareas eliminar la sesión y redirigir a `/login`?
5. ¿Existe o se planifica un endpoint de revocación de sesión?
6. ¿El backend garantiza siempre un arreglo de tareas y todos los campos
   utilizados por la UI?

## Documentos y fuentes consultados

- `docs/ENDPOINTS.md` anterior, para identificar el contrato legacy que debía
  actualizarse.
- `src/app/login/login.component.ts`.
- `src/app/login/login.component.html`.
- `src/app/login/login.component.spec.ts`.
- `src/app/dashboard/dashboard.component.ts`.
- `src/app/dashboard/dashboard.component.html`.
- `src/app/dashboard/dashboard.component.spec.ts`.
- `src/app/services/session.service.ts`.
