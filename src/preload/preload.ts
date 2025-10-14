import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  openFile: async (): Promise<OpenFileResponse> => {
    return (await ipcRenderer.invoke("dialog:openFile")) as OpenFileResponse;
  },
  saveFile: async (
    filePath: string,
    content: string
  ): Promise<SaveFileResponse> => {
    return (await ipcRenderer.invoke(
      "file:saveFile",
      filePath,
      content
    )) as SaveFileResponse;
  },
  saveAs: async (suggestedName: string): Promise<SaveAsResponse> => {
    return (await ipcRenderer.invoke(
      "dialog:saveAs",
      suggestedName
    )) as SaveAsResponse;
  },
});
