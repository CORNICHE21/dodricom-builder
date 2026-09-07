import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, Placeholder } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/saas")({
  component: () => (
    <AdminShell title="SaaS Management" breadcrumbs={[{ label: "SaaS Management" }]}>
      <Placeholder
        description="Plans, licences, essais, renouvellements et statistiques d'usage."
        bullets={[
          "Module intégré au Back Office DODRICOM",
          "Interface premium glassmorphism",
          "RBAC appliqué selon le rôle utilisateur",
          "Prêt à connecter aux données live",
          "Export PDF / Excel",
          "Multi-langue FR / EN / AR",
        ]}
      />
    </AdminShell>
  ),
});
