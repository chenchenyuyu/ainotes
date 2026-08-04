import {
  hiringSignals,
  jobBoards,
  jobsIntro,
  marketNotes,
  roleProfiles,
  salaryBands,
} from "../../src/content/jobs.js";

export function JobsTab() {
  return (
    <section className="tab-page">
      <header className="tab-hero">
        <p className="eyebrow">{jobsIntro.eyebrow}</p>
        <h1>{jobsIntro.title}</h1>
        <p className="hero-copy">{jobsIntro.copy}</p>
      </header>

      <section className="content-block">
        <div className="block-heading">
          <p className="section-label">JOB BOARDS</p>
          <h2>常见招聘网站</h2>
          <p className="block-subcopy">点击即可跳转对应平台检索 AI Agent / 大模型相关岗位。</p>
        </div>
        <div className="job-board-grid">
          {jobBoards.map((board) => (
            <a
              className="job-board-card"
              href={board.url}
              key={board.name}
              rel="noreferrer"
              target="_blank"
            >
              <div className="job-board-head">
                <h3>{board.name}</h3>
                <span>{board.region}</span>
              </div>
              <p>{board.summary}</p>
              <small>{board.searchHint}</small>
              <em>
                前往查看 <i aria-hidden="true">↗</i>
              </em>
            </a>
          ))}
        </div>
      </section>

      <section className="content-block">
        <div className="block-heading">
          <p className="section-label">SALARY BANDS</p>
          <h2>薪资区间观察</h2>
        </div>
        <div className="salary-table" role="table" aria-label="薪资区间">
          <div className="salary-head" role="row">
            <span>级别</span>
            <span>城市</span>
            <span>月薪区间</span>
            <span>中位参考</span>
            <span>说明</span>
          </div>
          {salaryBands.map((band) => (
            <div className="salary-row" key={band.level} role="row">
              <strong>{band.level}</strong>
              <span>{band.cityTier}</span>
              <span className="salary-range">{band.range}</span>
              <span>{band.median}</span>
              <span>{band.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-block">
        <div className="block-heading">
          <p className="section-label">ROLE REQUIREMENTS</p>
          <h2>岗位要求画像</h2>
        </div>
        <div className="role-grid">
          {roleProfiles.map((role) => (
            <article key={role.title}>
              <div className="role-head">
                <h3>{role.title}</h3>
                <span data-demand={role.demand}>需求 {role.demand}</span>
              </div>
              <p className="role-salary">{role.salaryHint}</p>
              <div className="role-cols">
                <div>
                  <h4>必备</h4>
                  <ul>
                    {role.mustHave.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>加分</h4>
                  <ul>
                    {role.niceToHave.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>面试常问</h4>
                  <ul>
                    {role.interviewFocus.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-block dual-notes">
        <div>
          <div className="block-heading">
            <p className="section-label">HIRING SIGNALS</p>
            <h2>招聘信号</h2>
          </div>
          <ul className="ready-list">
            {hiringSignals.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="block-heading">
            <p className="section-label">NOTES</p>
            <h2>使用说明</h2>
          </div>
          <div className="note-cards">
            {marketNotes.map((note) => (
              <article key={note.title}>
                <h3>{note.title}</h3>
                <p>{note.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
