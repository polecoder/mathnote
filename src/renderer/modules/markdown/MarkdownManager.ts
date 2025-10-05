import { katex } from "@mdit/plugin-katex";
import "katex/dist/katex.min.css";
import MarkdownIt from "markdown-it";

export class MarkdownManager {
  private static instance: MarkdownManager | null = null;
  private mdInterface: MarkdownIt;

  private constructor() {
    this.mdInterface = MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    }).use(katex, {
      delimiters: "dollars",
      throwOnError: false,
      errorColor: "#FF0000",
    });
  }

  public static getInstance(): MarkdownManager {
    if (!MarkdownManager.instance) {
      MarkdownManager.instance = new MarkdownManager();
    }
    return MarkdownManager.instance;
  }

  /**
   * Dado el código Markdown por parámetro, lo transforma a HTML y lo devuelve.
   * Soporta matemática en el código fuente
   *
   * @param source
   * @returns
   */
  public markdownToHTMLwithMath(source: string): string {
    return this.mdInterface.render(source);
  }
}
