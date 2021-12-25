import React from 'react';

type KeyEvent = KeyboardEvent | React.KeyboardEvent<HTMLInputElement>;

enum Keys {
  COMMAND = 'p',
  SIDEBAR = '\\',
  ESCAPE = 'Escape',
}

export const isCommand = (e: KeyEvent) => (e.metaKey || e.ctrlKey) && e.key === Keys.COMMAND;
export const isToggleSidebar = (e: KeyEvent) => (e.metaKey || e.ctrlKey) && e.key === Keys.SIDEBAR;
export const isEscape = (e: KeyEvent) => e.key === Keys.ESCAPE;
