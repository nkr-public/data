import React from 'react';
import SchemaViewLayout from '../../components/architecture/SchemaViewLayout';
import devopsSvg from '../../svg/Devops.svg';
import { GitBranch, Cloud, ShieldCheck } from 'lucide-react';

export const DevopsPage: React.FC = () => {
  return (
    <SchemaViewLayout
      id="devops"
      title="DevOps Architecture — CI / CD & Platform"
      subtitle="Pipeline d'intégration et livraison continue GitOps, conteneurisation et infrastructure Kubernetes sécurisée"
      category="DevOps & Platform Engineering"
      badgeColor="bg-teal-500/10 text-teal-400 border-teal-500/20"
      svgSrc={devopsSvg}
      svgAlt="Schéma d'architecture DevOps CI/CD et Plateforme"
      overview="L'architecture DevOps assure des cycles de déploiement continus, indépendants et automatisés pour chaque micro-frontend et chaque microservice grâce au paradigme GitOps, des images immuables signées et une plateforme Kubernetes hautement observable."
      keyPoints={[
        {
          label: 'Continuous Integration (CI)',
          desc: 'Trunk-based development, builds parallélisés (Vite/Gradle), tests unitaires et de contrat (Pact/Testcontainers), SAST & SBOM, publication d\'artefacts immuables.',
          type: 'info'
        },
        {
          label: 'GitOps & Progressive Delivery',
          desc: 'Le GitOps Controller réconcilie automatiquement l\'état du cluster avec le dépôt de manifests. Déploiement progressif (Canary / Blue-Green / Feature flags).',
          type: 'success'
        },
        {
          label: 'Plateforme Kubernetes & IaC',
          desc: 'Infrastructure déclarative as Code (Terraform/OpenTofu), autoscaling HPA, Network Policies strictes et gestion centralisée des secrets.',
          type: 'info'
        },
        {
          label: 'Boucle de Rétroaction & Observabilité',
          desc: 'Logs, métriques Prometheus/Grafana, traces OpenTelemetry, SLOs et rollback automatique déclenché en cas de brèche de qualité.',
          type: 'warning'
        }
      ]}
      techStack={['Git / GitHub Actions / GitLab CI', 'Docker / Container Registry', 'Kubernetes / Helm / Kustomize', 'ArgoCD / Flux (GitOps)', 'Terraform / OpenTofu', 'OpenTelemetry / Prometheus / Grafana']}
      rules={[
        'Chaque micro-frontend et chaque microservice possède son propre pipeline indépendant et sa propre cadence de release.',
        'Un même artefact immuable (image Docker taguée au SHA Git) est promu de Dev -> Staging -> Production (seuls la configuration et les secrets diffèrent).',
        'Les secrets ne sont JAMAIS gravés dans les images de conteneurs (injection runtime via HashiCorp Vault ou Sealed Secrets).',
        'Toutes les modifications d\'infrastructure et de configuration applicative transitent impérativement par une Pull Request Git (Audit trail).',
        'Les signaux de santé et alertes SLO pilotent automatiquement la promotion ou le rollback des versions.'
      ]}
      sections={[
        {
          title: 'Pipeline CI & Registres d\'Artefacts',
          badge: 'Build & Verify',
          icon: <GitBranch className="w-4 h-4 text-teal-400" />,
          content: (
            <p className="text-xs">
              De la pull request jusqu'aux tests de contrats et scanners de vulnérabilités, le pipeline CI génère des conteneurs immuables et pousse les manifests sur le dépôt GitOps avec bump de version automatique.
            </p>
          )
        },
        {
          title: 'GitOps Controller & Déploiement Progressif',
          badge: 'Continuous Delivery',
          icon: <Cloud className="w-4 h-4 text-blue-400" />,
          content: (
            <p className="text-xs">
              Le contrôleur GitOps synchronise l'environnement Kubernetes. Les déploiements en production utilisent des stratégies sans coupure (Blue/Green ou Canary) avec analyse de métriques en temps réel.
            </p>
          )
        },
        {
          title: 'Socle Plateforme & Sécurité',
          badge: 'Platform Engineering',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          content: (
            <p className="text-xs">
              Cloisonnement par namespaces Kubernetes, politiques réseau (NetworkPolicies), authentification OIDC sans clés statiques et politiques de sécurité OPA (Open Policy Agent).
            </p>
          )
        }
      ]}
    />
  );
};

export default DevopsPage;
