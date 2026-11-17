"use client";

import { useEffect } from "react";

/**
 * Turns off the browser's right-click menu on the whole site. Text fields keep it, so people can still paste and
 * correct spelling in a form. This only discourages casual copying: it cannot stop anyone who wants a page's
 * content, and keyboard shortcuts and browser menus still work. Renders nothing.
 */
export function DisableContextMenu() {
  useEffect(() => {
    const block = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
    };
    document.addEventListener("contextmenu", block);
    return () => document.removeEventListener("contextmenu", block);
  }, []);

  return null;
}
