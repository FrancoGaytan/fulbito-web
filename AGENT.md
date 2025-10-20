# AGENT.md

Guía oficial para la generación y mantenimiento de nuevo código asistido por el agente.

Este documento establece reglas no negociables, buenas prácticas y un checklist que deben consultarse ANTES de escribir o modificar código en este repositorio. El objetivo es mantener consistencia, evitar regresiones y asegurar calidad técnica y funcional.

---

## 1. Propósito

Estándar único de referencia que el agente (y cualquier colaborador) debe leer antes de:

- Crear nuevos servicios, stores, componentes o vistas.
- Refactorizar lógica existente.
- Agregar documentación o localizaciones nuevas.

---

## 2. Principios Inmutables (Golden Rules)

1. NUNCA duplicar funciones, `computed`, stores o imports al documentar: un único bloque + comentario JSDoc encima.
2. Todos los textos visibles al usuario se obtienen mediante `t('clave.path')` (sin literales hardcode en templates ni scripts, salvo mensajes técnicos en consola).
3. Comentarios JSDoc SIEMPRE antes de la declaración (nunca dentro de la firma) y cerrados correctamente.
4. Evitar `any` salvo justificación; si se usa, documentar el porqué en un comentario corto.
5. Lógica de red SOLO en servicios dentro de `src/lib/*.service.ts` (o `httpService`). Nada de `fetch/axios` directo en componentes.
6. Mutaciones de estado global exclusivamente vía objetos Pinia (`usePlayers`, `useGroups`, etc.).
7. No introducir side-effects dentro de `computed`; deben ser puros.
8. Eliminar código muerto o comentarios obsoletos en la misma PR/refactor.
9. Selectores (derivaciones) => `computed`; transformaciones repetidas => extraer a función utilitaria.
10. Al agregar una feature: actualizar documentación y evaluar si requiere clave de traducción nueva.

---

## 3. Checklist previo a crear/modificar código

Marcar mentalmente (o copiar este bloque en la PR si aplica):

- [ ] ¿Revisé este AGENT.md antes de empezar?
- [ ] ¿Existen ya funciones/utilidades que resuelven parte de lo que necesito?
- [ ] ¿Necesita clave de traducción? Si sí, agregar en diccionario antes de usar.
- [ ] ¿Agregué JSDoc con `@param` / `@returns` donde corresponde?
- [ ] ¿Evité duplicar lógica presente en otra vista/componente?
- [ ] ¿Validé tipos y evité `any` innecesario?
- [ ] ¿Manejo correctamente estados: loading / error / empty state?
- [ ] ¿Las llamadas a servicios están centralizadas?
- [ ] ¿Respeté nombres consistentes (camelCase en TS, kebab-case en templates)?
- [ ] ¿UI reactiva sin watchers innecesarios? (Preferir `computed`).
- [ ] ¿Textos/hints/tooltips localizados?

---

## 4. Estándar de Comentarios / JSDoc

Para funciones, `computed`, composables, servicios y helpers expuestos:

```ts
/**
 * Descripción breve en imperativo.
 * Línea opcional ampliando contexto.
 * @param {Tipo} nombre Descripción.
 * @returns {Tipo} Descripción (si aplica).
 */
function algo(param: Tipo): Retorno { /* ... */ }
```

Reglas:

- No repetir @returns si la función es `void` y la descripción ya lo aclara.
- Computed: documentar qué deriva y fuente de verdad.
- No documentar obviedades triviales (p.ej. un simple wrapper de array.length).

---

## 5. Localización (i18n)

- Nueva clave: seguir la jerarquía existente (`matches.create`, `players.claimError`, etc.).
- No interpolar lógica compleja dentro del template; si se requiere condicional, usar `computed` que devuelva clave o valor final.
- Evitar concatenaciones manuales en runtime que dificulten traducciones futuras.

---

## 6. Servicios HTTP

Estructura recomendada:

```ts
/**
 * Crea un recurso X.
 * @param {PayloadX} payload Datos de creación.
 * @returns {Promise<X>} Recurso creado.
 */
export async function createX(payload: PayloadX): Promise<X> { /* ... */ }
```

Buenas prácticas:

- Reutilizar `httpService` para headers/token.
- Manejar errores: lanzar Error con `message` claro -> UI decide cómo mostrar.
- Evitar suposiciones sobre backend: validar campos opcionales.

---

## 7. Stores (Pinia)

- Campos reactivos planos (`items`, `loading`, etc.).
- Derivaciones => `getters` o `computed` en componentes según acople.
- Acciones asíncronas retornan Promises.
- No mezclar side-effects de UI (alert, confirm) dentro de store.

