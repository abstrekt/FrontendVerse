/**
 * Label and icon for the tri-state theme control.
 *
 * The cycle is System -> Light -> Dark -> System. The icon shows the mode the
 * app is *currently* in; the label names what pressing it will do next, so the
 * control is unambiguous without relying on the icon alone. `short` is the
 * one-word form for places with room for a label but not a sentence; `label`
 * stays the accessible name in both.
 */
export function themeButtonState(theme, themeSource) {
  if (themeSource === 'system') {
    return {
      icon: 'monitor',
      short: 'System',
      label: `Theme: following the system (${theme}). Switch to light.`,
    };
  }
  if (theme === 'light') {
    return { icon: 'sun', short: 'Light', label: 'Theme: light. Switch to dark.' };
  }
  return { icon: 'moon', short: 'Dark', label: 'Theme: dark. Switch to following the system.' };
}
