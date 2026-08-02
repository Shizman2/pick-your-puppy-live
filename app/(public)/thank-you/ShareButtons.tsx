"use client";

export default function ShareButtons() {
  function shareLink(type: "text" | "copy") {
    const url = typeof window !== "undefined" ? window.location.origin : "https://thepuppyplugs.com";
    const message = `Check out ThePuppyPlugs.com — I just found my new puppy here! ${url}`;
    if (type === "text") {
      window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
    } else {
      navigator.clipboard?.writeText(url);
      alert("Link copied!");
    }
  }

  return (
    <div className="share-btns">
      <button className="share-btn" onClick={() => shareLink("text")}>
        💬 Text a Friend
      </button>
      <button className="share-btn" onClick={() => shareLink("copy")}>
        🔗 Copy Link
      </button>
    </div>
  );
}
