import { FieldPair } from "../core/types";

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(element, "value");
  const prototype = Object.getPrototypeOf(element);
  const protoDescriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (protoDescriptor?.set) {
    protoDescriptor.set.call(element, value);
  } else if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function applyContentEditable(element: HTMLElement, value: string): boolean {
  const previous = element.innerHTML;
  try {
    if (value.includes("<") && value.includes(">")) {
      element.innerHTML = value;
    } else {
      element.innerText = value;
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.setAttribute("data-ai-translate-prev", previous);
    return true;
  } catch {
    element.innerHTML = previous;
    return false;
  }
}

export function applyTranslation(pair: FieldPair, translated: string, registry: Map<string, HTMLElement>): boolean {
  const target = registry.get(pair.target.fieldId);
  if (!target) return false;

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    setNativeValue(target, translated);
    return true;
  }

  if (target.isContentEditable) {
    return applyContentEditable(target, translated);
  }

  return false;
}
