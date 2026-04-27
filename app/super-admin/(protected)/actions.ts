"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/super-admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type ActionState = {
  error?: string;
  success?: boolean;
};

export async function createBusinessAction(
  _prevState: ActionState,
  formData: FormData
) {
  await requireSuperAdmin();
  const supabase = await createSupabaseServerClient();

  const name = getTrimmedString(formData.get("name"));
  const slug = getTrimmedString(formData.get("slug")).toLowerCase();
  const whatsappNumber = getTrimmedString(formData.get("whatsapp_number"));

  if (!name) {
    return { error: "Ingresa un nombre para el negocio." };
  }

  if (!slug) {
    return { error: "Ingresa un slug para el negocio." };
  }

  if (!whatsappNumber) {
    return { error: "Ingresa un numero de WhatsApp." };
  }

  const { error } = await supabase.from("businesses").insert({
    name,
    slug,
    whatsapp_number: whatsappNumber
  });

  if (error) {
    return { error: error.message || "No pudimos crear el negocio." };
  }

  revalidatePath("/super-admin");
  return { success: true };
}

export async function createClientAction(
  _prevState: ActionState,
  formData: FormData
) {
  await requireSuperAdmin();

  const name = getTrimmedString(formData.get("name"));
  const slug = getTrimmedString(formData.get("slug")).toLowerCase();
  const whatsappNumber = getTrimmedString(formData.get("whatsapp_number"));
  const email = getTrimmedString(formData.get("email")).toLowerCase();
  const password = getTrimmedString(formData.get("password"));

  if (!name) {
    return { error: "Ingresa un nombre para el negocio." };
  }

  if (!slug) {
    return { error: "Ingresa un slug para el negocio." };
  }

  if (!whatsappNumber) {
    return { error: "Ingresa un numero de WhatsApp." };
  }

  if (!email) {
    return { error: "Ingresa un email para el usuario admin." };
  }

  if (!password) {
    return { error: "Ingresa una password para el usuario admin." };
  }

  const supabase = await createSupabaseServerClient();
  const serviceSupabase = createSupabaseServiceClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      name,
      slug,
      whatsapp_number: whatsappNumber
    })
    .select("id")
    .single();

  if (businessError || !business) {
    return { error: businessError?.message || "No pudimos crear el negocio." };
  }

  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError || !authData.user) {
    await supabase.from("businesses").delete().eq("id", business.id);
    return { error: authError?.message || "No pudimos crear el usuario admin." };
  }

  const { error: profileError } = await serviceSupabase.from("profiles").insert({
    id: authData.user.id,
    business_id: business.id,
    role: "admin"
  });

  if (profileError) {
    await serviceSupabase.auth.admin.deleteUser(authData.user.id);
    await supabase.from("businesses").delete().eq("id", business.id);
    return { error: profileError.message || "No pudimos vincular el usuario al negocio." };
  }

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/businesses");
  revalidatePath("/super-admin/users");
  return { success: true };
}

export async function createBusinessUserAction(
  _prevState: ActionState,
  formData: FormData
) {
  await requireSuperAdmin();

  const email = getTrimmedString(formData.get("email")).toLowerCase();
  const password = getTrimmedString(formData.get("password"));
  const businessId = getTrimmedString(formData.get("business_id"));

  if (!email) {
    return { error: "Ingresa un email." };
  }

  if (!password) {
    return { error: "Ingresa una password." };
  }

  if (!businessId) {
    return { error: "Selecciona un negocio." };
  }

  const serviceSupabase = createSupabaseServiceClient();
  const { data, error } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error || !data.user) {
    return { error: error?.message || "No pudimos crear el usuario." };
  }

  const { error: profileError } = await serviceSupabase.from("profiles").insert({
    id: data.user.id,
    business_id: businessId,
    role: "admin"
  });

  if (profileError) {
    return { error: profileError.message || "No pudimos vincular el usuario al negocio." };
  }

  revalidatePath("/super-admin");
  return { success: true };
}

export async function updateBusinessAction(
  _prevState: ActionState,
  formData: FormData
) {
  await requireSuperAdmin();
  const supabase = await createSupabaseServerClient();

  const businessId = getTrimmedString(formData.get("business_id"));
  const name = getTrimmedString(formData.get("name"));
  const slug = getTrimmedString(formData.get("slug")).toLowerCase();
  const whatsappNumber = getTrimmedString(formData.get("whatsapp_number"));
  const isActive = formData.get("is_active") === "on";

  if (!businessId) {
    return { error: "Falta identificar el negocio." };
  }

  if (!name) {
    return { error: "Ingresa un nombre para el negocio." };
  }

  if (!slug) {
    return { error: "Ingresa un slug para el negocio." };
  }

  if (!whatsappNumber) {
    return { error: "Ingresa un numero de WhatsApp." };
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      slug,
      whatsapp_number: whatsappNumber,
      is_active: isActive
    })
    .eq("id", businessId);

  if (error) {
    return { error: error.message || "No pudimos actualizar el negocio." };
  }

  revalidatePath("/super-admin");
  return { success: true };
}

