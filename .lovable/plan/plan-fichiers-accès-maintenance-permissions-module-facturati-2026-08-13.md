# Plan — Fichiers, accès Maintenance, permissions, module Facturation

## 1. Explorateur de fichiers (CMS → Fichiers)
Aujourd'hui l'explorateur liste ce que voit le serveur au moment de l'exécution, ce qui peut être une version compilée du projet.

- Afficher la **structure source** : racine forcée sur le projet (`src/`, `public/`, `supabase/`, fichiers de config), tri dossiers puis fichiers.
- Masquer tout ce qui est généré : `dist`, `.output`, `.vinxi`, `node_modules`, `.git`, `routeTree.gen.ts`, caches.
- Si le serveur n'a pas accès aux sources (site publié), afficher un message clair au lieu d'une arborescence compilée.

## 2. Maintenance : qui peut voir le front-office
- Quand la maintenance est active, seuls **les super admins** et **les utilisateurs explicitement autorisés** voient le site normal ; tous les autres voient l'écran de maintenance.
- Dans CMS → Maintenance : liste des utilisateurs avec une case « peut voir le site pendant la maintenance ».
- Le bouton Connexion reste toujours accessible.

## 3. Permissions par utilisateur (Administration)
- À la création et à l'édition d'un utilisateur, un super admin coche les modules visibles dans le back-office :
  Dashboard, Administration, Website (CMS), Commercial (CRM), Finance, Facturation, SaaS Management, Messages, Paramètres.
- Ces permissions sont stockées en base (nouvelle table de permissions par utilisateur) et priment sur les permissions par rôle.
- Le menu latéral et l'accès aux pages du back-office s'adaptent automatiquement.

## 4. Module Facturation (fonctionnel)
### Identité de l'entreprise
- Téléversement de : **logo**, **papier en-tête** (fond de page), **cachet/signature**.
- Coordonnées société (raison sociale, adresse, ICE, RC, IF, patente, RIB, téléphone, email, site) — utilisées dans le pied de page du document.

### Documents administratifs
Types gérés : Devis, Bon de commande, Facture, Facture d'acompte, Avoir, Bon de livraison, Reçu.
- Numérotation automatique par type et par année (ex. `FA26010002`).
- Client, date, objet, lignes (désignation, prix unitaire HT, quantité, total), TVA paramétrable, acompte, net à payer, montant en toutes lettres, conditions commerciales.
- Statuts : brouillon, envoyé, payé partiellement, payé, annulé.

### Conversion entre documents
- Un devis se convertit en bon de commande ou en facture en un clic, en reprenant toutes les informations (client, lignes, totaux) sans ressaisie ; le lien entre les documents est conservé et visible.

### Suivi des paiements
- Enregistrement des règlements (date, montant, mode : chèque, virement, espèces, carte, référence).
- Calcul automatique du restant dû, historique des paiements et échéancier par document.

### Archivage et export PDF
- Liste filtrable (type, statut, client, période) avec recherche.
- Export PDF au format de la facture DODRICOM fournie : bandeau bleu nuit avec logo et vague turquoise, titre « Facture N° … », bloc client + ICE + bon de commande, bandeau date, tableau des désignations, bandeau totaux (Total HT, Taux TVA, TVA, Total TTC, Acompte), encadré « NET A PAYER » avec montant en lettres, conditions commerciales, pied de page société. Le cachet est apposé si activé, et l'utilisateur choisit avant l'export quels éléments afficher (logo, papier en-tête, cachet, conditions).

## Notes techniques
- Nouvelles tables : paramètres de facturation, documents, lignes de document, paiements, permissions utilisateur, autorisations maintenance.
- Accès réservé aux utilisateurs ayant la permission Facturation ; règles de sécurité côté base.
- PDF généré côté client (rendu HTML fidèle → PDF) pour garder la mise en page exacte.
- Le module sera livré en une étape : réglages + documents + conversion + paiements + PDF.
