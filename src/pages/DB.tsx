import React, { useState, useMemo } from 'react';
import {
  Database,
  Terminal,
  Key,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Activity,
  Cpu,
  HardDrive,
  Server,
  CheckCircle,
  Copy,
  ChevronRight,
  Filter,
  BarChart3,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Layers,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Info,
  Gauge
} from 'lucide-react';
import { SchemaViewer } from '../components/SchemaViewer';
import { SchemaProvider } from '../components/SchemaContext';

type DbMenuItem = 'Statistique' | 'Points Critiques' | 'CDM';

interface KeyItem {
  key: string;
  type: 'string' | 'hash' | 'list' | 'set' | 'zset';
  ttl: number; // in seconds (-1 for none)
  size: string;
  value: string;
}

const INITIAL_KEYS: KeyItem[] = [
  { key: 'user:session:10492', type: 'hash', ttl: 3540, size: '420 B', value: '{\n  "userId": 10492,\n  "role": "admin",\n  "ip": "192.168.1.42",\n  "lastLogin": "2026-09-28T19:40:00Z"\n}' },
  { key: 'cache:homepage:metrics', type: 'string', ttl: 120, size: '1.2 KB', value: '{"activeUsers": 4820, "rps": 12400, "cacheHitRatio": 99.4}' },
  { key: 'queue:background_tasks', type: 'list', ttl: -1, size: '850 B', value: '[\n  "sync_analytics_node_01",\n  "refresh_cr_legacy_index",\n  "invalidate_cdn_cache"\n]' },
  { key: 'rate_limit:ip:84.112.5.19', type: 'string', ttl: 45, size: '48 B', value: '42' },
  { key: 'features:flags:v2', type: 'set', ttl: -1, size: '310 B', value: '["dark_mode_v2", "vector_search", "cr_legacy_adapter", "streaming_api"]' },
  { key: 'leaderboard:highscores', type: 'zset', ttl: -1, size: '2.1 KB', value: '[\n  {"score": 99400, "member": "alex_dev"},\n  {"score": 87210, "member": "sarah_k"},\n  {"score": 75300, "member": "thomas_b"}\n]' }
];

