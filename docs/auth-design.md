# 账号与无状态认证设计方案（轻量版）

面向小型团队的“可编辑/只读”二级账号模型，账号存储在 `/data/users.json`，后端使用无状态 JWT 认证与基于角色的授权，所有日志记录携带操作者身份。

---

## 1. 目标与边界
- 账号类型：
  - editor（可编辑）：可进行新增/修改/删除/刷新等变更性操作
  - reader（只读）：仅可查询和导出，不允许任何数据或缓存文件的写入
- 存储：不使用数据库，账号放置在 JSON 文件 `/data/users.json`，手动编辑维护
- 认证：无状态 JWT；后端不维护会话；注销=客户端丢弃 Token
- 审计：接入现有 Winston 日志体系（app、error、access），每条日志附加用户名和角色
- 兼容：开发模式可通过配置开关临时禁用认证

---

## 2. 文件与数据结构

### 2.1 账号文件 `/data/users.json`
建议结构（示例）：
```json
{
  "users": [
    {
      "username": "admin",
      "password_hash": "$argon2id$v=19$m=65536,t=3,p=1$...", // 使用 Argon2 或 Bcrypt 哈希
      "role": "editor", // editor | reader
      "display_name": "系统管理员",
      "enabled": true,
      "last_password_change": "2025-08-18T07:00:00.000Z"
    },
    {
      "username": "auditor",
      "password_hash": "$argon2id$v=19$m=65536,t=3,p=1$...",
      "role": "reader",
      "display_name": "审计账号",
      "enabled": true,
      "last_password_change": "2025-08-10T09:30:00.000Z"
    }
  ]
}
```
说明：
- password_hash：仅存哈希，不存明文。推荐 Argon2id（优先）或 Bcrypt（兼容）
- enabled：禁用账号时设为 false
- last_password_change：用于实现“哈希轮换/密码变更后旧 Token 失效”（见 4.2）

### 2.2 JWT 密钥文件
- 文件：`/data/jwt-secret.txt`
- 内容：64 字节以上随机字符串（Base64 或 Hex）
- 后端启动时读取；若不存在可自动生成一次并写入（生产环境建议手动生成与备份）

### 2.3 配置项（追加到 `data/appConfig.json`）
```json
{
  "auth": {
    "enabled": true,
    "tokenExpiresInHours": 12,
    "loginRateLimit": {
      "windowMinutes": 5,
      "maxAttempts": 20
    },
    "allowExportsForReader": true // 只读账号是否允许导出（POST /api/export/*）
  }
}
```

---

## 3. 认证 API 设计

### 3.1 登录
- 路径：`POST /api/auth/login`
- 请求体：`{ "username": string, "password": string }`
- 响应：
```json
{
  "token": "<JWT>",
  "expires_in": 43200, // 秒（示例：12 小时）
  "user": { "username": "admin", "role": "editor", "display_name": "系统管理员" }
}
```
- 行为：
  - 从 `/data/users.json` 读取并匹配用户
  - 校验 `enabled === true`
  - 使用 Argon2/Bcrypt 校验密码
  - 生成 JWT（见 3.4）
  - 失败时返回 401，不泄漏具体原因（统一提示“用户名或密码错误”）
  - 登录接口应用简单防爆破限流（内存计数即可）

### 3.2 获取当前用户
- 路径：`GET /api/auth/me`
- 需携带 Authorization: `Bearer <token>`
- 返回：与登录响应的 `user` 一致，并附带 `exp`/`iat`

### 3.3 注销
- 无状态：前端删除本地 Token 即可；后端可提供空实现 `POST /api/auth/logout`（返回 200）

### 3.4 JWT 内容
- Header: `{ alg: "HS256", typ: "JWT" }`
- Payload 建议：
```json
{
  "sub": "admin",             // username
  "role": "editor",           // editor | reader
  "name": "系统管理员",         // display_name
  "pwd_ver": "2025-08-18T07:00:00.000Z", // last_password_change 快照
  "iat": 1692345600,
  "exp": 1692388800
}
```
- 签名：HS256 + `/data/jwt-secret.txt`

---

## 4. 授权与权限矩阵

### 4.1 鉴权中间件
- 解析 `Authorization: Bearer <JWT>` → `req.user = { username, role, name, pwd_ver }`
- 校验 Token 有效期、签名、与用户存在性
- 版本校验（软吊销）：若 `token.pwd_ver < users.json 中相同用户的 last_password_change` 则拒绝（密码变更后旧 Token 失效）

### 4.2 权限规则
- reader：
  - 允许：所有 GET 请求
  - 允许（可配置）：`POST /api/export/*`（仅生成文件流，不改动数据）
  - 禁止：任何会产生持久化变化的 POST/PUT/DELETE（含缓存刷新写入 JSON 的操作）
- editor：允许全部

### 4.3 现有路由映射（摘取要点）
- 仅 GET（reader 允许）：
  - `GET /api/inbound|outbound|stock|partners|products|product-prices|receivable|payable|overview/*|analysis/*(GET)`
- 变更性操作（editor 才允许）：
  - 所有 `POST/PUT/DELETE` 的 CRUD 接口
  - `POST /api/stock/refresh`
  - `POST /api/overview/stats`
  - `POST /api/analysis/refresh`
  - `POST /api/analysis/clean-cache`
- 导出：
  - `POST /api/export/*` → 默认 reader 允许（可通过 `allowExportsForReader` 关闭）

