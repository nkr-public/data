import React from 'react';
import SchemaViewLayout from '../../components/architecture/SchemaViewLayout';
import invalidationSvg from '../../svg/Invalidation.svg';
import { RefreshCw, ShieldAlert } from 'lucide-react';

export const InvalidationPage: React.FC = () => {
  return (
    <SchemaViewLayout
      id="invalidation"
      title="Writes & Cache Invalidation (Eventual Consistency)"
      subtitle="Séquence d'invalidation asynchrone par Transactional Outbox et Redis Pub/Sub"
      category="Caching & Consistency"
      badgeColor="bg-red-500/10 text-red-400 border-red-500/20"
      svgSrc={invalidationSvg}
      svgAlt="Schéma de séquence d'invalidation de cache et cohérence à terme"
      overview="Garantir la cohérence des caches lors d'une écriture sans bloquer les performances nécessite une stratégie robuste. Le pattern Transactional Outbox couplé à Redis Pub/Sub assure une invalidation fiable et découplée des caches L1 et L2 à travers toutes les instances."
      keyPoints={[
        {
          label: 'Transactional Outbox Atomique',
          desc: 'La mutation des données et l\'événement d\'invalidation sont persistés dans la même transaction SQL (durable et infaillible).',
          type: 'success'
        },
        {
          label: 'Invalidation L1 Immédiate (Writer)',
          desc: 'L\'instance écrivant la donnée invalide immédiatement son propre cache mémoire local L1 dès le commit.',
          type: 'info'
        },
        {
          label: 'Outbox Relay & Suppression L2 Redis',
          desc: 'Un composant d\'arrière-plan (Outbox Relay) lit les événements et purge la clé correspondante dans le cache L2 Redis.',
          type: 'info'
        },
        {
          label: 'Redis Pub/Sub Fan-out pour L1 Readers',
          desc: 'Une notification de purge est diffusée par Redis Pub/Sub à toutes les instances réceptrices (Instance 2) pour vider leur L1.',
          type: 'warning'
        }
      ]}
      techStack={['PostgreSQL / MySQL (Outbox Table)', 'Debezium / Outbox Poller', 'Redis Pub/Sub', 'Caffeine Local Invalidation']}
      rules={[
        'Cohérence à terme (Eventual Consistency) : les lecteurs peuvent observer des données légèrement périmées pendant une fenêtre temporelle bornée.',
        'Les lectures exigeant une fraîcheur stricte (Strict Freshness) DOIVENT contourner les caches L1/L2 et lire directement la base de données source.',
        'Redis Pub/Sub ne rejoue pas les messages manqués : les TTL courts sur le cache L1 bornent la durée maximale des données obsolètes.',
        'Ne jamais tenter d\'invalider un cache distant avant le COMMIT effectif de la transaction en base.',
        'L\'écriture dans l\'Outbox et la mise à jour des tables métier doivent impérativement faire partie de la même transaction ACID.'
      ]}
      sections={[
        {
          title: 'Séquence d\'Écriture et Invalidation (Étapes a-g)',
          badge: 'Sequence Flow',
          icon: <RefreshCw className="w-4 h-4 text-red-400" />,
          content: (
            <div className="space-y-1.5 text-xs text-gray-300">
              <p><strong className="text-white">a. BEGIN TX :</strong> Écriture des données métier + insertion de l'événement d'invalidation dans la table Outbox.</p>
              <p><strong className="text-white">b. COMMIT :</strong> Validation atomique et durable en base de données.</p>
              <p><strong className="text-white">c. Invalidate Local L1 :</strong> L'Instance 1 (writer) purge son propre cache local.</p>
              <p><strong className="text-white">d. Poll / Tail Outbox :</strong> L'Outbox Relay dépile l'événement d'invalidation validé.</p>
              <p><strong className="text-white">e. DEL L2 Key :</strong> Suppression de la clé dans le cache central Redis.</p>
              <p><strong className="text-white">f. PUBLISH L1-Invalidation :</strong> Publication sur le topic Redis Pub/Sub et diffusion (*fan-out*).</p>
              <p><strong className="text-white">g. Invalidate Reader L1 :</strong> L'Instance 2 (reader) reçoit le signal et purge son cache L1 local.</p>
            </div>
          )
        },
        {
          title: 'Strict Freshness vs Eventual Consistency',
          badge: 'Consistency Guarantee',
          icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
          content: (
            <div className="p-3 bg-[#0d1117] rounded border border-amber-500/30 text-xs text-amber-200">
              Pour les opérations critiques nécessitant une précision absolue (soldes bancaires, vérification de stocks), contournez systématiquement le cache pour exécuter une requête directe sur la base de données.
            </div>
          )
        }
      ]}
    />
  );
};

export default InvalidationPage;
