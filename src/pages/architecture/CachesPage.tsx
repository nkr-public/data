import React from 'react';
import SchemaViewLayout from '../../components/architecture/SchemaViewLayout';
import cachesSvg from '../../svg/Caches.svg';
import { Zap, Server } from 'lucide-react';

export const CachesPage: React.FC = () => {
  return (
    <SchemaViewLayout
      id="caches"
      title="Backend L1 / L2 Caches (Cache-Aside Pattern)"
      subtitle="Stratégie de mise en cache multi-niveaux ultra-performante combinant mémoire locale et cache distribué"
      category="Caching & Performance"
      badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
      svgSrc={cachesSvg}
      svgAlt="Schéma d'architecture Backend L1 / L2 Caches"
      overview="Pour réduire la latence et soulager la base de données relationnelle, le système implémente un double niveau de cache avec le pattern Cache-Aside : un cache L1 local ultra-rapide (Caffeine) in-process par instance, et un cache L2 distribué partagé (Redis)."
      keyPoints={[
        {
          label: 'L1 Cache (Caffeine - In-Process)',
          desc: 'Cache mémoire local à chaque instance (temps d\'accès < 1ms), TTL court et taille bornée pour éviter toute fuite mémoire.',
          type: 'success'
        },
        {
          label: 'L2 Cache (Redis - Distribué)',
          desc: 'Cache partagé entre toutes les instances du microservice avec TTL configurable. Clés organisées par namespace (ex: svc-x:tenant-42:entity:id).',
          type: 'info'
        },
        {
          label: 'Database (Source of Truth)',
          desc: 'La base de données relationnelle reste la source de vérité absolue. Redis ne requête jamais la base directement.',
          type: 'warning'
        },
        {
          label: 'Cascade de Lecture Hiérarchique',
          desc: 'L1 Lookup -> (si miss) L2 Redis Lookup -> (si miss) Database Query -> Remplissage L2 -> Remplissage L1.',
          type: 'info'
        }
      ]}
      techStack={['Redis 7.x (Cluster)', 'Caffeine Cache (Java/Go/Node in-memory)', 'PostgreSQL / MySQL', 'Spring Cache / RedisOM']}
      rules={[
        'Pattern Cache-Aside : l\'application (Cached Query Adapter) orchestre elle-même la hiérarchie L1 -> L2 -> DB.',
        'Les clés L2 Redis doivent obligatoirement inclure l\'identifiant de tenant et de service pour garantir l\'isolation multitenant.',
        'La base de données fait toujours autorité ; le cache n\'est qu\'une vue temporaire et révocable.',
        'En cas de L2 Hit, l\'étape de requête DB est ignorée et seul le cache L1 local est repeuplé.',
        'Le cache L1 local n\'est pas partagé entre les instances scalées horizontalement.'
      ]}
      sections={[
        {
          title: 'Flux de Lecture (Read Flow Steps 1-5)',
          badge: 'Cache-Aside Sequence',
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          content: (
            <div className="space-y-2 text-xs">
              <ol className="list-decimal pl-4 space-y-1.5">
                <li><strong className="text-white">Étape 1 (L1 Lookup) :</strong> Recherche dans la mémoire vive locale de l'instance courante.</li>
                <li><strong className="text-white">Étape 2 (L2 GET) :</strong> En cas de miss L1, interrogation du cluster Redis distant.</li>
                <li><strong className="text-white">Étape 3 (DB Query) :</strong> En cas de miss L2, exécution de la requête SQL sur la base de données.</li>
                <li><strong className="text-white">Étape 4 (Populate L2) :</strong> Écriture de la valeur dans Redis avec son TTL.</li>
                <li><strong className="text-white">Étape 5 (Populate L1) :</strong> Alimentation du cache L1 local pour les futures requêtes.</li>
              </ol>
            </div>
          )
        },
        {
          title: 'Isolation & Multi-Instance',
          badge: 'Horizontal Scaling',
          icon: <Server className="w-4 h-4 text-blue-400" />,
          content: (
            <p>
              Chaque réplique (Instance 1, Instance 2...) possède son propre cache L1 indépendant mais partage le même cache L2 Redis. Si l'Instance 1 met en cache une donnée dans Redis, l'Instance 2 profitera immédiatement d'un <strong className="text-emerald-400">L2 Hit</strong>.
            </p>
          )
        }
      ]}
    />
  );
};

export default CachesPage;
