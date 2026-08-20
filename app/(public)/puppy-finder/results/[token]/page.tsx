import { notFound } from "next/navigation";
import "./results.css";
import { getProposalByToken, createPuppyFinderReadClient } from "../../../../../lib/puppyFinderAccess";
import ResultsHeader from "./ResultsHeader";
import ProcessSteps from "./ProcessSteps";
import OptionRow from "./OptionRow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your Puppy Finder Results - ThePuppyPlugs.com",
};

export default async function PuppyFinderResultsPage({ params }: { params: { token: string } }) {
  const proposal = await getProposalByToken(params.token);
  if (!proposal) notFound();

  const admin = createPuppyFinderReadClient();

  const { data: contact } = await admin
    .from("contacts")
    .select("first_name, display_name")
    .eq("id", proposal.contact_id)
    .maybeSingle();

  let inquiryBreed: string | null = null;
  if (proposal.inquiry_id) {
    const { data: inquiry } = await admin
      .from("inquiries")
      .select("breed")
      .eq("id", proposal.inquiry_id)
      .maybeSingle();
    inquiryBreed = inquiry?.breed || null;
  }

  const firstName = contact?.first_name || contact?.display_name || "there";
  const selectedOption = proposal.options.find((o) => o.is_selected);

  return (
    <>
      <ResultsHeader firstName={firstName} breed={inquiryBreed} />

      {proposal.status !== "proposed" &&
        (proposal.status === "deposit_confirmed" ? (
          <div className="pfr-banner pfr-banner--secured">
            <div className="pfr-banner-title">🎉 Your puppy is secured!</div>
            <p className="pfr-banner-body">
              Your deposit for {selectedOption?.name || selectedOption?.breed || "your puppy"} has been confirmed.
              We&rsquo;ll be in touch with next steps.
            </p>
          </div>
        ) : (
          <div className="pfr-banner pfr-banner--pending">
            <div className="pfr-banner-title">
              You selected {selectedOption?.name || selectedOption?.breed || "your puppy"}!
            </div>
            <p className="pfr-banner-body">
              A deposit is required to secure your puppy. We&rsquo;ll contact you with the next steps.
            </p>
          </div>
        ))}

      <ProcessSteps />

      <div className="pfr-options">
        {proposal.options.length === 0 ? (
          <div className="pfr-empty">We&rsquo;re still finding the perfect puppies for you. Check back soon!</div>
        ) : (
          proposal.options.map((option, index) => (
            <OptionRow
              key={option.id}
              token={params.token}
              option={option}
              proposalStatus={proposal.status}
              isFirst={index === 0}
            />
          ))
        )}
      </div>
    </>
  );
}
