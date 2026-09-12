/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ListTree } from "lucide-react";
import { EntityCrud, BoolChip, type ColDef } from "./EntityCrud";
import { LinksModal, serviceGroups } from "./LinksModal";
import { fmt } from "@/components/admin/finance/ui";
import { nameOf, type Row, type SaasDataset } from "@/lib/saas-data";

export function AppsTab({ data, canEdit }: { data: SaasDataset; canEdit: boolean }) {
  const cols: ColDef[] = [
    { label: "Code", render: (r) => <span className="font-mono text-xs">{r["code"]}</span> },
    { label: "Application", render: (r) => <span className="text-white">{r["name"]}</span> },
    { label: "Version", render: (r) => r["version"] },
    {
      label: "Services",
      render: (r) => data.services.filter((s) => s["app_id"] === r["id"]).length,
    },
    { label: "Statut", render: (r) => <BoolChip value={!!r["is_active"]} /> },
  ];
  return (
    <EntityCrud
      table="saas_apps"
      title="SaaS / Applications"
      singular="Application"
      description="Catalogue des programmes de la plateforme. Ajoutez un nouveau SaaS à tout moment."
      rows={data.apps}
      columns={cols}
      canEdit={canEdit}
      searchKeys={["name", "code"]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Nom", required: true },
        { name: "version", label: "Version", fallback: "1.0.0" },
        { name: "icon", label: "Icône (lucide)" },
        { name: "sort_order", label: "Ordre", type: "number", fallback: 0 },
        { name: "is_active", label: "Actif", type: "bool", fallback: true },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}

export function ServicesTab({ data, canEdit }: { data: SaasDataset; canEdit: boolean }) {
  const appOpts = data.apps.map((a) => ({ value: a["id"] as string, label: a["name"] as string }));
  const parentOpts = data.services
    .filter((s) => !s["parent_id"])
    .map((s) => ({
      value: s["id"] as string,
      label: `${nameOf(data.apps, s["app_id"])} › ${s["name"]}`,
    }));

  const cols: ColDef[] = [
    {
      label: "Service",
      render: (r) => (
        <span className={r["parent_id"] ? "pl-5 text-white/70" : "font-medium text-white"}>
          {r["parent_id"] ? "— " : ""}
          {r["name"]}
        </span>
      ),
    },
    { label: "Application", render: (r) => nameOf(data.apps, r["app_id"]) },
    { label: "Code", render: (r) => <span className="font-mono text-xs">{r["code"]}</span> },
    { label: "Route", render: (r) => r["route"] ?? "—" },
    { label: "Statut", render: (r) => <BoolChip value={!!r["is_active"]} /> },
  ];

  // Affichage arborescent : chaque parent suivi de ses sous-services.
  const ordered: Row[] = [];
  for (const app of data.apps) {
    const roots = data.services.filter((s) => s["app_id"] === app["id"] && !s["parent_id"]);
    for (const root of roots) {
      ordered.push(root);
      ordered.push(...data.services.filter((s) => s["parent_id"] === root["id"]));
    }
  }

  return (
    <EntityCrud
      table="saas_services"
      title="Services / Modules"
      singular="Service"
      description="Arborescence des services par application. Chaque service s'active séparément."
      rows={ordered}
      columns={cols}
      canEdit={canEdit}
      searchKeys={["name", "code"]}
      fields={[
        { name: "app_id", label: "Application", type: "select", options: appOpts, required: true },
        { name: "parent_id", label: "Service parent", type: "select", options: parentOpts },
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Nom", required: true },
        { name: "route", label: "Route" },
        { name: "sort_order", label: "Ordre", type: "number", fallback: 0 },
        { name: "is_active", label: "Actif", type: "bool", fallback: true },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}

export function PlansTab({ data, canEdit }: { data: SaasDataset; canEdit: boolean }) {
  const [target, setTarget] = useState<Row | null>(null);

  const cols: ColDef[] = [
    { label: "Plan", render: (r) => <span className="font-medium text-white">{r["name"]}</span> },
    { label: "Prix", render: (r) => fmt(Number(r["price"] ?? 0), r["currency"] as string) },
    { label: "Période", render: (r) => r["period"] },
    { label: "Utilisateurs", render: (r) => r["max_users"] },
    { label: "Stockage", render: (r) => `${r["storage_mb"]} Mo` },
    {
      label: "Services inclus",
      render: (r) => data.planServices.filter((p) => p["plan_id"] === r["id"]).length,
    },
    { label: "Statut", render: (r) => <BoolChip value={!!r["is_active"]} /> },
  ];

  return (
    <>
      <EntityCrud
        table="saas_plans"
        title="Plans"
        singular="Plan"
        description="Formules d'abonnement : prix, limites, applications et services inclus."
        rows={data.plans}
        columns={cols}
        canEdit={canEdit}
        searchKeys={["name", "code"]}
        extraActions={(r) =>
          canEdit ? (
            <button
              onClick={() => setTarget(r)}
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Services inclus"
              title="Services inclus"
            >
              <ListTree className="h-3.5 w-3.5" />
            </button>
          ) : null
        }
        fields={[
          { name: "code", label: "Code", required: true },
          { name: "name", label: "Nom", required: true },
          { name: "price", label: "Prix", type: "number", fallback: 0 },
          { name: "currency", label: "Devise", fallback: "MAD" },
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
          { name: "max_users", label: "Utilisateurs max", type: "number", fallback: 1 },
          { name: "storage_mb", label: "Stockage (Mo)", type: "number", fallback: 1024 },
          { name: "sort_order", label: "Ordre", type: "number", fallback: 0 },
          { name: "is_active", label: "Actif", type: "bool", fallback: true },
          { name: "description", label: "Description", type: "textarea" },
        ]}
      />
      {target && (
        <LinksModal
          title={`Services inclus — ${target["name"]}`}
          groups={serviceGroups(data.apps, data.services)}
          selected={data.planServices
            .filter((p) => p["plan_id"] === target["id"])
            .map((p) => p["service_id"] as string)}
          table="plan_services"
          ownerKey="plan_id"
          ownerId={target["id"] as string}
          targetKey="service_id"
          onClose={() => setTarget(null)}
        />
      )}
    </>
  );
}
