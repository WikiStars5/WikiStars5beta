
import type { ReactNode } from 'react';

// This is a pass-through layout to fix a broken i18n routing structure.
export default function LocaleAdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
