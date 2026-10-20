# Inputs del skill embrace-tags

## Formato esperado
Entrada en JSON o lista de campos clave/valor.

## Campos obligatorios
- `modo_lectura`: define la fuente de cambios. Valor permitido en esta etapa:
  - `sin_commit`
- `app_nombre`: nombre de la app para la etiqueta (ejemplo: `accounts_pyme`).

## Campos condicionales
- `paths_incluidos`: opcional. Lista de rutas para limitar analisis.
- `paths_excluidos`: opcional. Lista de rutas a ignorar.
- `alias_endpoint_map`: opcional. Mapa para convertir endpoint real a alias de negocio.

## Regla de deteccion en codigo
- En esta version, solo se analizan lineas modificadas que contengan llamadas de `HttpClient`.
- Se consideran metodos HTTP sobre `HttpClient`: `get`, `post`, `put`, `patch`, `delete`.

## Regla de insercion
- En esta etapa, el tag se inserta unicamente como:
  - `console.log("api.<endpoint_o_alias>.<metodo_http>.<app_nombre>")`

## Reglas de validacion
- Si falta `modo_lectura` o `app_nombre`, devolver error.
- Si `modo_lectura` es distinto de `sin_commit`, devolver error de modo no soportado en esta version.
- Normalizar `app_nombre` y `endpoint_o_alias` a formato slug simple (minusculas y guion bajo cuando aplique).
- Convertir el metodo HTTP detectado a minusculas.

## Ejemplo de input
```json
{
  "modo_lectura": "sin_commit",
  "app_nombre": "accounts_pyme",
  "paths_incluidos": [
    "src/app/services"
  ],
  "alias_endpoint_map": {
    "/api/v1/login": "login"
  }
}
```