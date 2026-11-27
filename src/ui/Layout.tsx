/**
 * Layout — modern webapp shell with sidebar navigation, header, and main
 * content area. Replaces the macOS desktop metaphor.
 */

import React, { useEffect, useState } from 'react';
import { useDocumentStore } from '@/state/document';
import { CanvasEditor } from './CanvasEditor';
import { LayersPanel } from './panels/LayersPanel';
import { ToolsPanel } from './panels/ToolsPanel';
import styles from './Layout.module.css';

const SIDEBAR_ITEMS = [
  { id: 'canvas', label: 'Canvas', icon: '🖼️' },
  { id: 'tools', label: 'Tools', icon: '🛠️' },
  { id: 'layers', label: 'Layers', icon: '📚' },
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

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandText}>Imageshop</span>
          <button
            className={styles.collapseBtn}
            onClick={() => setActiveSidebarItem('canvas')}
            aria-label="Show canvas"
          >
            🖼️
          </button>
        </div>
        <div className={styles.nav}>
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeSidebarItem === item.id ? styles.navItemActive : ''}`}
              onClick={() => setActiveSidebarItem(item.id)}
              title={item.label}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.divider} />
        <div className={styles.panelsList}>
          <button
            className={`${styles.panelItem} ${activeSidebarItem === 'layers' ? styles.panelItemActive : ''}`}
            onClick={() => setActiveSidebarItem('layers')}
            title="Layers"
          >
            <span className={styles.panelIcon}>📚</span>
            <span className={styles.panelLabel}>Layers</span>
          </button>
          <button
            className={`${styles.panelItem} ${activeSidebarItem === 'tools' ? styles.panelItemActive : ''}`}
            onClick={() => setActiveSidebarItem('tools')}
            title="Tools"
          >
            <span className={styles.panelIcon}>🛠️</span>
            <span className={styles.panelLabel}>Tools</span>
          </button>
        </div>
      </aside>

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.appTitle}>Imageshop</h1>
          {doc && <span className={styles.docTitle}>{doc.title}</span>}
        </div>
        <div className={styles.headerRight}>
          <button className={styles.btnIcon} title="Export">
            📤
          </button>
          <button className={styles.btnIcon} title="Settings">
            ⚙️
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.canvasArea}>
          {doc ? (
            <CanvasEditor documentId={doc.id} />
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🖼️</div>
              <h2 className={styles.emptyTitle}>No document open</h2>
              <p className={styles.emptyHint}>Create or open a document to start editing.</p>
            </div>
          )}
        </div>

        {/* Docked panels — Layers and Tools rendered inline in the main area */}
        <div className={styles.dockedPanels}>
          <LayersPanel />
          <ToolsPanel />
        </div>
      </main>
    </div>
  );
}