/** Shared public header visibility signal for catalog sticky offsets. */

export const PUBLIC_HEADER_HIDDEN_EVENT = "orderops-public-header-hidden" as const;

export type PublicHeaderHiddenDetail = {
  hidden: boolean;
  headerOffsetPx: number;
};

export function dispatchPublicHeaderHidden(detail: PublicHeaderHiddenDetail): void {
  if (typeof window === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.publicHeaderHidden = detail.hidden ? "1" : "0";
  root.style.setProperty(
    "--public-catalog-category-top",
    detail.hidden ? "0px" : `${Math.max(0, Math.round(detail.headerOffsetPx))}px`
  );
  root.style.setProperty(
    "--public-catalog-scroll-margin",
    detail.hidden ? "64px" : `${Math.max(64, Math.round(detail.headerOffsetPx) + 56)}px`
  );

  window.dispatchEvent(
    new CustomEvent(PUBLIC_HEADER_HIDDEN_EVENT, {
      detail
    })
  );
}
