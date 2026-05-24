# 妆搭 App 手机端前端优化与组件封装方案

## 一、问题背景

“妆搭”是一款面向手机端使用的美妆陪练类 App，核心定位是：

> 看懂妆容，更懂你  
> 把喜欢的妆，变成适合你的妆。

目前在使用 Claude Code 修改前端页面时，经常出现以下问题：

1. 修改过程繁琐，页面样式反复调整；
2. 一处改好，另一处又出问题；
3. 手机端适配效果不稳定；
4. 底部导航、顶部导航、卡片、按钮、标签等组件反复重写；
5. Claude Code 容易把 App 页面做成“网页缩放版”，而不是原生移动端体验；
6. 修改后经常需要回退，开发效率较低。

这些问题的根源不是 Claude Code 完全不会写前端，而是当前项目缺少一套稳定的：

- 移动端设计规范；
- 统一组件库；
- 页面骨架；
- 手机端验收流程；
- 设计稿与代码的映射机制。

因此，后续开发不应继续让 Claude Code 每次从零修改页面，而应先沉淀一套“妆搭移动端组件系统”。

---

## 二、核心结论

对于“妆搭”这种 App，建议采用以下原则：

> 不要让 Claude Code 反复手写页面样式，而是先封装常用组件，让它基于组件进行拼装和局部修改。

简言之：

```text
过去的方式：
每次改页面 → Claude Code 重新写样式 → 效果不稳定 → 回退

推荐方式：
先封装组件 → 页面只调用组件 → 样式统一维护 → 修改成本降低
```

组件封装是必要的，而且越早封装越好。

---

## 三、为什么需要封装组件

### 1. 减少返工

如果按钮、卡片、标签、底部导航都散落在不同页面里，每次调整样式都要逐页修改。

封装后，例如：

- 想调整所有按钮圆角，只改 `ZDButton`；
- 想调整所有卡片阴影，只改 `ZDCard`；
- 想调整所有标签颜色，只改 `ZDTag`；
- 想调整底部导航安全区，只改 `BottomTabBar`。

这样可以显著减少重复劳动。

### 2. 提高 Claude Code 输出稳定性

如果没有组件约束，Claude Code 每次都会自己发挥，很容易出现：

- 按钮风格不统一；
- 卡片边距不一致；
- 页面宽度不稳定；
- 标签换行混乱；
- 底部导航遮挡内容；
- 页面视觉越来越偏离原 App 风格。

封装后，可以明确要求 Claude Code：

```text
只能使用已有组件，不要临时新写按钮、标签、卡片样式。
```

这样 Claude Code 的自由度被控制在合理范围内，输出更稳定。

### 3. 手机端适配更可控

“妆搭”是手机端 App，不是桌面网页。核心适配宽度应围绕：

```text
375px
390px
430px
```

封装 `MobileShell` 后，所有页面统一遵守：

- 最大宽度 430px；
- 居中显示；
- 支持 `100dvh`；
- 支持 iPhone 安全区；
- 禁止横向滚动；
- 底部导航不遮挡内容。

### 4. 便于后期接入 Storybook、截图验收和 Figma

组件封装后，可以进一步做：

- Storybook 组件预览；
- Playwright 手机端截图；
- Figma 中导入组件截图；
- Figma Code Connect 关联设计组件与代码组件。

这会让前端修改从“凭感觉调样式”变成“有组件、有规范、有验收”。

---

## 四、建议封装的组件清单

### 4.1 页面布局类组件

#### 1. `MobileShell`

用途：所有手机端页面的最外层容器。

负责：页面最大宽度、背景色、手机端居中、防止横向溢出、安全区适配、页面整体高度。

适用页面：登录页、首页、解析页、灵感库、聊天陪练页、我的页面。

#### 2. `AppHeader`

用途：顶部导航栏。

负责：返回按钮、页面标题、副标题、历史记录按钮、用户按钮、图标按钮、顶部安全区适配。

#### 3. `BottomTabBar`

用途：首页 / 聊天 / 我的底部导航。

负责：固定在底部、适配 iPhone 底部安全区、当前 Tab 高亮、防止遮挡页面内容、统一图标和文字样式。

