# Cheatsheet Piscinas SOP — Documentación

Herramienta de campo para técnicos de piscinas. 29 fichas de diagnóstico,
calculadora de volumen y árboles de decisión. Funciona sin conexión (PWA).

---

## Inicio rápido

```bash
node scripts/validate.mjs   # validar datos
npm run serve               # servir en localhost:3000
```

Abre `http://localhost:3000` en el navegador.

---

## Cómo añadir o editar una ficha

**Sólo toca `data/fichas.json`. No toques ningún archivo JS.**

### 1. Abre `data/fichas.json`

El archivo es un array JSON de objetos. Cada objeto es una ficha con este
esquema (todos los campos son obligatorios salvo `arbol_relacionado`):

```jsonc
{
  "id":                      "mi_nueva_ficha",        // único, snake_case, sin espacios
  "titulo":                  "Nombre del problema",
  "categoria":               "agua",                  // ver tabla de categorías abajo
  "prioridad":               "media",                 // baja | media | alta | critica
  "destacado":               false,                   // true = aparece en "Problemas más comunes"
  "sintomas":                ["Síntoma 1", "Síntoma 2"],
  "palabras_clave":          ["palabra"],
  "sinonimos":               ["otro nombre"],
  "problema_explicado":      "Texto explicativo.",
  "causas":                  ["Causa 1", "Causa 2"],
  "parametros":              [
    ["Parámetro", "Rango OK", "Acción"],              // primera fila = cabeceras
    ["pH", "7,2–7,6", "Si >7,6: baja"]
  ],
  "interpretacion_resultados": "Texto de interpretación.",
  "acciones":                [
    ["PASO", "ACCIÓN"],                               // primera fila = cabeceras
    ["1", "Primer paso"],
    ["2", "Segundo paso"]
  ],
  "que_no_hacer":            ["No hacer X"],
  "calculo_producto":        "Fórmula: (Vol÷10)×Dosis",
  "checklist":               "✓ Paso 1 | ✓ Paso 2",
  "construccion":            "Notas por tipo de vaso.",
  "cuando_derivar":          ["Si persiste >72h"],
  "cuando_cerrar_bano":      ["SIEMPRE si X"],
  "cliente":                 "Texto para decirle al cliente.",
  "parte":                   "Texto para el parte de trabajo.",
  "modulo_relacionado":      "M3",
  "fuentes":                 ["RD 742/2013"],
  "arbol_relacionado":       null                     // o "id_del_arbol"
}
```

### 2. Valida

```bash
npm run validate
# → debe salir ✅ sin errores
```

El validador comprueba:
- IDs únicos y sin campos obligatorios vacíos.
- Que la categoría existe en `data/categorias.json`.
- Que la prioridad es una de: `baja`, `media`, `alta`, `critica`.
- Que `arbol_relacionado` (si no es null) existe en `data/arboles.json`.
- Que el conteo es exactamente 29 fichas (ajusta `EXPECTED_FICHAS` en el
  script si añades más).
- Que no hay campos heredados del formato antiguo (`cat`, `problema`, etc.).

### 3. Sube al servidor

Mínimo: `data/fichas.json` + `sw.js` (con `CACHE_VERSION` incrementado).

---

## Categorías disponibles

| Clave          | Emoji | Nombre               |
|----------------|-------|----------------------|
| `agua`         | 💧    | Agua y química       |
| `algas`        | 🦠    | Algas                |
| `bomba`        | ⚙️    | Bomba                |
| `filtro`       | 🛢️    | Filtro y válvula     |
| `fugas`        | 🚱    | Fugas                |
| `robot`        | 🤖    | Limpiafondos/robot   |
| `salino`       | ⚗️    | Salino/dosificación  |
| `seguridad`    | ⚡    | Seguridad            |
| `mantenimiento`| 🧰    | Mantenimiento        |

Para añadir una nueva categoría, edita `data/categorias.json` siguiendo el
mismo formato.

---

## Cómo añadir un árbol de decisión

Edita `data/arboles.json`. Cada árbol tiene este formato:

