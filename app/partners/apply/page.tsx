import ApplyForm from "../../../components/partners/ApplyForm";
import "../../../components/partners/partners.css";

export const dynamic = "force-dynamic";

export default function PartnersApplyPage() {
  return (
    <div className="partners-shell">
      <div className="partners-card">
        <h1 className="partners-title">Become an Affiliate</h1>
        <ApplyForm />
      </div>
    </div>
  );
}