---

## 8. Componentes Vue (`<script setup>`)

- Props tipadas con `defineProps<>()`.
- Eventos documentados en comentario superior si son relevantes.
- Evitar watchers donde un `computed` + binding resuelve el caso.
- Fragmentar en subcomponentes cuando: (a) template > ~150 líneas o (b) se repite patrón lógico.

---

## 9. Manejo de Carga, Error, Empty

Cada vista que consulta datos debe contemplar:

1. `loading` (spinner / skeleton)
2. `error` (mensaje traducido recuperable)
3. `empty state` (mensaje claro y/o CTA)

Evitar flicker: mantener datos previos hasta que nuevos lleguen (optimizar UX).

---

## 10. Nomenclatura & Tipos

- IDs: `id` o `_id` según provenga del backend; no mezclar en la misma estructura.
- `UUID` tipo alias centralizado en `types`.
- Prefijo booleanos: `is`, `has`, `can`, `should`.
- No abreviar en exceso (`grp`, `plr`, etc.).

---

## 11. Seguridad y Validaciones

- Sanitizar inputs numéricos (ej: clamp 0-10 skills).
- Backend errors: catch -> traducir clave genérica + mostrar detalle opcional en consola.
- Nunca exponer tokens en logs.

---

## 12. Performance / Optimización

- Evitar recomputar filtrados costosos en plantilla: usar `computed`.
- `watch` sólo para efectos (llamadas a servicio, side-effects) no para formateo.
- Debounce manual cuando se agreguen búsquedas reactivas sobre texto.

---

## 13. Edición de Vistas

- Al documentar: NO duplicar código; sólo insertar bloque JSDoc encima.
- Verificar con linter/TS: cero redeclaraciones.
- Revisar que no se introduzcan watchers redundantes.

---

## 14. Estilo de Commits (Sugerido)

`tipo(scope): descripción breve`

Tipos: `feat`, `fix`, `refactor`, `docs`, `chore`, `perf`, `test`.

Ej: `feat(matches): permitir edición de resultado antes de aplicar ratings`

---

## 15. Utilidades Recomendadas (Futuras)

- Helper de tipo para claves de traducción (`type TKey = keyof typeof dictionary`).
- Función `formatDateLocal(date: string|Date): string` centralizada.
- Composable `useConfirm(messageKey)` para centralizar confirm dialogs localizados.

---

## 16. Anti‑Patrones a Evitar

| Anti-patrón | Alternativa |
|-------------|-------------|
| Texto plano en template | `t('...')` |
| Repetir fetch en varios componentes | Centralizar en store / composable |
| Lógica de red en componentes | Servicio en `lib/` |
| Duplicar funciones al documentar | Insertar JSDoc sobre la única definición |
| Mutar arrays directamente sin reemplazo (cuando se necesita reactividad de asignación) | Usar spread / nueva referencia si Pinia no detecta |
| Computed con efectos secundarios | Separar: computed puro + efecto en `watch` |

---

## 17. Roadmap Sugerido (Opcional)

- Tipado estricto de claves de traducción.
- Tests de servicios (mock fetch) para rutas críticas.
- Componente genérico de tabla con slots.
- Soporte dark mode (tailwind `dark:`).
- Linter de claves huérfanas de i18n.

---

## 18. Plantillas Rápidas

Servicio:

```ts
/**
 * Descripción.
 * @param {Input} input Detalle.
 * @returns {Promise<Output>} Recurso resultante.
 */
export async function doThing(input: Input): Promise<Output> {
  // 1. Validar
  // 2. Llamar endpoint
  // 3. Normalizar y retornar
}
```

Función en vista/componente:

```ts
/**
 * Aplica filtros activos a la lista de jugadores.
 * @returns {Player[]} Lista filtrada.
 */
const filteredPlayers = computed(() => { /* ... */ })
```

---

## 19. Uso por el Agente

Antes de cualquier cambio, el agente debe:

1. Releer la sección 2 (Golden Rules).
2. Confirmar que no viola anti‑patrones (sección 16).
3. Generar código ya con claves i18n si hay nuevos textos.
4. Incluir JSDoc consistente.
5. Explicar brevemente en la respuesta qué puntos del checklist fueron cubiertos.

---

## 20. Actualización de este Documento

Si una regla deja de aplicar o surge una nueva práctica, actualizar aquí en la misma PR donde se introduce el cambio.

---

Fin del documento. Consultar este archivo antes de cada aporte.
