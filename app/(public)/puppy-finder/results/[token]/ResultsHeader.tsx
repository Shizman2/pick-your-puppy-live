export default function ResultsHeader({ firstName, breed }: { firstName: string; breed: string | null }) {
  return (
    <div className="pfr-header">
      <div className="pfr-eyebrow">🐾 Your Puppy Finder Results</div>
      <h1 className="pfr-title">Hi {firstName}, here&rsquo;s what we found just for you!</h1>
      <p className="pfr-sub">
        {breed
          ? `Based on your search for a ${breed}, we hand-picked the puppies below just for you.`
          : "We hand-picked the puppies below just for you."}
      </p>
    </div>
  );
}
