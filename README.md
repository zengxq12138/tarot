# 塔罗占卜 (Tarot Divination)

AI 驱动的沉浸式塔罗占卜 Web 应用。神秘暗黑风界面 + Three.js 3D 牌面动画 + DeepSeek LLM 个性化解读。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 14 (App Router) + React 18 + TypeScript |
| 3D 动画 | Three.js + React Three Fiber |
| UI | Tailwind CSS + shadcn/ui |
| 认证 | Supabase Auth |
| 数据库 | Supabase PostgreSQL |
| LLM | DeepSeek API (SSE 流式) |
| 国际化 | next-intl (中文 / English) |
| 部署 | Vercel |

## 快速开始

### 前置条件

1. [Supabase](https://supabase.com) 项目（免费计划即可）
2. [DeepSeek API Key](https://platform.deepseek.com)
3. Node.js 18+

### 1. 克隆并安装依赖

```bash
git clone <repo-url> taluo
cd taluo
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 Supabase 和 DeepSeek 配置。

### 3. 初始化数据库

在 Supabase SQL Editor 中执行 `supabase-migration.sql`。

### 4. 设置管理员

在 Supabase Auth 中，找到你的用户，在 `raw_user_meta_data` 中添加：
```json
{ "is_admin": true }
```

### 5. 获取塔罗牌面图片

将 78 张 Rider-Waite 塔罗牌图片放入 `public/cards/rws/` 目录，命名为：
`00-fool.jpg` ~ `77-king-pentacles.jpg`

图片需为公共领域版本（如 Rider-Waite 1920 年版）。

### 6. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DEEPSEEK_API_KEY`
4. 部署

## 项目结构

```
src/
├── app/
│   ├── [locale]/        # i18n 路由 (zh/en)
│   │   ├── ritual/      # 占卜仪式页
│   │   ├── history/     # 历史记录页
│   │   ├── favorites/   # 收藏页
│   │   ├── reading/[id]/# 占卜详情页
│   │   ├── admin/       # 管理后台
│   │   ├── login/       # 登录
│   │   └── register/    # 注册
│   └── api/             # API Routes
│       ├── divination/stream/ # LLM 流式解读
│       └── admin/       # 管理 API
├── components/
│   ├── auth/            # 认证组件
│   ├── layout/          # 布局 (Navbar)
│   ├── points/          # 积分显示
│   ├── ritual/          # Three.js 场景 + 解读面板
│   ├── share/           # 分享卡片生成
│   └── ui/              # shadcn/ui 组件
├── data/
│   └── tarot-cards.json # 78 张塔罗牌数据
├── i18n/                # 国际化配置和翻译
│   └── messages/        # zh.json / en.json
└── lib/                 # 工具和类型
    ├── supabase/        # Supabase 客户端
    └── types.ts         # TypeScript 类型定义
```

## 积分规则

- 抽牌：1 积分 / 次
- 解读：2 积分 / 次
- 新用户注册：赠送 100 积分
- 充值：管理员后台手动操作

## License

MIT
