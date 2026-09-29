import React, { useState } from 'react';
import Navbar, { NavTab } from './components/Navbar';
import DB from './pages/DB';
import CRLegacy from './pages/CRLegacy';
import NewDesign from './pages/NewDesign';
import { Terminal, Shield, Zap, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('DB');
  const [isStandalone] = useState<boolean>(() => {
    return (
      (window as unknown as { __IS_STANDALONE_WINDOW__?: boolean }).__IS_STANDALONE_WINDOW__ ||
      window.location.search.includes('standalone=true') ||
      window.name === 'HtmlEditorAppWindow'
    );
  });

  const openInAppWindow = () => {
    const width = 1280;
    const height = 850;
    const left = (window.screen.availWidth - width) / 2;
    const top = (window.screen.availHeight - height) / 2;

    const features = [
      `width=${window.screen.availWidth}`,
      `height=${window.screen.availHeight}`,
      `top=${top}`,
      `left=${left}`,
      'popup=yes',
      'location=no',
      'menubar=no',
      'toolbar=no',
      'status=no',
      'scrollbars=yes',
      'resizable=yes'
    ].join(',');

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('standalone', 'true');

    const newWin = window.open(currentUrl.toString(), 'HtmlEditorAppWindow', features);
    if (newWin) {
      newWin.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-[#e6edf3] font-sans selection:bg-red-500/30">
      {/* Top Navigation Bar - Redis style */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenStandalone={openInAppWindow}
        isStandalone={isStandalone}
      />

      {/* Dynamic Page Router */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {activeTab === 'DB' && <DB />}
        {activeTab === 'CR Legacy' && <CRLegacy />}
        {activeTab === 'New Design' && <NewDesign />}
      </main>

    </div>
  );
}
