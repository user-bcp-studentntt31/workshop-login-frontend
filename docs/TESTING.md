# Estrategia y resultados de pruebas

Fecha de ejecución: 2026-10-19

## Alcance

La suite cubre el flujo descrito en `docs/ENDPOINTS.md`: validación de
credenciales, login, sesión, navegación, consulta y transformación de tareas,
errores y logout.

Vitest ejecuta pruebas unitarias y de integración de clases. Los servicios HTTP
se prueban con dobles de `HttpClient`; no se llaman los servicios reales.

## Matriz

| flujo | caso | tipo | resultado esperado |
|---|---|---|---|
| Login y tareas | Credenciales válidas y tareas disponibles | Camino feliz integrado | Guarda sesión, navega, consulta tareas con owner y Bearer y presenta la colección. |
| Login | Usuario vacío o espacios | Caso borde | No llama `AuthService` y muestra la validación. |
| Login | Contraseña vacía o espacios | Caso borde | No llama `AuthService` y muestra la validación. |
| Login | Respuesta sin token | Caso borde | No crea sesión ni navega y muestra error público. |
| Login | Backend caído | Error | No crea sesión, restablece `busy` y muestra error público. |
| Login | Timeout de 5000 ms | Error | Restablece el formulario sin crear sesión. |
| Login | Detalle o HTML externo | Seguridad | No expone detalles ni renderiza HTML dinámico. |
| Sesión | Guardar, leer y borrar sesión | Camino feliz | Usa claves centralizadas y conserva preferencias en logout. |
| Sesión | Usuario con JSON inválido | Error | Elimina el dato inválido y devuelve `null`. |
| Preferencias | Valores parciales almacenados | Caso borde | Combina solo claves conocidas con valores predeterminados. |
| Preferencias | JSON inválido | Error | Registra el error y devuelve valores predeterminados. |
| Dashboard | Sin token | Caso borde | No consulta tareas y navega a `/login`. |
| Dashboard | Token y usuario válidos | Camino feliz | Delega la consulta con owner y token. |
| Dashboard | Usuario sin username | Caso borde | Consulta con owner vacío. |
| Dashboard | Tareas visibles y archivadas | Camino feliz | Conserva todas, excluye archivadas, etiqueta y ordena visibles. |
| Dashboard | Token inválido | Error | Muestra detail, termina carga y mantiene sesión según contrato actual. |
| Dashboard | Red caída | Error | Muestra mensaje disponible y termina carga. |
| Dashboard | Error sin mensaje | Error | Usa `No se pudo cargar el dashboard`. |
| Tareas HTTP | Respuesta no arreglo | Respuesta inesperada | `TasksService` rechaza la respuesta con error controlado. |
| Logout | Sesión y preferencias presentes | Camino feliz | Elimina sesión, conserva preferencias y navega a `/login`. |
| Formato | Datos presentes, ausentes o tarea nula | Casos borde | Formatea mayúsculas y usa valores predeterminados. |
| Aplicación | Componente raíz y rutas | Configuración | El componente se crea y las rutas esperadas existen. |

## Organización del código de pruebas

| archivo | responsabilidad |
|---|---|
| `src/app/auth-flow.spec.ts` | Camino feliz integrado login -> tareas. |
| `src/app/login/login.component.spec.ts` | Validaciones, UI, errores y delegación a AuthService. |
| `src/app/dashboard/dashboard.component.spec.ts` | Sesión, transformación, estados y errores de tareas. |
| `src/app/services/auth.service.spec.ts` | URL, body y timeout del login. |
| `src/app/services/tasks.service.spec.ts` | URL, Bearer y validación de respuesta de tareas. |
| `src/app/services/session.service.spec.ts` | Persistencia centralizada de sesión. |
| `src/app/services/preferences.service.spec.ts` | Lectura, mezcla, error y guardado de preferencias. |
| `src/app/utils/legacy-format.spec.ts` | Formato nominal y valores predeterminados. |
| `src/app/app.component.spec.ts` | Creación del componente raíz. |
| `src/app/app.routes.spec.ts` | Rutas login, dashboard y fallbacks. |

