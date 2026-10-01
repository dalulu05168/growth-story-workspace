# 辰南撰写 · 人物与创作工作台

管理人物档案、群组、事件记忆、每日撰写、文档和模拟交易。浏览器通过 Supabase `workspace-cloud` 函数验证账号密码、恢复工作区和同步修改。默认人物资料是 `data/people.json` 中的 70 位虚构法国人物测试画像。

## 本地运行与检查

需要 Node.js 22 或更新版本。

```bash
npm ci
npm test
npm run test:gate
npm run build:static
npx playwright install chromium
npm run test:prelogin
python -m http.server 3000 --directory dist/pages
```

打开 `http://localhost:3000`。正常登录仍连接云端，不提供前端默认账号或管理员密码；登录后的隔离业务测试使用 CI 创建的临时账号，执行后清理。

## 登录与数据保存

账号密码在服务端验证，会话令牌保存在浏览器 `sessionStorage`，服务端只保存令牌哈希并支持退出撤销。当前没有本机密码认证或二次验证码要求。

已加载的数据及编辑缓存保留在 `localStorage`。云端保存完成才显示同步成功；请求最长等待 15 秒，失败后保留本地修改并提示重试，不自动重试写入。超时并不保证服务端未处理请求；遇到版本冲突先备份本地修改，再恢复云端版本。

三套主题：星空金黑、暖光书卷、通透蓝白。手动选择在刷新和重新进入后恢复；支持 `?theme=night|warm|blue`，以及旧的 `dark|ink|modern` 参数。电影开场可跳过，跳过动画不会绕过认证；减少动态效果设置使用快速显示。

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
