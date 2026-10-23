const WIDGET_CSS = "https://assets.calendly.com/assets/external/widget.css";
const WIDGET_JS = "https://assets.calendly.com/assets/external/widget.js";

let widgetPromise = null;
let bound = false;

function loadWidget() {
  if (typeof window !== "undefined" && window.Calendly?.initPopupWidget) return Promise.resolve();
  if (widgetPromise) return widgetPromise;
  widgetPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${WIDGET_CSS}"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = WIDGET_CSS;
      document.head.append(css);
    }
    const script = document.createElement("script");
    script.src = WIDGET_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      widgetPromise = null;
      reject(new Error("calendly"));
    };
    document.head.append(script);
  });
  return widgetPromise;
}

function openFallback(url) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) opened.opener = null;
}

function onCalendlyClick(event) {
  const link = event.target.closest("a[data-calendly]");
  if (!link || !link.href) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const url = link.href;
  loadWidget()
    .then(() => {
      if (window.Calendly?.initPopupWidget) {
        window.Calendly.initPopupWidget({ url });
        return;
      }
      openFallback(url);
    })
    .catch(() => openFallback(url));
}

export function initCalendly() {
  if (bound || typeof document === "undefined") return;
  bound = true;
  document.addEventListener("click", onCalendlyClick);
}
