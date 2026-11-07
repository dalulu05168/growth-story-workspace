# Nuvexa 统一编程框架：项目接入试点（隔离分支）

本项目是中央开发/独立验收协作框架的第一个 **非生产试点**。仅添加 `.github/workflows/nuvexa-qa-pilot.yml` 与说明，不修改现有用户业务代码、自动发布工作流、数据库、域名和客户登录。

## 实际执行和不能声称的事项

1. `nuvexa-source-preflight-only`：执行本仓库真正的 `npm ci`、`npm test`、`npm run test:gate`、`npm run build:static`。这是源码回归与构建，不代表云端账号已经登录、数据已经保存、UI 已无瑕疵。
2. `nuvexa-branch-governance`：从当前 GitHub API 读取 `main` 保护状态，用固定 commit 的中央检查器审查。只要 `main` 未开启保护/必需检查，本任务就按设计 **BLOCK**；**不要为了获得绿色结果而删除此项**。
3. 完整交付前仍须运行真实登录、数据读写、桌面与移动端浏览器测试，并由独立审核者复核；当前这套 CI 并没有替代已有的 `pages-live-smoke.yml` 和 `acceptance.yml`。
4. 本试点不会发布到 GitHub Pages、Render 或其他网站，也不会碰生产用户数据。手动 `workflow_dispatch` 同样只运行试点。
5. 单独经过授权后，应将受保护分支 required check、Reviewer 和生产环境审批落实，才能称为不可绕过的交付门禁。

**特别说明：** 目前 `main` 的历史检查显示 `protected=false`，因此预期治理检查失败。这是正确的安全结果，不是测试造假。

中央框架： https://github.com/dalulu05168/-Skill/pull/41 ；本仓库其他已在进行的 PR 与业务代码保持独立，不作合并。
