🧩 **Fonctionnalités:**

🏠 **Dashboard**

* Infos utilisateur
* Classe sélectionnée
* Accès rapide aux modules, planning, stats

📘 **Modules**

* Liste des modules liés à l’utilisateur
* Progression par module (relation Travailler)
* Difficulté + rappels automatiques

🧪 **Quiz & Flashcards**

* Quiz : réponse libre + correction
* Score calculé
* Résultats enregistrés (relation Obtenir)

📊 **Statistiques**

* Historique des scores
* Moyenne
* Meilleur score
* Données issues du backend ou du mock

🗓️ **Planning**

* Activités privées (ajout / suppression)
* Import d’horaires scolaires via fichier .ics
* Vue semaine (Lundi → Dimanche)
* Calcul automatique des créneaux libres
* Stockage local sécurisé par utilisateur

🧪 **Mode Mock (sans backend)**

Le projet fonctionne 100 % sans backend grâce à :

* mockDb.ts : données simulées
* fakeDelay() : délai réseau réaliste
* cache.ts : cache mémoire avec TTL

Services smart :
* backend → mock automatique en cas d’erreur
Aucune modification nécessaire pour passer au backend réel plus tard.

✅ Séparation claire :

* Pages = UI
* Services = logique métier
* Types = modèle de données


------------------------------------------------



**Installer et démarrer le serveur Vite local:**

Installer NodeJs :
https://nodejs.org/en/download
Télécharger le projet depuit le github dans la branch develop :
https://github.com/Rrogalaxy/MA-Metier_outil_de_revision/tree/Develop
ou 
git clone https://github.com/Rrogalaxy/MA-Metier_outil_de_revision/tree/Develop
depuis le terminal webstorm.

Une fois le projet téléchargé et mis dans un dossier, prenez le path de vote dossier. ( dans mon cas : C:\Users\pj77vjm\Desktop\revisions-poc-frontend)

Utilisez Windows powershell ISE ou Windows Powershell (version terminal standard) pour vous placer dans le dossier et télécharger les dépendances :

cd "$env:USERPROFILE\Desktop\revisions-poc-frontend" 

npm.cmd install

 <img width="945" height="282" alt="image" src="https://github.com/user-attachments/assets/7be0e653-84d2-4340-84bb-c4d8550a674b" />


Appuyez sur F5 pour exécuter le script. 

Une fois que vous avez installé les dépendances, vous êtes prêts à démarrer le serveur. 

Utilisez Windows Powershell (version terminal standard car la version ISE affiche les données du port de connexions bizarrement.) à nouveau :

cd "$env:USERPROFILE\Desktop\revisions-poc-frontend"
npm.cmd run dev

 <img width="945" height="361" alt="image" src="https://github.com/user-attachments/assets/af5685ae-dcd6-4113-ac61-d6c64b4dc712" />


Le serveur VITE va vous donner une ligne avec l’url à utiliser (dans notre cas le port 5174)
Surtout ne fermez pas le terminal powershell, cela « éteint » le serveur local.

Tapez le liens URL avec le numéro de port correspondant afin d’afficher le serveur.

 
<img width="945" height="547" alt="image" src="https://github.com/user-attachments/assets/db94a929-5c4a-4b89-9cfe-67e9d50c2a72" />








# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