底部导航建议固定为：

```text
首页
聊天
我的
```

---

### 4.2 导航与筛选类组件

#### 1. `SegmentTabs`

用途：顶部大分段切换。

例如：

```text
AI 陪练
美妆灵感库
```

要求：选中项为白色卡片或酒红文字；未选中项为浅棕文字；圆角、轻边框；移动端触控区域足够大。

#### 2. `CategoryTabs`

用途：灵感库中的一级分类。

例如：

```text
博主灵感
风格复刻
场景妆容
新手陪练
```

要求：当前分类加粗；底部短横线高亮；不使用大面积色块；视觉类似原 App。

#### 3. `ChipScroll`

用途：横向滚动筛选标签。

例如：

```text
全部
教程型
风格型
仿妆型
改造型
测评型
```

或：

```text
全部
清冷
韩系
甜妹
港风
泰妆
欧美
```

要求：横向滚动；不强制换行；选中项酒红底白字；未选中项白底暖色边框；移动端隐藏滚动条。

---

### 4.3 基础 UI 组件

#### 1. `ZDButton`

用途：所有按钮统一使用。

类型：

```text
primary
secondary
ghost
disabled
```

示例：

```text
生成我的版本
导入聊天
登录
上传图片
正在生成解析卡片
```

主按钮样式：酒红背景、白色文字、胶囊圆角、高度 40–48px、字重 700。

次按钮样式：奶油白或浅粉背景、酒红文字、暖色边框、胶囊圆角。

#### 2. `ZDTag`

用途：所有标签统一使用。

示例：

```text
新手友好
基础教学
低翻车
低饱和
自然
伪素颜
淡颜友好
```

要求：柔粉背景、酒红文字、胶囊圆角、字体较小但清晰、不同页面样式一致。

#### 3. `ZDCard`

用途：所有白色圆角卡片统一容器。

适用：妆容卡片、博主卡片、风格卡片、场景卡片、新手陪练卡片、上传面板、聊天建议卡、解析结果模块。

要求：白色背景、20–24px 圆角、轻阴影、内边距统一、边框克制、不使用厚重分割线。

#### 4. `ZDIconButton`

用途：图标按钮。

适用：返回、历史记录、用户中心、拍照、上传图片、语音、视频通话。

要求：至少 44px 点击区域、圆角、图标颜色统一、轻边框或淡色背景。

---

### 4.4 业务卡片组件

#### 1. `MakeupCard`

用途：展示一个妆容解析结果。

示例内容：

```text
雀斑奶油妆
低饱和 · 自然 · 伪素颜 · 淡颜友好
复刻难度：中等
预计耗时：25分钟
产品 · 步骤 · 翻车点 · 全到位
```

适用页面：解析结果页、最近生成、妆容档案、聊天导入卡片。

#### 2. `CreatorCard`

用途：博主灵感卡片。

示例：

```text
程十安an
新手全脸妆
新手全脸 · 底妆教学 · 眼妆拆解
适合 化妆初学者 · 学生党 · 想补齐基础步骤的用户
```

按钮：

```text
生成我的版本
导入聊天
```

#### 3. `StyleCard`

用途：风格复刻卡片。

示例：

```text
入门妆
新手全脸妆
新手友好 · 基础教学 · 低翻车
```

#### 4. `SceneCard`

用途：场景妆容卡片。

示例：

```text
通勤
5 步极速通勤妆
通勤 · 极简
适合 上班族 · 赶时间
```

#### 5. `TrainingCard`

用途：新手陪练卡片。

示例：

```text
第一次画眼线
后半段短眼线
新手 · 短眼线
只练眼尾三分之一，避免完整上挑线条。
```

#### 6. `UploadPanel`

用途：上传 / 粘贴链接 / 上传视频的解析入口。

支持：

```text
粘贴链接
上传图片
上传视频
```

状态：

```text
未上传
已上传
正在解析
解析完成
解析失败
```

#### 7. `ProgressSteps`

用途：解析进度展示。

示例：

```text
读取内容来源
提取画面关键帧
识别妆容风格
生成解析卡片
```

