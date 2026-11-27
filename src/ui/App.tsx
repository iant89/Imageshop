/**
 * App — top-level shell. Applies theme and accessibility preferences to the
 * root element, then mounts the enterprise-ui-based layout.
 */

import React, { useEffect } from 'react';
import { Layout } from './Layout';
import { syncAppStoreToDOM } from '@/state/app';
import { applyA11yPreferences } from '@/design/theme';

// Import enterprise-ui styles once at the app root
import '@enterprise-ui/react/styles.css';
import '@enterprise-ui/react/tokens.css';

export function App() {
  useEffect(() => {
    applyA11yPreferences();
    syncAppStoreToDOM();
  }, []);

  return <Layout />;
}