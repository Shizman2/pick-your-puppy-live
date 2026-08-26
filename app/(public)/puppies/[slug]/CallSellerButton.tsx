/**
 * Renders nothing if no Seller Phone Number has been configured in
 * admin yet - never shows a broken/empty call button.
 */
export default function CallSellerButton({ phone }: { phone: string | null }) {
  if (!phone) return null;

  const digitsOnly = phone.replace(/[^\d+]/g, "");
  if (!digitsOnly) return null;

  return (
    <a href={`tel:${digitsOnly}`} className="call-seller-btn">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path
          d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2 2z"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      Call the Seller
    </a>
  );
}
