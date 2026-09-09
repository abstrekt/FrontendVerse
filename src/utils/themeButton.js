/**
 * Label and icon for the tri-state theme control.
 *
 * The cycle is System -> Light -> Dark -> System. The icon shows the mode the
 * app is *currently* in; the label names what pressing it will do next, so the
 * control is unambiguous without relying on the icon alone.
 */
export function themeButtonState(theme, themeSource) {
  if (themeSource === 'system') {
    return {
      icon: 'monitor',
      label: `Theme: following the system (${theme}). Switch to light.`,
    };
  }
  if (theme === 'light') {
    return { icon: 'sun', label: 'Theme: light. Switch to dark.' };
  }
  return { icon: 'moon', label: 'Theme: dark. Switch to following the system.' };
}
