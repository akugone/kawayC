# 🔐 KawaiiC - KYC Confidentiel Décentralisé

> **Application de vérification d'identité confidentielle avec génération de cartes NFC/Wallet mobile**

Développé lors de l'iHackathon iExec 2025 🏆

---

## 🎯 Qu'est-ce que KawaiiC ?

KawaiiC révolutionne la vérification d'identité en permettant aux utilisateurs de prouver leur âge et leur pays de résidence **sans jamais révéler leurs documents personnels**. 

Grâce au confidential computing d'iExec, vos documents restent chiffrés du début à la fin - seules les informations strictement nécessaires sont validées et partagées.

### ✨ Fonctionnalités Principales

- **🔒 Upload Sécurisé** : Selfie + CNI + Justificatif de domicile chiffrés côté client
- **🧠 IA Confidentielle** : Processing biométrique dans un environnement d'exécution de confiance (TEE)
- **📱 Wallet Integration** : Génération automatique de passes Apple Wallet / Google Wallet
- **🔍 Vérification QR** : Preuve d'âge instantanée par scan sans révéler les documents
- **🌐 Décentralisé** : Aucun stockage centralisé de vos données personnelles

## 🏗️ Architecture Technique

### Stack Frontend
- **Next.js 15** avec App Router + TypeScript
- **Tailwind CSS + ShadCN UI** pour l'interface
- **Reown (WalletConnect)** pour la connexion wallet
- **iExec DataProtector** pour le chiffrement des documents
- **SIWE** pour une UX plus fluide et moins de signatures 

### Innovation iExec
- **DataProtector SDK** : Chiffrement end-to-end des documents sensibles
- **Confidential Computing** : Processing IA dans un TEE sur Bellecour
- **Dataset Innovant** : Premier type "ConfidentialKYCDocuments"
- **Gas-Free** : Transactions sur la sidechain Bellecour

## 🚀 Comment ça marche

### Pour l'Utilisateur
1. **Connexion** de votre wallet Web3
2. **Upload** de vos 3 documents (selfie, CNI, justificatif domicile)
3. **Chiffrement** automatique côté client via DataProtector
4. **Processing** confidentiel par l'IA iExec dans un TEE
5. **Génération** de votre carte digitale avec QR code
6. **Ajout** à Apple Wallet ou Google Wallet

### Pour la Vérification
- **Scan QR** : Affiche uniquement l'âge validé et le pays
- **Aucune donnée personnelle** n'est révélée
- **Signature cryptographique** iExec pour l'authenticité

## 🛠️ Installation & Développement

### Prérequis
```bash
Node.js 18+
npm ou yarn
Wallet Web3 (MetaMask recommandé)
```

### Installation
```bash
# Cloner le repository
git clone https://github.com/votre-equipe/kawaiic.git
cd kawayc

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Compléter avec vos clés API iExec

# Lancer en développement
npm run dev
```

### Variables d'Environnement
```env
NEXT_PUBLIC_IEXEC_APP_ADDRESS=0x194aa55fc47273fb25a395e64a984573a78ccfad
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
```

## 🔬 Innovation Technique

### Nouveau Type de Dataset iExec
```javascript
const KYCDataset = {
  type: "ConfidentialKYCDocuments",
  privacy: "documents_never_revealed",
  processing: [
    "age_estimation_ai",
    "document_ocr", 
    "coherence_validation"
  ],
  output: [
    "validated_age",
    "country_residence", 
    "kyc_status"
  ]
}
```

### Avantages Uniques
- **Privacy by Design** : Les documents originaux ne quittent jamais l'environnement chiffré
- **Vérification Sélective** : Prouvez seulement ce qui est nécessaire
- **Décentralisation Complète** : Pas de base de données centralisée à hacker
- **Mobile-First** : Intégration native avec les wallets smartphone

## 📊 Cas d'Usage

### Pour les Utilisateurs
- ✅ Accès aux plateformes 18+
- ✅ Ouverture de comptes financiers  
- ✅ Vérification d'âge sans révéler la date de naissance
- ✅ Preuve de résidence sans donner l'adresse exacte

### Pour les Entreprises
- ✅ Conformité KYC/AML simplifiée
- ✅ Réduction des risques de fuite de données
- ✅ Coûts de compliance réduits
- ✅ Expérience utilisateur améliorée

---

> **"Vos documents restent privés, seule votre éligibilité est prouvée"**

*Développé avec ❤️ pendant l'iHackathon iExec 2025* par la Tagadata Team
