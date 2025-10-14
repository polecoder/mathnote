# MathNote — Instrucciones para agentes AI

Breve y directo: estas notas ayudan a un agente AI a ser productivo rápidamente en el código de MathNote.

1. Contexto general

   - Proyecto Electron + Vite que aloja una UI renderer en `src/renderer` y el proceso principal en `src/main`.
   - `vite.config.ts` define `root: "src/renderer"` y usa `vite-plugin-electron` para empaquetar `../main/main.js`.
   - `package.json` expone scripts importantes: `dev` (vite), `build` (vite build) y `start` (electron .).

2. Estructura y responsabilidades principales

   - `src/main/main.ts`: proceso principal de Electron. Crea `BrowserWindow` y carga `VITE_DEV_SERVER_URL` en dev o `renderer/index.html` en producción.
   - `src/renderer/renderer.ts`: punto de entrada del renderer. Inicializa Monaco (editor), Split.js y conecta `EditorManager` y `PreviewManager`.
   - `src/renderer/modules/EditorManager.ts`: wrapper singleton de Monaco. Exponer `getEditor()`, `syncScroll(ratio)` y `setPartner()`.
   - `src/renderer/modules/PreviewManager.ts`: renderiza HTML en un contenedor y sincroniza scroll con `EditorManager`.
   - `src/renderer/modules/markdown/MarkdownManager.ts`: instancia de `markdown-it` con plugin KaTeX; usar `markdownToHTMLwithMath(source: string)`.

3. Patrones y convenciones relevantes

   - Singletons para managers (usar `getInstance()` para obtener la instancia única).
   - Scroll sync basado en ratios entre editor y preview (no usar px directos). Usa `getScrollHeight()` y `clientHeight` como en `EditorManager`.
   - Renderer asume `root` en Vite es `src/renderer`; rutas relativas de assets usan `./` (ver `index.html` y `vite.config.ts` `base: "./"`).
   - Código TS target ESNext, sin emisión (`tsconfig.json` tiene `noEmit: true`). Desarrollo con `vite` (dev server).

4. Comandos de desarrollo / pruebas / lint

   - `npm run dev` — inicia Vite (dev server). En este modo `main` carga `process.env.VITE_DEV_SERVER_URL`.
   - `npm run build` — empaqueta el renderer (y `vite-plugin-electron` build para main según config).
   - `npm run start` — arranca Electron desde la carpeta raíz (útil después de `build`).
   - `npm run lint` — ejecuta ESLint sobre `.ts`.

5. Integraciones y dependencias clave

   - Monaco Editor: `monaco-editor` usado en `EditorManager`.
   - Markdown: `markdown-it` + `@mdit/plugin-katex` y `katex` para render de matemáticas (ver `MarkdownManager`).
   - Split panes: `split.js` para layout resizable (`renderer.ts`).

6. Ejemplos concretos a usar como referencia

   - Para renderizar Markdown con KaTeX: ver `MarkdownManager.markdownToHTMLwithMath`.
   - Para sincronizar scroll desde el editor: `EditorManager` usa `onDidScrollChange` y calcula `ratio = scrollTop/(scrollHeight-clientHeight)`.
   - Para arrancar en modo desarrollo: `npm run dev` y luego `npm run start` en otra terminal para abrir la app con Electron apuntando al dev server.

7. Qué buscar cuando modifiques código

   - Evitar romper el contrato singleton (`getInstance()`), especialmente para managers que mantienen estado DOM.
   - Mantener `root: "src/renderer"` en `vite.config.ts` si mueves archivos renderer.
   - Si añades assets estáticos, respetar rutas relativas (base: `./`) para que `index.html` funcione en producción.
