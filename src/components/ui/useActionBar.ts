"use client";

import { useEffect } from "react";

/**
 * Marks the page as having a fixed mobile action bar (product page, cart,
 * checkout) so the body reserves room for it — see `.has-action-bar` in
 * shop.css. The mobile tab bar is hidden on those routes.
 */
export function useActionBar() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("has-action-bar");
    return () => root.classList.remove("has-action-bar");
  }, []);
}
