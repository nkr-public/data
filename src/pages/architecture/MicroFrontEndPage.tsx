import React from 'react';
import SchemaViewLayout from '../../components/architecture/SchemaViewLayout';
import microFrontEndSvg from '../../svg/MicroFrontEnd.svg';
import { Layout, Box, Share2 } from 'lucide-react';

export const MicroFrontEndPage: React.FC = () => {
  return (
    <SchemaViewLayout
      id="micro-frontend"
      title="Micro-frontends & Shared Packages"
      subtitle="Architecture modulaire React + Vite Monorepo avec composition au runtime"
      category="Frontend Architecture"
      badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
      svgSrc={microFrontEndSvg}
      svgAlt="Schéma d'architecture Micro-frontends & Shared Packages"
      overview="L'architecture Micro-frontend découpe l'application monolithique en plusieurs sous-applications autonomes hébergées et orchestrées par un conteneur racine Shell (Host). Les sous-applications (Remotes) sont construites et déployées indépendamment, puis composées dynamiquement au runtime sans rechargement complet."
      keyPoints={[
        {
          label: 'Shell (Host) Orchestrateur',
          desc: 'Gère la navigation racine, l’authentification globale, le routage et le chargement dynamique à la demande des applications distantes.',
          type: 'info'
        },
        {
          label: 'Isolation stricte des Remotes',
          desc: 'Les micro-frontends (Application A, B, C) ne s’importent jamais directement entre eux pour éliminer tout couplage fort.',
          type: 'warning'
        },
        {
          label: 'Packages Partagés (Monorepo)',
          desc: 'Les modules transverses (ui, i18n, config, auth, api-client) sont distribués sous forme de bibliothèques partagées et typées.',
          type: 'success'
        },
        {
          label: 'Dépendances Uni-directionnelles',
          desc: 'Les micro-frontends dépendent des packages partagés, mais le package UI ne dépend jamais de la logique API ou HTTP.',
          type: 'info'
        }
      ]}
      techStack={['React', 'Vite', 'Module Federation', 'TypeScript', 'Tailwind CSS', 'Turborepo / Nx', 'pnpm workspaces']}
      rules={[
        'Les micro-frontends ne doivent JAMAIS s\'importer les uns les autres (interdiction de dépendance croisée Application A <-> Application B).',
        'Le package de composants graphiques UI ne doit JAMAIS dépendre de api-client ou de http (composants agnostiques et purs).',
        'Les contrats d\'API (api-contracts) définissent les types et schémas stricts consommés par api-client et les applications.',
        'Le Shell résout les URLs des remotes via un manifeste de configuration versionné sans nécessiter de re-déploiement de toutes les applications.',
        'La communication inter-micro-frontends s\'effectue exclusivement via événements du Shell ou état partagé contrôlé.'
      ]}
      sections={[
        {
          title: 'Shell (Host Application)',
          badge: 'Composition Root',
          icon: <Layout className="w-4 h-4 text-blue-400" />,
          content: (
            <div className="space-y-2">
              <p>
                Le <strong className="text-white">Shell</strong> est l'application hôte principale responsable de :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li>Initialiser le layout global (barre de navigation, header, drawer).</li>
                <li>Gérer le cycle de vie de la session utilisateur et le token d'authentification.</li>
                <li>Charger dynamiquement les Micro-frontends (Remotes A, B, C) via Module Federation à l'exécution.</li>
              </ul>
            </div>
          )
        },
        {
          title: 'Applications Distantes (Micro-frontends A, B, C)',
          badge: 'Independently Deployed',
          icon: <Box className="w-4 h-4 text-purple-400" />,
          content: (
            <div className="space-y-2">
              <p>
                Chaque micro-frontend est une application autonome développée par une équipe dédiée.
              </p>
              <div className="p-3 bg-[#0d1117] rounded border border-[#21262d] text-xs">
                <span className="text-red-400 font-semibold font-mono">REGLE CRITIQUE :</span> Micro-frontends must NOT import each other. Toutes les interactions se font via des contrats partagés ou le Shell.
              </div>
            </div>
          )
        },
        {
          title: 'Packages Partagés du Monorepo',
          badge: 'Shared Libraries',
          icon: <Share2 className="w-4 h-4 text-emerald-400" />,
          content: (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d]">
                <strong className="text-blue-300 font-mono">ui</strong> : Composants visuels, design system, sans dépendance API.
              </div>
              <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d]">
                <strong className="text-purple-300 font-mono">auth</strong> : Contexte de sécurité, gestion des tokens JWT.
              </div>
              <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d]">
                <strong className="text-emerald-300 font-mono">api-client</strong> : Client HTTP typé consommant les contrats d'API.
              </div>
              <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d]">
                <strong className="text-amber-300 font-mono">api-contracts</strong> : Types TypeScript, DTOs et validation runtime (Zod).
              </div>
            </div>
          )
        }
      ]}
    />
  );
};

export default MicroFrontEndPage;