export const DB: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<DbMenuItem>('Statistique');
  const [keys, setKeys] = useState<KeyItem[]>(INITIAL_KEYS);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedKey, setSelectedKey] = useState<KeyItem | null>(keys[0]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [cliInput, setCliInput] = useState('');
  const [cliHistory, setCliHistory] = useState<Array<{ command: string; output: string; time: string }>>([
    { command: 'INFO server', output: 'redis_version: 7.4.2\nos: Linux x86_64\nuptime_in_seconds: 149200\nconnected_clients: 42', time: '19:40:12' },
    { command: 'DBSIZE', output: '(integer) 6', time: '19:42:05' }
  ]);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'string' | 'hash' | 'list' | 'set' | 'zset'>('string');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredKeys = useMemo(() => {
    return keys.filter(k => {
      const matchesSearch = k.key.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesType = typeFilter === 'all' || k.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [keys, searchFilter, typeFilter]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = { string: 0, hash: 0, list: 0, set: 0, zset: 0 };
    keys.forEach(k => {
      if (counts[k.type] !== undefined) counts[k.type]++;
    });
    return counts;
  }, [keys]);

  const handleExecuteCli = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const cmd = cliInput.trim();
    const parts = cmd.split(' ');
    const action = parts[0].toUpperCase();
    let result = '';

    if (action === 'PING') {
      result = 'PONG';
    } else if (action === 'GET') {
      const target = keys.find(k => k.key === parts[1]);
      result = target ? `"${target.value}"` : '(nil)';
    } else if (action === 'SET' && parts.length >= 3) {
      const keyName = parts[1];
      const val = parts.slice(2).join(' ');
      setKeys(prev => {
        const existing = prev.find(k => k.key === keyName);
        if (existing) {
          return prev.map(k => k.key === keyName ? { ...k, value: val } : k);
        }
        return [...prev, { key: keyName, type: 'string', ttl: -1, size: `${val.length} B`, value: val }];
      });
      result = 'OK';
    } else if (action === 'DEL' && parts[1]) {
      const keyName = parts[1];
      setKeys(prev => prev.filter(k => k.key !== keyName));
      if (selectedKey?.key === keyName) setSelectedKey(null);
      result = '(integer) 1';
    } else if (action === 'KEYS') {
      result = keys.map((k, idx) => `${idx + 1}) "${k.key}"`).join('\n');
    } else if (action === 'DBSIZE') {
      result = `(integer) ${keys.length}`;
    } else {
      result = `OK [Executed: ${cmd}]`;
    }

    setCliHistory(prev => [
      ...prev,
      {
        command: cmd,
        output: result,
        time: new Date().toLocaleTimeString()
      }
    ]);
    setCliInput('');
  };

  const handleAddKey = () => {
    if (!newKeyName.trim()) return;
    const item: KeyItem = {
      key: newKeyName.trim(),
      type: newKeyType,
      ttl: -1,
      size: `${newKeyValue.length || 10} B`,
      value: newKeyValue || '""'
    };
    setKeys(prev => [item, ...prev]);
    setSelectedKey(item);
    setNewKeyModal(false);
    setNewKeyName('');
    setNewKeyValue('');
  };

  const handleDeleteKey = (k: string) => {
    setKeys(prev => prev.filter(item => item.key !== k));
    if (selectedKey?.key === k) {
      setSelectedKey(null);
    }
  };

  const copyValue = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeBadge = (type: KeyItem['type']) => {
    const map: Record<string, string> = {
      string: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      hash: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      list: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      set: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      zset: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-mono rounded border uppercase font-medium ${map[type] || ''}`}>
        {type}
      </span>
    );
  };

  const menuEntries: { id: DbMenuItem; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'Statistique',
      label: 'Statistique',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      id: 'Points Critiques',
      label: 'Points Critiques',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: '3'
    },
    {
      id: 'CDM',
      label: 'CDM',
      icon: <Database className="w-4 h-4" />
    }
  ];

  return (
    <div className="flex-1 flex min-h-0 bg-[#0b0d13] text-gray-200 overflow-hidden">
      {/* Menu gauche (Left Sidebar) */}
      <aside className="w-56 md:w-64 border-r border-[#21262d] bg-[#0e1219] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#21262d]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-red-600/15 border border-red-500/30 text-red-500">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Base de Données</h2>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1.5 flex-1">
          {menuEntries.map((entry) => {
            const isActive = activeMenu === entry.id;
            return (
              <button
                key={entry.id}
                onClick={() => setActiveMenu(entry.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {entry.icon}
                  </span>
                  <span>{entry.label}</span>
                </div>
                {entry.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {entry.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>


      </aside>

      {/* Main Content Area based on Active Menu Item */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {/* VIEW: Statistique */}
        {activeMenu === 'Statistique' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#21262d]">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-red-500" />
                  Statistiques & Performances
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Métriques d'exécution, volumétrie et santé du moteur in-memory
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Statut : Opérationnel</span>
                </span>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#12161f] border border-[#21262d] rounded-xl p-4">
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span>Mémoire Allouée</span>
                  <HardDrive className="w-4 h-4 text-red-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white font-mono">48.6 MB</span>
                  <span className="text-xs text-gray-500 font-mono">/ 256 MB</span>
                </div>
                <div className="w-full bg-[#1e2430] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: '19%' }}></div>
                </div>
                <div className="mt-2 text-[11px] text-gray-500 flex justify-between">
                  <span>Utilisation : 19%</span>
                  <span className="text-emerald-400">Normal</span>
                </div>
              </div>

              <div className="bg-[#12161f] border border-[#21262d] rounded-xl p-4">
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span>Débit de requêtes</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white font-mono">14,250</span>
                  <span className="text-xs text-emerald-400 font-mono">ops/sec</span>
                </div>
                <div className="w-full bg-[#1e2430] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="mt-2 text-[11px] text-gray-500 flex justify-between">
                  <span>Pic : 18,900 ops/s</span>
                  <span className="text-emerald-400">+12% vs 1h</span>
                </div>
              </div>

              <div className="bg-[#12161f] border border-[#21262d] rounded-xl p-4">
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span>Taux de Succès (Hit Ratio)</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white font-mono">99.4%</span>
                  <span className="text-xs text-gray-500 font-mono">cache hit</span>
                </div>
                <div className="w-full bg-[#1e2430] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '99.4%' }}></div>
                </div>
                <div className="mt-2 text-[11px] text-gray-500 flex justify-between">
                  <span>Miss : 0.6%</span>
                  <span className="text-emerald-400">Excellent</span>
                </div>
              </div>

              <div className="bg-[#12161f] border border-[#21262d] rounded-xl p-4">
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span>Latence P99</span>
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white font-mono">0.42 ms</span>
                  <span className="text-xs text-emerald-400 font-mono">&lt; 1ms</span>
                </div>
                <div className="w-full bg-[#1e2430] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '22%' }}></div>
                </div>
                <div className="mt-2 text-[11px] text-gray-500 flex justify-between">
                  <span>Clients actifs : 42</span>
                  <span className="text-emerald-400">Uptime: 41h</span>
                </div>
              </div>
            </div>

            {/* Distribution des types de données */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#12161f] border border-[#21262d] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-red-500" />
                  <span>Répartition des Structures de Données</span>
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'String (Clés scalaires)', count: typeDistribution.string, color: 'bg-emerald-500', text: 'text-emerald-400' },
                    { label: 'Hash (Objets & Sessions)', count: typeDistribution.hash, color: 'bg-amber-500', text: 'text-amber-400' },
                    { label: 'List (Files d\'attente & Logs)', count: typeDistribution.list, color: 'bg-blue-500', text: 'text-blue-400' },
                    { label: 'Set (Ensembles uniques)', count: typeDistribution.set, color: 'bg-purple-500', text: 'text-purple-400' },
                    { label: 'Sorted Set (Classements & Scores)', count: typeDistribution.zset, color: 'bg-rose-500', text: 'text-rose-400' },
                  ].map(item => {
                    const pct = keys.length ? Math.round((item.count / keys.length) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1 font-mono">
                          <span className="text-gray-300">{item.label}</span>
                          <span className={item.text}>{item.count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-[#1e2430] h-2 rounded-full overflow-hidden">
                          <div className={`${item.color} h-full rounded-full transition-all duration-300`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Métriques système */}
              <div className="bg-[#12161f] border border-[#21262d] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-red-500" />
                  <span>Charge & Ressources Système</span>
                </h3>
                <div className="space-y-4 text-xs font-mono">
                  <div className="flex items-center justify-between p-3 bg-[#0e1219] rounded-lg border border-[#21262d]">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Cpu className="w-4 h-4 text-red-400" />
                      <span>Utilisation CPU (Process)</span>
                    </div>
                    <span className="text-emerald-400 font-bold">1.8%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0e1219] rounded-lg border border-[#21262d]">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Server className="w-4 h-4 text-blue-400" />
                      <span>Fragmentation Mémoire (mem_fragmentation_ratio)</span>
                    </div>
                    <span className="text-blue-400 font-bold">1.12</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0e1219] rounded-lg border border-[#21262d]">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Activity className="w-4 h-4 text-amber-400" />
                      <span>Bande passante réseau (I/O)</span>
                    </div>
                    <span className="text-amber-400 font-bold">2.4 MB/s (In) / 8.1 MB/s (Out)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#0e1219] rounded-lg border border-[#21262d]">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>Dernière sauvegarde RDB</span>
                    </div>
                    <span className="text-gray-400 font-bold">Il y a 4 min (Succès)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Points Critiques */}
        {activeMenu === 'Points Critiques' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#21262d]">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Points Critiques & Diagnostic de Stabilité
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Détection automatique des goulets d'étranglement, clés sans TTL et risques d'invalidation
                </p>
              </div>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>3 alertes nécessitent une attention</span>
              </span>
            </div>

            {/* Alert List */}
            <div className="space-y-4">
              {/* Critical Point 1 */}
              <div className="bg-[#12161f] border border-amber-500/30 rounded-xl p-5 hover:border-amber-500/50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-white">Clés persistantes sans expiration (TTL = -1)</h3>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-mono uppercase font-bold rounded border border-amber-500/30">
                          Sévérité : Moyenne
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                        3 clés actives ne possèdent aucun délai d'expiration défini. En l'absence de politique d'éviction LRU stricte, ces enregistrements accumuleront de la mémoire résiduelle.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {['queue:background_tasks', 'features:flags:v2', 'leaderboard:highscores'].map(k => (
                          <span key={k} className="px-2 py-1 bg-[#161b22] border border-[#30363d] rounded text-[11px] font-mono text-gray-300">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#21262d] flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center space-x-1.5 text-gray-400">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recommandation : Définir un TTL via <code className="text-red-400 bg-[#0e1219] px-1 py-0.5 rounded font-mono">EXPIRE</code> ou migrer vers une politique de cache volatile.</span>
                  </span>
                </div>
              </div>

              {/* Critical Point 2 */}
              <div className="bg-[#12161f] border border-red-500/30 rounded-xl p-5 hover:border-red-500/50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 mt-0.5">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-white">Commandes bloquantes sur le thread principal</h3>
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-mono uppercase font-bold rounded border border-red-500/30">
                          Sévérité : Critique
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                        L'exécution de commandes non linéaires O(N) de type <code className="text-red-400 font-mono bg-[#0e1219] px-1 py-0.5 rounded">KEYS *</code> ou <code className="text-red-400 font-mono bg-[#0e1219] px-1 py-0.5 rounded">HGETALL</code> sur des structures volumineuses bloque le traitement des requêtes concurrentes.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#21262d] flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center space-x-1.5 text-gray-400">
                    <Info className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Recommandation : Remplacer par <code className="text-emerald-400 bg-[#0e1219] px-1 py-0.5 rounded font-mono">SCAN / HSCAN</code> avec curseur itératif.</span>
                  </span>
                </div>
              </div>

              {/* Critical Point 3 */}
              <div className="bg-[#12161f] border border-blue-500/30 rounded-xl p-5 hover:border-blue-500/50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 mt-0.5">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-white">Taille des collections (ZSet & List Payload)</h3>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-mono uppercase font-bold rounded border border-blue-500/30">
                          Sévérité : Faible
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                        La clé <code className="text-gray-300 font-mono bg-[#0e1219] px-1 py-0.5 rounded">leaderboard:highscores</code> atteint 2.1 KB. Une pagination par range est recommandée pour économiser la bande passante client.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#21262d] flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center space-x-1.5 text-gray-400">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recommandation : Utiliser <code className="text-blue-400 bg-[#0e1219] px-1 py-0.5 rounded font-mono">ZREVRANGEBYSCORE ... LIMIT 0 10</code>.</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CDM (Conceptual Data Model) */}
        {activeMenu === 'CDM' && (
          <div className="flex-1 flex min-h-0 w-full h-full overflow-hidden">
            <SchemaProvider>
              <SchemaViewer />
            </SchemaProvider>
          </div>
        )}
      </div>

      {/* Modal New Key */}
      {newKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-[#30363d] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-red-500" />
              Ajouter une nouvelle clé Redis
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-mono">Nom de la clé (Key Name)</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="ex: session:app:9823"
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2 text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Type de données</label>
                <select
                  value={newKeyType}
                  onChange={(e) => setNewKeyType(e.target.value as any)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2 text-white focus:outline-none focus:border-red-500 font-mono capitalize"
                >
                  <option value="string">String</option>
                  <option value="hash">Hash</option>
                  <option value="list">List</option>
                  <option value="set">Set</option>
                  <option value="zset">Sorted Set (ZSet)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-mono">Valeur (Value / Payload)</label>
                <textarea
                  rows={4}
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder='ex: {"enabled": true}'
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-md p-3 text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setNewKeyModal(false)}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded-md text-xs transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAddKey}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs transition font-medium shadow-sm hover:shadow-red-600/30"
              >
                Enregistrer la clé
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DB;
