import Link from "next/link";
import type { SaleListItem } from "../../../lib/sales";
import { formatPriceFromCents } from "../../../lib/puppyTypes";
import { SALE_PROGRESS_LABEL } from "../../../lib/saleTypes";

export default function SalesListClient({ sales }: { sales: SaleListItem[] }) {
  if (sales.length === 0) {
    return <div className="contacts-empty">No active sales yet. Start one from a puppy&apos;s edit page.</div>;
  }

  return (
    <div>
      {sales.map((item) => (
        <Link key={item.sale.id} href={`/admin/sales/${item.sale.id}`} className="sale-card">
          <div className="sale-card-top">
            <div>
              <div className="sale-card-puppy">{item.puppyName}</div>
              <div className="sale-card-contact">{item.contactName}</div>
            </div>
            <div className="sale-card-amounts">
              <div className="sale-card-total">{formatPriceFromCents(item.sale.sale_price_cents)}</div>
              <div className="sale-card-paid">{formatPriceFromCents(item.totalPaidCents)} paid</div>
            </div>
          </div>
          <span className={`sale-progress-tag ${item.progress}`}>{SALE_PROGRESS_LABEL[item.progress]}</span>
        </Link>
      ))}
    </div>
  );
}