---

### 4.5 聊天陪练组件

#### 1. `ChatBubble`

用途：聊天气泡。

类型：

```text
user
assistant
system
suggestion
```

要求：用户消息为酒红背景；AI 消息为白色卡片；行距舒适；不挤压屏幕；长文本自动换行。

#### 2. `ChatInputBar`

用途：聊天输入框。

负责：固定在底部导航上方、不遮挡消息、支持文字输入、支持语音按钮、支持发送按钮、支持上传图片入口。

#### 3. `QuickActionBar`

用途：聊天页快捷操作区。

示例：

```text
拍照
上传图片
语音通话
视频通话
```

要求：图标清晰、触控区域足够大、与底部导航不冲突。

---

## 五、建议项目目录结构

推荐将“妆搭”的组件统一放到 `src/components/zhuangda/` 下：

```text
src/
  components/
    zhuangda/
      layout/
        MobileShell.tsx
        AppHeader.tsx
        BottomTabBar.tsx

      navigation/
        SegmentTabs.tsx
        CategoryTabs.tsx
        ChipScroll.tsx

      base/
        ZDButton.tsx
        ZDCard.tsx
        ZDTag.tsx
        ZDIconButton.tsx

      business/
        MakeupCard.tsx
        CreatorCard.tsx
        StyleCard.tsx
        SceneCard.tsx
        TrainingCard.tsx
        UploadPanel.tsx
        ProgressSteps.tsx

      chat/
        ChatBubble.tsx
        ChatInputBar.tsx
        QuickActionBar.tsx

  styles/
    zhuangda.tokens.css

  stories/
    ZDButton.stories.tsx
    ZDCard.stories.tsx
    MakeupCard.stories.tsx
    CreatorCard.stories.tsx
    ChatInputBar.stories.tsx
```

---

## 六、设计变量建议

建议新建：

```text
src/styles/zhuangda.tokens.css
```

内容如下：

```css
:root {
  --zd-bg: #fbf7f2;
  --zd-card: #ffffff;
  --zd-card-warm: #f6ece6;

  --zd-primary: #8f2f32;
  --zd-primary-dark: #76272a;
  --zd-primary-soft: #f4dcd7;

  --zd-text: #2d2421;
  --zd-text-muted: #9c8177;
  --zd-text-light: #b49a91;

  --zd-border: #eadcd4;
  --zd-border-strong: #dfc8bd;

  --zd-shadow: 0 10px 28px rgba(80, 43, 38, 0.08);
  --zd-shadow-soft: 0 6px 18px rgba(80, 43, 38, 0.06);

  --zd-radius-card: 24px;
  --zd-radius-panel: 28px;
  --zd-radius-pill: 999px;

  --zd-bottom-tab-height: 64px;
}
```

后续所有组件都尽量引用这些变量，而不是到处写死颜色。

---

## 七、关键组件代码示例

以下代码仅作为结构参考，可以让 Claude Code 结合你的项目实际技术栈调整。

### 7.1 MobileShell

```tsx
import React from "react";
import "./zhuangda.tokens.css";

type MobileShellProps = {
  children: React.ReactNode;
  withBottomPadding?: boolean;
};

export function MobileShell({
  children,
  withBottomPadding = true,
}: MobileShellProps) {
  return (
    <div className="zd-root">
      <div className="zd-mobile-shell">
        <main
          className={
            withBottomPadding
              ? "zd-mobile-page zd-mobile-page-with-bottom"
              : "zd-mobile-page"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
```

对应 CSS：

```css
.zd-root {
  min-height: 100dvh;
  background: var(--zd-bg);
  color: var(--zd-text);
  overflow-x: hidden;
}

.zd-mobile-shell {
  width: 100%;
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  background: var(--zd-bg);
  overflow-x: hidden;
}

.zd-mobile-page {
  min-height: 100dvh;
}

.zd-mobile-page-with-bottom {
  padding-bottom: calc(
    var(--zd-bottom-tab-height) + env(safe-area-inset-bottom) + 24px
  );
}
```

### 7.2 BottomTabBar

