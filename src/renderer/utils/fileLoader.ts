import type { EditorManager } from "../modules/EditorManager";
import type { PreviewManager } from "../modules/PreviewManager";

/**
 * Carga un archivo desde el sistema y lo muestra en el editor.
 * Maneja errores comunes como archivos muy grandes o problemas de lectura.
 *
 * @param filePath - Ruta absoluta del archivo a cargar
 * @param editorManager - Instancia del administrador del editor
 * @param previewManager - Instancia del administrador del preview
 * @returns Promise que se resuelve cuando el archivo se carga exitosamente
 *
 * @example
 * ```typescript
 * await loadFileIntoEditor("/path/to/file.md", editorManager, previewManager);
 * ```
 */
export async function loadFileIntoEditor(
  filePath: string,
  editorManager: EditorManager,
  previewManager: PreviewManager
): Promise<void> {
  const result = await window.api.readFile(filePath);

  if (!result.ok) {
    handleFileLoadError(result.error);
    return;
  }

  // Cargar contenido en el editor
  editorManager.loadFromPath(filePath, result.content);

  // Actualizar preview
  previewManager.updatePreview(editorManager.getEditor().getValue());
}

/**
 * Maneja los errores al cargar un archivo mostrando mensajes apropiados al usuario.
 *
 * @param error - Código de error o mensaje de error
 */
function handleFileLoadError(error: string): void {
  if (error === "file_too_large") {
    alert(
      "El archivo es demasiado grande (máx 2 MB). Cambia a uno más pequeño."
    );
  } else {
    alert("Error al leer el archivo: " + error);
  }
}
