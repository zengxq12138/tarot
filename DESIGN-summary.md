# 概要设计：塔罗占卜 Web

## 1. 设计目标
- **与一期 PRD 对应**：实现沉浸式塔罗占卜 Web 应用，覆盖注册→占卜仪式→解读→历史→分享全链路
- **本次设计覆盖范围**：前端、后端 API、数据库、LLM 集成、动画方案、部署架构

## 2. 推荐技术栈

| 层 | 技术 | 选择原因 |
|----|------|----------|
| 前端 | Next.js 14 (App Router) + React 18 | 用户已选；服务端组件 + 客户端组件灵活组合；Vercel 原生部署 |
| 动画 | Three.js + React Three Fiber | 用户已选全 Three.js 方案；React Three Fiber 提供声明式 3D 场景 API，粒子/牌面翻转/场景统一 |
| UI 组件 | Tailwind CSS + shadcn/ui | 快速出暗黑风格 UI，shadcn/ui 组件可定制 |
| 认证 | Supabase Auth（邮箱+密码） | 用户已选；与 Supabase 数据库同源，免费额度充足（5 万 MAU） |
| 数据库 | Supabase PostgreSQL | 用户已选；含 Row Level Security、实时订阅、REST API |
| 牌库数据 | JSON 静态文件 | 用户已选；78 张牌数据不变，构建时加载，零运行时开销 |
| 牌面图片 | `/public` 静态资源 | 用户已选；Next.js 直接 serve，无需额外存储 |
| LLM | DeepSeek API（deepseek-chat） | 用户已选；性价比高，支持流式输出；通过 Next.js API Route 代理保护 Key |
| 分享卡片 | html2canvas | 用户已选；前端 DOM 截图，实现简单 |
| 部署 | Vercel (Hobby) + Supabase (Free) | 用户已选；免费额度够 MVP；无需自己运维服务器 |

## 3. 总体架构

```
┌──────────────────────────────────────────┐
│                用户浏览器                  │
│  ┌────────────────────────────────────┐  │
│  │   Next.js App (React + Three.js)   │  │
│  │   - 仪式场景 (R3F Canvas)           │  │
│  │   - UI 页面 (shadcn/ui + Tailwind) │  │
│  │   - html2canvas 卡片生成            │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │ HTTPS
    ┌─────────────┼─────────────┐
    │             ▼             │
    │    Vercel (Serverless)    │
    │  ┌─────────────────────┐  │
    │  │ Next.js API Routes  │  │
    │  │ - /api/divination   │  │
    │  │ - /api/readings     │  │
    │  │ - /api/admin/*      │  │
    │  └──────┬──────┬──────┘  │
    │         │      │         │
    │         ▼      ▼         │
    │   Supabase    DeepSeek   │
    │   (Auth+DB)   (LLM API)  │
    └──────────────────────────┘
```

- **关键链路**：
  1. 认证链路：浏览器 ↔ Supabase Auth（前端 SDK 直连，不经过 Next.js 后端）
  2. 占卜链路：浏览器 → Next.js API Route → DeepSeek API（SSE 流式返回）
  3. 数据链路：浏览器 ↔ Supabase Client SDK（直连数据库，RLS 保证安全）
  4. 静态资源：牌面图由 Vercel CDN 直接分发

## 4. 核心模块划分

### 4.1 认证模块 (Auth)
- **职责**：注册、登录、会话管理
- **实现**：Supabase Auth 前端 SDK；`@supabase/ssr` 处理 Next.js 服务端 cookie 同步
- **输出**：登录态 JWT，前端所有 Supabase 请求自动携带

### 4.2 牌库模块 (Card Library)
- **职责**：提供 78 张塔罗牌的静态数据
- **输入**：牌 ID (0-77)
- **输出**：牌名（中/英）、类型（大阿卡纳/小阿卡纳）、正位关键词、逆位关键词、基础含义、对应图片路径
- **实现**：单 JSON 文件 `data/tarot-cards.json`，构建时 import；牌图路径映射到 `/public/cards/{id}.jpg`

### 4.3 占卜仪式模块 (Ritual)
- **职责**：管理从问题输入到翻牌揭示的完整动画流程
- **实现**：React Three Fiber 场景，包含：
  - 暗黑氛围背景（粒子星空 + 烛光点光源）
  - 洗牌动画（78 张牌 3D 堆叠 → 快速随机穿插）
  - 抽牌交互（三张牌从牌堆飞出，排列为过去/现在/未来）
  - 翻牌揭示（牌面绕 Y 轴 180° 翻转，显示牌图）
