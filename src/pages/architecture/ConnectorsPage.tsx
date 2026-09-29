import React from 'react';
import SchemaViewLayout from '../../components/architecture/SchemaViewLayout';
import connectorsSvg from '../../svg/Connectors.svg';
import { Cable, Lock } from 'lucide-react';

export const ConnectorsPage: React.FC = () => {
  return (
    <SchemaViewLayout
      id="connectors"
      title="External Connectors Architecture"
      subtitle="Patterns d'intégration pour APIs tierces, protocoles spécialisés et connexions actives/standby avec baux distribués"
      category="Integration & Resiliency"
      badgeColor="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      svgSrc={connectorsSvg}
      svgAlt="Schéma d'architecture des Connecteurs Externes"
      overview="L'intégration de systèmes tiers (APIs partenaires, passerelles de paiement, flux de données en continu) s'appuie sur deux patterns architecturaux majeurs : l'adaptateur embarqué (Option A) ou le connecteur autonome dédié (Option B), renforcé par un mécanisme Active / Standby avec verrouillage par bail (fencing tokens) pour les flux exclusifs."
      keyPoints={[
        {
          label: 'Option A — Embedded Adapter',
          desc: 'Adaptateur HTTP sortant inclus directement dans le microservice pour les appels courts, stateless (REST/JSON) avec timeouts et retries bornés.',
          type: 'info'
        },
        {
          label: 'Option B — Standalone Connector',
          desc: 'Microservice dédié pour les connexions longues, protocoles complexes, conversion de messages, reconnexions et scaling indépendant.',
          type: 'info'
        },
        {
          label: 'Connexion Exclusive (Active / Standby)',
          desc: 'Une seule instance active détient le bail (lease) et établit la session avec le système tiers, l\'instance standby reste prête en secours.',
          type: 'success'
        },
        {
          label: 'Fencing Tokens (Protection Anti-Split-Brain)',
          desc: 'Le Shared Lease Store délivre des jetons de clôture incrémentaux (fencing tokens) pour rejeter immédiatement les requêtes issues d\'anciennes instances déconnectées.',
          type: 'warning'
        }
      ]}
      techStack={['REST / JSON / gRPC', 'WebSockets / Fix Protocol', 'Redis Distributed Lock / Consul', 'Resilience4j / Circuit Breaker']}
      rules={[
        'Option A : adaptée uniquement aux appels stateless et rapides ne nécessitant pas de cycle de vie de connexion persistant.',
        'Option B : requise lorsque l\'intégration a des exigences de reconnexion, de maintien de session socket ou de scaling asymétrique.',
        'Un bail seul (Lease) ne garantit pas l\'absence totale de double connexion active (à cause de la dérive d\'horloge ou des pauses GC) ; le système externe doit valider le Fencing Token.',
        'Tous les appels sortants vers des services tiers doivent impérativement être configurés avec des timeouts stricts et un disjoncteur (Circuit Breaker).'
      ]}
      sections={[
        {
          title: 'Option A vs Option B',
          badge: 'Architectural Choice',
          icon: <Cable className="w-4 h-4 text-cyan-400" />,
          content: (
            <div className="space-y-2 text-xs">
              <p><strong className="text-white">Option A (Embedded) :</strong> Faible coût d'infrastructure, pas de déploiement séparé, simple client HTTP dans le microservice existant.</p>
              <p><strong className="text-white">Option B (Standalone) :</strong> Haute résilience, isolation des pannes tierces, gestion fine du protocole et de l'idempotence.</p>
            </div>
          )
        },
        {
          title: 'Mécanisme Active / Standby & Fencing Tokens',
          badge: 'High Availability',
          icon: <Lock className="w-4 h-4 text-emerald-400" />,
          content: (
            <div className="space-y-2 text-xs">
              <p>
                L'<strong className="text-emerald-400">Active Instance</strong> renouvelle périodiquement son bail auprès du <strong className="text-white">Shared Lease Store</strong>. Si le heartbeat expire, la <strong className="text-amber-400">Standby Instance</strong> acquiert le bail avec un nouveau numéro de fencing token supérieur.
              </p>
            </div>
          )
        }
      ]}
    />
  );
};

export default ConnectorsPage;
