"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction } from "@/app/admin/(protected)/products/actions";
import type { AdminCategory } from "@/lib/categories/admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CreateProductFormProps = {
  businessId: string;
  categories: AdminCategory[];
  embedded?: boolean;
};

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

export default function CreateProductForm({
  businessId,
  categories,
  embedded = false
}: CreateProductFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createProductAction, initialState);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setImageUrl("");
      setImageError(null);
      router.refresh();
    }
  }, [router, state.success]);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setImageUrl("");
      setImageError(null);
      return;
    }

    setIsUploadingImage(true);
    setImageError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const productId = crypto.randomUUID();
      const fileExt = getFileExtension(file.name);
      const filePath = `${businessId}/${productId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          contentType: file.type || undefined,
          upsert: true
        });

      if (uploadError) {
        setImageUrl("");
        setImageError(uploadError.message || "No pudimos subir la imagen.");
        return;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className={embedded ? "admin-embedded-form" : "admin-form-card"}
    >
      {!embedded ? (
        <div className="admin-form-header">
          <h2>Nuevo producto</h2>
          <p>Crea un producto simple con categoria, precio e imagen opcional.</p>
        </div>
      ) : null}

      <label className="admin-field">
        <span>Nombre</span>
        <input name="name" type="text" disabled={isPending} required />
      </label>

      <label className="admin-field">
        <span>Precio</span>
        <input name="price" type="number" min="0" step="0.01" disabled={isPending} required />
      </label>

      <label className="admin-field">
        <span>Categoria</span>
        <select name="category_id" disabled={isPending} required defaultValue="">
          <option value="" disabled>
            Selecciona una categoria
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="admin-field">
        <span>Descripcion</span>
        <textarea name="description" rows={4} disabled={isPending} />
      </label>

      <label className="admin-field">
        <span>Imagen</span>
        <input type="file" accept="image/*" disabled={isPending || isUploadingImage} onChange={handleImageChange} />
      </label>
      <input type="hidden" name="image_url" value={imageUrl} />

      {isUploadingImage ? (
        <p className="admin-feedback">Subiendo imagen...</p>
      ) : null}
      {imageError ? <p className="admin-feedback admin-feedback--error">{imageError}</p> : null}
      {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
      {state.success ? (
        <p className="admin-feedback admin-feedback--success">Producto creado.</p>
      ) : null}

      <button type="submit" className="admin-primary-button" disabled={isPending || isUploadingImage}>
        {isPending ? "Guardando..." : "Crear producto"}
      </button>
    </form>
  );
}

function getFileExtension(filename: string) {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? parts.pop() : "jpg";
  return (extension || "jpg").toLowerCase();
}
