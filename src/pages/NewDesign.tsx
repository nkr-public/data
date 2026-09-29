import React, { useState } from 'react';
import {
  Layers,
  Layout,
  Server,
  Hexagon,
  Zap,
  RefreshCw,
  Cable,
  GitBranch
} from 'lucide-react';
import {
  MicroFrontEndPage,
  MfeLayersPage,
  BackendPage,
  HexagonalPage,
  CachesPage,
  InvalidationPage,
  ConnectorsPage,
  DevopsPage
} from './architecture';
import ArchitectureLegend from '../components/architecture/ArchitectureLegend';

export type WorkspaceMode =
  | 'MicroFrontEnd'
  | 'MFE Layers'
  | 'Backend'
  | 'Hexgonal'
  | 'Caches'
  | 'Invalidation'
  | 'Connectors'
  | 'Devops'
  | 'HtmlEditor';

export const NewDesign: React.FC = () => {
  const [activeMode, setActiveMode] = useState<WorkspaceMode>('MicroFrontEnd');

  const navButtons: { id: WorkspaceMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'MicroFrontEnd',
      label: 'MicroFrontEnd',
      icon: <Layout className="w-3.5 h-3.5" />
    },
    {
      id: 'MFE Layers',
      label: 'MFE Layers',
      icon: <Layers className="w-3.5 h-3.5" />
    },
    {
      id: 'Backend',
      label: 'Backend',
      icon: <Server className="w-3.5 h-3.5" />
    },
    {
      id: 'Hexgonal',
      label: 'Hexgonal',
      icon: <Hexagon className="w-3.5 h-3.5" />
    },
    {
      id: 'Caches',
      label: 'Caches',
      icon: <Zap className="w-3.5 h-3.5" />
    },
    {
      id: 'Invalidation',
      label: 'Invalidation',
      icon: <RefreshCw className="w-3.5 h-3.5" />
    },
    {
      id: 'Connectors',
      label: 'Connectors',
      icon: <Cable className="w-3.5 h-3.5" />
    },
    {
      id: 'Devops',
      label: 'Devops',
      icon: <GitBranch className="w-3.5 h-3.5" />
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b0d13] text-gray-200">
      {/* Workspace Mode Toolbar - Divisé en deux : Gauche = Boutons / Droite = Légende */}
      <div className="flex items-center justify-between border-b border-[#21262d] bg-[#0e1219] px-4 py-2 flex-shrink-0 gap-4 overflow-x-auto custom-scrollbar">
        {/* Partie Gauche : Boutons de navigation */}
        <div className="flex items-center space-x-1.5 md:space-x-2 flex-shrink-0">
          {navButtons.map((btn) => {
            const isActive = activeMode === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setActiveMode(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-600/30'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-[#1c2128]'
                }`}
              >
                {btn.icon}
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Partie Droite : Légende de l'architecture */}
        <div className="flex items-center flex-shrink-0">
          <ArchitectureLegend />
        </div>
      </div>

      {/* Dynamic View rendering based on active workspace mode */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {activeMode === 'MicroFrontEnd' && <MicroFrontEndPage />}
        {activeMode === 'MFE Layers' && <MfeLayersPage />}
        {activeMode === 'Backend' && <BackendPage />}
        {activeMode === 'Hexgonal' && <HexagonalPage />}
        {activeMode === 'Caches' && <CachesPage />}
        {activeMode === 'Invalidation' && <InvalidationPage />}
        {activeMode === 'Connectors' && <ConnectorsPage />}
        {activeMode === 'Devops' && <DevopsPage />}
      </div>
    </div>
  );
};

export default NewDesign;
