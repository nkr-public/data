import React from 'react';
import SchemaViewLayout from '../../components/architecture/SchemaViewLayout';
import backendSvg from '../../svg/Backend.svg';
import { Database, MessageSquare, Shield } from 'lucide-react';

export const BackendPage: React.FC = () => {
  return (
    <SchemaViewLayout
      id="backend"
      title="Backend — Microservices Architecture"
      subtitle="Système distribué hautement disponible avec Reverse Proxy, API Gateway, Services autonomes et Message Broker"
      category="Backend Architecture"
      badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      svgSrc={backendSvg}
      svgAlt="Schéma d'architecture Backend Microservices"
      overview="L'architecture backend repose sur une séparation claire entre le point d'entrée public sécurisé (Reverse Proxy + API Gateway), des microservices autonomes spécialisés possédant chacun leur propre base de données, et un bus de messages asynchrone pour la communication inter-domaines."
      keyPoints={[
        {
          label: 'API Gateway & Reverse Proxy',
          desc: 'Terminaison TLS, authentification / autorisation (AuthN/AuthZ), rate limiting et routage intelligent vers les services cibles.',
          type: 'info'
        },
        {
          label: 'Database per Service',
          desc: 'Chaque microservice est propriétaire exclusif de son schéma et de sa base de données. Aucun accès cross-service n\'est autorisé.',
          type: 'warning'
        },
        {
          label: 'Communication Hybride (Sync / Async)',
          desc: 'HTTP/REST synchrone pour les requêtes de lecture et actions utilisateur directes ; Message Broker (Kafka/RabbitMQ) pour les événements asynchrones.',
          type: 'success'
        },
        {
          label: 'Idempotence des Consommateurs',
          desc: 'Garantie de livraison At-Least-Once sur le broker : chaque consommateur doit être conçu pour gérer les doublons sans effet de bord.',
          type: 'warning'
        }
      ]}
      techStack={['Node.js / Go / Java', 'Reverse Proxy (NGINX / Envoy)', 'API Gateway (Kong / Traefik)', 'PostgreSQL / MongoDB', 'Kafka / RabbitMQ', 'Docker / K8s']}
      rules={[
        'Pas de couplage 1:1 obligatoire entre Micro-frontends et Microservices (un écran frontend peut agréger les données de plusieurs services).',
        'RÈGLE STRICTE : Interdiction absolue d\'accéder directement à la base de données d\'un autre microservice (Database Isolation).',
        'Toute mutation de données nécessitant une répercussion dans d\'autres services doit publier un événement sur le Message Broker.',
        'Les consommateurs d\'événements doivent être idempotents face au modèle de distribution at-least-once du broker.',
        'L\'API Gateway centralise le contrôle d\'accès et la validation des jetons JWT pour décharger les services internes.'
      ]}
      sections={[
        {
          title: 'Front-Door : Reverse Proxy & API Gateway',
          badge: 'Edge Layer',
          icon: <Shield className="w-4 h-4 text-blue-400" />,
          content: (
            <p>
              Le navigateur envoie des requêtes HTTPS au <strong className="text-white">Reverse Proxy</strong> qui gère le chiffrement TLS et les assets statiques, puis les transmet à l'<strong className="text-white">API Gateway</strong> qui vérifie l'identité, applique les quotas de requêtes et route l'appel vers le microservice approprié.
            </p>
          )
        },
        {
          title: 'Services Autonomes & Database per Service',
          badge: 'Service Autonomy',
          icon: <Database className="w-4 h-4 text-emerald-400" />,
          content: (
            <div className="space-y-2">
              <p>
                Chaque microservice (Service A, Service B, Service C) gère son propre cycle de vie et possède son stockage dédié (<code className="text-emerald-300">Database A</code>, <code className="text-emerald-300">Database B</code>, <code className="text-emerald-300">Database C</code>).
              </p>
              <div className="p-3 bg-[#0d1117] rounded border border-red-500/30 text-xs text-red-300">
                L'intégrité et la cohérence des données sont garanties localement au sein de chaque microservice sans transactions distribuées 2PC lourdes.
              </div>
            </div>
          )
        },
        {
          title: 'Message Broker (Événements Asynchrones)',
          badge: 'Event-Driven',
          icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
          content: (
            <p>
              Le <strong className="text-white">Message Broker</strong> permet aux microservices de publier des événements de domaine (ex: <code>OrderCreated</code>) consommés par les services dépendants (ex: Facturation, Notifications), assurant ainsi un découplage temporel et technique total.
            </p>
          )
        }
      ]}
    />
  );
};

export default BackendPage;