export async function updateBusinessUserAction(
  _prevState: ActionState,
  formData: FormData
) {
  await requireSuperAdmin();
  const serviceSupabase = createSupabaseServiceClient();

  const userId = getTrimmedString(formData.get("user_id"));
  const businessId = getTrimmedString(formData.get("business_id"));
  const role = getTrimmedString(formData.get("role"));
  const isDisabled = formData.get("is_disabled") === "on";

  if (!userId) {
    return { error: "Falta identificar el usuario." };
  }

  if (!["admin", "super_admin"].includes(role)) {
    return { error: "Rol invalido." };
  }

  if (role === "admin" && !businessId) {
    return { error: "Selecciona un negocio para usuarios admin." };
  }

  const { error: profileError } = await serviceSupabase
    .from("profiles")
    .update({
      business_id: role === "super_admin" ? null : businessId,
      role
    })
    .eq("id", userId);

  if (profileError) {
    return { error: profileError.message || "No pudimos actualizar el perfil." };
  }

  const { error: authError } = await serviceSupabase.auth.admin.updateUserById(userId, {
    ban_duration: isDisabled ? "876000h" : "none"
  });

  if (authError) {
    return { error: authError.message || "No pudimos actualizar el usuario." };
  }

  revalidatePath("/super-admin");
  return { success: true };
}

export async function deleteBusinessUserAction(
  _prevState: ActionState,
  formData: FormData
) {
  const context = await requireSuperAdmin();
  const serviceSupabase = createSupabaseServiceClient();

  const userId = getTrimmedString(formData.get("user_id"));
  const confirmEmail = getTrimmedString(formData.get("confirm_email")).toLowerCase();

  if (!userId) {
    return { error: "Falta identificar el usuario." };
  }

  if (!confirmEmail) {
    return { error: "Escribe el email para confirmar." };
  }

  if (userId === context.user.id) {
    return { error: "No puedes eliminar tu propio usuario." };
  }

  const [{ data: authUsers, error: authUsersError }, { data: targetProfile, error: profileError }] =
    await Promise.all([
      serviceSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      serviceSupabase
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle()
    ]);

  if (authUsersError) {
    return { error: authUsersError.message || "No pudimos cargar el usuario." };
  }

  if (profileError) {
    return { error: profileError.message || "No pudimos cargar el perfil." };
  }

  const authUser = (authUsers.users ?? []).find((user) => user.id === userId);

  if (!authUser || !targetProfile) {
    return { error: "El usuario ya no existe o no tiene perfil asociado." };
  }

  const targetEmail = (authUser.email ?? "").trim().toLowerCase();

  if (!targetEmail || confirmEmail !== targetEmail) {
    return { error: "La confirmacion no coincide con el email del usuario." };
  }

  if (targetProfile.role === "super_admin") {
    const { count, error: countError } = await serviceSupabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");

    if (countError) {
      return { error: countError.message || "No pudimos validar los super admin." };
    }

    if ((count ?? 0) <= 1) {
      return { error: "No puedes eliminar el ultimo super admin." };
    }
  }

  const { error: authDeleteError } = await serviceSupabase.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    return { error: authDeleteError.message || "No pudimos eliminar el usuario." };
  }

  const { error: profileDeleteError } = await serviceSupabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileDeleteError) {
    return { error: profileDeleteError.message || "No pudimos eliminar el perfil." };
  }

  revalidatePath("/super-admin");
  return { success: true };
}

