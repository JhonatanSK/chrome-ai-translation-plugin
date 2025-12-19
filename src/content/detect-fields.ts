import { FieldMeta, FieldKind } from "../core/types";

let fieldCounter = 0;

const INPUT_TYPES = new Set(["text", "email", "url", "search", "tel", ""]);

function ensureFieldId(element: HTMLElement): string {
  const existing = element.getAttribute("data-ai-translate-id");
  if (existing) return existing;
  const id = `f${fieldCounter++}`;
  element.setAttribute("data-ai-translate-id", id);
  return id;
}

function getAriaLabel(element: HTMLElement): string | undefined {
  const aria = element.getAttribute("aria-label");
  if (aria) return aria.trim();
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const ids = labelledBy.split(" ").map((id) => id.trim());
    const labels = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .map((el) => el?.textContent?.trim())
      .filter(Boolean) as string[];
    if (labels.length > 0) return labels.join(" ");
  }
  return undefined;
}

function getLabelText(element: HTMLElement): string | undefined {
  const aria = getAriaLabel(element);
  if (aria) return aria;
  const id = (element as HTMLInputElement).id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label) return label.textContent?.trim() || undefined;
  }

  const parentLabel = element.closest("label");
  if (parentLabel) return parentLabel.textContent?.trim() || undefined;
  return undefined;
}

function getRect(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  return true;
}

export function detectFields(): { fields: FieldMeta[]; map: Map<string, HTMLElement> } {
  const fields: FieldMeta[] = [];
  const map = new Map<string, HTMLElement>();

  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
  const textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea"));
  const editables = Array.from(document.querySelectorAll<HTMLElement>("[contenteditable='true'], [role='textbox']"));

  const collect = (element: HTMLElement, kind: FieldKind) => {
    if (!isVisible(element)) return;
    if ((element as HTMLInputElement).disabled) return;
    const fieldId = ensureFieldId(element);
    const meta: FieldMeta = {
      fieldId,
      name: (element as HTMLInputElement).name || undefined,
      id: (element as HTMLInputElement).id || undefined,
      label: getLabelText(element),
      placeholder: (element as HTMLInputElement).placeholder || undefined,
      kind,
      maxLength: (element as HTMLInputElement).maxLength > 0 ? (element as HTMLInputElement).maxLength : undefined,
      rect: getRect(element)
    };
    fields.push(meta);
    map.set(fieldId, element);
  };

  inputs.forEach((el) => {
    const type = (el.getAttribute("type") || "").toLowerCase();
    if (!INPUT_TYPES.has(type)) return;
    collect(el, "input");
  });
  textareas.forEach((el) => collect(el, "textarea"));
  editables.forEach((el) => collect(el, "contenteditable"));

  return { fields, map };
}
