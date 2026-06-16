"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { createClientAction } from "@/app/super-admin/(protected)/actions";

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

export default function CreateClientForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createClientAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <Card className="admin-form-card super-admin-create-client-card">
      <form ref={formRef} action={formAction} className="super-admin-client-form">
        <div className="admin-form-header">
          <h2>Crear nuevo cliente</h2>
          <p>Creá el negocio y su usuario admin en un único paso.</p>
        </div>

        <div className="super-admin-client-grid">
          <Input
            name="name"
            type="text"
            label="Nombre del negocio"
            disabled={isPending}
            required
          />

          <Input
            name="slug"
            type="text"
            label="Slug del negocio"
            disabled={isPending}
            required
          />
        </div>

        <Input
          name="whatsapp_number"
          type="text"
          label="WhatsApp del negocio"
          disabled={isPending}
          required
        />

        <div className="super-admin-client-grid">
          <Input
            name="email"
            type="email"
            autoComplete="email"
            label="Email del usuario admin"
            disabled={isPending}
            required
          />

          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            label="Contraseña del usuario admin"
            disabled={isPending}
            required
          />
        </div>

        {state.error ? <p className="admin-feedback admin-feedback--error">{state.error}</p> : null}
        {state.success ? (
          <p className="admin-feedback admin-feedback--success">
            Cliente creado correctamente.
          </p>
        ) : null}

        <Button type="submit" className="admin-primary-button" disabled={isPending} variant="primary">
          {isPending ? "Creando..." : "Crear cliente"}
        </Button>
      </form>
    </Card>
  );
}
