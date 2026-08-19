// Global System Shield for AuraFlex Web & Native (F12, Right-Click, and Console Logging Enabled)

export function initSystemShield() {
  if (typeof window === 'undefined') return;

  // F12, Right-Click Context Menu, and Developer Tools are enabled by user request.
  console.log('[AuraFlex System] Developer Tools and F12 Inspection Enabled');
}
