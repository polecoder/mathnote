import type * as monaco from "monaco-editor";
import type { EditorManager } from "../modules/EditorManager";
import type { PreviewManager } from "../modules/PreviewManager";
import { TabManager, WELCOME_MODEL_URI } from "../modules/TabManager";

/**
 * Devuelve la plataforma del usuario (Windows, Mac, Linux, etc).
 * @returns La plataforma del usuario.
 */
function getPlatform(): string {
  const nav = navigator as unknown as {
    userAgentData?: { platform?: string };
    userAgent: string;
  };
  return nav.userAgentData?.platform ?? nav.userAgent;
}

/**
 * Verifica si se está presionando la tecla modificadora correcta.
 * @param event El evento de teclado.
 * @returns true si la tecla modificadora está presionada, false en caso contrario.
 */
export function isModifierPressed(event: KeyboardEvent): boolean {
  const platform = getPlatform();
  const isMac = String(platform).toUpperCase().includes("MAC");
  return isMac ? event.metaKey : event.ctrlKey;
}

/**
 * Abre un archivo y carga su contenido en el editor.
 * También actualiza el preview con el nuevo contenido.
 * @param editorManager El administrador del editor.
 * @param previewManager El administrador del visor.
 * @param editor El editor de código.
 * @returns
 */
export async function openFileAndLoad(
  editorManager: EditorManager,
  previewManager: PreviewManager,
  editor: monaco.editor.IStandaloneCodeEditor
): Promise<void> {
  const res = await window.api.openFile();
  if (!res.ok) {
    if (res.error === "file_too_large") {
      alert(
        "El archivo es demasiado grande (máx 2 MB). Cambia a uno más pequeño."
      );
    }
    return;
  }

  // creamos un modelUri para Monaco (usar file URI para archivos reales)
  const modelUri = res.path
    ? `file://${res.path}`
    : `inmemory://model/untitled-${Date.now()}`;
  const tabManager = TabManager.getInstance();
  // crear modelo y pestaña
  editorManager.createModel(modelUri, res.content);
  const name = res.path
    ? res.path.split(/[/\\]/).pop() ?? "untitled.md"
    : "untitled.md";
  tabManager.openTab(name, modelUri, res.path ?? null);
  // cerrar welcome si hay más de una pestaña
  const tabs = tabManager.list();
  if (tabs.length > 1) {
    const welcome = tabs.find((t) => t.getModelUri() === WELCOME_MODEL_URI);
    if (welcome) {
      // forzamos el cerrado de la pestaña de welcome
      void tabManager.closeTab(welcome.getId(), true);
    }
  }
  // switch editor to model
  editorManager.switchToModel(modelUri);
  previewManager.updatePreview(editor.getValue());
}

/**
 * Guarda el archivo actual si ya se tiene un path en Editor o muestra el diálogo "Guardar como" para guardar el archivo en el sistema operativo.
 * @param editorManager El administrador del editor.
 * @param editor El editor de código.
 * @returns true si se guardó el archivo correctamente, false en caso contrario.
 */
export async function saveCurrentOrSaveAs(
  editorManager: EditorManager,
  editor: monaco.editor.IStandaloneCodeEditor
): Promise<boolean> {
  // obtener tab activo
  const tabManager = TabManager.getInstance();
  const active = tabManager.getActive();
  if (!active) {
    alert("No hay archivo activo para guardar.");
    return false;
  }

  // si la pestaña activa tiene un path -> flujo de guardado normal
  const activePath = active.getPath();
  if (activePath) {
    const res = await editorManager.saveModelToPath(
      active.getModelUri(),
      activePath
    );
    if (res.ok) {
      tabManager.setDirty(active.getId(), false);
      return true;
    }
    alert("Error al guardar el archivo: " + (res.error ?? ""));
    return false;
  }

  // si la pestaña activa no tiene path -> flujo de "guardar como"
  const suggested = active.getName() || "untitled.md";
  const pick = await window.api.saveAs(suggested);
  if (!pick.ok) return false;
  const writeRes = await window.api.saveFile(pick.path, editor.getValue());
  if (writeRes.ok) {
    // actualizar la pestaña con el nuevo path/nombre
    active.setPath(pick.path);
    active.setName(pick.path.split(/[/\\]/).pop() ?? active.getName());
    tabManager.setDirty(active.getId(), false);
    tabManager.openTab(
      active.getName(),
      active.getModelUri(),
      active.getPath()
    );
    return true;
  }
  alert("Error al guardar el archivo: " + (writeRes.error ?? ""));
  return false;
}
