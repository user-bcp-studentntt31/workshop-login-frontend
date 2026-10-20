# Outputs del skill embrace-tags

## Formato de salida
Salida en JSON estructurado con etiquetas Embrace y ubicaciones donde se insertaron.

## Estructura
- `tags`: lista de etiquetas generadas.
- `inserciones`: lista de ubicaciones donde se inserto cada etiqueta.
- `errores`: lista de errores de validacion o deteccion.

## Reglas de salida
- Si la entrada es valida y hay llamadas de `HttpClient` detectadas, generar etiquetas con formato:
  - `api.<endpoint_o_alias>.<metodo_http>.<app_nombre>`
- La insercion en codigo debe ser via `console.log("<tag>")`.
- Si no hay llamadas detectadas, devolver `tags` vacio y `errores` vacio.
- Si la entrada no es valida, devolver errores y no insertar etiquetas parciales.
- Mantener orden deterministico por archivo y linea.
- Cada elemento en `inserciones` debe apuntar a la linea donde se detecto el uso de `HttpClient`.

## Ejemplo de output valido
```json
{
  "tags": [
    "api.login.post.accounts_pyme",
    "api.tasks.get.accounts_pyme"
  ],
  "inserciones": [
    {
      "archivo": "src/app/services/auth.service.ts",
      "linea": 42,
      "tag": "api.login.post.accounts_pyme",
      "insercion": "console.log(\"api.login.post.accounts_pyme\")"
    },
    {
      "archivo": "src/app/services/tasks.service.ts",
      "linea": 31,
      "tag": "api.tasks.get.accounts_pyme",
      "insercion": "console.log(\"api.tasks.get.accounts_pyme\")"
    }
  ],
  "errores": []
}
```

## Ejemplo de output con error
```json
{
  "tags": [],
  "inserciones": [],
  "errores": [
    "modo_lectura no soportado en esta version: commit_remoto. Use sin_commit"
  ]
}
```