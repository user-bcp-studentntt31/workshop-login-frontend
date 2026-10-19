# Endpoints y flujo funcional

Este contrato se reconstruyó a partir del código actual del frontend.

## Flujo de autenticación

1. La aplicación abre `/login`.
2. El usuario ingresa sus credenciales.
3. El frontend envía la solicitud de autenticación.
4. Si recibe un token, guarda token, usuario y preferencias en `localStorage`.
5. El frontend navega a `/dashboard`.
6. El dashboard recupera token y usuario; sin token, vuelve a `/login`.
7. Con el token consulta las tareas del usuario.
8. Al cerrar sesión, elimina token y usuario y vuelve a `/login`.

## Login

### `POST http://localhost:8080/auth/login`

Payload:

```json
{
  "username": "string",
  "password": "string",
  "client": "angular-workshop"
}
```

La solicitud usa un timeout de 5000 ms. El frontend consume
`response.data.token` y `response.data.user`.

Si la respuesta contiene un token:

- guarda el token con la clave `workshop_token`;
- guarda el usuario serializado con la clave `workshop_user`;
- guarda las preferencias con la clave `workshop_preferences`;
- navega a `/dashboard`.

## Consulta de tareas

### `GET http://localhost:8000/api/tasks?owner={username}`

El valor de `owner` se obtiene de `workshop_user.username`. La solicitud envía
el token de sesión mediante el esquema de autorización Bearer.

El frontend espera un arreglo de tareas y utiliza los campos:

- `title`;
- `description`;
- `status`;
- `priority`;
- `owner`.

Antes de mostrar las tareas:

- excluye las que tienen estado `ARCHIVED`;
- genera una etiqueta con prioridad y propietario;
- ordena las tareas visibles por prioridad;
- traduce los estados conocidos.

## Cierre de sesión

El flujo actual no llama a un endpoint de logout. El frontend elimina
`workshop_token` y `workshop_user`, conserva `workshop_preferences` y navega a
`/login`.
