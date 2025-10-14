export {};

declare global {
  type OpenFileResponse =
    | { ok: true; path: string; content: string }
    | { ok: false; error: string };
  type SaveFileResponse = { ok: true } | { ok: false; error: string };
  type SaveAsResponse =
    | { ok: true; path: string }
    | { ok: false; error: string };

  interface Window {
    api: {
      openFile: () => Promise<OpenFileResponse>;
      saveFile: (
        filePath: string,
        content: string
      ) => Promise<SaveFileResponse>;
      saveAs: (suggestedName: string) => Promise<SaveAsResponse>;
    };
  }
}
