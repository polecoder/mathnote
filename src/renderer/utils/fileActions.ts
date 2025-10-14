import type * as monaco from "monaco-editor";
import type { EditorManager } from "../modules/EditorManager";
import type { PreviewManager } from "../modules/PreviewManager";

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

  editorManager.loadFromPath(res.path, res.content);
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
  // Caso 1: el archivo ya tiene path (currentFilePath) -> guardar directamente
  const saveRes = await editorManager.saveToCurrentPath();
  if (saveRes.ok) {
    return true;
  }

  // Caso 2: el archivo no tiene path (currentFilePath=null) -> guardar como
  if (saveRes.error === "no_path") {
    const suggested =
      (editorManager.getCurrentFilePath() || "untitled.md").split("\\").pop() ??
      "untitled.md";
    const pick = await window.api.saveAs(suggested);
    if (!pick.ok) {
      return false;
    }

    const writeRes = await window.api.saveFile(pick.path, editor.getValue());
    if (writeRes.ok) {
      editorManager.setCurrentFilePath(pick.path);
      return true;
    }
    alert("Error al guardar el archivo: " + (writeRes.error ?? ""));
    return false;
  }

  alert("Error al guardar el archivo: " + (saveRes.error ?? ""));
  return false;
}
