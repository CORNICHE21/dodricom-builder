import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Back Office — DODRICOM" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Plateforme d'administration DODRICOM." },
    ],
  }),
  component: () => <Outlet />,
});