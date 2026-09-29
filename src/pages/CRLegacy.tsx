import React, { useState } from 'react';
import {
  FileCode,
  History,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Play,
  Download,
  RefreshCw,
  Copy,
  GitBranch,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles
} from 'lucide-react';

const LEGACY_TEMPLATES = [
  {
    id: 'report-template-2018',
    title: 'Rapport d\'Activité Mensuel (CR v1.2)',
    author: 'Legacy Reporting Engine',
    date: '2019-04-12',
    status: 'deprecated',
    tags: ['HTML4', 'Table-layout', 'Inline CSS', 'CR Engine'],
    code: `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
  <title>Compte-Rendu d'Activité Hebdomadaire</title>
  <style type="text/css">
    body { background-color: #f0f0f0; font-family: Tahoma, Verdana, sans-serif; font-size: 11px; margin: 0; padding: 20px; }
    .header-tbl { background-color: #2b3a4a; color: #ffffff; font-weight: bold; padding: 10px; width: 100%; border: 1px solid #1c2732; }
    .content-tbl { background-color: #ffffff; width: 100%; border: 1px solid #cccccc; margin-top: 15px; }
    .th-cell { background-color: #dfe6ec; color: #333333; font-size: 11px; padding: 6px; border: 1px solid #b0bec5; }
    .td-cell { padding: 6px; border-bottom: 1px solid #e0e0e0; font-size: 11px; color: #222222; }
    .badge-ok { background-color: #4caf50; color: white; padding: 2px 6px; font-size: 10px; font-weight: bold; }
    .footer { font-size: 10px; color: #777777; text-align: center; margin-top: 15px; }
  </style>
</head>
<body>
  <table class="header-tbl" cellpadding="0" cellspacing="0">
    <tr>
      <td align="left" style="font-size: 14px;">COMPTE-RENDU D'EXPLOITATION & PERFORMANCE (CR LEGACY)</td>
      <td align="right" style="font-size: 10px;">Généré le: 28/09/2026</td>
    </tr>
  </table>

  <table class="content-tbl" cellpadding="0" cellspacing="0">
    <thead>
      <tr>
        <th class="th-cell" align="left">Module / Service</th>
        <th class="th-cell" align="center">Statut CR</th>
        <th class="th-cell" align="right">Temps d'exécution (ms)</th>
        <th class="th-cell" align="left">Remarques</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-cell">Import Flux XML Boursiers</td>
        <td class="td-cell" align="center"><span class="badge-ok">VALIDE</span></td>
        <td class="td-cell" align="right">1,240 ms</td>
        <td class="td-cell">Traité via batch CR classique</td>
      </tr>
      <tr>
        <td class="td-cell">Génération Facturation PDF</td>
        <td class="td-cell" align="center"><span class="badge-ok">VALIDE</span></td>
        <td class="td-cell" align="right">850 ms</td>
        <td class="td-cell">Compatible moteur CR 2018</td>
      </tr>
      <tr>
        <td class="td-cell">Synchronisation Cache Redis</td>
        <td class="td-cell" align="center"><span class="badge-ok">VALIDE</span></td>
        <td class="td-cell" align="right">12 ms</td>
        <td class="td-cell">Trafic optimisé</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Système CR Legacy v1.2.9 - Ne pas modifier la structure &lt;table&gt; sans passer par l'adaptateur moderne.
  </div>
</body>
</html>`
  },
  {
    id: 'email-bulletin-cr',
    title: 'Bulletin de Diffusion Interne (CR-Mail v0.9)',
    author: 'Mail Automation CR',
    date: '2021-11-05',
    status: 'legacy',
    tags: ['Email-Safe', 'VML Fallback', 'Outlook Compatible'],
    code: `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a1a24; font-family: Arial, sans-serif; color: #ffffff; padding: 25px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #232736; border: 1px solid #3c445c; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 20px 24px; background-color: #dc382d; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px; font-weight: bold;">CR Legacy Newsletter #481</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Rapport d'audit et métriques de migration</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px; font-size: 13px; line-height: 1.6; color: #e2e8f0;">
            <p>Bonjour à l'équipe,</p>
            <p>Le traitement des comptes-rendus (CR) au format historique s'est achevé avec un taux de conformité de <strong>99.98%</strong>.</p>
            <div style="background-color: #161822; border-left: 4px solid #dc382d; padding: 12px; margin: 16px 0;">
              <em>Note technique: Les balises héritées doivent être migrées vers le composant "New Design" pour bénéficier de l'accélération CSS Tailwind.</em>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
  }
];

export const CRLegacy: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(LEGACY_TEMPLATES[0]);
  const [code, setCode] = useState(LEGACY_TEMPLATES[0].code);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'diff'>('preview');

  const handleSelectTemplate = (template: typeof LEGACY_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setCode(template.code);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b0d13] text-gray-200">

      {/* Main Grid */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar Template Catalog */}
        <div className="w-80 md:w-96 border-r border-[#21262d] bg-[#0e1219] flex flex-col">
          <div className="p-4 border-b border-[#21262d]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center">
              <Layers className="w-4 h-4 mr-2 text-amber-400" />
              Gabarits CR Enregistrés
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1e2430] p-2 space-y-2">
            {LEGACY_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`p-3.5 rounded-lg cursor-pointer transition border ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-500/40 text-white'
                      : 'bg-[#12161f] border-[#21262d] hover:border-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-xs leading-snug">{tmpl.title}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e2430] text-amber-300 border border-amber-500/20">
                      {tmpl.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">Auteur: {tmpl.author} • {tmpl.date}</p>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {tmpl.tags.map((tg) => (
                      <span key={tg} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181d28] text-gray-400 border border-[#2b3345]">
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Retrocompatibility advice card */}
            <div className="p-4 rounded-lg bg-[#141822] border border-[#2b3345] text-xs text-gray-400 space-y-2 mt-4">
              <div className="flex items-center text-amber-400 font-semibold space-x-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Compatibilité Moteur CR</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-400">
                Les modules CR Legacy utilisent une structure de rendu basée sur les normes HTML strictes. Pour convertir ces modèles vers les composants réactifs modernes, basculez sur l'onglet <strong>New Design</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right Content Workspace */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0b0d13]">
          {/* Tabs bar */}
          <div className="flex items-center justify-between border-b border-[#21262d] bg-[#12161f] px-4 py-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition ${
                  activeTab === 'preview'
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Rendu Visuel (Live Preview)</span>
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition ${
                  activeTab === 'editor'
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Source Code HTML / CR</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 text-xs text-gray-400 font-mono">
              <span>{code.length} octets</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400">Rendu Standard Actif</span>
            </div>
          </div>

          {/* Tab Views */}
          <div className="flex-1 min-h-0 relative">
            {activeTab === 'preview' && (
              <div className="w-full h-full p-4 flex flex-col">
                <div className="bg-[#12161f] rounded-t-lg border border-[#30363d] px-4 py-2 flex items-center justify-between text-xs text-gray-400">
                  <span className="font-mono text-gray-300 flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>
                    Simulation d'affichage navigateur / visionneuse CR
                  </span>
                  <span>Isolation Sandbox: Strict</span>
                </div>
                <iframe
                  title="CR Legacy Sandbox"
                  srcDoc={code}
                  sandbox="allow-scripts allow-same-origin"
                  className="flex-1 w-full bg-white rounded-b-lg border-x border-b border-[#30363d]"
                />
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="w-full h-full p-4">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="w-full h-full bg-[#090c12] border border-[#21262d] rounded-xl p-4 font-mono text-xs text-amber-200/90 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed selection:bg-amber-500/30"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRLegacy;
