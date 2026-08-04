import {
  categoryMeta,
  discussionTagCloud,
  formatDiscussions,
  industryIntro,
  sortedProductApps,
  topicsByCategory,
  type TopicCategory,
} from "../../src/content/industry.js";

const categories: TopicCategory[] = ["tech", "industry", "conference"];

export function IndustryTab() {
  const cloudTags = [...discussionTagCloud].sort((a, b) => b.weight - a.weight);
  const productApps = sortedProductApps();
  const domesticApps = productApps.filter((app) => app.region === "国内");
  const overseasApps = productApps.filter((app) => app.region === "海外");

  return (
    <section className="tab-page">
      <header className="tab-hero">
        <p className="eyebrow">{industryIntro.eyebrow}</p>
        <h1>{industryIntro.title}</h1>
        <p className="hero-copy">{industryIntro.copy}</p>
      </header>

      <section className="content-block">
        <div className="block-heading">
          <p className="section-label">DISCUSSION TAG CLOUD</p>
          <h2>业界讨论标签云</h2>
          <p className="block-subcopy">技术与产品高频话题，点击标签跳转原文或官方文档。</p>
        </div>
        <div className="tag-cloud" aria-label="AI 业界讨论标签云">
          {cloudTags.map((tag) => (
            <a
              className={`tag-cloud-item weight-${tag.weight}`}
              data-category={tag.category}
              href={tag.href}
              key={`${tag.label}-${tag.href}`}
              rel="noreferrer"
              target="_blank"
              title={`查看「${tag.label}」相关原文`}
            >
              {tag.label}
            </a>
          ))}
        </div>
      </section>

      <section className="hot-modules">
        <div className="block-heading hot-modules-heading">
          <p className="section-label">RANKED MODULES</p>
          <h2>当前热点议题</h2>
          <p className="block-subcopy">
            按技术 / 行业 / AI 大会直播视频分栏，热点分排序；带 HOT 与讨论/观看热度，点击卡片查看原文或直播回放。
          </p>
        </div>

        <div className="hot-category-grid">
          {categories.map((category) => {
            const meta = categoryMeta[category];
            const topics = topicsByCategory(category);
            return (
              <section className="hot-category-panel" key={category}>
                <header>
                  <small>{meta.eyebrow}</small>
                  <h3>{meta.label}</h3>
                  <p>{meta.description}</p>
                </header>
                <ol className="hot-topic-list">
                  {topics.map((topic, index) => (
                    <li key={topic.id}>
                      <a
                        className="hot-topic-card"
                        href={topic.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <div className="hot-topic-top">
                          <span className="hot-rank">#{index + 1}</span>
                          {topic.hot && <span className="hot-flag">HOT</span>}
                          <span className="hot-discussions">
                            {formatDiscussions(topic.discussions)}
                          </span>
                        </div>
                        <strong>{topic.title}</strong>
                        <p>{topic.summary}</p>
                        <div className="hot-topic-foot">
                          <small>{topic.source}</small>
                          <em>
                            {topic.category === "conference" ? "观看直播 / 回放" : "查看原文"}{" "}
                            <i aria-hidden="true">↗</i>
                          </em>
                        </div>
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      </section>

      <section className="content-block product-apps-block">
        <div className="block-heading">
          <p className="section-label">PRODUCT APPS</p>
          <h2>产品热点 · 国内外应用</h2>
          <p className="block-subcopy">
            列举当前讨论度高的 Agent / AI 应用，附官网入口与近期新功能说明，点击卡片直达官网。
          </p>
        </div>

        <div className="product-app-groups">
          {[
            { label: "海外热点应用", apps: overseasApps },
            { label: "国内热点应用", apps: domesticApps },
          ].map((group) => (
            <div className="product-app-group" key={group.label}>
              <h3>{group.label}</h3>
              <div className="product-app-grid">
                {group.apps.map((app) => (
                  <a
                    className="product-app-card"
                    href={app.website}
                    key={app.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="product-app-top">
                      <div>
                        <strong>{app.name}</strong>
                        <span>{app.kind}</span>
                      </div>
                      <div className="product-app-badges">
                        {app.hot && <span className="hot-flag">HOT</span>}
                        <small>{formatDiscussions(app.discussions)}</small>
                      </div>
                    </div>
                    <p>{app.summary}</p>
                    <div className="product-feature-box">
                      <h4>新功能说明</h4>
                      <ul>
                        {app.newFeatures.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="hot-topic-foot">
                      <small>{app.region} · 官网</small>
                      <em>
                        打开官网 <i aria-hidden="true">↗</i>
                      </em>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
