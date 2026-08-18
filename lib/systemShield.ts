// Global Developer Tools & System Shield for AuraFlex Web & Native

export function initSystemShield() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Prevent Right-Click Context Menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // 2. Prevent F12 and Inspection Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      const isF12 = e.key === 'F12' || e.keyCode === 123;
      const isCtrlShiftI = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73);
      const isCtrlShiftJ = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74);
      const isCtrlShiftC = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67);
      const isCtrlU = (e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85);
      const isCmdOptI = e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c');

      if (isF12 || isCtrlShiftI || isCtrlShiftJ || isCtrlShiftC || isCtrlU || isCmdOptI) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    // 3. Suppress Console Output in Production
    if (!__DEV__) {
      const noop = () => {};
      window.console.log = noop;
      window.console.debug = noop;
      window.console.info = noop;
      window.console.warn = noop;
    }
  } catch {}
}
