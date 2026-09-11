# PARAMÈTRE — Centre d'administration SaaS

Objectif : transformer la page « Paramètres » (aujourd'hui vide) en centre de gestion de la plateforme, sans toucher aux modules existants (CMS, CRM, Finance, Facturation, Messages, Administration).

## Structure de la page

Une page unique `/admin/settings` avec une navigation par onglets, dans le style visuel actuel du back-office :

Clients · Sociétés · SaaS / Applications · Services / Modules · Plans · Abonnements · Utilisateurs · Rôles · Permissions · Facturation · Paiements · Audit · Configuration

## Contenu de chaque section

**Clients** — liste avec recherche, ajout, modification, désactivation/réactivation. Fiche client : nom, société, email, téléphone, adresse, ville, pays, statut, date de création, plus les applications, services et abonnements liés.

**Sociétés** — gestion indépendante : coordonnées, utilisateurs rattachés, applications, services activés, abonnements, stockage utilisé/disponible, dates de début et de fin, statut. Chaque société ne voit que ses propres données.

**SaaS / Applications** — catalogue des programmes (Gestion Commerciale, CRM, Stock, Comptabilité, RH, Finance…). Nom, description, version, statut, services rattachés. Ajout d'un nouveau SaaS possible à tout moment.

**Services / Modules** — arborescence par application, avec services principaux et sous-services (Commercial → Clients, Documents Clients, Fournisseurs, Documents Fournisseurs ; Stock → Articles, Famille, Suivi stock ; RH → Personnel, Pointage, Congés, Paie ; Comptabilité → Journal, Grand livre, Balance, Bilan, Résultat, Banque ; Finance → Trésorerie, Budget, Plan financement, Analyse, Rapprochement, Indicateurs ; Paiement → Paiements clients, Paiements fournisseur, Chèques). Chaque service s'active ou se désactive séparément.

**Plans** — Free, Basic, Pro, Premium, Enterprise. Nom, description, prix, devise, périodicité (mensuel, annuel, personnalisé), nombre d'utilisateurs, stockage, applications incluses, services inclus, statut. Les services d'un plan se cochent individuellement.

**Abonnements** — un abonnement relie client, société, application et plan : dates de début/fin, durée, prix, statut (Active, Trial, Expired, Suspended, Cancelled), création, renouvellement, changement de plan, suspension, annulation, réactivation.

**Utilisateurs** — création, modification, activation/désactivation, rattachement à une société, rôle, applications et services autorisés.

**Rôles** — Administrator, Manager, Commercial, Accountant, RH, User, chacun avec son jeu de permissions modifiable.

**Permissions** — matrice service par service. Un service parent autorisé n'accorde jamais automatiquement ses sous-services.

**Facturation / Paiements** — factures d'abonnement, montants dus, renouvellements, état de paiement, rattachés au client, à l'abonnement et au plan. Réutilise les documents de facturation existants.

**Audit** — journal des opérations : utilisateur, action, date, heure, élément concerné, détails. S'appuie sur la table de journal d'activité déjà présente.

**Configuration** — réglages généraux de la plateforme et choix de la langue.

## Sidebar et langues

- Le menu latéral n'affiche que les services autorisés, principaux comme secondaires ; un service parent avec sous-services s'ouvre et se referme au clic. L'organisation et l'apparence actuelles sont conservées.
- Interface traduisible en français, arabe, anglais, espagnol et allemand, avec affichage droite-à-gauche complet en arabe.
- Aucun nouveau thème, aucune nouvelle couleur : l'identité visuelle actuelle reste inchangée.

## Détails techniques

Nouvelles tables (avec règles d'accès réservées aux administrateurs) :
`saas_apps`, `saas_services` (auto-référencée pour les sous-services), `saas_plans`, `plan_services`, `companies`, `saas_clients`, `client_apps`, `subscriptions`, `company_users`, `saas_roles`, `role_permissions`, `user_service_permissions`, `subscription_invoices`, `subscription_payments`.

Chaque table publique reçoit ses `GRANT`, RLS activé, politiques basées sur `has_role`/`is_staff`, et déclencheur `tg_set_updated_at`.

Une migration de départ insère le catalogue décrit ci-dessus (applications, arborescence de services, plans standard) pour que les écrans ne soient pas vides.

Côté code : `src/lib/saas-admin.functions.ts` (server functions protégées par `requireSupabaseAuth` + vérification de rôle), un dossier `src/components/admin/settings/` avec un composant par onglet, réécriture de `src/routes/admin.settings.tsx`, extension de la sidebar pour les sous-menus repliables, et un contexte de traduction léger `src/lib/i18n.tsx` avec bascule RTL.

Livraison par étapes : (1) base de données + catalogue, (2) Clients / Sociétés / SaaS / Services, (3) Plans / Abonnements / Facturation / Paiements, (4) Utilisateurs / Rôles / Permissions + sidebar dynamique, (5) Audit / Configuration / langues.
