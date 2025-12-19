import { FieldMeta } from "../core/types";

const OVERLAY_ID = "ai-translate-overlay";

function ensureOverlayContainer(): HTMLElement {
  let container = document.getElementById(OVERLAY_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = OVERLAY_ID;
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";
    container.style.zIndex = "2147483647";
    document.body.appendChild(container);

    const style = document.createElement("style");
    style.textContent = `
      .ai-translate-outline {
        outline: 2px solid rgba(120, 80, 200, 0.8);
        outline-offset: 2px;
      }
      .ai-translate-badge {
        position: fixed;
        padding: 2px 6px;
        background: rgba(120, 80, 200, 0.9);
        color: #fff;
        font-family: Arial, sans-serif;
        font-size: 10px;
        border-radius: 10px;
        pointer-events: none;
        text-transform: uppercase;
      }
    `;
    document.head.appendChild(style);
  }
  return container;
}

export function renderOverlay(fields: FieldMeta[]): void {
  const container = ensureOverlayContainer();
  container.innerHTML = "";

  fields.forEach((field) => {
    if (!field.rect) return;
    const badge = document.createElement("div");
    badge.className = "ai-translate-badge";
    badge.textContent = field.langHint ? field.langHint.replace("-", "") : "AUTO";
    badge.style.left = `${field.rect.x + 4}px`;
    badge.style.top = `${field.rect.y - 12}px`;
    container.appendChild(badge);
  });
}

export function applyOutline(element: HTMLElement): void {
  element.classList.add("ai-translate-outline");
}

export function clearOutline(element: HTMLElement): void {
  element.classList.remove("ai-translate-outline");
}

export function clearOverlay(): void {
  const container = document.getElementById(OVERLAY_ID);
  if (container) container.innerHTML = "";
}
