import "./ProfilePage.css";

const profileRows = [
  ["脸型", "方圆脸"],
  ["肤色", "自然偏暖"],
  ["五官风格", "淡颜偏自然"],
  ["眼型", "内双"],
  ["适合腮红", "眼下外侧上移"],
  ["适合眼线", "后半段短眼线"],
];

const memories = [
  "喜欢清冷、韩系、通勤",
  "上班日希望 15 分钟内完成",
  "眼线需要新手版",
  "没有修容盘，优先用腮红和口红替代",
];

const history = [
  ["最近复刻", "清冷通勤妆、韩系裸妆"],
  ["最适合我的妆", "低饱和通勤淡妆"],
  ["最容易翻车", "眼线、鼻影、重修容"],
  ["常用产品", "气垫、浅棕眼影、奶茶唇泥"],
];

export function ProfilePage() {
  return (
    <div className="profile-page">
      <header className="profile-page__head">
        <div className="profile-page__avatar">妆</div>
        <div>
          <div className="profile-page__name">妆搭体验用户</div>
          <div className="profile-page__sub">
            妆容档案完成度 <span>68%</span>
          </div>
        </div>
      </header>

      <section className="profile-card profile-card--hero">
        <div>
          <span>我的妆容档案</span>
          <h2>低饱和通勤 · 新手友好</h2>
          <p>AI 会把解析卡片和灵感库方案自动改写得更适合你。</p>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-card__title">
          <h3>妆容档案</h3>
          <span>已结构化</span>
        </div>
        <div className="profile-grid">
          {profileRows.map(([key, value]) => (
            <div key={key} className="profile-grid__row">
              <span>{key}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-card__title">
          <h3>AI 已记住</h3>
          <span>可随时清空</span>
        </div>
        <div className="memory-list">
          {memories.map((item) => (
            <div key={item} className="memory-pill">{item}</div>
          ))}
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-card__title">
          <h3>历史复刻</h3>
          <span>最近 7 天</span>
        </div>
        <div className="profile-grid">
          {history.map(([key, value]) => (
            <div key={key} className="profile-grid__row">
              <span>{key}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="privacy-card">
        <h3>隐私设置</h3>
        <p>默认不保存原始自拍和视频，只在授权后保存脸型、肤色、偏好等结构化档案。</p>
        <div>
          <button type="button">仅本次分析</button>
          <button type="button">清空妆容记忆</button>
        </div>
      </section>
    </div>
  );
}
