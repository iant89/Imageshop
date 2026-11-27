/**
 * Layout — enterprise-ui-based application shell with side navigation,
 * header, and main content area. Replaces the custom modern webapp layout.
 */

import React, { useEffect, useState } from 'react';
import { useDocumentStore } from '@/state/document';
import {
  AppShell,
  ApplicationHeader,
  SideNavigation,
  NavigationItem,
  NavigationGroup,
  Button,
  IconButton,
  Panel,
  Card,
} from '@enterprise-ui/react';
import { CanvasEditor } from './CanvasEditor';
import { LayersPanel } from './panels/LayersPanel';
import { ToolsPanel } from './panels/ToolsPanel';
import styles from './Layout.module.css';

const SIDEBAR_ITEMS = [
  { id: 'canvas', label: 'Canvas', icon: 'canvas' },
  { id: 'tools', label: 'Tools', icon: 'brush' },
  { id: 'layers', label: 'Layers', icon: 'layers' },
];

const FOOTER_ITEMS = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export function Layout() {
  const { createDocument, getActiveDocument } = useDocumentStore();
  const [activeSidebarItem, setActiveSidebarItem] = useState('canvas');

  // Seed the shell with a document.
  useEffect(() => {
    const doc = getActiveDocument();
    if (!doc) {
      createDocument('Untitled-1', 1200, 800, 72, 'RGB');
    }
  }, [createDocument, getActiveDocument]);

  const doc = getActiveDocument();

  const header = (
    <ApplicationHeader
      productName="Imageshop"
      secondaryTitle={doc?.title}
      onSettingsClick={() => setActiveSidebarItem('settings')}
      user={{
        name: 'User',
        email: 'user@example.com',
      }}
      showNavToggle
      additionalActions={[
        {
          id: 'export',
          label: 'Export',
          icon: 'export',
          onClick: () => {
            // Export handler
          },
        },
      ]}
    />
  );

  const navigation = (
    <SideNavigation activeId={activeSidebarItem} onNavigate={(id) => setActiveSidebarItem(id)}>
      <NavigationGroup label="Editor">
        <NavigationItem id="canvas" label="Canvas" icon="canvas" />
        <NavigationItem id="tools" label="Tools" icon="brush" />
        <NavigationItem id="layers" label="Layers" icon="layers" />
      </NavigationGroup>
      <NavigationGroup label="Panels">
        {FOOTER_ITEMS.map((item) => (
          <NavigationItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </NavigationGroup>
    </SideNavigation>
  );

  return (
    <AppShell header={header} navigation={navigation} fullHeight>
      <div className={styles.appBody}>
        <div className={styles.canvasArea}>
          <Card title={doc?.title || 'Untitled'} noPadding>
            {doc ? (
              <CanvasEditor documentId={doc.id} />
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🖼️</div>
                <h2 className={styles.emptyTitle}>No document open</h2>
                <p className={styles.emptyHint}>
                  Create or open a document to start editing.
                </p>
              </div>
            )}
          </Card>
        </div>

        <div className={styles.dockedPanels}>
          <Panel title="Layers" defaultExpanded>
            <LayersPanel />
          </Panel>
          <Panel title="Tools" defaultExpanded>
            <ToolsPanel />
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}