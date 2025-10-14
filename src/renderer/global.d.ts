export {};

declare global {
  type OpenFileResponse =
    | { ok: true; path: string; content: string }
    | { ok: false; error: string };
  type SaveFileResponse = { ok: true } | { ok: false; error: string };
  type SaveAsResponse =
    | { ok: true; path: string }
    | { ok: false; error: string };
  type OpenFolderResponse =
    | { ok: true; path: string }
    | { ok: false; error: string };
  type ReadFolderContentsResponse =
    | { ok: true; entries: FileEntry[] }
    | { ok: false; error: string };
  type ReadFileResponse =
    | { ok: true; content: string }
    | { ok: false; error: string };

  interface FileEntry {
    name: string;
    path: string;
    relativePath: string;
    type: "directory" | "markdown" | "image";
  }

  interface Window {
    api: {
      openFile: () => Promise<OpenFileResponse>;
      saveFile: (
        filePath: string,
        content: string
      ) => Promise<SaveFileResponse>;
      saveAs: (suggestedName: string) => Promise<SaveAsResponse>;
      openFolder: () => Promise<OpenFolderResponse>;
      readFolderContents: (
        folderPath: string
      ) => Promise<ReadFolderContentsResponse>;
      readFile: (filePath: string) => Promise<ReadFileResponse>;
    };
  }
}
