# HtmlEditor - React + Vite Single Page Application

Application React + Vite générant un fichier HTML unique autonome (`single HTML file`), obfusqué pour la production et conçu pour se lancer dans une fenêtre sans menu ni barre d'adresse (`standalone app window`).

## 🚀 Fonctionnalités

- **Éditeur HTML interactif en temps réel** (Live preview dans iframe sécurisée).
- **Single HTML Page Builder** : Grâce à `vite-plugin-singlefile`, tout le code JavaScript et CSS est compilé et intégré dans un unique fichier `dist/index.html`.
- **Obfuscation Production** : Intégration de `javascript-obfuscator` dans le pipeline de build Vite en mode production (`npm run build`).
- **Lancement dans une fenêtre sans menu ni barre d'adresse** :
  - Bouton interactif « **Ouvrir en mode Fenêtre App** » utilisant `window.open` avec les flags `menubar=no,toolbar=no,location=no,status=no`.
  - Scripts d'aide pour lancer directement le fichier HTML en mode standalone (par exemple sous Chrome / Edge avec `--app=file:///...` ou popup).

## 🛠 Commandes

```bash
# Lancer le serveur de développement
npm run dev

# Compiler la single-page HTML autonome et obfusquée
npm run build

# Prévisualiser la version de production
npm run preview
```
