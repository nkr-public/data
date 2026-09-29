import React from 'react';
import SchemaViewLayout from '../../components/architecture/SchemaViewLayout';
import mfeLayersSvg from '../../svg/MfeLayers.svg';
import { Layers, Cpu, Cable } from 'lucide-react';

export const MfeLayersPage: React.FC = () => {
  return (
    <SchemaViewLayout
      id="mfe-layers"
      title="Micro-frontend Internal Layers"
      subtitle="Organisation en couches internes orientée domaine et découplage par Ports & Adapters"
      category="Frontend Architecture"
      badgeColor="bg-purple-500/10 text-purple-400 border-purple-500/20"
      svgSrc={mfeLayersSvg}
      svgAlt="Schéma des couches internes d'un Micro-frontend"
      overview="Chaque micro-frontend est structuré selon les principes du Clean Architecture et DDD (Domain-Driven Design). Le code applicatif et métier est totalement isolé de React et du navigateur grâce au découplage par Ports & Adaptateurs."
      keyPoints={[
        {
          label: 'Bootstrap (Composition Root)',
          desc: 'Point d’entrée principal qui configure les dépendances et injecte les implémentations concrètes (Infrastructure) dans les interfaces (Ports).',
          type: 'info'
        },
        {
          label: 'Presentation (UI React)',
          desc: 'Composants, pages, hooks UI et view models réactifs. Cette couche délègue tout traitement métier à la couche Application.',
          type: 'info'
        },
        {
          label: 'Domain (Cœur Métier Pur)',
          desc: 'Entités, value objects et règles métier immuables. 100% sans framework, sans dépendance externe, exécutable dans n\'importe quel environnement.',
          type: 'success'
        },
        {
          label: 'Inversion de Dépendance (Ports)',
          desc: 'La couche Application définit les interfaces dont elle a besoin (Ports). La couche Infrastructure implémente ces contrats.',
          type: 'warning'
        }
      ]}
      techStack={['React', 'TypeScript', 'Clean Architecture', 'Domain-Driven Design (DDD)', 'Vite']}
      rules={[
        'Les dépendances de code pointent TOUJOURS vers l\'intérieur : Presentation -> Application -> Domain.',
        'Le Domain ne dépend d\'absolument RIEN en dehors de lui-même (aucun import React, aucun import HTTP ou navigateur).',
        'La couche Application consomme uniquement des interfaces (Ports) et ne connaît jamais les classes concrètes d\'Infrastructure.',
        'La couche Infrastructure implémente les interfaces Ports (ex: ApiClientAdapter implements UserRepositoryPort).',
        'Le Bootstrap est le seul module autorisé à instancier les classes concrètes et les câbler.'
      ]}
      sections={[
        {
          title: 'Bootstrap (Composition Root)',
          badge: 'Entry Point & Wiring',
          icon: <Cpu className="w-4 h-4 text-blue-400" />,
          content: (
            <p>
              Le <strong className="text-white">Bootstrap</strong> est le point d'entrée exposé via Vite Module Federation. Il instancie les adaptateurs d'infrastructure (client HTTP, stockage local, auth) et les injecte dans les use cases de l'Application avant de monter l'arborescence React.
            </p>
          )
        },
        {
          title: 'Presentation & Application',
          badge: 'React & Use Cases',
          icon: <Layers className="w-4 h-4 text-purple-400" />,
          content: (
            <div className="space-y-2">
              <p>
                <strong className="text-blue-300">Presentation :</strong> Vues React, boutons, formulaires, state visuel.
              </p>
              <p>
                <strong className="text-purple-300">Application :</strong> Cas d'utilisation (Use Cases), coordination du workflow métier et orchestration des appels aux Ports.
              </p>
            </div>
          )
        },
        {
          title: 'Ports & Infrastructure',
          badge: 'Inversion of Control',
          icon: <Cable className="w-4 h-4 text-emerald-400" />,
          content: (
            <div className="space-y-2">
              <p>
                <strong className="text-emerald-300 font-mono">Ports :</strong> Contrats abstraits (interfaces TypeScript) exigés par le métier (ex: <code>PaymentGatewayPort</code>).
              </p>
              <p>
                <strong className="text-gray-300 font-mono">Infrastructure :</strong> Adaptateurs réels (<code>FetchHttpClient</code>, <code>LocalStorageService</code>, <code>KeycloakAuthAdapter</code>) implémentant ces contrats.
              </p>
            </div>
          )
        }
      ]}
    />
  );
};

export default MfeLayersPage;
