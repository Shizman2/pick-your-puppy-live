const ITEMS = ["Vet Checked", "Age-Appropriate Vaccinations", "Health Records Included", "Health Guarantee Included"];

export default function HealthyCheckedReady() {
  return (
    <div className="healthy-section">
      <h3 className="healthy-title">Healthy, Checked &amp; Ready</h3>
      <div className="healthy-pills">
        {ITEMS.map((item) => (
          <div className="healthy-pill" key={item}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <circle cx="12" cy="12" r="10" fill="#22C55E" opacity=".15" />
              <path d="M8 12l3 3 5-6" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
