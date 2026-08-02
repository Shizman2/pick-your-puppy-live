import "./sold.css";

export const metadata = {
  title: "Happy Homes – ThePuppyPlugs.com",
};

const REVIEWS = [
  {
    initial: "B",
    name: "Brianna T.",
    meta: "Adopted a Maltipoo · Miami, FL",
    text: "The process was so easy and trustworthy. Our puppy arrived healthy and happy. We couldn't be happier! She is the sweetest thing and our whole family is obsessed.",
  },
  {
    initial: "M",
    name: "Marcus & Diana L.",
    meta: "Adopted a Yorkie · Atlanta, GA",
    text: "We were nervous about buying a puppy online but ThePuppyPlugs made it so smooth. They answered every question, sent us videos, and delivered him right to our door. 10/10.",
  },
  {
    initial: "S",
    name: "Sofia R.",
    meta: "Adopted a Maltipoo · Houston, TX",
    text: "I found my Maltipoo here and she is literally perfect. Came with all her health records, already partly potty trained, and just the sweetest personality. Worth every penny.",
  },
  {
    initial: "J",
    name: "James K.",
    meta: "Adopted a Yorkie · New York, NY",
    text: "Got a Yorkie for my daughter's birthday and she cried happy tears. He is healthy, vaccinated, and full of energy. The whole experience was professional and stress-free.",
  },
];

const ADOPTED = [
  { breed: "Yorkie", gender: "Male", meta: "10 weeks · $799", home: "Miami, FL" },
  { breed: "Maltipoo", gender: "Female", meta: "12 weeks · $899", home: "Atlanta, GA" },
  { breed: "Yorkie", gender: "Female", meta: "11 weeks · $749", home: "Houston, TX" },
  { breed: "Maltipoo", gender: "Male", meta: "9 weeks · $849", home: "New York, NY" },
  { breed: "Yorkie", gender: "Male", meta: "10 weeks · $799", home: "Dallas, TX" },
  { breed: "Maltipoo", gender: "Female", meta: "11 weeks · $875", home: "Chicago, IL" },
];

export default function SoldPage() {
  return (
    <>
      <div className="sold-hero">
        <div className="icon">🏡</div>
        <h1>Puppies That Found Their Forever Home</h1>
        <p>Every puppy here is living their best life with a loving family. This could be yours next.</p>
      </div>

      <div className="sold-stats">
        <div className="sold-stat">
          <div className="num">500+</div>
          <div className="lbl">Placed</div>
        </div>
        <div className="sold-stat">
          <div className="num">4.9★</div>
          <div className="lbl">Rating</div>
        </div>
        <div className="sold-stat">
          <div className="num">100%</div>
          <div className="lbl">Healthy</div>
        </div>
      </div>

      <div className="reviews-section">
        <h2>Happy Families 💛</h2>
        {REVIEWS.map((r) => (
          <div className="review-card" key={r.name}>
            <div className="review-top">
              <div className="review-avatar">{r.initial}</div>
              <div>
                <div className="review-name">{r.name}</div>
                <div className="review-meta">{r.meta}</div>
                <div className="review-stars">★★★★★</div>
              </div>
            </div>
            <p className="review-text">&ldquo;{r.text}&rdquo;</p>
          </div>
        ))}
      </div>

      <div className="sold-section">
        <h2>Recently Adopted 🐾</h2>
        <p className="sub">These puppies already found their families — more available now!</p>
        <div className="sold-grid">
          {ADOPTED.map((p, i) => (
            <div className="sold-card" key={i}>
              <div className="sold-card-photo">🐶</div>
              <div className="sold-badge">🏡 Adopted</div>
              <div className="sold-heart">❤️</div>
              <div className="sold-card-body">
                <div className="sold-card-name">
                  {p.breed} · {p.gender}
                </div>
                <div className="sold-card-meta">{p.meta}</div>
                <div className="sold-card-home">🏠 Home: {p.home}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="trust-banner">
        <h2>Why Families Trust Us</h2>
        <div className="trust-row">
          <div className="trust-emoji">🛡️</div>
          <p>
            <strong>No puppy mills.</strong> Every breeder is personally vetted by our team before listing.
          </p>
        </div>
        <div className="trust-row">
          <div className="trust-emoji">💉</div>
          <p>
            <strong>Health certified.</strong> Every puppy is vet-examined and fully vaccinated before leaving.
          </p>
        </div>
        <div className="trust-row">
          <div className="trust-emoji">🏥</div>
          <p>
            <strong>30-day guarantee.</strong> If there&rsquo;s a health issue within 30 days, we make it right.
          </p>
        </div>
        <div className="trust-row">
          <div className="trust-emoji">🚚</div>
          <p>
            <strong>Safe delivery.</strong> Professional pet transport, climate-controlled, tracked.
          </p>
        </div>
        <div className="trust-row">
          <div className="trust-emoji">📞</div>
          <p>
            <strong>Real support.</strong> Real humans available by phone, text, or email.
          </p>
        </div>
      </div>

      <div className="sold-cta">
        <h2>Your Puppy is Waiting 🐾</h2>
        <p>Join hundreds of happy families. Browse our available puppies today and find your perfect match.</p>
        <a className="btn-white" href="/puppies" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          See Available Puppies ›
        </a>
      </div>
    </>
  );
}
