'use client';

import { useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import TestSuite from '../TestSuite';
import TrainingPanel from '../TrainingPanel';
import UserConfig from '../UserConfig';

type TabKey = 'test-suite' | 'user-config' | 'training';

interface Tab {
  component: React.ReactNode;
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { component: <TestSuite />, key: 'test-suite', label: 'Test Suite' },
  { component: <UserConfig />, key: 'user-config', label: 'Config Usuario' },
  { component: <TrainingPanel />, key: 'training', label: 'Entrenamiento' },
];

const ToolsPanel = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('test-suite');

  const activeComponent = TABS.find((t) => t.key === activeTab)?.component;

  return (
    <Flexbox style={{ height: '100%', overflow: 'hidden' }}>
      {/* Tab Header */}
      <Flexbox
        gap={4}
        horizontal
        style={{
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0,
          padding: '8px 12px',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? '#667eea' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeTab === tab.key ? '#fff' : '#6b7280',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === tab.key ? 600 : 400,
              padding: '6px 12px',
              transition: 'all 0.2s',
            }}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </Flexbox>

      {/* Tab Content */}
      <Flexbox style={{ flex: 1, overflow: 'auto' }}>{activeComponent}</Flexbox>
    </Flexbox>
  );
};

export default ToolsPanel;
