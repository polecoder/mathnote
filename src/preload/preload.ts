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
  openFolder: async (): Promise<OpenFolderResponse> => {
    return (await ipcRenderer.invoke(
      "dialog:openFolder"
    )) as OpenFolderResponse;
  },
  readFolderContents: async (
    folderPath: string
  ): Promise<ReadFolderContentsResponse> => {
    return (await ipcRenderer.invoke(
      "folder:readContents",
      folderPath
    )) as ReadFolderContentsResponse;
  },
  readFile: async (filePath: string): Promise<ReadFileResponse> => {
    return (await ipcRenderer.invoke(
      "file:readFile",
      filePath
    )) as ReadFileResponse;
  },
});
