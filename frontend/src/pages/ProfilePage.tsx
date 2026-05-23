import "./ProfilePage.css";

export function ProfilePage() {
  const sections = [
    {
      key: "profile",
      title: "我的妆容档案",
      desc: "脸型、肤色、五官风格、眼型、推荐妆容元素",
    },
    {
      key: "memory",
      title: "AI 已记住",
      desc: "你的偏好、容易翻车的步骤、最近的反馈",
    },
    {
      key: "history",
      title: "历史总结",
      desc: "近期上妆主题、灵感来源、解析次数",
    },
    {
      key: "privacy",
      title: "隐私设置",
      desc: "档案保存、照片分析、清空记忆、导出档案",
    },
  ];

  return (
    <div className="profile-page">
      <header className="profile-page__head">
        <div className="profile-page__avatar" />
        <div className="profile-page__info">
          <div className="profile-page__name">妆搭体验用户</div>
          <div className="profile-page__sub">
            档案完成度 · <span>40%</span>
          </div>
        </div>
      </header>

      <div className="profile-page__list">
        {sections.map((s) => (
          <button key={s.key} type="button" className="profile-page__row">
            <div>
              <div className="profile-page__row-title">{s.title}</div>
              <div className="profile-page__row-desc">{s.desc}</div>
            </div>
            <span className="profile-page__chev">›</span>
          </button>
        ))}
      </div>

      <p className="profile-page__privacy-note">
        我们默认仅保存结构化档案，不长期保存原始自拍。
      </p>
    </div>
  );
}
