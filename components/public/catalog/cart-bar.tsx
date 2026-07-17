"use client";

type CartBarProps = {
  count: number;
  total: number;
  onOpenCart: () => void;
};

export default function CartBar({ count, total, onOpenCart }: CartBarProps) {
  const isEmpty = count === 0;

  return (
    <div className="catalog-cart-bar">
      <div className="catalog-cart-bar__copy">
        <strong>
          {count} {count === 1 ? "producto" : "productos"}
        </strong>
        <span>{formatCurrency(total)}</span>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!isEmpty) {
            onOpenCart();
          }
        }}
        disabled={isEmpty}
        aria-disabled={isEmpty}
        className={`catalog-cart-bar__button${
          isEmpty ? " catalog-cart-bar__button--disabled" : ""
        }`}
        style={{ border: "none", font: "inherit", cursor: isEmpty ? "default" : "pointer" }}
      >
        Ver pedido
      </button>
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
