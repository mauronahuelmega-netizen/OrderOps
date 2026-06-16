"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type BusinessSettingsRow = Database["public"]["Tables"]["business_settings"]["Row"];

type UseBusinessSettingsOptions = {
  businessId?: string;
};

type UseBusinessSettingsResult = {
  settings: BusinessSettingsRow | null;
  loading: boolean;
  error: Error | null;
};

async function resolveBusinessId(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  businessId?: string
): Promise<string | null> {
  if (businessId) {
    return businessId;
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return profile?.business_id ?? null;
}

export function useBusinessSettings(
  options: UseBusinessSettingsOptions = {}
): UseBusinessSettingsResult {
  const { businessId: businessIdOption } = options;
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [settings, setSettings] = useState<BusinessSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBusinessSettings() {
      setLoading(true);
      setError(null);

      try {
        const businessId = await resolveBusinessId(supabase, businessIdOption);

        if (!businessId) {
          if (!cancelled) {
            setSettings(null);
            setLoading(false);
          }
          return;
        }

        const { data, error: settingsError } = await supabase
          .from("business_settings")
          .select("*")
          .eq("business_id", businessId)
          .maybeSingle();

        if (settingsError) {
          throw settingsError;
        }

        if (!cancelled) {
          setSettings(data);
          setLoading(false);
        }
      } catch (cause) {
        if (!cancelled) {
          setSettings(null);
          setError(
            cause instanceof Error ? cause : new Error("No se pudieron cargar los feature flags.")
          );
          setLoading(false);
        }
      }
    }

    void loadBusinessSettings();

    return () => {
      cancelled = true;
    };
  }, [businessIdOption, supabase]);

  return { settings, loading, error };
}
