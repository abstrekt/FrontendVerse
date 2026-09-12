import test from 'node:test';
import assert from 'node:assert/strict';
import { themeButtonState, editorThemeButtonState } from './themeButton.js';

test('themeButtonState returns correct icons and labels for binary toggle', () => {
  assert.deepEqual(themeButtonState('dark'), {
    icon: 'moon',
    short: 'Dark',
    label: 'Theme: dark. Switch to light.',
  });

  assert.deepEqual(themeButtonState('light'), {
    icon: 'sun',
    short: 'Light',
    label: 'Theme: light. Switch to dark.',
  });
});

test('editorThemeButtonState returns correct icons and labels for editor toggle', () => {
  assert.deepEqual(editorThemeButtonState('dark'), {
    icon: 'code',
    short: 'Editor: Dark',
    label: 'Editor theme: dark. Switch to light.',
  });

  assert.deepEqual(editorThemeButtonState('light'), {
    icon: 'code',
    short: 'Editor: Light',
    label: 'Editor theme: light. Switch to dark.',
  });
});
