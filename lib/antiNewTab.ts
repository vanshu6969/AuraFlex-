import { useEffect } from 'react';

/**
 * Top-Level Anti-New-Tab Shield
 * Prevents any component, iframe, ad script, or external link from opening new tabs or windows in the app.
 */
export function useAntiNewTab() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Safely override window.open without defineProperty read-only errors
    try {
      window.open = function () {
        console.log("Blocked embed popunder redirect");
        return null;
      };
    } catch (e) {
      console.warn("Could not override window.open:", e);
    }

    // Intercept capture-phase clicks on any target="_blank" links or middle clicks
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const path = e.composedPath ? e.composedPath() : [];
      for (const node of path) {
        if (node instanceof HTMLAnchorElement) {
          const target = node.target || node.getAttribute('target');
          if (target === '_blank') {
            const href = node.href || '';
            const isExternal = href && !href.includes(window.location.hostname);
            if (isExternal) {
              e.preventDefault();
              e.stopPropagation();
              console.log("Blocked embed popunder redirect:", href);
              return false;
            } else {
              node.target = '_self';
            }
          }
        }
      }
    };

    // Intercept form submissions targeting _blank
    const handleFormSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form && (form.target === '_blank' || form.getAttribute('target') === '_blank')) {
        form.target = '_self';
      }
    };

    window.addEventListener('click', handleGlobalClick, true);
    window.addEventListener('auxclick', handleGlobalClick, true);
    window.addEventListener('submit', handleFormSubmit, true);

    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
      window.removeEventListener('auxclick', handleGlobalClick, true);
      window.removeEventListener('submit', handleFormSubmit, true);
    };
  }, []);
}
