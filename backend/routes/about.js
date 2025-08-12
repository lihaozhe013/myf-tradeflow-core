const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const { logger } = require("../utils/logger");

const router = express.Router();

// 获取关于信息
router.get("/", async (req, res) => {
  try {
    const aboutPath = path.join(__dirname, "../../data/about.json");
    await fs.access(aboutPath);

    // 读取文件内容
    const data = await fs.readFile(aboutPath, "utf8");
    const aboutData = JSON.parse(data);

    logger.info("获取关于信息成功");
    res.json(aboutData);
  } catch (error) {
    logger.error("获取关于信息失败:", error);
    res.status(500).json({
      error: "获取关于信息失败",
      details: error.message,
    });
  }
});

module.exports = router;
