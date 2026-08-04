import {
  agentTimeline,
  coreConcepts,
  historyIntro,
} from "../../src/content/fundamentals.js";
import { TimelineVisual } from "./TimelineVisual.js";

export function FundamentalsTab() {
  return (
    <section className="tab-page">
      <header className="tab-hero">
        <p className="eyebrow">{historyIntro.eyebrow}</p>
        <h1>{historyIntro.title}</h1>
        <p className="hero-copy">{historyIntro.copy}</p>
      </header>

      <section className="content-block history-block">
        <div className="block-heading">
          <p className="section-label">VISUAL TIMELINE</p>
          <h2>时间轴学习路径</h2>
          <p className="block-subcopy">按时间推进阅读；点击资料链接可打开论文或官方文档。</p>
        </div>

        <ol className="history-timeline">
          {agentTimeline.map((item, index) => (
            <li className="history-node" key={item.id}>
              <div className="history-rail" aria-hidden="true">
                <span className="history-dot">{String(index + 1).padStart(2, "0")}</span>
                {index < agentTimeline.length - 1 && <span className="history-line" />}
              </div>

              <article className="history-card">
                <div className="history-card-copy">
                  <div className="history-meta">
                    <span className="history-year">{item.year}</span>
                    <strong>{item.title}</strong>
                  </div>
                  <p>{item.summary}</p>
                  <ul className="history-tags">
                    {item.highlights.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <div className="history-links">
                    <span>延伸阅读</span>
                    <div>
                      {item.links.map((link) => (
                        <a
                          href={link.href}
                          key={link.href}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <small>{link.kind}</small>
                          {link.label}
                          <i aria-hidden="true">↗</i>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <TimelineVisual kind={item.visual} alt={item.imageAlt} />
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="content-block">
        <div className="block-heading">
          <p className="section-label">CONCEPT BOUNDARY</p>
          <h2>概念对照（可跳转学习）</h2>
        </div>
        <div className="concept-grid">
          {coreConcepts.map((concept) => (
            <article key={concept.title}>
              <h3>{concept.title}</h3>
              <p>{concept.summary}</p>
              <ul>
                {concept.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <div className="concept-links">
                {concept.links.map((link) => (
                  <a href={link.href} key={link.href} rel="noreferrer" target="_blank">
                    {link.kind} · {link.label} ↗
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
