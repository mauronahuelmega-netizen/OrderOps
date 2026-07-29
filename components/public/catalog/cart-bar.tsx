"use client";

type CartBarProps = {
  count: number;
  total: number;
  onOpenCart: () => void;
};

export default function CartBar({ count, total, onOpenCart }: CartBarProps) {
  const isEmpty = count === 0;

  return (
    <div className="catalog-cart-bar" data-preview-pan-ignore>
      <div className="catalog-cart-bar__copy">
        <strong>
          {isEmpty
            ? "Carrito vacío"
            : `${count} ${count === 1 ? "producto" : "productos"}`}
        </strong>
        <span>
          {isEmpty ? "Sumá algo para continuar" : `Total ${formatCurrency(total)}`}
        </span>
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
        aria-label={
          isEmpty
            ? "Carrito vacío"
            : `Ver pedido con ${count} ${count === 1 ? "producto" : "productos"}`
        }
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
