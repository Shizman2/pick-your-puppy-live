import "./partner-landing.css";
import "../../faq/faq.css";
import ApplyForm from "../../../../components/partners/ApplyForm";
import PartnerHero from "../../../../components/partners/PartnerHero";
import PartnerHowItWorks from "../../../../components/partners/PartnerHowItWorks";
import PartnerWhyUs from "../../../../components/partners/PartnerWhyUs";
import PartnerHowYouEarn from "../../../../components/partners/PartnerHowYouEarn";
import PartnerFaq from "../../../../components/partners/PartnerFaq";
import PartnerFooter from "../../../../components/partners/PartnerFooter";

export const metadata = {
  title: "Partner Program – ThePuppyPlugs.com",
};

export default function PartnersApplyPage() {
  return (
    <div className="partner-landing">
      <PartnerHero />
      <PartnerHowItWorks />
      <PartnerWhyUs />
      <PartnerHowYouEarn />
      <PartnerFaq />
      <ApplyForm />
      <PartnerFooter />
    </div>
  );
}