```tsx
type BottomTabKey = "home" | "chat" | "profile";

type BottomTabBarProps = {
  active: BottomTabKey;
  onChange?: (key: BottomTabKey) => void;
};

const tabs: Array<{ key: BottomTabKey; label: string }> = [
  { key: "home", label: "首页" },
  { key: "chat", label: "聊天" },
  { key: "profile", label: "我的" },
];

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <nav className="zd-bottom-tab">
      {tabs.map((tab) => {
        const isActive = active === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            className={isActive ? "zd-bottom-tab-item active" : "zd-bottom-tab-item"}
            onClick={() => onChange?.(tab.key)}
          >
            <span>{tab.label}</span>
            {isActive && <i className="zd-bottom-tab-line" />}
          </button>
        );
      })}
    </nav>
  );
}
```

对应 CSS：

```css
.zd-bottom-tab {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 50;
  width: 100%;
  max-width: 430px;
  height: calc(var(--zd-bottom-tab-height) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--zd-border);
  box-shadow: 0 -6px 20px rgba(80, 43, 38, 0.04);
}

.zd-bottom-tab-item {
  border: 0;
  background: transparent;
  color: var(--zd-text-muted);
  font-size: 17px;
  font-weight: 700;
  position: relative;
}

.zd-bottom-tab-item.active {
  color: var(--zd-primary);
}

.zd-bottom-tab-line {
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: 24px;
  height: 4px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: var(--zd-primary);
}
```

### 7.3 ZDButton

```tsx
import React from "react";

type ZDButtonVariant = "primary" | "secondary" | "ghost";

type ZDButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ZDButtonVariant;
  fullWidth?: boolean;
};

export function ZDButton({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ZDButtonProps) {
  return (
    <button
      className={[
        "zd-button",
        `zd-button-${variant}`,
        fullWidth ? "zd-button-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
```

对应 CSS：

```css
.zd-button {
  min-height: 40px;
  padding: 0 18px;
  border-radius: var(--zd-radius-pill);
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.zd-button-full {
  width: 100%;
}

.zd-button-primary {
  background: var(--zd-primary);
  color: #fff;
}

.zd-button-secondary {
  background: #fff7f3;
  color: var(--zd-primary);
  border-color: var(--zd-border);
}

.zd-button-ghost {
  background: transparent;
  color: var(--zd-primary);
}

.zd-button:disabled {
  opacity: 0.55;
}
```

### 7.4 ZDTag

```tsx
type ZDTagProps = {
  children: React.ReactNode;
};

export function ZDTag({ children }: ZDTagProps) {
  return <span className="zd-tag">{children}</span>;
}
```

对应 CSS：

```css
.zd-tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--zd-radius-pill);
  background: var(--zd-primary-soft);
  color: var(--zd-primary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}
```

### 7.5 ZDCard

```tsx
type ZDCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function ZDCard({ children, className = "" }: ZDCardProps) {
  return <section className={`zd-card ${className}`}>{children}</section>;
}
```

对应 CSS：

```css
.zd-card {
  background: var(--zd-card);
  border-radius: var(--zd-radius-card);
  padding: 18px;
  box-shadow: var(--zd-shadow-soft);
}
```

### 7.6 ChipScroll

```tsx
type ChipOption = {
  label: string;
  value: string;
};

type ChipScrollProps = {
  options: ChipOption[];
  activeValue: string;
  onChange: (value: string) => void;
};

export function ChipScroll({
  options,
  activeValue,
  onChange,
}: ChipScrollProps) {
  return (
    <div className="zd-chip-scroll">
      <div className="zd-chip-row">
        {options.map((option) => {
          const active = option.value === activeValue;

          return (
            <button
              key={option.value}
              type="button"
              className={active ? "zd-chip active" : "zd-chip"}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

对应 CSS：

```css
.zd-chip-scroll {
  overflow-x: auto;
  padding: 0 20px 8px;
  margin: 0 -20px;
  scrollbar-width: none;
}

.zd-chip-scroll::-webkit-scrollbar {
  display: none;
}

.zd-chip-row {
  display: flex;
  gap: 10px;
  min-width: max-content;
}

