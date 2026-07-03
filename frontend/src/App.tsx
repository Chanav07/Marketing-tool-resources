import { useState } from 'react'
import { BrandInputs } from './components/BrandInputs'
import { ICPBuilder } from './components/ICPBuilder'
import { VoiceCodifier } from './components/VoiceCodifier'
import './App.css'

const TABS = [
  { key: 'brand-inputs', label: 'Brand inputs' },
  { key: 'icp-builder', label: 'ICP builder' },
  { key: 'voice-codifier', label: 'Voice codifier' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function App() {
  const [tab, setTab] = useState<TabKey>('brand-inputs')

  return (
    <div className="app">
      <main className="stage">
        <div className="topbar">
          <div className="topbar-brand">
            AIMark<span>Brand Brain</span>
          </div>
          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={t.key === tab ? 'tab active' : 'tab'}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === 'brand-inputs' && <BrandInputs />}
        {tab === 'icp-builder' && <ICPBuilder />}
        {tab === 'voice-codifier' && <VoiceCodifier />}
      </main>
    </div>
  )
}
