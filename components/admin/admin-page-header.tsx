import type { HTMLAttributes, ReactNode } from "react";

export type AdminPageHeaderVariant = "default" | "operational";

export type AdminPageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  variant?: AdminPageHeaderVariant;
  className?: string;
} & HTMLAttributes<HTMLElement>;

export default function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
  variant = "default",
  className,
  ...props
}: AdminPageHeaderProps) {
  const classes = [
    "admin-page-header",
    variant === "operational" ? "admin-page-header--operational" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={classes} {...props}>
      <div className="admin-page-header__copy">
        {eyebrow ? <p className="admin-page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="admin-page-header__title">{title}</h1>
        {description ? (
          <p className="admin-page-header__description">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
    </header>
  );
}