.zd-chip {
  height: 36px;
  padding: 0 18px;
  border-radius: var(--zd-radius-pill);
  border: 1px solid var(--zd-border);
  background: #fff;
  color: var(--zd-text);
  font-size: 14px;
  white-space: nowrap;
}

.zd-chip.active {
  background: var(--zd-primary);
  border-color: var(--zd-primary);
  color: #fff;
}
```

---

## 八、Claude Code 重构提示词

### 8.1 第一阶段：只审计，不改代码

```text
请先不要修改代码。

现在要为“妆搭”App 建立移动端组件库。请先审计当前项目中重复出现的 UI 结构。

重点检查：
1. 页面外层容器；
2. 顶部导航；
3. 底部导航；
4. 按钮；
5. 标签；
6. 白色圆角卡片；
7. 横向筛选标签；
8. 博主灵感卡片；
9. 风格复刻卡片；
10. 场景妆容卡片；
11. 新手陪练卡片；
12. 上传解析面板；
13. 聊天气泡；
14. 聊天输入栏。

请输出：
1. 当前重复样式和重复结构清单；
2. 建议封装的组件清单；
3. 每个组件对应的现有文件位置；
4. 推荐重构顺序；
5. 第一阶段最小改动方案。

注意：
- 不要改业务逻辑；
- 不要改 API；
- 不要改路由；
- 不要一次性重构所有页面。
```

### 8.2 第二阶段：建立基础组件

```text
请根据刚才的审计结果，执行第一阶段组件封装。

目标：
1. 新建 src/components/zhuangda/base；
2. 新建 src/components/zhuangda/layout；
3. 新建 src/components/zhuangda/navigation；
4. 新建 src/styles/zhuangda.tokens.css；
5. 封装 MobileShell、BottomTabBar、ZDButton、ZDCard、ZDTag、ChipScroll；
6. 只迁移一个页面进行验证；
7. 不改业务逻辑、不改 API、不改路由；
8. 修改后运行 lint/build；
9. 输出修改文件、修改内容和验证结果。
```

### 8.3 第三阶段：迁移美妆灵感库页面

```text
现在请迁移“美妆灵感库”页面。

要求：
1. 页面外层使用 MobileShell；
2. 底部导航使用 BottomTabBar；
3. 顶部分类使用 CategoryTabs；
4. 横向筛选标签使用 ChipScroll；
5. 卡片外层使用 ZDCard；
6. 按钮使用 ZDButton；
7. 标签使用 ZDTag；
8. 保持现有数据和交互逻辑不变；
9. 保持现有视觉风格：奶油白背景、酒红主色、柔粉标签、白色圆角卡片、轻阴影；
10. 适配 375px、390px、430px 三个宽度；
11. 修改后运行 lint/build；
12. 输出修改文件和验证结果。
```

### 8.4 第四阶段：迁移聊天页

```text
请迁移聊天陪练页面。

要求：
1. 页面外层使用 MobileShell；
2. 顶部栏使用 AppHeader；
3. 聊天气泡使用 ChatBubble；
4. 输入区使用 ChatInputBar；
5. 快捷操作使用 QuickActionBar；
6. 输入区不得被底部导航遮挡；
7. 消息列表需要可滚动；
8. 支持 375px、390px、430px；
9. 不改接口和业务逻辑；
10. 修改后运行 lint/build；
11. 输出修改文件和验证结果。
```

---

## 九、移动端适配验收标准

### 9.1 视口尺寸

至少检查：

```text
375 × 812
390 × 844
430 × 932
```

### 9.2 页面检查项

```text
1. 页面是否出现横向滚动；
2. 顶部导航是否遮挡内容；
3. 底部导航是否遮挡内容；
4. 聊天输入框是否被底部导航覆盖；
5. 筛选标签是否横向滚动；
6. 卡片是否贴边；
7. 按钮高度是否至少 40px；
8. 图标按钮点击区域是否至少 44px；
9. 长文本是否溢出；
10. 页面是否像手机 App，而不是桌面网页缩放版；
11. 主题色是否统一；
12. 标签、按钮、卡片是否风格一致。
```

### 9.3 Playwright 截图验收提示词

```text
请使用 Playwright 对以下页面进行移动端截图验收：

