"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import styles from "./admin-order-modal.module.css";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class AdminOrderWorkspaceErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[workspace-boundary] render failure", {
      error,
      componentStack: errorInfo.componentStack
    });
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={`${styles["admin-order-modal-state"]} ${styles["admin-order-modal-state--error"]}`}
        >
          <h3>Error cargando el pedido</h3>
          <p>Pudimos abrir el modal, pero una parte del workspace no se pudo renderizar.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
