import "./ProfilePage.css";

const PROFILE_QUICK = [
  { label: "脸型", value: "方圆脸" },
  { label: "五官", value: "淡颜偏自然" },
  { label: "色调", value: "自然偏暖" },
];

const FACE_CODE = [
  {
    title: "脸型判断",
    desc: "方圆脸，下颌饱满圆润，颧骨柔和，下颌线较短，整体轮廓偏温柔。",
  },
  {
    title: "五官风格",
    desc: "淡颜偏自然，五官分布舒展，眉眼柔和不锐利，气质适合干净通透的妆面。",
  },
  {
    title: "眼型分析",
    desc: "内双眼，建议眼妆走「后半段短眼线 + 浅棕铺色」路线，避免过长上挑线条。",
  },
  {
    title: "修饰重点",
    desc: "腮红上移到眼下外侧，视觉拉长面中；下颌线弱化处理，避免向外做欧美式修容。",
  },
  {
    title: "肤色特征",
    desc: "自然偏暖肤色，搭配奶茶豆沙等柔雾色系最贴肤，回避过深红棕与冷调粉雕。",
  },
];

interface ColorItem {
  name: string;
  hex: string;
}

const COLOR_PALETTE: { title: string; items: ColorItem[] }[] = [
  {
    title: "适合唇色",
    items: [
      { name: "奶茶色", hex: "#C9A07A" },
      { name: "豆沙色", hex: "#B0716B" },
      { name: "低饱和红棕", hex: "#8E5546" },
    ],
  },
  {
    title: "适合腮红",
    items: [
      { name: "杏粉", hex: "#E5B5A4" },
      { name: "豆沙粉", hex: "#D49387" },
    ],
  },
  {
    title: "适合眼影",
    items: [
      { name: "浅棕", hex: "#C9A88E" },
      { name: "大地色", hex: "#A98363" },
    ],
  },
];

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
      {/* ===== Workbench 风格头部 ===== */}
      <header className="profile-hero">
        <div className="profile-hero__top">
          <h1 className="profile-hero__title">我的妆容档案</h1>
          <button type="button" className="profile-hero__action">
            <span aria-hidden>↻</span>重新分析
          </button>
        </div>
        <div className="profile-hero__user">
          <div className="profile-hero__avatar">妆</div>
          <div className="profile-hero__meta">
            <div className="profile-hero__name">
              小妆<span className="profile-hero__level">新手 · L2</span>
            </div>
            <div className="profile-hero__sub">加入第 24 天 · 已复刻 12 次妆容</div>
            <div className="profile-hero__progress">
              <span>妆容档案完成度</span>
              <span className="profile-hero__pv">78%</span>
            </div>
            <div className="profile-progress-bar">
              <i style={{ width: "78%" }} />
            </div>
          </div>
        </div>
      </header>

      {/* ===== 3 个 stat 卡 ===== */}
      <div className="quick-stats">
        {PROFILE_QUICK.map((s) => (
          <div key={s.label} className="qs-card">
            <span className="qs-label">{s.label}</span>
            <span className="qs-value">{s.value}</span>
          </div>
        ))}
      </div>

      {/* ===== 时间线分析：面容密码 + 色彩标签 ===== */}
      <div className="analysis">
        <section className="analysis-section">
          <h3 className="analysis-title">
            <span className="analysis-emoji">👤</span>面容密码
          </h3>
          <div className="analysis-list">
            {FACE_CODE.map((item) => (
              <div key={item.title} className="analysis-item">
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="analysis-section">
          <h3 className="analysis-title">
            <span className="analysis-emoji">🎨</span>色彩标签
          </h3>
          <div className="analysis-list">
            {COLOR_PALETTE.map((group) => (
              <div key={group.title} className="analysis-item">
                <h4>{group.title}</h4>
                <div className="color-tags">
                  {group.items.map((c) => (
                    <div
                      key={c.name}
                      className="color-tag"
                      style={{ background: c.hex }}
                    >
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ===== 建议避开 ===== */}
      <section className="profile-section">
        <span className="profile-section__label">建议避开</span>
        <div className="profile-tags">
          {AVOIDS.map((t) => (
            <span key={t} className="profile-tag profile-tag--ghost">{t}</span>
          ))}
        </div>
      </section>

      {/* ===== MM 记住的事 ===== */}
      <section className="profile-section">
        <span className="profile-section__label">MM 记住的事</span>
        <div className="profile-notes">
          {MEMORIES.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      </section>

      {/* ===== 最近的复刻 ===== */}
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

      {/* ===== 统计 ===== */}
      <p className="profile-stats">
        已复刻 <b>12</b> 次妆容，覆盖 <b>3</b> 类风格，最近一次在 <b>5 月 22 日</b>。
      </p>

      {/* ===== CTA ===== */}
      <button type="button" className="profile-cta">
        试试一键生成「我的版本」
      </button>

      {/* ===== 隐私 footer ===== */}
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
