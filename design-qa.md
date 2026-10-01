# 动态登录与工作台精修验收

final result: passed

用户要求无需 Krea 点数的替代方案，已使用本地开源 FSRCNN 重建并输出 7680×4320 背景和 3840×2160 桌面素材。明确为增强素材而非原生 8K。金黄 Logo、单一可见品牌、无附加标题与副标题、笔与币分离均已在真实浏览器检查。发布与正式账号验收另由 CI 执行。

## 源与渲染证据

登录构图：用户黑金仙山参考 `/tmp/codex-remote-attachments/01a0f537-7f86-7752-9b54-77f3ff2ef0a6/C4D41C7D-507B-4978-A4B8-C711EE14D0B8/1-照片-1.jpg`，1280×720。
Logo：用户第五张 `/tmp/codex-remote-attachments/01a0f537-7f86-7752-9b54-77f3ff2ef0a6/01E7244F-D34D-4749-B154-602352EB6672/5-照片-5.jpg`，1280×1280。
内部问题依据：同附件目录1、2、3张手机截图；工作台按用户明确要求以电脑端为主，采用一致深色阅读系统，不复刻截图中的对比度错误或浏览器UI。

真实Chromium浏览器实现：`evidence/login-frame-a.png`、`evidence/login-frame-b.png`，1280×720 CSS，DPR1；`evidence/refined-overview.png`、`refined-people.png`、`refined-groups.png`、`refined-holdingsV2.png`、`refined-novel.png`、`refined-person-detail.png`，1440×960 CSS，DPR1。
同尺寸登录对照：`evidence/immersive-login-comparison.png`，2560×720，左参考右实际运行；明确独立毛笔/币构图为本轮用户要求的动态变化。
重点区域对照：`evidence/immersive-logo-comparison.png`，原始标识与金黄材质版本归一到152×152并排；实际桌面Logo76×76。
本地工作台截图通过真实表单提交与模拟云端login/load进入，使用70人资料、43笔合成持仓和6条合成待买计划，不移除登录层或注入会话。非正式云端账号证据。

## 五项视觉检查

1. 字体：桌面标题26–36px，正文14–16px，标签11–12px。清除浅底浅字与深底深字残留。表格姓名/指标对比度4.5:1以上；详情值恢复浅色。
2. 间距：统一24px面板内边距、16–24px网格间距。总览8指标按4×2。文档排名由136px改240px，显示头像、C编号、姓名、分类与次数。持仓条目头像、姓名与价格不挤在同一行。
3. 颜色：背景#0b1018，表面#141c28，次级表面#101722，正文#f1f4f8，次级文字#b5c0d0，边界#334052，金色#efd08a。四类文字标签辅以标识色；VIP不会覆盖分类。
4. 图片：使用真实用户Logo与生成的独立透明毛笔、币以及70头像图集。未用字母头像/手绘SVG替代。WebP压缩保留Alpha。增强背景为7680×4320，交付导出尺寸通过检查，GPU支持与实际视口决定4K/8K选择；不宣称原生8K细节。
5. 内容：C.01–10老女、C.11–30新女、C.31–50老男、C.51–70新男；老/新指客户关系。保留FR数据主键维护交易/分组/文档关联，支持C别名检索和文档输入。

## 迭代历史

- P1 老客户姓名旧色覆盖新深色表格，实测对比度2.43。添加明确状态选择器，重新检查超过4.5。
- P1 文档排名过窄且工具栏浅色。重排排名与头像、深色工具栏和编辑面，重新捕获refined-novel。
- P1 人物详情字段值被旧黑色文字覆盖。明确detail-line b浅色，重新捕获refined-person-detail。
- P2 最高柱17人标签顶部裁切。扩大绘图区并按股票均匀排列，重新捕获refined-holdingsV2，数值与柱高对应且标签完整。
- P2 总览指标6+2布局不均。改4×2并清理装饰光斑，重新捕获refined-overview。

## 交互验证