### Ejemplo: contrato de login

```ts
const post = vi.fn().mockReturnValue(of(response));
const service = new AuthService({ post } as unknown as HttpClient);

await service.login('student', 'Workshop123!');

expect(post).toHaveBeenCalledWith(
  'http://localhost:8080/auth/login',
  {
    username: 'student',
    password: 'Workshop123!',
    client: 'angular-workshop'
  },
  { timeout: 5000 }
);
```

### Ejemplo: contrato de tareas

```ts
const get = vi.fn().mockReturnValue(of([]));
const service = new TasksService({ get } as unknown as HttpClient);

await service.loadTasks('student', 'token-123');

const [url, options] = get.mock.calls[0];
expect(url).toBe('http://localhost:8000/api/tasks?owner=student');
expect(options.headers.get('Authorization')).toBe('Bearer token-123');
```

### Ejemplo: respuesta inesperada

```ts
const get = vi.fn().mockReturnValue(of({ title: 'Not an array' }));
const service = new TasksService({ get } as unknown as HttpClient);

await expect(service.loadTasks('student', 'token-123')).rejects.toThrow(
  'No se pudo cargar el dashboard'
);
```

## Ejecución real

Directorio:

```text
C:\Users\Usuario\Documents\t53174-felix-chacaliaza-gutierrez\reqflow-workspace\workshop-login-frontend
```

| comando | código de salida | resultado |
|---|---:|---|
| `npm test` | 0 | 10 archivos y 41 pruebas aprobadas; 0 fallidas. |
| `npm run test:coverage` | 0 | Thresholds de 85% superados. |
| `npm run build` | 0 | Build Angular exitoso. |
| `npm audit --audit-level=moderate` | 1 | 25 alertas restantes: 9 moderadas, 10 altas y 6 críticas en Angular/tooling. |
| `npm ls axios lodash --all` | 1 | Árbol vacío; Axios y Lodash no están instalados. |

## Cobertura

| métrica | resultado | threshold |
|---|---:|---:|
| Sentencias | 97.68% | 85% |
| Ramas | 87.80% | 85% |
| Funciones | 90% | 85% |
| Líneas | 97.68% | 85% |

`vitest.config.ts` aplica los thresholds al código de producción. Se excluyen:

- specs;
- `src/app/testing`, por ser infraestructura exclusiva de pruebas;
- modelos sin ejecución;
- `main.ts`, entry point de bootstrap fuera del patrón incluido.

## Fallos

No hubo pruebas fallidas ni errores de build.

La auditoría continúa fallando por dependencias de Angular y tooling. No se
silenció el scanner ni se ejecutó `npm audit fix --force`. Axios y Lodash ya no
forman parte del árbol.

## Pendientes

| pendiente | motivo |
|---|---|
| Decisión de logout ante `401`/`403` | El contrato actual conserva sesión y muestra el error. |
| Actualización segura de Angular/tooling | Requiere analizar compatibilidad de versiones y advisories restantes. |
| Cookie HttpOnly | Requiere coordinación con backend para resolver completamente H-01. |

## Pruebas propuestas

| prueba | tipo | objetivo |
|---|---|---|
| Navegador contra servicios controlados | End-to-end | Validar DOM, rutas y servicios reales en conjunto. |
| Logout entre pestañas | Estado | Verificar sincronización frente a la caché en memoria. |
| Error 403 de tareas | Error | Confirmar si comparte el comportamiento documentado del 401. |

## Documentos consultados

- `docs/ENDPOINTS.md`.
- `docs/GOOD_PRACTICES.md`.
- `REGLAS.md`.
- `PLAN-PENDIENTES.md`.
- `package.json`.
- `vitest.config.ts`.
