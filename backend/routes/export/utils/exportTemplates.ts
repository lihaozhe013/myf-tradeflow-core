// Excel 导出模板定义（TS + ESM）
// 使用 TypeScript 直接导入 JSON 模板
// 说明：这里使用别名从 backend 目录跳转到项目根目录的数据文件
import TEMPLATES from '@/../data/exportConfig.json';

export { TEMPLATES };