- **状态机**：`idle → question_input → shuffle → pick_1 → pick_2 → pick_3 → reveal → interpretation`

### 4.4 LLM 解读模块 (Interpretation)
- **职责**：构造 prompt → 调用 DeepSeek → 流式返回结构化解读
- **输入**：用户问题、三张牌的 ID + 正逆位 + 牌名
- **输出**：SSE 流，前端逐段渲染四个区块（牌面含义 / 正逆位 / 影响 / 建议）
- **API Route**：`POST /api/divination/stream`
- **容错**：超时 15s 重试 1 次；流中断时展示已接收内容 + 兜底文案

### 4.5 历史记录模块 (History)
- **职责**：占卜结果持久化和查询
- **数据库表**：`readings`（user_id, question, cards JSON, interpretation, is_favorited, created_at）
- **接口**：列表分页查询、详情查看、收藏切换
- **权限**：RLS — 用户只能读写自己的记录

### 4.6 积分模块 (Points)
- **职责**：积分余额、扣减、充值记录
- **数据库表**：`user_points`（user_id, balance）、`points_transactions`（user_id, amount, type, balance_after, created_at）
- **扣减逻辑**：在 API Route 中原子校验余额，不足时抛错
- **新用户初始化**：注册时 Supabase Database Trigger 自动插入 `user_points` 行，balance=100

### 4.7 分享卡片模块 (Share)
- **职责**：生成占卜结果分享图
- **实现**：客户端渲染一个隐藏的卡片 DOM → html2canvas 截图 → 导出 PNG → 调用 `navigator.share()` 或下载
- **卡片内容**：三张牌名/图、问题摘要、一句解读金句、品牌标识

### 4.8 管理后台模块 (Admin)
- **职责**：用户积分管理
- **页面**：用户列表、积分详情、手动增减积分
- **权限**：Supabase RLS + 用户角色字段 `is_admin`；仅管理员访问
- **接口**：`GET /api/admin/users`、`PATCH /api/admin/users/[id]/points`

### 4.9 国际化模块 (i18n)
- **职责**：中/英文界面切换
- **实现**：`next-intl`；牌名等动态内容从 JSON 牌库中按 locale 取字段
- **持久化**：URL 路径 `/[locale]/...` 或 cookie

## 5. 核心实体 / 数据模型

### 5.1 readings（占卜记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 外键 → auth.users |
| question | text | 用户输入的问题 |
| locale | text | 占卜时语言 (zh/en) |
| cards | jsonb | `[{card_id, name, position, is_reversed}]` |
| interpretation | text | LLM 完整解读内容 |
| is_favorited | boolean | 是否收藏，默认 false |
| created_at | timestamptz | 创建时间 |

### 5.2 user_points（积分余额）
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | uuid | 主键，外键 → auth.users |
| balance | integer | 当前积分余额，默认 100 |
| updated_at | timestamptz | 最后更新时间 |

### 5.3 points_transactions（积分流水）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 外键 → auth.users |
| amount | integer | 变动量（正=充值，负=消费） |
| type | text | `draw` / `interpret` / `admin_recharge` / `signup_bonus` |
| balance_after | integer | 变动后余额 |
| created_at | timestamptz | 交易时间 |

### 5.4 tarot-cards.json（静态牌库，不存 DB）
```json
{
  "id": 0,
  "name_zh": "愚者",
  "name_en": "The Fool",
  "arcana": "major",
  "suit": null,
  "keywords_upright_zh": ["开始", "冒险", "天真"],
  "keywords_upright_en": ["beginnings", "innocence", "spontaneity"],
  "keywords_reversed_zh": ["鲁莽", "冒险", "愚蠢"],
  "keywords_reversed_en": ["recklessness", "risk-taking", "foolishness"],
  "meaning_zh": "愚者代表新的开始...",
  "meaning_en": "The Fool represents new beginnings...",
  "image": "/cards/rws/00-fool.jpg"
}
```
（78 张牌完整数据待编写，可从开源塔罗数据集获取）

## 6. 关键接口 / 交互边界

### 6.1 前端 ↔ Supabase（直连）
| 操作 | 方法 | 说明 |
|------|------|------|
| 注册 | `supabase.auth.signUp()` | 邮箱+密码 |
| 登录 | `supabase.auth.signInWithPassword()` | 返回 JWT |
| 查积分 | `supabase.from('user_points').select('balance')` | RLS 限制只能查自己 |
| 查历史 | `supabase.from('readings').select().order('created_at')` | 分页，RLS |
| 切换收藏 | `supabase.from('readings').update({is_favorited})` | RLS |

