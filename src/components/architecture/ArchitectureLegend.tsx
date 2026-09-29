import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

interface ArchitectureLegendProps {
  className?: string;
  defaultExpanded?: boolean;
}

export const ArchitectureLegend: React.FC<ArchitectureLegendProps> = ({
  className = '',
  defaultExpanded = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Bouton Toggle pour modal / dropdown sur petits écrans ou affichage rapide */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#161b22] hover:bg-[#21262d] text-gray-300 hover:text-white border border-[#30363d] transition cursor-pointer 2xl:hidden"
        title="Afficher la légende de l'architecture"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="font-semibold text-red-400 text-[11px] tracking-wide uppercase">Légende</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>

      {/* Affichage direct en ligne pour les grands écrans (2XL et +) */}
      <div className="hidden 2xl:flex items-center gap-5 px-3.5 py-1.5 bg-[#161b22]/90 border border-[#30363d] rounded-xl shadow-lg backdrop-blur-md">
        {/* Titre / Tag */}
        <div className="flex flex-col justify-center border-r border-[#30363d] pr-3">
          <span className="text-[9px] font-bold text-red-400 tracking-wider uppercase px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 w-fit">
            LÉGENDE
          </span>
          <span className="text-[11px] font-bold text-gray-200 whitespace-nowrap mt-0.5">Flux & Nœuds</span>
        </div>

        {/* Flux (Lignes & Flèches) */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-gray-300">
          {/* Appel synchrone */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <svg width="28" height="10" className="flex-shrink-0">
              <line x1="0" y1="5" x2="20" y2="5" stroke="#f8fafc" strokeWidth="2" />
              <polygon points="20,1.5 27,5 20,8.5" fill="#f8fafc" />
            </svg>
            <span className="text-gray-200">Appel sync <span className="text-gray-500 text-[10px]">(HTTP)</span></span>
          </div>

          {/* Dépendance code */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <svg width="28" height="10" className="flex-shrink-0">
              <line x1="0" y1="5" x2="20" y2="5" stroke="#c084fc" strokeWidth="2" strokeDasharray="3,2" />
              <polygon points="20,1.5 27,5 20,8.5" fill="#c084fc" />
            </svg>
            <span className="text-gray-200">Dép. code <span className="text-gray-500 text-[10px]">(import)</span></span>
          </div>

          {/* Étape pipeline */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <svg width="28" height="10" className="flex-shrink-0">
              <line x1="0" y1="5" x2="20" y2="5" stroke="#2dd4bf" strokeWidth="2" />
              <polygon points="20,1.5 27,5 20,8.5" fill="#2dd4bf" />
            </svg>
            <span className="text-gray-200">Pipeline <span className="text-gray-500 text-[10px]">(CI/CD)</span></span>
          </div>

          {/* Événement async */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <svg width="28" height="10" className="flex-shrink-0">
              <line x1="0" y1="5" x2="20" y2="5" stroke="#fb923c" strokeWidth="2" strokeDasharray="4,2" />
              <polygon points="20,1.5 27,5 20,8.5" fill="#fb923c" />
            </svg>
            <span className="text-gray-200">Async <span className="text-gray-500 text-[10px]">(Broker)</span></span>
          </div>

          {/* Implémentation interface */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <svg width="28" height="10" className="flex-shrink-0">
              <line x1="0" y1="5" x2="20" y2="5" stroke="#c084fc" strokeWidth="2" strokeDasharray="5,2" />
              <polygon points="20,1.5 27,5 20,8.5" fill="#161b22" stroke="#c084fc" strokeWidth="1.5" />
            </svg>
            <span className="text-gray-200">Impl. interface</span>
          </div>

          {/* Flux interdit */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <svg width="28" height="10" className="flex-shrink-0">
              <line x1="0" y1="5" x2="28" y2="5" stroke="#f87171" strokeWidth="2" />
              <line x1="11" y1="1" x2="17" y2="9" stroke="#ef4444" strokeWidth="2.5" />
            </svg>
            <span className="text-red-400 font-medium">Bloqué / Interdit</span>
          </div>
        </div>

        {/* Nœuds (Couleurs & Boîtes) */}
        <div className="border-l border-[#30363d] pl-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 rounded bg-blue-900/60 border border-blue-500"></span>
            <span className="text-blue-300">Frontend</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 rounded bg-red-900/60 border border-red-500"></span>
            <span className="text-red-300">Redis (L2)</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 rounded bg-purple-900/60 border border-purple-500"></span>
            <span className="text-purple-300">Business logic</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 rounded bg-slate-800/80 border border-slate-400"></span>
            <span className="text-slate-300">Infrastructure</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 rounded bg-green-900/60 border border-green-500"></span>
            <span className="text-green-300">L1 cache</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 rounded bg-teal-900/60 border border-teal-400"></span>
            <span className="text-teal-300">DevOps / CI-CD</span>
          </div>
        </div>
      </div>

      {/* Popover / Dropdown pour écrans inférieurs à 2XL ou quand cliqué */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[540px] max-w-[90vw] p-4 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl backdrop-blur-xl 2xl:hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                LÉGENDE
              </span>
              <span className="text-sm font-bold text-gray-100">Flux & Nœuds d'Architecture</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#21262d] text-xs"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Colonne 1: Flux */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Type de Flux</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <svg width="32" height="10" className="flex-shrink-0">
                    <line x1="0" y1="5" x2="24" y2="5" stroke="#f8fafc" strokeWidth="2" />
                    <polygon points="24,1.5 31,5 24,8.5" fill="#f8fafc" />
                  </svg>
                  <span className="text-gray-200">Appel synchrone <span className="text-gray-500 text-[11px]">(HTTP / runtime)</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="32" height="10" className="flex-shrink-0">
                    <line x1="0" y1="5" x2="24" y2="5" stroke="#fb923c" strokeWidth="2" strokeDasharray="5,3" />
                    <polygon points="24,1.5 31,5 24,8.5" fill="#fb923c" />
                  </svg>
                  <span className="text-gray-200">Événement async <span className="text-gray-500 text-[11px]">(Broker / runtime)</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="32" height="10" className="flex-shrink-0">
                    <line x1="0" y1="5" x2="24" y2="5" stroke="#c084fc" strokeWidth="2" strokeDasharray="4,2" />
                    <polygon points="24,1.5 31,5 24,8.5" fill="#c084fc" />
                  </svg>
                  <span className="text-gray-200">Dépendance de code <span className="text-gray-500 text-[11px]">(dépend de)</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="32" height="10" className="flex-shrink-0">
                    <line x1="0" y1="5" x2="24" y2="5" stroke="#c084fc" strokeWidth="2" strokeDasharray="6,3" />
                    <polygon points="24,1.5 31,5 24,8.5" fill="#161b22" stroke="#c084fc" strokeWidth="1.5" />
                  </svg>
                  <span className="text-gray-200">Implémentation d'interface</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="32" height="10" className="flex-shrink-0">
                    <line x1="0" y1="5" x2="24" y2="5" stroke="#2dd4bf" strokeWidth="2" />
                    <polygon points="24,1.5 31,5 24,8.5" fill="#2dd4bf" />
                  </svg>
                  <span className="text-gray-200">Étape pipeline <span className="text-gray-500 text-[11px]">(CI/CD)</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="32" height="10" className="flex-shrink-0">
                    <line x1="0" y1="5" x2="32" y2="5" stroke="#f87171" strokeWidth="2" />
                    <line x1="13" y1="1" x2="19" y2="9" stroke="#ef4444" strokeWidth="2.5" />
                  </svg>
                  <span className="text-red-400 font-medium">Flux interdit / Bloqué</span>
                </div>
              </div>
            </div>

            {/* Colonne 2: Nœuds & Couleurs */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Types de Composants</div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3.5 rounded bg-blue-900/60 border border-blue-500"></span>
                  <span className="text-blue-300 font-medium">Frontend</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3.5 rounded bg-purple-900/60 border border-purple-500"></span>
                  <span className="text-purple-300 font-medium">Business logic</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3.5 rounded bg-green-900/60 border border-green-500"></span>
                  <span className="text-green-300 font-medium">L1 cache</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3.5 rounded bg-red-900/60 border border-red-500"></span>
                  <span className="text-red-300 font-medium">Redis (L2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3.5 rounded bg-slate-800/80 border border-slate-400"></span>
                  <span className="text-slate-300 font-medium">Infrastructure</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-3.5 rounded bg-teal-900/60 border border-teal-400"></span>
                  <span className="text-teal-300 font-medium">DevOps / CI-CD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitectureLegend;
