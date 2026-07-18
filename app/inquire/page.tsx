import "./inquire.css";
import InquireForm from "../../components/inquire/InquireForm";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["puppy_interest", "puppy_finder", "pypl", "general"];

/**
 * Public, hosted inquiry form - lives inside this app rather than
 * being embedded cross-domain into iheartpuppy.com. That site's
 * buttons link here with query params that preselect the right
 * intent, e.g. /inquire?type=puppy&puppy=Leo
 */
export default function InquirePage({
  searchParams,
}: {
  searchParams: { type?: string; puppy?: string; slug?: string };
}) {
  const rawType = searchParams.type;
  const typeMap: Record<string, string> = {
    puppy: "puppy_interest",
    finder: "puppy_finder",
    pypl: "pypl",
    general: "general",
  };

  const resolvedType =
    (rawType && typeMap[rawType]) ||
    (rawType && VALID_TYPES.includes(rawType) ? rawType : null) ||
    "general";

  return (
    <div className="inquire-shell">
      <div className="inquire-inner">
        <InquireForm
          initialType={resolvedType as "puppy_interest" | "puppy_finder" | "pypl" | "general"}
          initialPuppyName={searchParams.puppy}
          initialPuppySlug={searchParams.slug}
        />
      </div>
    </div>
  );
}
