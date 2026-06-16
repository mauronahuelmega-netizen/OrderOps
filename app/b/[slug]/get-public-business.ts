import { cache } from "react";
import { requirePublicBusinessBySlug } from "@/lib/business/public";

export const getRequestPublicBusiness = cache(async (slug: string) =>
  requirePublicBusinessBySlug(slug)
);