53项单元与静态门禁通过。Chromium普通/减少动画模式的工作台导航、桌面四尺寸、表格内部滚动、固定导航通过。独立场景测试确认：普通模式湖面截图像素变化、毛笔与币变换变化；减少动画时冻结；认证层隐藏后渲染资源释放；70头像与C.01显示；详情与文档人物记忆操作通过。控制台无pageerror。新增完整18秒周期的不透明笔像素与币保守轮廓分离检查，普通与减少动画模式均通过；桌面确认仅1个可见品牌与0条品牌副标题。本地WebKit普通/减少动画模式的完整工作台与场景检查也已通过。湖面像素验证使用Canvas 2D实际位图或WebGL独立湖面区域，排除毛笔、币与表单叠层干扰。云端PR CI再执行相同检查。

## 本次修正

- 收小并抬高毛笔，币移向右下，缩小笔的运动幅度；整个周期无笔尖插入币轮廓。
- 桌面只显示居中侧栏Logo，移除“辰南撰写”与下方小字；窄屏只显示顶栏Logo。品牌改为金黄色材质；光晕/亮度缓慢变化，减少动画模式关闭。
- 桌面居中16:9框线内工作台，顶栏与导航固定，模块在框内独立滚动；模块起始线与导航起始线对齐。
- 本地超分辨率输出8K/4K；书法形状与内容保留。大图不超出GPU纹理限制。
- CI日志确认Ubuntu Azure源下载依赖时反复超时，改用与项目Playwright 1.55.1匹配的官方预装浏览器容器，避免重复安装，保留Chromium/WebKit与全部正式验收项目。进一步在本地复现Linux WebKit的WebGL纹理渲染崩溃；该浏览器使用真实Canvas 2D湖面渲染，保留动画、减少动画冻结与资源释放。

## 质量边界

背景8K为神经网络增强后导出，不是独立生成的原生8K细节；任何算法都不能恢复素材中不存在的真实细节。普通桌面截图保持清晰。正式发布须PR CI通过，然后继续双域一致性与隔离账号验收。

## 2026-10-01 可读性、记忆与保存修复

新增逐字计算实际前景/背景对比度的浏览器检查，包含有股票计划的交易视图。九个主要模块采样均达到4.5:1；修复 offer-stat 值、offer-row 标题/说明、人物表格操作按钮。统一紧凑间距、卡片框线，保留桌面16:9内部滚动。

人物成长弹窗引用历史日期与原文，增加首次经历、年龄倒退、关系变化和未来事件规则，允许有说明的成长和回忆。切换模块关闭提醒，避免遮挡其他模块操作。

服务端隔离账户验证通过：绑定验证后才启用、撤销旧会话、验证码防重放、恢复码仅用一次。真实浏览器绑定/二次登录流程通过。断网编辑、完全离线刷新、恢复网络补传及再次刷新数据保持通过。

清理未引用的旧图片、脚本、旧主题预览；删除已由intro.css拥有的重复登录规则、旧主题切换代码。迁移历史和有效测试保留。新一轮正式CI及完整业务验收继续进行，结果以发布检查为准。

手工交易计划恢复后，各标签、规则表单与持仓表通过对比度检查。真实浏览器验证手工加入、重算保留手工计划、刷新及完成标记。旧直接标记已售入口改为统一到期/价格确认。写作输入立即记入本地日志，云端请求仍防抖处理。


## 2026-10 desktop writing and recovery update

- Retained single black/gold theme, gold sidebar logo and the desktop 16:9 frame. Added bounded document revisions, escaped line-change comparison and reversible restore.
- Added editable character relationships/foreshadowing, per-person evidence acknowledgements, adjustable writing columns, focus mode and global search shortcuts.
- Added account-scoped cloud snapshots, transactional pre-change backup, validated export/import, session revocation and verifier replacement with fresh second-factor proof.
- Local validation: 70 unit checks, runtime static gate, Chromium/WebKit prelogin regression, real cloud history/reload/notes/contrast/keyboard and mouse resize/search/export/snapshot restore/file import/session revocation, and real verifier rotation/recovery/replay checks passed. Isolated accounts removed after verification.
- Cloud snapshots share the database; downloaded exports provide independently stored copies. Application snapshots are not a database disaster-recovery service.
- Production browser acceptance is dispatched after merge; do not interpret local tests as production deployment verification.