视口：
1. 375x812
2. 390x844
3. 430x932

页面：
1. /login
2. /home
3. /inspiration
4. /analysis
5. /chat
6. /profile

检查：
1. 是否有横向溢出；
2. 是否有内容被底部导航遮挡；
3. 是否有内容被顶部导航遮挡；
4. 卡片是否超出屏幕；
5. 筛选标签是否正常横向滚动；
6. 按钮是否可点击；
7. 页面是否保持妆搭视觉风格。

请输出：
1. 截图保存路径；
2. 每个页面的问题清单；
3. 是否需要修复；
4. 如果需要，逐项修复。
```

---

## 十、是否可以把封装后的代码反向转成 Figma 图片

可以，但需要区分三种方式。

### 10.1 方式一：代码直接生成 Figma 可编辑组件

理论上可以，但不建议作为主流程。

原因是：

```text
React 组件 ≠ Figma 组件
```

React 组件中包含：状态、条件渲染、数据循环、CSS、Flex/Grid、API 数据、路由逻辑。

Figma 中对应的是：Frame、Auto Layout、Text、Component、Variant、Image、Vector。

二者并不是天然一一对应。

所以，代码直接反向生成 Figma 可编辑组件容易出现：布局不准确、层级混乱、文本样式丢失、组件语义丢失、后续维护困难。

因此，不建议把它作为主要工作流。

### 10.2 方式二：代码渲染成截图，再导入 Figma

这是最稳、最实用的方式。

推荐流程：

```text
React 组件
→ Storybook 或页面预览
→ Playwright 截图
→ 导入 Figma
→ 用作视觉稿、展示图、海报素材、版本对比
```

这种方式生成的是图片，不是可编辑 Figma 组件。

但它非常适合你的场景：

- 做产品展示；
- 做海报素材；
- 做手机端截图；
- 做版本对比；
- 做页面验收；
- 与设计稿进行视觉对照。

### 10.3 方式三：Figma 与代码组件建立映射

这是中长期更推荐的方式。

流程是：

```text
Figma 中建立设计组件
React 中建立代码组件
通过 Code Connect 或 Storybook 进行映射
```

例如：

```text
Figma Button
↔
React ZDButton

Figma Card
↔
React ZDCard

Figma Tag
↔
React ZDTag
```

这种方式不是“代码自动生成 Figma”，而是让设计组件与真实代码组件保持对应。

---

## 十一、推荐的 Figma 协作流程

对于“妆搭”项目，建议采用以下流程：

```text
第一层：Figma 管视觉方向
第二层：React 组件库管真实实现
第三层：Storybook 管组件预览
第四层：Playwright 管手机端截图回归
第五层：Code Connect 或 Storybook Connect 管设计与代码映射
```

具体流程：

```text
1. 先在代码中沉淀组件库
   MobileShell / BottomTabBar / ZDButton / ZDCard / ZDTag / ChipScroll / MakeupCard

2. 给每个组件写 Storybook
   展示默认态、选中态、禁用态、长文本态、小屏态

3. 用 Playwright 自动截图
   375x812、390x844、430x932

4. 将截图导入 Figma
   用作展示、评审、海报、版本归档

5. 等 UI 稳定后，再在 Figma 中建立同名组件
   ZDButton / ZDCard / ZDTag / MakeupCard