export async function deleteBusinessAction(
  _prevState: ActionState,
  formData: FormData
) {
  const context = await requireSuperAdmin();
  const serviceSupabase = createSupabaseServiceClient();

  const businessId = getTrimmedString(formData.get("business_id"));
  const confirmSlug = getTrimmedString(formData.get("confirm_slug")).toLowerCase();

  if (!businessId) {
    return { error: "Falta identificar el negocio." };
  }

  if (!confirmSlug) {
    return { error: "Escribe el slug para confirmar." };
  }

  const [
    { data: business, error: businessError },
    { data: profiles, error: profilesError },
    { data: orders, error: ordersError },
    { count: superAdminCount, error: superAdminCountError }
  ] = await Promise.all([
    serviceSupabase
      .from("businesses")
      .select("id, slug")
      .eq("id", businessId)
      .maybeSingle(),
    serviceSupabase
      .from("profiles")
      .select("id, role")
      .eq("business_id", businessId),
    serviceSupabase
      .from("orders")
      .select("id")
      .eq("business_id", businessId),
    serviceSupabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin")
  ]);

  if (businessError) {
    return { error: businessError.message || "No pudimos cargar el negocio." };
  }

  if (profilesError) {
    return { error: profilesError.message || "No pudimos cargar los usuarios del negocio." };
  }

  if (ordersError) {
    return { error: ordersError.message || "No pudimos cargar los pedidos del negocio." };
  }

  if (superAdminCountError) {
    return { error: superAdminCountError.message || "No pudimos validar los super admin." };
  }

  if (!business) {
    return { error: "El negocio ya no existe." };
  }

  if (confirmSlug !== business.slug) {
    return { error: "La confirmacion no coincide con el slug del negocio." };
  }

  const businessProfiles = profiles ?? [];

  if (businessProfiles.some((profile) => profile.id === context.user.id)) {
    return { error: "No puedes eliminar un negocio que contiene tu propio usuario." };
  }

  const superAdminsInBusiness = businessProfiles.filter(
    (profile) => profile.role === "super_admin"
  ).length;

  if ((superAdminCount ?? 0) - superAdminsInBusiness < 1) {
    return { error: "No puedes eliminar el ultimo super admin del sistema." };
  }

  const removeImagesError = await removeBusinessImages(serviceSupabase, businessId);

  if (removeImagesError) {
    return { error: removeImagesError };
  }

  const orderIds = (orders ?? []).map((order) => order.id);

  if (orderIds.length > 0) {
    const { error: orderItemsDeleteError } = await serviceSupabase
      .from("order_items")
      .delete()
      .in("order_id", orderIds);

    if (orderItemsDeleteError) {
      return {
        error: orderItemsDeleteError.message || "No pudimos eliminar los items de pedidos."
      };
    }
  }

  const { error: ordersDeleteError } = await serviceSupabase
    .from("orders")
    .delete()
    .eq("business_id", businessId);

  if (ordersDeleteError) {
    return { error: ordersDeleteError.message || "No pudimos eliminar los pedidos." };
  }

  const { error: productsDeleteError } = await serviceSupabase
    .from("products")
    .delete()
    .eq("business_id", businessId);

  if (productsDeleteError) {
    return { error: productsDeleteError.message || "No pudimos eliminar los productos." };
  }

  const { error: categoriesDeleteError } = await serviceSupabase
    .from("categories")
    .delete()
    .eq("business_id", businessId);

  if (categoriesDeleteError) {
    return { error: categoriesDeleteError.message || "No pudimos eliminar las categorias." };
  }

  for (const profile of businessProfiles) {
    const { error: authDeleteError } = await serviceSupabase.auth.admin.deleteUser(profile.id);

    if (authDeleteError) {
      return { error: authDeleteError.message || "No pudimos eliminar usuarios del negocio." };
    }
  }

  const { error: profilesDeleteError } = await serviceSupabase
    .from("profiles")
    .delete()
    .eq("business_id", businessId);

  if (profilesDeleteError) {
    return { error: profilesDeleteError.message || "No pudimos eliminar los perfiles." };
  }

  const { error: businessDeleteError } = await serviceSupabase
    .from("businesses")
    .delete()
    .eq("id", businessId);

  if (businessDeleteError) {
    return { error: businessDeleteError.message || "No pudimos eliminar el negocio." };
  }

  revalidatePath("/super-admin");
  return { success: true };
}

function getTrimmedString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function removeBusinessImages(
  serviceSupabase: ReturnType<typeof createSupabaseServiceClient>,
  businessId: string
) {
  const bucket = serviceSupabase.storage.from("product-images");
  const productFolders = await listStorageEntries(bucket, businessId);
  const filePaths: string[] = [];

  for (const folder of productFolders) {
    const files = await listStorageEntries(bucket, `${businessId}/${folder.name}`);

    for (const file of files) {
      filePaths.push(`${businessId}/${folder.name}/${file.name}`);
    }
  }

  if (filePaths.length === 0) {
    return null;
  }

  const { error } = await bucket.remove(filePaths);

  return error?.message ?? null;
}

async function listStorageEntries(
  bucket: ReturnType<ReturnType<typeof createSupabaseServiceClient>["storage"]["from"]>,
  path: string
) {
  const items: Array<{ name: string }> = [];
  let offset = 0;

  while (true) {
    const { data, error } = await bucket.list(path, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" }
    });

    if (error) {
      throw new Error(error.message || "No pudimos listar archivos del bucket.");
    }

    const pageItems = (data ?? []).map((item) => ({ name: item.name }));
    items.push(...pageItems);

    if (pageItems.length < 100) {
      break;
    }

    offset += 100;
  }

  return items;
}
