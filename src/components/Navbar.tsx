import React, {useState} from 'react';
import {
    Database,
    History,
    Sparkles,
    Search,
    Command,
    ExternalLink,
    ChevronDown,
    Github,
    Terminal,
    Zap,
    Layers,
    Menu,
    X,
    Bell,
    Cpu
} from 'lucide-react';
import { Tooltip } from './Tooltip';

export type NavTab = 'DB' | 'CR Legacy' | 'New Design';

interface NavbarProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    onOpenStandalone?: () => void;
    isStandalone?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
                                                  activeTab,
                                                  onTabChange,
                                                  onOpenStandalone,
                                                  isStandalone
                                              }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const navItems: { label: NavTab; icon: React.ReactNode; desc: string }[] = [
        {
            label: 'DB',
            icon: <Database className="w-4 h-4"/>,
            desc: 'In-Memory Key-Value & Web CLI'
        },
        {
            label: 'CR Legacy',
            icon: <History className="w-4 h-4"/>,
            desc: 'Rapports & Gabarits Historiques'
        },
        {
            label: 'New Design',
            icon: <Sparkles className="w-4 h-4"/>,
            desc: 'Studio Next-Gen Tailwind UI'
        },
    ];

    return (
        <header
            className="sticky top-0 z-50 w-full bg-[#0e1117]/95 backdrop-blur-md border-b border-[#21262d] transition-all">

            <div
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Left: Brand Logo (Redis styled) */}
                <div className="flex items-center space-x-8">
                    <div
                        onClick={() => onTabChange('DB')}
                        className="flex items-center space-x-3 cursor-pointer group"
                    >

                    </div>

                    <nav className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.label;
                            return (
                                <Tooltip
                                    key={item.label}
                                    content={item.label}
                                    subtitle={item.desc}
                                    position="bottom"
                                    variant={isActive ? 'red' : 'dark'}
                                >
                                    <button
                                        onClick={() => onTabChange(item.label)}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                                            isActive
                                                ? 'bg-red-600 text-white shadow-md shadow-red-600/25 font-semibold'
                                                : 'text-gray-300 hover:text-white hover:bg-[#161b22]'
                                        }`}
                                    >
                                      <span
                                          className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                        {item.icon}
                                      </span>
                                        <span>{item.label}</span>
                                    </button>
                                </Tooltip>
                            );
                        })}
                    </nav>
                </div>

                {/* Right side items */}
                <div className="hidden lg:flex items-center space-x-3">
                    {!isStandalone && onOpenStandalone && (
                        <Tooltip
                            content="Mode Application Dédié"
                            subtitle="Ouvre l'éditeur dans une fenêtre autonome"
                            shortcut="Alt+O"
                            position="bottom"
                            variant="emerald"
                        >
                            <button
                                onClick={onOpenStandalone}
                                className="flex items-center space-x-2 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1.5 rounded-lg text-emerald-400 text-xs font-mono hover:bg-emerald-900/40 transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5"/>
                                <span>Mode App</span>
                            </button>
                        </Tooltip>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
