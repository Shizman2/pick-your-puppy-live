const STEPS = [
  { title: "Review Your Puppy Options", desc: "Take a look at everything we found for you below." },
  { title: "Choose Your Puppy", desc: 'Tap "Choose This Puppy" on the one you want.' },
  {
    title: "Secure Your Puppy With the Required Deposit",
    desc: "We'll reach out with deposit instructions to lock in your puppy.",
  },
  { title: "We Handle the Rest", desc: "Sit back - we'll take care of everything from here." },
];

export default function ProcessSteps() {
  return (
    <div className="pfr-steps">
      {STEPS.map((step, i) => (
        <div className="pfr-step" key={step.title}>
          <div className="pfr-step-num">{i + 1}</div>
          <div>
            <div className="pfr-step-title">{step.title}</div>
            <div className="pfr-step-desc">{step.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