### 6.2 前端 ↔ Next.js API Routes
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/divination/stream` | POST | body: `{question, cards[]}` → SSE 流返回解读 |
| `/api/admin/users` | GET | 管理员查用户列表 |
| `/api/admin/users/[id]/points` | PATCH | 管理员增减积分 |

### 6.3 Next.js ↔ DeepSeek API
| 端点 | 说明 |
|------|------|
| `POST https://api.deepseek.com/v1/chat/completions` | `stream: true`，SSE 转发至前端 |
| 环境变量 | `DEEPSEEK_API_KEY` 存储在 Vercel Environment Variables |

### 6.4 积分扣减边界
- 积分校验在 API Route 中执行（服务端），不依赖前端传值
- 扣减步骤：读取余额 → 校验 ≥ N → 更新余额 + 写交易流水（同一事务）

## 7. 关键技术难点与实现建议

### 7.1 Three.js 牌面 3D 场景
- **难点**：78 张牌的 3D 模型、洗牌动画、翻转动画、粒子背景
- **建议**：
  - 使用 React Three Fiber + `@react-three/drei` 简化场景搭建
  - 每张牌为一个 `<Box>` 或 `<Plane>` + 双面纹理（正面牌图 / 背面统一纹理）
  - 洗牌动画用 `useFrame` + 补间插值（牌位置/旋转随机化）
  - 翻转用 `react-spring` 驱动的 Y 轴旋转
  - 粒子背景用 `@react-three/drei` 的 `Stars` 或自定义 `Points`
- **风险**：移动端性能；72 张牌全部渲染可能卡顿 → 抽牌后只保留 3 张在场景中

### 7.2 DeepSeek 流式输出稳定性
- **难点**：API 超时、格式不稳定、中文输出偶有截断
- **建议**：
  - API Route 中用 `fetch` + `ReadableStream` 逐 chunk 转发 SSE
  - 设置 `timeout: 15000ms`，超时重试 1 次
  - System prompt 明确要求 JSON 结构（含四个字段），增加格式稳定性
  - 前端解析 SSE 时做容错：非 JSON chunk 跳过并追加到上一个有效文本块
- **备选**：如果 DeepSeek 频繁超时，可切到 Groq 或 Together AI 的快速推理端点

### 7.3 积分扣减并发安全
- **难点**：用户快速点击可能导致重复扣分
- **建议**：
  - 前端按钮点击后立即 disabled，等待 API 返回
  - 后端用 Supabase `.select().single()` + `.update()` 做乐观锁校验版本
  - 或者用 Supabase RPC 函数在一个事务中完成"检查+扣减+写流水"

### 7.4 分享卡片跨浏览器一致性
- **难点**：html2canvas 在不同浏览器渲染差异；中文字体加载
- **建议**：
  - 卡片使用系统安全字体或预加载 Web 字体
  - 牌面图片确保 CORS 配置正确（同域静态资源无此问题）
  - 生成前在 hidden div 中渲染，确保所有图片加载完成后再截图
  - 备选：若 html2canvas 效果不理想，切换到 Satori (JSX → SVG)

## 8. 延后项与技术债说明

### 8.1 一期暂不处理
- 数据库连接池和 Supabase 付费升级（免费额度 500MB DB + 2GB 带宽够 MVP）
- CDN 加速牌面图（Vercel 自带全球 CDN，暂时够用）
- 日志和监控（Vercel 自带基础日志）
- E2E 测试
- 容器化（Vercel 原生部署不需要 Docker）

### 8.2 后续扩展建议
- 一期验证后，若用户量大：
  - Supabase 升级 Pro（$25/月）
  - 牌面图迁至 Supabase Storage 或 Cloudflare R2
  - 接入在线支付（Stripe / 微信支付）
  - 引入 Redis 做积分缓存热点
  - 考虑迁移到独立后端（FastAPI）以支持更复杂的 LLM 编排

## 9. 假设与待确认项

- **假设**：Rider-Waite 牌图版权为公共领域，可合法使用
- **假设**：DeepSeek API 可用 `deepseek-chat` 模型获得稳定输出，无需 `deepseek-reasoner`
- **假设**：一期日活 < 100，Vercel + Supabase 免费额度足够
- **假设**：管理员通过数据库直接创建（设置 `is_admin=true`），无需注册流程
- **待确认**：Supabase 国内访问可能被墙 → 若目标用户在国内，需考虑替代方案（自建 PostgreSQL + NextAuth.js）
- **待确认**：DeepSeek API Key 是否已有，还是需要新申请
