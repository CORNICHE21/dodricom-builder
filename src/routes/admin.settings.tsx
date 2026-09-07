import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, Placeholder } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <AdminShell title="Paramètres" breadcrumbs={[{ label: "Paramètres" }]}>
      <Placeholder
        description="Branding, langues, devises, SMTP, API, sécurité, sauvegardes."
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
