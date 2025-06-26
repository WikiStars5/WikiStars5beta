
import type { ReactNode } from 'react';

// This is a pass-through layout to fix a broken i18n routing structure.
// It ensures that this route segment doesn't break the UI.
export default function LocaleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
