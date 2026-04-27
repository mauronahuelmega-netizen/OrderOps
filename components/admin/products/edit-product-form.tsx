"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProductAction } from "@/app/admin/(protected)/products/actions";
import type { AdminCategory } from "@/lib/categories/admin";
import type { AdminProduct } from "@/lib/products/admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type EditProductFormProps = {
  businessId: string;
  categories: AdminCategory[];
  product: AdminProduct;
  inModal?: boolean;
  onSuccess?: () => void;
};

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

export default function EditProductForm({
  businessId,
  categories,
  product,
  inModal = false,
  onSuccess
}: EditProductFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateProductAction, initialState);
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onSuccess?.();
    }
  }, [onSuccess, router, state.success]);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setImageError(null);
      setImageUrl(product.image_url ?? "");
      return;
    }

    setIsUploadingImage(true);
    setImageError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const fileExt = getFileExtension(file.name);
      const filePath = `${businessId}/${product.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          contentType: file.type || undefined,
          upsert: true
        });

      if (uploadError) {
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
      action={formAction}
      className={inModal ? "admin-product-form" : "admin-product-card"}
    >
      <input type="hidden" name="product_id" value={product.id} />
      <input type="hidden" name="image_url" value={imageUrl} />

      <div className="admin-product-media">
        {imageUrl ? (
          <img
            className="admin-product-image"
            src={imageUrl}
            alt={product.name}
          />
        ) : (
          <div className="admin-product-image admin-product-image--placeholder admin-product-image--empty">
            Sin foto
          </div>
        )}
      </div>

      <div className="admin-product-fields">
        <div className="admin-product-header">
          <h2>{product.name}</h2>
          <label className="admin-toggle">
            <input
              name="is_available"
              type="checkbox"
              defaultChecked={product.is_available}
              disabled={isPending}
            />
            <span>{product.is_available ? "Activo" : "Inactivo"}</span>
          </label>
        </div>

        <label className="admin-field">
          <span>Nombre</span>
          <input name="name" type="text" defaultValue={product.name} disabled={isPending} required />
        </label>

        <div className="admin-product-grid">
          <label className="admin-field">
            <span>Precio</span>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={product.price}
              disabled={isPending}
              required
            />
          </label>

          <label className="admin-field">
            <span>Categoria</span>
            <select
              name="category_id"
              defaultValue={product.category_id}
              disabled={isPending}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="admin-product-category">
          Categoria actual: <strong>{product.categories?.name ?? "Sin categoria"}</strong>
        </p>

        <label className="admin-field">
          <span>Descripcion</span>
          <textarea
            name="description"
            rows={4}
            defaultValue={product.description ?? ""}
            disabled={isPending}
          />
        </label>

        <label className="admin-field">
          <span>Reemplazar imagen</span>
          <input type="file" accept="image/*" disabled={isPending || isUploadingImage} onChange={handleImageChange} />
        </label>

        <div className="admin-product-actions">
          <button type="submit" className="admin-primary-button" disabled={isPending || isUploadingImage}>
            {isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <div className="admin-inline-feedback">
          {isUploadingImage ? (
            <p className="admin-feedback">Subiendo imagen...</p>
          ) : null}
          {imageError ? <p className="admin-feedback admin-feedback--error">{imageError}</p> : null}
          {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
          {state.success ? (
            <p className="admin-feedback admin-feedback--success">Producto actualizado.</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function getFileExtension(filename: string) {
  const parts = filename.split(".");
  const extension = parts.length > 1 ? parts.pop() : "jpg";
  return (extension || "jpg").toLowerCase();
}
