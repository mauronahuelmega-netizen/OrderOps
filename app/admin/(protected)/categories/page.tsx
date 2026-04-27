import CreateCategoryForm from "@/components/admin/categories/create-category-form";
import EditCategoryForm from "@/components/admin/categories/edit-category-form";
import { getAdminCategories } from "@/lib/categories/admin";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="admin-categories-page">
      <header className="admin-section-header">
        <div>
          <p className="catalog-eyebrow">Categorias</p>
          <h1>Categorias</h1>
        </div>
      </header>

      <div className="admin-categories-layout">
        <CreateCategoryForm />

        <section className="admin-form-card">
          <div className="admin-form-header">
            <h2>Categorias actuales</h2>
            <p>Edita el nombre de cada categoria sin salir de la lista.</p>
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
              <h2>No hay categorias todavia</h2>
              <p>Crea la primera categoria para empezar a organizar tu catalogo.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
