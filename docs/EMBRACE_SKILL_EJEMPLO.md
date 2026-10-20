# Ejemplo para probar el skill embrace-tags

## 1) Archivo de prueba creado
- `src/app/services/embrace-skill-example.service.ts`
- `src/app/services/embrace-skill-example-admin.service.ts`
- `src/app/services/embrace-skill-example-billing.service.ts`

Este archivo tiene dos llamadas `HttpClient` sin tag insertado:
- `this.http.get('/api/v1/customers/${customerId}')`
- `this.http.post('/api/v1/invoices', payload)`

Los archivos adicionales cubren mas metodos HTTP:
- `embrace-skill-example-admin.service.ts`: `put`, `patch`, `delete`
- `embrace-skill-example-billing.service.ts`: `get`, `post`, `delete`

## 2) Prompt para ejecutar
Usa este prompt en el chat del agente:

```text
Usa el skill embrace-tags.
Lee primero inputs.md y outputs.md.
Procesa solo cambios sin commit (working tree), revisa solo lineas modificadas.
Detecta uso de HttpClient en get/post/put/patch/delete.
Cuando detectes una llamada, inserta en esa misma linea:
console.log("api.<endpoint_o_alias>.<metodo_http>.<app_nombre>")
metodo_http en minusculas.
Si no puedes inferir endpoint o metodo, reporta error y no insertes tag parcial.

Input:
{
  "modo_lectura": "sin_commit",
  "app_nombre": "accounts_pyme",
  "paths_incluidos": [
    "src/app/services/embrace-skill-example.service.ts",
    "src/app/services/embrace-skill-example-admin.service.ts",
    "src/app/services/embrace-skill-example-billing.service.ts"
  ],
  "alias_endpoint_map": {
    "/api/v1/customers": "customers",
    "/api/v1/customers/status": "customer_status",
    "/api/v1/invoices": "invoices",
    "/api/v1/payments": "payments"
  }
}
```

## 3) Resultado esperado
Despues de ejecutar el skill, deberias ver inserciones de este estilo junto a cada llamada:

```ts
console.log("api.customers.get.accounts_pyme")
console.log("api.invoices.post.accounts_pyme")
console.log("api.customers.put.accounts_pyme")
console.log("api.customer_status.patch.accounts_pyme")
console.log("api.invoices.delete.accounts_pyme")
console.log("api.payments.post.accounts_pyme")
console.log("api.payments.delete.accounts_pyme")
```

## 4) Nota
El skill esta configurado para modo `sin_commit`, por eso este ejemplo se basa en archivos con cambios locales no comiteados.
