import { NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/orders";

/**
 * Public lookup by order number, used only by the success page as a fallback
 * when sessionStorage doesn't have the just-submitted order (e.g. the page
 * was refreshed or opened in a new tab). The order number itself acts as the
 * access token here — there is no other customer data exposed beyond what
 * the person who just placed the order already knows.
 */
export async function GET(_request: Request, { params }: { params: { orderNumber: string } }) {
  const result = await getOrderByNumber(params.orderNumber);
  if (!result) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { order, items } = result;
  return NextResponse.json({
    orderNumber: order.order_number,
    total: order.total,
    currency: order.currency,
    deliveryMethod: order.delivery_method,
    city: order.city,
    npWarehouseName: order.np_warehouse_name,
    courierAddress: order.courier_address,
    items: items.map((i) => ({ nameUk: i.name_uk, nameEn: i.name_en, price: i.price, qty: i.qty })),
  });
}
