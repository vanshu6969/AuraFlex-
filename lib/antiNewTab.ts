import { useEffect } from 'react';

/**
 * Top-Level Anti-New-Tab & Anti-Ad Popunder Shield
 * Prevents any component, embed iframe, ad script, or external link from opening new tabs or windows.
 */
export function useAntiNewTab() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Lock down window.open using Object.defineProperty to block popup spawns
    const dummyWin = {
      closed: true,
      focus: () => {},
      blur: () => {},
      close: () => {},
      postMessage: () => {},
    };

    try {
      Object.defineProperty(window, 'open', {
        configurable: false,
        writable: false,
        value: function (url?: string | URL, target?: string, features?: string) {
          console.warn('[Anti-Ad Shield] Intercepted and blocked popup window.open:', url);
          return dummyWin;
        },
      });
    } catch (e) {
      window.open = function () {
        console.warn('[Anti-Ad Shield] Blocked window.open popup');
        return dummyWin as any;
      };
    }

    // 2. Intercept programmatic HTMLAnchorElement.prototype.click calls used by ad networks
    try {
      const originalAnchorClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        const target = this.getAttribute('target') || this.target;
        const href = this.href || '';
        const isExternal = href && !href.includes(window.location.hostname);

        if (target === '_blank' && isExternal) {
          console.warn('[Anti-Ad Shield] Blocked programmatic anchor.click() to external ad:', href);
          return;
        }
        return originalAnchorClick.apply(this, arguments as any);
      };
    } catch (e) {}

    // 3. Intercept capture-phase clicks on any target="_blank" links or middle clicks
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const path = e.composedPath ? e.composedPath() : [];
      for (const node of path) {
        if (node instanceof HTMLAnchorElement) {
          const target = node.target || node.getAttribute('target');
          const href = node.href || '';
          const isExternal = href && !href.includes(window.location.hostname);

          if (target === '_blank' && isExternal) {
            e.preventDefault();
            e.stopPropagation();
            console.warn('[Anti-Ad Shield] Blocked capture-phase ad click:', href);
            return false;
          } else if (target === '_blank') {
            node.target = '_self';
          }
        }
      }
    };

    // 4. Intercept form submissions targeting _blank
    const handleFormSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form && (form.target === '_blank' || form.getAttribute('target') === '_blank')) {
        const action = form.action || '';
        if (action && !action.includes(window.location.hostname)) {
          e.preventDefault();
          e.stopPropagation();
          console.warn('[Anti-Ad Shield] Blocked external form submission:', action);
        } else {
          form.target = '_self';
        }
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
