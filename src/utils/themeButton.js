/**
 * Label and icon for the theme control (Light / Dark).
 *
 * The toggle cycles between Light and Dark mode. The icon shows the mode the
 * app is *currently* in; the label names what pressing it will do next.
 */
export function themeButtonState(theme) {
  if (theme === 'dark') {
    return { icon: 'moon', short: 'Dark', label: 'Theme: dark. Switch to light.' };
  }
  return { icon: 'sun', short: 'Light', label: 'Theme: light. Switch to dark.' };
}

export function editorThemeButtonState(editorTheme) {
  if (editorTheme === 'dark') {
    return { icon: 'code', short: 'Editor: Dark', label: 'Editor theme: dark. Switch to light.' };
  }
  return { icon: 'code', short: 'Editor: Light', label: 'Editor theme: light. Switch to dark.' };
}

