/**
 * Nodo del árbol de archivos utilizado para renderizar la estructura jerárquica.
 */
export interface TreeNode {
  name: string;
  path: string;
  type: "directory" | "markdown" | "image";
  children?: TreeNode[];
}

/**
 * Construye un árbol jerárquico a partir de una lista plana de entradas de archivos.
 * Organiza los archivos y carpetas en una estructura de árbol basada en sus rutas relativas.
 *
 * @param entries - Array de FileEntry con las entradas de archivos y carpetas
 * @returns Nodo raíz del árbol con todos los archivos organizados jerárquicamente
 *
 * @example
 * ```typescript
 * const entries = [
 *   { name: "file.md", relativePath: "folder/file.md", type: "markdown", ... },
 *   { name: "folder", relativePath: "folder", type: "directory", ... }
 * ];
 * const tree = buildFileTree(entries);
 * // tree.children contendrá la estructura jerárquica
 * ```
 */
export function buildFileTree(entries: FileEntry[]): TreeNode {
  // Nodo raíz vacío
  const root: TreeNode = {
    name: "",
    path: "",
    type: "directory",
    children: [],
  };

  // Ordenar entries: directorios primero, luego archivos alfabéticamente
  const sortedEntries = sortEntries(entries);

  // Construir el árbol procesando cada entrada
  for (const entry of sortedEntries) {
    addEntryToTree(root, entry);
  }

  return root;
}

/**
 * Ordena las entradas de archivos: directorios primero, luego por orden alfabético.
 *
 * @param entries - Array de FileEntry a ordenar
 * @returns Array ordenado de FileEntry
 */
function sortEntries(entries: FileEntry[]): FileEntry[] {
  return [...entries].sort((a, b) => {
    // Directorios van primero
    if (a.type === "directory" && b.type !== "directory") {
      return -1;
    }
    if (a.type !== "directory" && b.type === "directory") {
      return 1;
    }
    // Ordenar alfabéticamente por ruta relativa
    return a.relativePath.localeCompare(b.relativePath);
  });
}

/**
 * Agrega una entrada de archivo al árbol en la posición correcta según su ruta.
 * Crea nodos intermedios si es necesario.
 *
 * @param root - Nodo raíz del árbol
 * @param entry - Entrada de archivo a agregar
 */
function addEntryToTree(root: TreeNode, entry: FileEntry): void {
  const parts = entry.relativePath.split(/[\\/]/);
  let current = root;

  // Navegar por cada parte de la ruta
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLastPart = i === parts.length - 1;

    if (isLastPart) {
      // Es el archivo/directorio final, agregarlo como hijo
      addChildNode(current, entry);
    } else {
      // Es una carpeta intermedia, navegar o crear
      current = getOrCreateIntermediateFolder(current, part);
    }
  }
}

/**
 * Agrega un nodo hijo al nodo actual.
 *
 * @param parent - Nodo padre
 * @param entry - Entrada de archivo a agregar como hijo
 */
function addChildNode(parent: TreeNode, entry: FileEntry): void {
  if (!parent.children) {
    parent.children = [];
  }

  parent.children.push({
    name: entry.name,
    path: entry.path,
    type: entry.type,
    children: entry.type === "directory" ? [] : undefined,
  });
}

/**
 * Obtiene o crea una carpeta intermedia en el árbol.
 *
 * @param parent - Nodo padre
 * @param folderName - Nombre de la carpeta a buscar o crear
 * @returns Nodo de la carpeta encontrada o creada
 */
function getOrCreateIntermediateFolder(
  parent: TreeNode,
  folderName: string
): TreeNode {
  if (!parent.children) {
    parent.children = [];
  }

  // Buscar si ya existe
  let folder = parent.children.find(
    (child) => child.name === folderName && child.type === "directory"
  );

  // Si no existe, crearla
  if (!folder) {
    folder = {
      name: folderName,
      path: "",
      type: "directory",
      children: [],
    };
    parent.children.push(folder);
  }

  return folder;
}
