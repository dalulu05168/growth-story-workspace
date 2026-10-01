# 辰南撰写 · 人物与创作工作台

管理人物档案、群组、事件记忆、每日撰写、文档和模拟交易。浏览器通过 Supabase `workspace-cloud` 函数验证账号密码、恢复工作区和同步修改。默认人物资料是 `data/people.json` 中的 70 位虚构法国人物测试画像。

## 本地运行与检查

需要 Node.js 22 或更新版本。

```bash
npm ci
npm test
npm run test:gate
npm run build:static
npx playwright install --with-deps chromium webkit
npm run test:prelogin
python -m http.server 3000 --directory dist/pages
```

打开 `http://localhost:3000`。正常登录仍连接云端，不提供前端默认账号或管理员密码；登录后的隔离业务测试使用 CI 创建的临时账号，执行后清理。

## 登录与数据保存

账号密码在服务端验证，会话令牌保存在浏览器 `sessionStorage`，服务端只保存令牌哈希并支持退出撤销。当前没有本机密码认证或二次验证码要求。

已加载的数据及编辑缓存保留在 `localStorage`。云端保存完成才显示同步成功；请求最长等待 15 秒，失败后保留本地修改并提示重试，不自动重试写入。超时并不保证服务端未处理请求；遇到版本冲突先备份本地修改，再恢复云端版本。

固定黑金主题，以用户提供的仙山楼阁、毛笔与比特币登录设计为准；不显示主题切换入口，旧查询参数和旧偏好不改变主题。分层场景约 2.6 秒渐显后，登录卡片从下方缓缓浮出；湖面纹理持续波动，毛笔轻摆，比特币沿立体轴旋转。可跳过开场；减少动态效果时快速显示并停止持续动画。认证层隐藏后释放场景渲染资源。记住账号只存账号名称，不保存密码。

## 发布与自定义域名

Vercel 和 GitHub Pages 都发布 `dist/pages`。Vercel 构建参数由 `vercel.json` 管理；主分支提交经 Pages 工作流验证后自动同步到 `gh-pages`。Pages 应继续使用现有 `gh-pages` 根目录来源；CNAME 中保留已有 `nuvexapro.com`，本轮无需修改 DNS。

`release.json` 记录源码提交和完整静态文件哈希。发布完成后验证两个入口：

```bash
node scripts/verify-release.cjs https://nuvexapro.com/
node scripts/verify-release.cjs https://growth-story-workspace.vercel.app/
E2E_URL=https://nuvexapro.com/ npm run test:public-login
E2E_URL=https://growth-story-workspace.vercel.app/ npm run test:public-login
```

一处入口通过不代表另一处通过。若仓库禁止 Actions 写 `gh-pages`，需在仓库设置启用工作流写权限；若 Pages 未按分支更新，需核实 Pages 来源设置。未通过公网验证的提交不能宣称已正式上线。

当前验收要求见 [UI 与发布规范](docs/CODEX_UI_THEME_IMPLEMENTATION_SPEC.md)，历史修复记录见 [repair-notes](docs/repair-notes.md)。

## 人物与桌面视觉

人物显示编号为 C.01–C.70：01–10 老女、11–30 新女、31–50 老男、51–70 新男。原始主键保持不变，C 编号可检索、选择及在文档中插入，记录、持仓和分组关联不迁移。70 人使用独立虚构头像，并以文字标签与标识色区分分类。新头像为生成的虚构形象。

所有业务模块统一使用深色表面与清晰文字；Logo 使用用户提供的辰南圆形原图，提供轻微呼吸光效。持仓柱状图保持持有人数去重、排除已卖出和不同市场币种分开统计的语义。

当前登录背景原生素材为 1672×941，8K 增强待 Krea 额度授权，不能将当前素材称作原生 8K。
