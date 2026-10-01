"use client";

import type { ReactNode } from "react";
import { SubmitButton } from "./SubmitButton";

/** A <form> wrapper for a delete server action that asks for confirmation
 *  before letting the submit go through. `action` is the bound server
 *  action (e.g. `deleteProductAction.bind(null, product.id)`). */
export function ConfirmDeleteButton({
  action,
  children,
  confirmText,
  className,
}: {
  action: (formData: FormData) => Promise<void> | void;
  children: ReactNode;
  confirmText: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <SubmitButton variant="danger" className={className} pendingText="…">
        {children}
      </SubmitButton>
    </form>
  );
}
