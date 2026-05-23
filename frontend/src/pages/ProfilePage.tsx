import "./ProfilePage.css";

const SUITS = ["眼下外侧上移腮红", "后半段短眼线", "奶茶豆沙唇", "低饱和红棕"];
const AVOIDS = ["重修容", "欧美挑眉", "过长上挑眼线"];

const MEMORIES = [
  "不喜欢浓眼妆，倾向自然淡色晕染。",
  "上班日希望 15 分钟内完成，跳过复杂修容。",
  "眼线只画后半段，沿下眼睑自然延长。",
  "没有修容盘，优先用腮红和口红替代。",
];

const RECENT: Array<[string, string]> = [
  ["今天", "清冷通勤妆"],
  ["昨天", "韩系裸妆"],
  ["上周", "港风复古妆"],
];

export function ProfilePage() {
  return (
    <div className="profile-page">
      {/* hero */}
      <header className="profile-page__hero">
        <div className="profile-page__avatar">妆</div>
        <div className="profile-page__greeting">
          <h2>小妆</h2>
          <p>清冷通勤是你的高频选择，本周已复刻 3 次。</p>
        </div>
      </header>

      {/* 关于你：一句话 bio */}
      <section className="profile-section">
        <span className="profile-section__label">关于你</span>
        <p className="profile-bio">
          方圆脸 · 自然偏暖肤色 · 内双 · 淡颜偏自然。
        </p>
      </section>

      {/* 适合你：标签云 */}
      <section className="profile-section">
        <span className="profile-section__label">适合你</span>
        <div className="profile-tags">
          {SUITS.map((t) => (
            <span key={t} className="profile-tag">{t}</span>
          ))}
        </div>
      </section>

      {/* 建议避开 */}
      <section className="profile-section">
        <span className="profile-section__label">建议避开</span>
        <div className="profile-tags">
          {AVOIDS.map((t) => (
            <span key={t} className="profile-tag profile-tag--ghost">{t}</span>
          ))}
        </div>
      </section>

      {/* MM 记住的事 */}
      <section className="profile-section">
        <span className="profile-section__label">MM 记住的事</span>
        <div className="profile-notes">
          {MEMORIES.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      </section>

      {/* 最近的复刻：时间线 */}
      <section className="profile-section">
        <span className="profile-section__label">最近的复刻</span>
        <ul className="profile-timeline">
          {RECENT.map(([time, name]) => (
            <li key={name} className="profile-timeline__row">
              <i className="profile-timeline__dot" />
              <time>{time}</time>
              <span>{name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 统计：一行话 */}
      <p className="profile-stats">
        已复刻 <b>12</b> 次妆容，覆盖 <b>3</b> 类风格，最近一次在 <b>5 月 22 日</b>。
      </p>

      {/* 隐私：footer */}
      <footer className="profile-footer">
        <p>
          妆搭默认不保存原图，只保留脸型、肤色等结构化标签。
          你可以随时删除档案与历史记忆。
        </p>
        <div className="profile-footer__actions">
          <button type="button">仅本次分析</button>
          <button type="button">删除分析记录</button>
          <button type="button">清空妆容记忆</button>
        </div>
      </footer>
    </div>
  );
}
