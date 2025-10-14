import { readdir } from "fs/promises";
import * as path from "path";

/**
 * Lee recursivamente los archivos .md y las imágenes de una carpeta.
 *
 * @param folderPath - Ruta absoluta de la carpeta a explorar
 * @param basePath - Ruta base para calcular las rutas relativas
 * @returns Promise que resuelve a un array de FileEntry con todos los archivos encontrados
 *
 * @example
 * ```typescript
 * const entries = await readFolderRecursive("/path/to/folder", "/path/to/folder");
 * // entries contendrá todos los archivos .md y las imágenes encontradas recursivamente
 * ```
 */
export async function readFolderRecursive(
  folderPath: string,
  basePath: string
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
  const markdownExtensions = [".md", ".markdown"];

  try {
    const items = await readdir(folderPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(folderPath, item.name);
      const relativePath = path.relative(basePath, fullPath);

      if (item.isDirectory()) {
        // Agregar carpeta
        entries.push({
          name: item.name,
          path: fullPath,
          relativePath,
          type: "directory",
        });
        // Leer recursivamente
        const subEntries = await readFolderRecursive(fullPath, basePath);
        entries.push(...subEntries);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (markdownExtensions.includes(ext)) {
          entries.push({
            name: item.name,
            path: fullPath,
            relativePath,
            type: "markdown",
          });
        } else if (imageExtensions.includes(ext)) {
          entries.push({
            name: item.name,
            path: fullPath,
            relativePath,
            type: "image",
          });
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error reading folder:", err);
  }

  return entries;
}

/**
 * Tipo que representa una entrada de archivo o directorio en el sistema de archivos.
 */
export interface FileEntry {
  name: string;
  path: string;
  relativePath: string;
  type: "directory" | "markdown" | "image";
}
