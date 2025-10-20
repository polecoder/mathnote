export function confirmModal(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    // eslint-disable-next-line no-console
    console.debug("ConfirmModal: show -", message);

    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.innerHTML = `
      <div class="confirm-box" role="dialog" aria-modal="true">
        <p class="confirm-title">MathNote</p>
        <p class="confirm-message">${message}</p>
        <div class="confirm-actions">
          <button class="confirm-button cancel">Cancel</button>
          <button class="confirm-button primary ok">Close without saving</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const btnCancel = overlay.querySelector<HTMLButtonElement>(
      ".confirm-button.cancel"
    )!;
    const btnOk =
      overlay.querySelector<HTMLButtonElement>(".confirm-button.ok")!;

    const cleanup = (result: boolean) => {
      document.body.removeChild(overlay);
      // eslint-disable-next-line no-console
      console.debug("ConfirmModal:", result ? "confirmed" : "canceled");
      resolve(result);
      window.removeEventListener("keydown", onKey);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cleanup(false);
      }
    };

    btnCancel.addEventListener("click", () => cleanup(false));
    btnOk.addEventListener("click", () => cleanup(true));
    window.addEventListener("keydown", onKey);
  });
}
