"use client";

import Link from "next/link";

type CartBarProps = {
  slug: string;
  count: number;
  total: number;
};

export default function CartBar({ slug, count, total }: CartBarProps) {
  const isEmpty = count === 0;

  return (
    <div className="catalog-cart-bar">
      <div className="catalog-cart-bar__copy">
        <strong>
          {count} {count === 1 ? "producto" : "productos"}
        </strong>
        <span>{formatCurrency(total)}</span>
      </div>

      <Link
        href={isEmpty ? "#" : `/b/${slug}/checkout`}
        aria-disabled={isEmpty}
        tabIndex={isEmpty ? -1 : undefined}
        className={`catalog-cart-bar__button${
          isEmpty ? " catalog-cart-bar__button--disabled" : ""
        }`}
      >
        Ver pedido
      </Link>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}