实现建议：
- 定义 `authorize(allowedRoles: ("editor"|"reader")[], method?: 'GET'|'WRITE')` 辅助函数
- 默认策略：
  - GET → reader/editor
  - 导出 → 根据配置 → reader/editor
  - 其他 POST/PUT/DELETE → editor

---

## 5. 日志留痕（接入现有 logger）

### 5.1 目标
- access.log：每个请求记录 `username`、`role`、`ip`、`method`、`url`、`status`、`duration`
- app.log / error.log：在 `logger.info/error` 的 meta 中自动附加 `user` 字段：`{ username, role }`

### 5.2 实施
- 在 `backend/utils/loggerMiddleware.js` 的请求日志中：
  - 解析并附加 `req.user?.username`、`req.user?.role`
- 在 `backend/utils/logger.js` 创建 logger 实例时：
  - 使用 `defaultMeta` 或在封装的 `logger.<level>()` 内合并 `req.user`（通过请求域/中间件传递）
- 约定：所有业务代码调用 logger 时，尽量在拿到 `req` 的上下文中调用，以便带上用户

---

## 6. 前端改动（最小化）
- 登录页：简单表单（用户名/密码）并获取 Token，存储于 `localStorage`
- 请求头：所有 API 请求统一在 `fetch`/封装请求里加 `Authorization: Bearer <token>`
- 路由守卫：无 token 跳转登录；只读账号在 UI 上隐藏“新增/编辑/删除/刷新”等按钮（仅做 UX 约束，真正的约束在后端）
- 退出：清除本地 token，并跳转登录

（本方案暂不要求前端管理账号，账号文件手动维护）

---

## 7. 安全与运维建议
- 密码哈希：优先使用 Argon2id，其次 Bcrypt（cost 合理）；绝不存明文
- 传输安全：在生产使用 HTTPS，避免明文传输凭证
- 登录限流：按 IP+用户名组合做轻量内存计数，防止爆破
- Token 失效：缩短有效期（默认 12h），敏感操作后可手动要求用户重新登录
- 软吊销：使用 `last_password_change` 与 `pwd_ver` 实现；改密后旧 Token 立即失效
- 文件权限：限制 `/data/users.json` 与 `/data/jwt-secret.txt` 读写权限
- 审计保留：日志文件保留策略沿用现有配置（10MB×10 个）

---

## 8. 手动维护账号（运维流程）
1. 生成密码哈希（示例 Node 片段，使用 argon2）：
```js
// gen-hash.js
import argon2 from 'argon2';
const password = 'YourPassHere';
argon2.hash(password, { type: argon2.argon2id }).then(h => console.log(h));
```
2. 在 `/data/users.json` 中追加或修改用户：
   - `username`
   - `password_hash`（粘贴上一步输出）
   - `role`（editor|reader）
   - `enabled: true`
   - `last_password_change`（当前时间）
3. 保存文件，即刻生效（后端按需做文件变更监听或每次验证时读取）
4. 禁用账号：`enabled=false`
5. 修改密码：更新 `password_hash` 并刷新 `last_password_change`

---

## 9. 落地改动清单（后端）
- 新增：
  - `backend/routes/auth.js`：`POST /api/auth/login`、`GET /api/auth/me`、（可选）`POST /api/auth/logout`
  - `backend/utils/auth.js`：读取 `/data/users.json`、校验密码、签发/验证 JWT、权限判断
  - `data/jwt-secret.txt`：首次部署生成
- 修改：
  - `backend/server.js`：挂载 auth 路由；全局鉴权中间件（排除登录与静态资源）
  - `backend/utils/loggerMiddleware.js`：access 日志附加用户信息
  - `backend/utils/logger.js`：app/error 日志附加用户信息
  - 各业务路由：引入 `authorize(...)`，为变更性接口加 editor 限制

---

## 10. 时序与流程
1. 前端提交登录表单 → 后端验证 → 返回 JWT
2. 前端携带 JWT 访问 API → 后端鉴权中间件解析 → 注入 `req.user`
3. 授权中间件根据路由和方法判断权限
4. 业务处理 → 日志在 access/app/error 中均带上 `username`、`role`

---

## 11. 兼容性与回滚
- 开关：`data/appConfig.json` 中 `auth.enabled=false` 时，后端跳过鉴权/授权（开发或紧急回滚）
- 保持对现有 API 的最小侵入：新增中间件与路由，不改动现有业务逻辑与响应结构

---

## 12. 未来可选增强
- 按路由细粒度的权限策略（白名单/黑名单）
- 二次验证（TOTP）与 IP 白名单
- 密码复杂度策略与到期提醒
- 审计日志独立通道与外部告警对接

---

本方案遵循“简单、可控、低侵入”的原则：账号手动维护、后端无状态认证、细粒度到“读/写”两级授权，配合日志留痕即可满足小团队的安全与合规需求。

---

附：快速联调步骤（开发环境）
- 安装依赖（后端）：将自动新增的依赖安装（jsonwebtoken、argon2）
- 生成密码哈希：使用文中脚本或临时 Node 片段生成 Argon2 哈希，替换 `data/users.json` 中 `password_hash`
- 启动后端：保持 `data/appConfig.json` 中 `auth.enabled=true`
- 登录：`POST /api/auth/login`，拿到 token 后为后续请求添加 `Authorization: Bearer <token>` 头
