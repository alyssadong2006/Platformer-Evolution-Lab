export function LearningExplanation() {
  return (
    <section className="learning-explainer" aria-labelledby="learning-title">
      <p className="eyebrow">HOW THE SMARTNESS WORKS</p>
      <h2 id="learning-title">It learns by trying, scoring, and trying again.</h2>
      <p className="learning-intro">
        Each blue agent has a small neural-network “brain.” The brain starts with
        random settings, so early attempts are mostly guesses.
      </p>
      <ol className="learning-steps">
        <li><span className="step-number">1</span><span><strong>Notice</strong> — The agent senses nearby obstacles, its movement, and which way the goal is.</span></li>
        <li><span className="step-number">2</span><span><strong>Try</strong> — Its brain turns those signals into move-left, move-right, or jump actions.</span></li>
        <li><span className="step-number">3</span><span><strong>Score</strong> — Getting closer earns points; reaching the goal earns a big bonus.</span></li>
        <li><span className="step-number">4</span><span><strong>Improve the next batch</strong> — The best brains are copied and mixed, with small random changes. The next generation tries again.</span></li>
      </ol>
      <p className="learning-note">
        <strong>In short:</strong> agents don’t change their brains during one
        attempt. The population can improve between generations, but success
        isn’t guaranteed. This demo evolves brain settings; it doesn’t grow new
        brain structures.
      </p>
    </section>
  );
}
