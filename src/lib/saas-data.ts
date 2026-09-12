/* eslint-disable @typescript-eslint/no-explicit-any */
/** Couche d'accès aux données du centre d'administration SaaS (Paramètres). */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Row = Record<string, any>;

async function list(table: string, order: string, asc = true): Promise<Row[]> {
  const { data, error } = await supabase
    .from(table as never)
    .select("*")
    .order(order, { ascending: asc });
  if (error) throw error;
  return (data ?? []) as Row[];
}

export type SaasDataset = {
  apps: Row[];
  services: Row[];
  plans: Row[];
  planApps: Row[];
  planServices: Row[];
  companies: Row[];
  clients: Row[];
  clientApps: Row[];
  subscriptions: Row[];
  companyUsers: Row[];
  roles: Row[];
  rolePermissions: Row[];
  userServicePermissions: Row[];
  invoices: Row[];
  payments: Row[];
  audit: Row[];
};

export const SAAS_QUERY_KEY = ["saas", "admin", "dataset"] as const;

export function useSaasData() {
  return useQuery({
    queryKey: SAAS_QUERY_KEY,
    queryFn: async (): Promise<SaasDataset> => {
      const [
        apps,
        services,
        plans,
        planApps,
        planServices,
        companies,
        clients,
        clientApps,
        subscriptions,
        companyUsers,
        roles,
        rolePermissions,
        userServicePermissions,
        invoices,
        payments,
        auditRes,
      ] = await Promise.all([
        list("saas_apps", "sort_order"),
        list("saas_services", "sort_order"),
        list("saas_plans", "sort_order"),
        list("plan_apps", "created_at"),
        list("plan_services", "created_at"),
        list("companies", "created_at", false),
        list("saas_clients", "created_at", false),
        list("client_apps", "created_at"),
        list("subscriptions", "created_at", false),
        list("company_users", "created_at", false),
        list("saas_roles", "sort_order"),
        list("role_permissions", "created_at"),
        list("user_service_permissions", "created_at"),
        list("subscription_invoices", "issue_date", false),
        list("subscription_payments", "paid_at", false),
        supabase
          .from("activity_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (auditRes.error) throw auditRes.error;
      return {
        apps,
        services,
        plans,
        planApps,
        planServices,
        companies,
        clients,
        clientApps,
        subscriptions,
        companyUsers,
        roles,
        rolePermissions,
        userServicePermissions,
        invoices,
        payments,
        audit: (auditRes.data ?? []) as Row[],
      };
    },
  });
}

/** Insert ou update d'une ligne, selon la présence d'un id. */
export function useSaveRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      table,
      values,
      id,
    }: {
      table: string;
      values: Row;
      id?: string | null;
    }) => {
      if (id) {
        const { error } = await supabase
          .from(table as never)
          .update(values as never)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from(table as never)
        .insert(values as never)
        .select("id")
        .single();
      if (error) throw error;
      return (data as Row)?.["id"] as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SAAS_QUERY_KEY }),
  });
}

export function useDeleteRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, id }: { table: string; id: string }) => {
      const { error } = await supabase
        .from(table as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SAAS_QUERY_KEY }),
  });
}

/**
 * Synchronise une table de liaison : supprime tout pour `owner`, réinsère la sélection.
 * Ex : { table: "plan_services", ownerKey: "plan_id", ownerId, targetKey: "service_id", ids }
 */
export function useSyncLinks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      table,
      ownerKey,
      ownerId,
      targetKey,
      ids,
    }: {
      table: string;
      ownerKey: string;
      ownerId: string;
      targetKey: string;
      ids: string[];
    }) => {
      const del = await supabase
        .from(table as never)
        .delete()
        .eq(ownerKey, ownerId);
      if (del.error) throw del.error;
      if (!ids.length) return;
      const rows = ids.map((v) => ({ [ownerKey]: ownerId, [targetKey]: v }));
      const { error } = await supabase.from(table as never).insert(rows as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SAAS_QUERY_KEY }),
  });
}

export function nameOf(rows: Row[], id: string | null | undefined, key = "name") {
  if (!id) return "—";
  const r = rows.find((x) => x["id"] === id);
  return (r?.[key] as string) ?? "—";
}
