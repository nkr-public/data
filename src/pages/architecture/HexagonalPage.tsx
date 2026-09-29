import React from 'react';
import SchemaViewLayout from '../../components/architecture/SchemaViewLayout';
import hexagonalSvg from '../../svg/Hexagonal.svg';
import { Hexagon, Database, Radio } from 'lucide-react';

export const HexagonalPage: React.FC = () => {
  return (
    <SchemaViewLayout
      id="hexagonal"
      title="Hexagonal Architecture (Ports & Adapters)"
      subtitle="Conception interne d'un microservice isolant le domaine métier de tout framework et système externe"
      category="Software Architecture"
      badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      svgSrc={hexagonalSvg}
      svgAlt="Schéma de l'Architecture Hexagonale interne à un Microservice"
      overview="L'architecture hexagonale (ou Ports & Adapters) place le domaine métier au centre de l'application. Elle garantit que la logique métier (Domain & Use Cases) ne dépend d'aucun détail d'implémentation externe (base de données, contrôleur REST, message broker, cache), permettant une testabilité et une évolutivité maximales."
      keyPoints={[
        {
          label: 'Inbound Adapters (Adaptateurs Primaires)',
          desc: 'Points d’entrée déclenchant l’exécution : REST Controllers (requêtes HTTP), Message Consumers (événements Kafka/RabbitMQ), Scheduled Jobs (cron/timers).',
          type: 'info'
        },
        {
          label: 'Inbound Ports (Interfaces d\'Entrée)',
          desc: 'Interfaces définissant les contrats d’API interne implémentés par les Use Cases applicatifs.',
          type: 'info'
        },
        {
          label: 'Domain & Use Cases (Cœur Applicatif)',
          desc: 'Entités pures, Value Objects, Règles de gestion et événements métier. Zéro dépendance technique, écrit en code natif pur.',
          type: 'success'
        },
        {
          label: 'Outbound Ports & Adapters (Secondaires)',
          desc: 'Interfaces de sortie (Ports) requises par les Use Cases, implémentées par les adaptateurs d’infrastructure (Persistence JPA/SQL, Clients HTTP, Cache Redis/Caffeine, Event Publishing via Outbox).',
          type: 'warning'
        }
      ]}
      techStack={['Spring Boot / NestJS / Go / Quarkus', 'Ports & Adapters Pattern', 'Transactional Outbox', 'Caffeine Cache', 'Redis', 'JPA / SQL']}
      rules={[
        'Les dépendances de code pointent EXCLUSIVEMENT vers l\'intérieur (Application / Domain). Le domaine ne dépend de RIEN.',
        'Flux d\'exécution Runtime (de l\'extérieur vers l\'intérieur) : Requête / Message -> Inbound Adapter -> Inbound Port -> Use Case -> Outbound Port -> Outbound Adapter -> Système Externe.',
        'Les Use Cases implémentent les Inbound Ports et consomment les Outbound Ports.',
        'Les Outbound Adapters implémentent les Outbound Ports.',
        'Le module Bootstrap est le seul connaissant toutes les classes concrètes et réalisant l\'injection des dépendances.'
      ]}
      sections={[
        {
          title: 'Inbound Adapters & Inbound Ports',
          badge: 'Driving Side',
          icon: <Radio className="w-4 h-4 text-blue-400" />,
          content: (
            <p>
              Les requêtes externes (HTTP, messages de broker, cron) arrivent dans les <strong className="text-white">Inbound Adapters</strong> qui convertissent les données brutes en commandes typées et appellent les <strong className="text-white">Inbound Ports</strong>.
            </p>
          )
        },
        {
          title: 'Application Core (Use Cases & Domain)',
          badge: 'Domain Heart',
          icon: <Hexagon className="w-4 h-4 text-purple-400" />,
          content: (
            <div className="space-y-2">
              <p>
                <strong className="text-purple-300">Use Cases :</strong> Coordonnent les transactions, appliquent la logique applicative et orchestrent les ports de sortie.
              </p>
              <p>
                <strong className="text-emerald-300">Domain :</strong> Entités, invariants métier et règles de calcul sans aucun import de framework.
              </p>
            </div>
          )
        },
        {
          title: 'Outbound Adapters & External Systems',
          badge: 'Driven Side',
          icon: <Database className="w-4 h-4 text-emerald-400" />,
          content: (
            <div className="space-y-2">
              <p>
                Les adaptateurs secondaires interagissent avec l'infrastructure :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-300 text-xs">
                <li><strong className="text-white">Persistence :</strong> Repositories JPA/SQL.</li>
                <li><strong className="text-white">HTTP Clients :</strong> Communication avec d'autres microservices.</li>
                <li><strong className="text-white">Cache :</strong> L1 Caffeine (in-memory) / L2 Redis.</li>
                <li><strong className="text-white">Event Publishing :</strong> Pattern Outbox vers le broker.</li>
              </ul>
            </div>
          )
        }
      ]}
    />
  );
};

export default HexagonalPage;
