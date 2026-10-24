/**
 * App — top-level shell. Applies theme and accessibility preferences to the
 * root element, then mounts the modern webapp layout.
 */

import React, { useEffect } from 'react';
import { Layout } from './Layout';
import { syncAppStoreToDOM } from '@/state/app';
import { applyA11yPreferences } from '@/design/theme';

export function App() {
  useEffect(() => {
    applyA11yPreferences();
    syncAppStoreToDOM();
  }, []);

  return <Layout />;
}