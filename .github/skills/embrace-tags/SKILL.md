---
name: embrace-tags
description: Genera etiquetas Embrace siguiendo un formato estandar definido por la organizacion.
---

# Skill: Embrace Tags

## Objetivo
Leer cambios sin commit (working tree) y crear etiquetas Embrace para llamadas a endpoints.

## Cuando usar este skill
- Cuando necesites etiquetar automaticamente llamadas a APIs detectadas en cambios de codigo.
- Cuando quieras procesar archivos cambiados que aun no tienen commit.

## Entradas
El skill usa la especificacion de [inputs.md](inputs.md).

## Salidas
El skill usa la especificacion de [outputs.md](outputs.md).

## Referencia obligatoria
Antes de ejecutar cualquier analisis o insercion, el skill debe leer y respetar:
- [inputs.md](inputs.md)
- [outputs.md](outputs.md)

## Proceso
1. Leer la opcion de fuente de cambios indicada por el usuario.
2. Cargar cambios segun la fuente elegida:
	- `sin_commit`: leer archivos cambiados en control de cambios aun no confirmados.
3. Detectar uso de `HttpClient` dentro de las lineas modificadas.
4. Cuando se detecte `HttpClient` con metodos HTTP (`get`, `post`, `put`, `patch`, `delete`), tomar esa linea como punto de etiquetado.
5. Extraer `endpoint_o_alias`, `metodo_http` y `app_nombre`.
6. Construir etiqueta con el formato actual:
	- `api.<endpoint_o_alias>.<metodo_http>.<app_nombre>`
7. Insertar la etiqueta justo en la linea donde ocurre la llamada de `HttpClient` usando:
	- `console.log("api.<endpoint_o_alias>.<metodo_http>.<app_nombre>")`
8. Devolver resumen de etiquetas y ubicaciones modificadas.

## Alcance actual
- Caso implementado por ahora: solo llamadas a endpoints detectadas mediante `HttpClient`.
- Fuente de cambios soportada en esta etapa: solo `sin_commit`.
- En el futuro se pueden agregar mas tipos de etiqueta sin romper este formato base.

## Reglas
- No inventar endpoint, metodo o app si no se pueden inferir de forma confiable.
- Convertir `metodo_http` a minusculas (`get`, `post`, `put`, `patch`, `delete`).
- Normalizar separadores para mantener un formato estable.
- Si falta informacion obligatoria para formar etiqueta, reportar error y no insertar etiqueta parcial.
- No etiquetar llamadas que no usen `HttpClient` en esta version del skill.
- En esta etapa, la unica forma de insercion permitida es `console.log(...)`.