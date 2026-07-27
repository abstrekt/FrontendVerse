import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function getSyntaxStyle(theme) {
  return theme === 'dark' ? oneDark : oneLight;
}
