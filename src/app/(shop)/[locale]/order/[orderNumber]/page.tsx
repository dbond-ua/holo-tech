"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { formatUAH } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

interface OrderSummary {
  orderNumber: string;
  total: number;
  currency: string;
  deliveryMethod: "np_warehouse" | "np_poshtomat" | "courier";
  city?: string | null;
  npWarehouseName?: string | null;
  courierAddress?: string | null;
  items: { nameUk: string; nameEn: string; price: number; qty: number }[];
}

export default function OrderSuccessPage() {
  const { dict, locale } = useI18n();
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params.orderNumber;
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(`holotech:order:${orderNumber}`);
      if (raw) {
        setOrder(JSON.parse(raw));
        setLoaded(true);
        return;
      }
    } catch {
      // fall through to server lookup
    }

    fetch(`/api/orders/${orderNumber}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOrder(data))
      .finally(() => setLoaded(true));
  }, [orderNumber]);

  const deliveryLabel = order
    ? order.deliveryMethod === "courier"
      ? dict.checkout.methodCourier
      : order.deliveryMethod === "np_poshtomat"
      ? dict.checkout.methodNpPoshtomat
      : dict.checkout.methodNpWarehouse
    : "";

  return (
    <Container className="flex flex-col items-center justify-center py-20 text-center sm:py-28">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-volt/20 text-volt-600 dark:text-volt">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="mt-6 text-2xl font-semibold sm:text-3xl">{dict.success.title}</h1>
      <p className="mt-2 max-w-md text-muted dark:text-muted-dark">
        {dict.success.orderNumberPrefix}
        <span className="font-semibold text-ink dark:text-ink-dark">{orderNumber}</span> {dict.success.description}
      </p>

      {loaded && order && (
        <div className="mt-8 w-full max-w-md rounded-xl2 border border-line p-6 text-left dark:border-line-dark">
          <div className="flex flex-col gap-2.5 border-b border-line pb-4 dark:border-line-dark">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-3 text-sm">
                <span className="text-muted dark:text-muted-dark">
                  {(locale === "uk" ? item.nameUk : item.nameEn)} × {item.qty}
                </span>
                <span className="shrink-0 font-medium">{formatUAH(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted dark:text-muted-dark">{dict.success.sumLabel}</span>
            <span className="text-lg font-semibold tracking-tight">{formatUAH(order.total)}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-muted dark:text-muted-dark">{dict.success.deliveryLabel}</span>
            <span className="text-right font-medium">
              {deliveryLabel}
              {order.city && <><br />{order.city}</>}
              {order.npWarehouseName && <><br />{order.npWarehouseName}</>}
              {order.courierAddress && <><br />{order.courierAddress}</>}
            </span>
          </div>
        </div>
      )}

      <Link href="/" className={buttonVariants({ className: "mt-8" })}>
        {dict.success.backHome}
      </Link>
    </Container>
  );
}