```jsonc
{
  "id":     "mi_arbol",
  "titulo": "Título del árbol",
  "nodes": [
    {
      "q": "1. ¿Pregunta?",
      "ops": [
        { "res": "Sí", "act": "Acción si sí." },
        { "res": "No", "act": "Acción si no." }
      ]
    }
  ]
}
```

Las opciones con `res: "Sí"` se muestran en verde; `res: "No"` en rojo.

---

## Cómo añadir fuentes tipográficas self-hosted (opcional)

1. Descarga Inter y IBM Plex Mono en formato `.woff2` desde:
   - https://fonts.google.com/specimen/Inter
   - https://fonts.google.com/specimen/IBM+Plex+Mono
   
   O desde Bunny Fonts (privacidad EU): https://fonts.bunny.net/

2. Coloca los archivos en `assets/fonts/`:
   ```
   assets/fonts/
     inter-400.woff2
     inter-500.woff2
     inter-600.woff2
     inter-700.woff2
     ibm-plex-mono-500.woff2
   ```

3. Descomenta los bloques `@font-face` en `styles/tokens.css`.

Sin estos archivos, la app usa el stack de fuentes del sistema (SF Pro en
macOS/iOS, Segoe UI en Windows, Roboto en Android). El aspecto es excelente
en todos los casos.

---

## Estructura del proyecto

```
cheatsheet-piscinas/
│
├── index.html              App shell principal
├── manifest.webmanifest    PWA manifest
├── sw.js                   Service worker (offline)
├── robots.txt              Noindex (privacidad)
│
├── data/
│   ├── fichas.json         ← AQUÍ SE EDITA EL CONTENIDO
│   ├── arboles.json        ← Árboles de decisión
│   ├── categorias.json     ← Categorías con emoji
│   ├── prioridades.json    ← Labels de prioridad
│   ├── calculos.json       ← Textos y parámetros de la chuleta
│   ├── ficha.schema.json   JSON Schema (referencia)
│   └── arbol.schema.json   JSON Schema (referencia)
│
├── src/
│   ├── app.js              Entrada principal, orquestación
│   ├── data.js             Carga de JSON
│   ├── search.js           Búsqueda accent-insensitive
│   ├── calculator.js       Calculadora de volumen
│   ├── render.js           Funciones de renderizado HTML
│   ├── drawer.js           Drawer/modal de ficha
│   └── sw-register.js      Registro SW + toast de actualización
│
├── styles/
│   ├── tokens.css          Design tokens (colores, tipografía, espaciado)
│   ├── main.css            Estilos de componentes
│   └── print.css           Estilos de impresión / PDF
│
├── assets/
│   ├── fonts/              (vacío — añadir .woff2 si se quiere)
│   └── icons/              Iconos PWA generados
│
├── scripts/
│   ├── extract.mjs         Extracción one-time desde HTML fuente
│   ├── validate.mjs        Validación de datos (npm run validate)
│   └── gen-icons.mjs       Generador de iconos PNG
│
└── docs/
    ├── README.md           Este archivo
    ├── DEPLOY.md           Guía de despliegue
    ├── REVIEW.md           Ítems pendientes de revisión
    └── MIGRATION-REPORT.md Informe de migración inicial
```

---

## Scripts disponibles

```bash
npm run validate   # Valida data/*.json — ejecutar antes de cada despliegue
npm run serve      # Servidor local en http://localhost:3000
npm run extract    # Re-extrae datos del HTML fuente (uso puntual)
npm run icons      # Re-genera iconos PNG en assets/icons/
```

---

## Despliegue

Ver `docs/DEPLOY.md` para instrucciones completas de:
- Probar en local
- Subir al servidor (FTP, rsync, git)
- Configurar subcarpeta
- Proteger con contraseña a nivel servidor
- Configurar HTTPS y cabeceras para PWA

---

## Notas de seguridad del contenido

Los parámetros de química del agua (pH, cloro, cianúrico, etc.), las fórmulas
de dosificación y las reglas "cerrar baño" son contenido de seguridad. **No
los modifiques** sin revisión técnica. Si detectas un error, documéntalo en
`docs/REVIEW.md` y no lo cambies directamente.
