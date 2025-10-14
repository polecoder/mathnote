import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { readFile, stat, writeFile } from "fs/promises";
import * as path from "path";
import { readFolderRecursive } from "./utils/folderReader";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  process.on("uncaughtException", (err) => {
    // eslint-disable-next-line no-console
    console.error("Uncaught exception in main process:", err);
  });

  process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled rejection in main process:", reason);
  });

  // eslint-disable-next-line no-console
  console.log("Main process starting. __dirname=", __dirname);

  if (process.env.NODE_ENV === "development") {
    void win.loadURL("http://localhost:5173");
  } else {
    void win.loadFile(path.join(__dirname, "../index.html"));
  }
}

/**
 * Handlers IPC para operaciones básicas con archivos Markdown
 */
ipcMain.handle("dialog:openFile", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });

  if (canceled || filePaths.length === 0) {
    return { ok: false, error: "cancelled" };
  }

  const filePath = filePaths[0];
  try {
    // check size and reject large files
    const stat = await import("fs/promises").then((m) => m.stat(filePath));
    const maxBytes = 2 * 1024 * 1024; // 2 MB
    if (stat.size > maxBytes) {
      return { ok: false, error: "file_too_large" };
    }

    const content = await readFile(filePath, { encoding: "utf8" });
    return { ok: true, path: filePath, content };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle(
  "file:saveFile",
  async (_event, filePath: string, content: string) => {
    try {
      await writeFile(filePath, content, { encoding: "utf8" });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
);

ipcMain.handle("dialog:saveAs", async (_event, suggestedName: string) => {
  const options: Electron.SaveDialogOptions = {
    defaultPath: suggestedName,
    filters: [{ name: "Markdown", extensions: ["md"] }],
  };
  const { canceled, filePath } = await dialog.showSaveDialog(options);

  if (canceled || !filePath) {
    return { ok: false, error: "cancelled" };
  }

  return { ok: true, path: filePath };
});

/**
 * Handler IPC para abrir una carpeta.
 * Abre un diálogo nativo para seleccionar un directorio del sistema.
 *
 * @returns Promise con el resultado: {ok: true, path: string} si se seleccionó carpeta,
 *          {ok: false, error: string} si se canceló o hubo error
 */
ipcMain.handle("dialog:openFolder", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (canceled || filePaths.length === 0) {
    return { ok: false, error: "cancelled" };
  }

  return { ok: true, path: filePaths[0] };
});

/**
 * Handler IPC para leer el contenido de una carpeta recursivamente.
 * Escanea todos los subdirectorios en busca de archivos Markdown e imágenes.
 *
 * @param _event - Evento IPC (no utilizado)
 * @param folderPath - Ruta absoluta de la carpeta a escanear
 * @returns Promise con el resultado: {ok: true, entries: FileEntry[]} si tuvo éxito,
 *          {ok: false, error: string} si hubo un error
 */
ipcMain.handle("folder:readContents", async (_event, folderPath: string) => {
  try {
    const entries = await readFolderRecursive(folderPath, folderPath);
    return { ok: true, entries };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

/**
 * Handler IPC para leer el contenido de un archivo individual.
 * Verifica el tamaño del archivo antes de leerlo (límite: 2MB).
 *
 * @param _event - Evento IPC (no utilizado)
 * @param filePath - Ruta absoluta del archivo a leer
 * @returns Promise con el resultado: {ok: true, content: string} si tuvo éxito,
 *          {ok: false, error: string} si hubo un error o el archivo es muy grande
 */
ipcMain.handle("file:readFile", async (_event, filePath: string) => {
  try {
    const fileStat = await stat(filePath);
    const maxBytes = 2 * 1024 * 1024; // 2 MB
    if (fileStat.size > maxBytes) {
      return { ok: false, error: "file_too_large" };
    }

    const content = await readFile(filePath, { encoding: "utf8" });
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

void app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
