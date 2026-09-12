/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Boxes } from "lucide-react";
import { EntityCrud, StatusChip, type ColDef } from "./EntityCrud";
import { LinksModal } from "./LinksModal";
import { fmt } from "@/components/admin/finance/ui";
import { nameOf, type Row, type SaasDataset } from "@/lib/saas-data";

const STATUS_OPTS = [
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
  { value: "suspended", label: "Suspendu" },
];

export function ClientsTab({ data, canEdit }: { data: SaasDataset; canEdit: boolean }) {
  const [target, setTarget] = useState<Row | null>(null);
  const companyOpts = data.companies.map((c) => ({
    value: c["id"] as string,
    label: c["name"] as string,
  }));

  const cols: ColDef[] = [
    { label: "Client", render: (r) => <span className="text-white">{r["full_name"]}</span> },
    { label: "Société", render: (r) => nameOf(data.companies, r["company_id"]) },
    { label: "Email", render: (r) => r["email"] ?? "—" },
    { label: "Téléphone", render: (r) => r["phone"] ?? "—" },
    { label: "Ville", render: (r) => r["city"] ?? "—" },
    {
      label: "Abonnements",
      render: (r) => data.subscriptions.filter((s) => s["client_id"] === r["id"]).length,
    },
    { label: "Statut", render: (r) => <StatusChip value={r["status"]} /> },
  ];

  return (
    <>
      <EntityCrud
        table="saas_clients"
        title="Clients"
        singular="Client"
        rows={data.clients}
        columns={cols}
        canEdit={canEdit}
        searchKeys={["full_name", "email", "phone"]}
        extraActions={(r) =>
          canEdit ? (
            <button
              onClick={() => setTarget(r)}
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              title="Applications autorisées"
              aria-label="Applications autorisées"
            >
              <Boxes className="h-3.5 w-3.5" />
            </button>
          ) : null
        }
        fields={[
          { name: "full_name", label: "Nom complet", required: true },
          { name: "company_id", label: "Société", type: "select", options: companyOpts },
          { name: "email", label: "Email" },
          { name: "phone", label: "Téléphone" },
          { name: "city", label: "Ville" },
          { name: "country", label: "Pays", fallback: "Maroc" },
          { name: "status", label: "Statut", type: "select", options: STATUS_OPTS, fallback: "active" },
          { name: "address", label: "Adresse", type: "textarea" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
      {target && (
        <LinksModal
          title={`Applications — ${target["full_name"]}`}
          groups={[
            {
              label: "Applications",
              items: data.apps.map((a) => ({ id: a["id"] as string, label: a["name"] as string })),
            },
          ]}
          selected={data.clientApps
            .filter((c) => c["client_id"] === target["id"])
            .map((c) => c["app_id"] as string)}
          table="client_apps"
          ownerKey="client_id"
          ownerId={target["id"] as string}
          targetKey="app_id"
          onClose={() => setTarget(null)}
        />
      )}
    </>
  );
}

export function CompaniesTab({ data, canEdit }: { data: SaasDataset; canEdit: boolean }) {
  const cols: ColDef[] = [
    { label: "Société", render: (r) => <span className="text-white">{r["name"]}</span> },
    { label: "ICE", render: (r) => r["ice"] ?? "—" },
    { label: "Ville", render: (r) => r["city"] ?? "—" },
    {
      label: "Utilisateurs",
      render: (r) => data.companyUsers.filter((u) => u["company_id"] === r["id"]).length,
    },
    {
      label: "Stockage",
      render: (r) => `${r["storage_used_mb"]} / ${r["storage_limit_mb"]} Mo`,
    },
    { label: "Fin", render: (r) => r["end_date"] ?? "—" },
    { label: "Statut", render: (r) => <StatusChip value={r["status"]} /> },
  ];
  return (
    <EntityCrud
      table="companies"
      title="Sociétés"
      singular="Société"
      rows={data.companies}
      columns={cols}
      canEdit={canEdit}
      searchKeys={["name", "ice", "city"]}
      fields={[
        { name: "name", label: "Nom", required: true },
        { name: "legal_name", label: "Raison sociale" },
        { name: "ice", label: "ICE" },
        { name: "email", label: "Email" },
        { name: "phone", label: "Téléphone" },
        { name: "city", label: "Ville" },
        { name: "country", label: "Pays", fallback: "Maroc" },
        { name: "start_date", label: "Début", type: "date" },
        { name: "end_date", label: "Fin", type: "date" },
        { name: "storage_limit_mb", label: "Stockage max (Mo)", type: "number", fallback: 1024 },
        { name: "status", label: "Statut", type: "select", options: STATUS_OPTS, fallback: "active" },
        { name: "address", label: "Adresse", type: "textarea" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}

export function SubscriptionsTab({ data, canEdit }: { data: SaasDataset; canEdit: boolean }) {
  const cols: ColDef[] = [
    { label: "Client", render: (r) => nameOf(data.clients, r["client_id"], "full_name") },
    { label: "Société", render: (r) => nameOf(data.companies, r["company_id"]) },
    { label: "Application", render: (r) => nameOf(data.apps, r["app_id"]) },
    { label: "Plan", render: (r) => nameOf(data.plans, r["plan_id"]) },
    { label: "Début", render: (r) => r["start_date"] },
    { label: "Fin", render: (r) => r["end_date"] ?? "—" },
    { label: "Prix", render: (r) => fmt(Number(r["price"] ?? 0), r["currency"] as string) },
    { label: "Statut", render: (r) => <StatusChip value={r["status"]} /> },
  ];
  return (
    <EntityCrud
      table="subscriptions"
      title="Abonnements"
      singular="Abonnement"
      description="Un abonnement relie un client, une société, une application et un plan."
      rows={data.subscriptions}
      columns={cols}
      canEdit={canEdit}
      searchKeys={["status", "notes"]}
      fields={[
        {
          name: "client_id",
          label: "Client",
          type: "select",
          options: data.clients.map((c) => ({
            value: c["id"] as string,
            label: c["full_name"] as string,
          })),
        },
        {
          name: "company_id",
          label: "Société",
          type: "select",
          options: data.companies.map((c) => ({
            value: c["id"] as string,
            label: c["name"] as string,
          })),
        },
        {
          name: "app_id",
          label: "Application",
          type: "select",
          options: data.apps.map((a) => ({ value: a["id"] as string, label: a["name"] as string })),
        },
        {
          name: "plan_id",
          label: "Plan",
          type: "select",
          options: data.plans.map((p) => ({ value: p["id"] as string, label: p["name"] as string })),
        },
        { name: "start_date", label: "Début", type: "date", required: true },
        { name: "end_date", label: "Fin", type: "date" },
        {
          name: "period",
          label: "Périodicité",
          type: "select",
          fallback: "monthly",
          options: [
            { value: "monthly", label: "Mensuel" },
            { value: "yearly", label: "Annuel" },
            { value: "custom", label: "Personnalisé" },
          ],
        },
        { name: "price", label: "Prix", type: "number", fallback: 0 },
        { name: "currency", label: "Devise", fallback: "MAD" },
        {
          name: "status",
          label: "Statut",
          type: "select",
          fallback: "active",
          options: [
            { value: "active", label: "Active" },
            { value: "trial", label: "Essai" },
            { value: "expired", label: "Expirée" },
            { value: "suspended", label: "Suspendue" },
            { value: "cancelled", label: "Annulée" },
          ],
        },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
