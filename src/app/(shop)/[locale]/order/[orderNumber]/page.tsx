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
    <Container className="pt-8 sm:pt-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="caption flex items-center gap-2 text-ok">
            <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
            {dict.success.orderNumberPrefix}
            <span className="num">{orderNumber}</span>
          </p>
          <h1 className="mt-4 text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-h1">
            {dict.success.title}
          </h1>
          <p className="mt-4 max-w-md text-fg-2 sm:text-lg">
            {dict.success.orderNumberPrefix}
            <span className="num font-medium text-fg">{orderNumber}</span> {dict.success.description}
          </p>
          <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg", className: "mt-8" })}>
            {dict.success.backHome}
          </Link>
        </div>

        {loaded && order && (
          <div className="border-t border-fg lg:col-span-5 lg:col-start-8">
            <ul className="border-b border-rule">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-3 border-b border-rule py-3 text-[15px] last:border-b-0">
                  <span className="text-fg-2">
                    {locale === "uk" ? item.nameUk : item.nameEn} × {item.qty}
                  </span>
                  <span className="num shrink-0 font-medium">{formatUAH(item.price * item.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-b border-rule py-4">
              <span className="font-semibold">{dict.success.sumLabel}</span>
              <span className="num text-[28px] font-semibold tracking-[-0.02em]">{formatUAH(order.total)}</span>
            </div>
            <div className="flex justify-between gap-6 py-4 text-[15px]">
              <span className="text-fg-2">{dict.success.deliveryLabel}</span>
              <span className="text-right font-medium">
                {deliveryLabel}
                {order.city && <><br />{order.city}</>}
                {order.npWarehouseName && <><br />{order.npWarehouseName}</>}
                {order.courierAddress && <><br />{order.courierAddress}</>}
              </span>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
