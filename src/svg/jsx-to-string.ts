// markup is a class, not a string, so already-rendered elements are never escaped as text
export class Markup {
  constructor(readonly value: string) {}
}

export type Child = Markup | string | number | false | null | undefined | Child[];

type Props = Record<string, unknown> | null;
// props are checked at each call site by JSX itself, so the factory stays deliberately open
type Component = (props: any) => Markup;

const ATTRIBUTE_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const TEXT_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };

function escapeAttribute(value: string): string {
  return value.replace(/[&<>"]/g, (character) => ATTRIBUTE_ESCAPES[character]!);
}

function escapeText(value: string): string {
  return value.replace(/[&<>]/g, (character) => TEXT_ESCAPES[character]!);
}

function renderChild(child: Child): string {
  if (child === null || child === undefined || child === false) return "";
  if (child instanceof Markup) return child.value;
  if (Array.isArray(child)) return child.map(renderChild).join("");
  if (typeof child === "string") return escapeText(child);
  return String(child);
}

function renderAttributes(props: Props): string {
  if (!props) return "";
  return Object.entries(props)
    .filter(([name, value]) => name !== "children" && value !== null && value !== undefined && value !== false)
    .map(([name, value]) => ` ${name}="${escapeAttribute(String(value))}"`)
    .join("");
}

export function h(type: string | Component, props: Props, ...children: Child[]): Markup {
  if (typeof type === "function") return type({ ...props, children });

  const inner = renderChild(children);
  if (!inner) return new Markup(`<${type}${renderAttributes(props)}/>`);
  return new Markup(`<${type}${renderAttributes(props)}>${inner}</${type}>`);
}

export function Fragment(props: { children?: Child }): Markup {
  return new Markup(renderChild(props.children));
}

export function renderToString(markup: Markup): string {
  return markup.value;
}

declare global {
  namespace JSX {
    type Element = Markup;
    type ElementType = string | Component;
    interface ElementChildrenAttribute {
      children: unknown;
    }
    interface IntrinsicElements {
      [tag: string]: Record<string, unknown> & { children?: Child };
    }
  }
}
