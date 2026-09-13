import ApplyForm from "../../../components/partners/ApplyForm";
import "../../../components/partners/partners.css";

export const dynamic = "force-dynamic";

export default function PartnersApplyPage() {
  return (
    <div className="partners-shell">
      <div className="partners-card">
        <ApplyForm />
      </div>
    </div>
  );
}
