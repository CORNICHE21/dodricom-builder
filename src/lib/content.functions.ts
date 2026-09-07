import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type ServiceCategoryDTO = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  features: string[];
};

export type ProductDTO = {
  id: string;
  categorySlug: string | null;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  badge: string | null;
};

export type PackageDTO = {
  id: string;
  categorySlug: string | null;
  slug: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  billingPeriod: string | null;
  features: string[];
  isPopular: boolean;
  ctaLabel: string | null;
};

export type ProjectDTO = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  tags: string[];
  client: string | null;
  year: number | null;
};

export type BlogPostDTO = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: string | null;
  authorName: string | null;
  readMinutes: number | null;
  publishedAt: string | null;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export const getServicesContent = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [catsRes, prodsRes, packsRes] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id, slug, name, tagline, description, icon, image_url, features")
      .eq("status", "published")
      .order("sort_order"),
    supabase
      .from("products")
      .select("id, category_id, slug, name, tagline, description, image_url, price, currency, badge")
      .eq("status", "published")
      .order("sort_order"),
    supabase
      .from("packages")
      .select("id, category_id, slug, name, description, price, currency, billing_period, features, is_popular, cta_label")
      .eq("status", "published")
      .order("sort_order"),
  ]);

  const cats = catsRes.data ?? [];
  const byId = new Map(cats.map((c) => [c.id, c.slug]));

  const categories: ServiceCategoryDTO[] = cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    icon: c.icon,
    imageUrl: c.image_url,
    features: asStringArray(c.features),
  }));

  const products: ProductDTO[] = (prodsRes.data ?? []).map((p) => ({
    id: p.id,
    categorySlug: p.category_id ? (byId.get(p.category_id) ?? null) : null,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    imageUrl: p.image_url,
    price: p.price === null ? null : Number(p.price),
    currency: p.currency,
    badge: p.badge,
  }));

  const packages: PackageDTO[] = (packsRes.data ?? []).map((p) => ({
    id: p.id,
    categorySlug: p.category_id ? (byId.get(p.category_id) ?? null) : null,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price === null ? null : Number(p.price),
    currency: p.currency,
    billingPeriod: p.billing_period,
    features: asStringArray(p.features),
    isPopular: p.is_popular,
    ctaLabel: p.cta_label,
  }));

  return { categories, products, packages };
});

export const getProjects = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [catsRes, projRes] = await Promise.all([
    supabase.from("service_categories").select("id, slug, name").eq("status", "published"),
    supabase
      .from("projects")
      .select("id, slug, title, summary, cover_image_url, category_id, tags, client, year")
      .eq("status", "published")
      .order("sort_order"),
  ]);
  const cats = new Map((catsRes.data ?? []).map((c) => [c.id, c]));
  const projects: ProjectDTO[] = (projRes.data ?? []).map((p) => {
    const cat = p.category_id ? cats.get(p.category_id) : undefined;
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      coverImageUrl: p.cover_image_url,
      categorySlug: cat?.slug ?? null,
      categoryName: cat?.name ?? null,
      tags: asStringArray(p.tags),
      client: p.client,
      year: p.year,
    };
  });
  return projects;
});

export const getBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image_url, category, author_name, read_minutes, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  const posts: BlogPostDTO[] = (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImageUrl: p.cover_image_url,
    category: p.category,
    authorName: p.author_name,
    readMinutes: p.read_minutes,
    publishedAt: p.published_at,
  }));
  return posts;
});