import CreateCategoryForm from "@/components/admin/categories/create-category-form";
import EditCategoryForm from "@/components/admin/categories/edit-category-form";
import { requireAdminContext } from "@/lib/admin/context";
import { getAdminCategories } from "@/lib/categories/admin";

export default async function AdminCategoriesPage() {
  const adminContext = await requireAdminContext();
  const categories = await getAdminCategories(adminContext.businessId);

  return (
    <div className="admin-categories-page">
      <header className="admin-section-header">
        <div>
          <p className="catalog-eyebrow">Categorías</p>
          <h1>Categorías</h1>
        </div>
      </header>

      <div className="admin-categories-layout">
        <CreateCategoryForm />

        <section className="admin-form-card">
          <div className="admin-form-header">
            <h2>Categorías actuales</h2>
            <p>Editá el nombre de cada categoría sin salir de la lista.</p>
          </div>

          {categories.length > 0 ? (
            <div className="admin-categories-list">
              {categories.map((category) => (
                <EditCategoryForm
                  key={category.id}
                  categoryId={category.id}
                  initialName={category.name}
                />
              ))}
            </div>
          ) : (
            <div className="admin-empty-state">
              <h2>No hay categorías todavía</h2>
              <p>Creá la primera categoría para empezar a organizar tu catálogo.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