6. 使用 Code Connect 或手动文档把 Figma 组件和 React 组件关联
```

---

## 十二、推荐开发顺序

不要一次性大重构。建议按以下顺序推进。

### 第 1 步：审计当前前端

目标：找出重复 UI 和重复样式。

产出：重复组件清单、涉及文件、重构优先级。

### 第 2 步：建立基础组件库

优先封装：

```text
MobileShell
BottomTabBar
ZDButton
ZDCard
ZDTag
ChipScroll
```

这一步最关键。

### 第 3 步：迁移一个页面验证

建议先迁移：

```text
美妆灵感库页面
```

原因：它包含顶部导航、分类 Tabs、筛选 Chips、卡片列表、按钮、标签、底部导航，最能检验组件系统是否有效。

### 第 4 步：迁移解析卡片页

重点封装：

```text
MakeupCard
ProductList
StepSection
RiskTips
```

### 第 5 步：迁移聊天陪练页

重点封装：

```text
ChatBubble
ChatInputBar
QuickActionBar
SuggestionCard
```

### 第 6 步：迁移上传解析页

重点封装：

```text
UploadPanel
ProgressSteps
RecentGeneratedCard
```

### 第 7 步：迁移登录页和我的页面

重点统一：

```text
表单输入框
登录按钮
游客体验入口
用户档案卡片
历史记录卡片
```

### 第 8 步：引入 Storybook

为核心组件建立 stories：

```text
ZDButton
ZDCard
ZDTag
ChipScroll
BottomTabBar
CreatorCard
StyleCard
SceneCard
TrainingCard
MakeupCard
ChatInputBar
```

### 第 9 步：建立 Playwright 截图回归

每次修改后自动截图：

```text
375x812
390x844
430x932
```

### 第 10 步：再考虑 Figma 映射

等组件稳定后，再做：

```text
Figma 组件
↔
React 组件
```

---

## 十三、Claude Code 使用原则

### 13.1 不要让它“一次改全站”

错误做法：

```text
请帮我整体优化手机端页面。
```

这种请求容易导致大面积不可控修改。

推荐做法：

```text
请只迁移美妆灵感库页面，使用已有 MobileShell、ZDButton、ZDCard、ZDTag、ChipScroll、BottomTabBar，不要修改业务逻辑。
```

### 13.2 每次只改一个范围

建议单次任务控制在以下范围之一：

```text
一个基础组件
一个业务卡片
一个页面
一个适配问题
一个交互状态
```

### 13.3 修改前先让它输出计划

固定要求：

```text
先输出修改计划，不要立刻改代码。
```

### 13.4 修改后必须验收

固定要求：

```text
修改后运行 lint/build，并说明是否通过。
```

如果能接 Playwright，再要求：

```text
生成 375px、390px、430px 三种截图，检查是否有溢出和遮挡。
```

---

## 十四、推荐的长期技术路线

最终建议形成以下开发体系：

```text
妆搭 App
│
├── 设计变量
│   └── zhuangda.tokens.css
│
├── 基础组件
│   ├── ZDButton
│   ├── ZDCard
│   ├── ZDTag
│   └── ZDIconButton
│
├── 布局组件
│   ├── MobileShell
│   ├── AppHeader
│   └── BottomTabBar
│
├── 导航组件
│   ├── SegmentTabs
│   ├── CategoryTabs
│   └── ChipScroll
│
├── 业务组件
│   ├── MakeupCard
│   ├── CreatorCard
│   ├── StyleCard
│   ├── SceneCard
│   ├── TrainingCard
│   ├── UploadPanel
│   └── ProgressSteps
│
├── 聊天组件
│   ├── ChatBubble
│   ├── ChatInputBar
│   └── QuickActionBar
│
├── Storybook
│   └── 组件预览和状态管理
│
├── Playwright
│   └── 手机端截图回归
│
└── Figma
    └── 视觉设计、截图归档、组件映射
```

---

## 十五、最终建议

对于“妆搭”当前阶段，最重要的不是继续反复调页面，而是先完成以下三件事：

```text
第一，封装移动端基础组件。
第二，迁移一个典型页面验证。
第三，建立手机端截图验收流程。
```

优先级如下：

```text
P0：MobileShell、BottomTabBar、ZDButton、ZDCard、ZDTag、ChipScroll
P1：CreatorCard、StyleCard、SceneCard、TrainingCard、MakeupCard
P2：ChatBubble、ChatInputBar、QuickActionBar
P3：Storybook、Playwright 截图
P4：Figma 组件映射
```

一句话总结：

> 组件封装是必须的；代码可以稳定生成截图再导入 Figma；代码直接反向生成可编辑 Figma 组件不建议作为主流程。  
> 对“妆搭”来说，最佳路径是：先做组件库，再做页面迁移，再做截图验收，最后再考虑 Figma 映射。
