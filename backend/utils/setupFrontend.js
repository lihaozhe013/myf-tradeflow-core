const express = require('express');
const path = require('path');

function setupFrontend(app) {
  // 假设前端已构建到 frontend/dist
  const frontendDist = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  // Express 5.x 推荐用 '/*' 作为 SPA 兜底路由
  app.get('/*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

module.exports = setupFrontend;
