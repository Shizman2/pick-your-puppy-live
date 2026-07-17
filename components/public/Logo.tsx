import Image from "next/image";

/**
 * Renders the official Pick Your Puppy Live logo exactly as provided.
 * Do not recolor, redraw, or replace this asset with typed text.
 */
export default function Logo() {
  return (
    <Image
      src="/assets/pick-your-puppy-live-logo.png"
      alt="Pick Your Puppy Live"
      width={296}
      height={296}
      className="logo"
      priority
    />
  );
}
