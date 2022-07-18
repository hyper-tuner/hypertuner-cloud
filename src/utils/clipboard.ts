import { copiedToClipboard } from '../pages/auth/notifications';

export const isClipboardSupported = 'clipboard' in navigator;

export const copyToClipboard = (text: string) => {
  if (!isClipboardSupported) {
    return;
  }

  navigator.clipboard.writeText(text).then(copiedToClipboard);
};
