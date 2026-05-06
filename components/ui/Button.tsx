import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";

type SharedButtonProps = {
  variant?: ButtonVariant;
  className?: string;
};

type ButtonElementProps = SharedButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonLinkProps = SharedButtonProps &
  Omit<ComponentProps<typeof Link>, "className"> & {
    href: string;
  };

export type ButtonProps = ButtonElementProps | ButtonLinkProps;

export default function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const classes = ["ui-button", `ui-button--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && typeof props.href === "string") {
    return <Link className={classes} {...props} />;
  }

  const { type = "button", ...buttonProps } = props;
  return <button type={type} className={classes} {...buttonProps} />;
}
