import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import CreateCategoryForm from "@/components/admin/categories/create-category-form";
import EditCategoryForm from "@/components/admin/categories/edit-category-form";
import categoryLayoutStyles from "@/components/admin/categories/categories-layout.module.css";
import { requireAdminPermission } from "@/lib/admin/context";
import { getAdminCategories } from "@/lib/categories/admin";

export default async function AdminCategoriesPage() {
  const adminContext = await requireAdminPermission("manageProducts");
  const categories = await getAdminCategories(adminContext.businessId);

  return (
    <AdminPageLayout size="wide">
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Categorías"
        description="Organizá los productos del catálogo público por secciones."
      />

      <div className={categoryLayoutStyles.layout}>
        <CreateCategoryForm />

        <section className="admin-form-card">
          <div className="admin-form-header">
            <h2>Categorías actuales</h2>
            <p>Editá el nombre de cada categoría sin salir de la lista.</p>
          </div>

          {categories.length > 0 ? (
            <div className={categoryLayoutStyles.list}>
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
    </AdminPageLayout>
  );
}
