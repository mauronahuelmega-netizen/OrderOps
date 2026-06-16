import type { HTMLAttributes, ReactNode } from "react";

type AdminPageLayoutSize = "default" | "wide" | "narrow" | "operational";

export type AdminPageLayoutProps = {
  children: ReactNode;
  className?: string;
  size?: AdminPageLayoutSize;
} & HTMLAttributes<HTMLDivElement>;

export default function AdminPageLayout({
  children,
  className,
  size = "default",
  ...props
}: AdminPageLayoutProps) {
  const classes = [
    "admin-page-layout",
    `admin-page-layout--${size}`,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
