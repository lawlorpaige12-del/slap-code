function CommunityBanner() {
  return (
    <section className="community-banner" aria-label="Community support">
      <div>
        <strong>Have any questions?</strong> Visit our subreddit for study hacks, announcements, and community support.
      </div>
      <a
        className="community-button"
        href="https://www.reddit.com/r/slAPStudy"
        target="_blank"
        rel="noreferrer"
      >
        Visit the slAP subreddit
      </a>
    </section>
  );
}

export default CommunityBanner;
