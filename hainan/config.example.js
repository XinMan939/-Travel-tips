/* 高德 API 配置模板 —— 复制为 config.js 后填入你自己的密钥
   申请：https://console.amap.com → 应用管理 → 添加 Key
   · Web服务类型：用于构建时抓 POI 坐标（脚本 tools/geocode.js）
   · Web端(JS API)：用于页面实时地图
   · Web端安全密钥 jscode：与 Web端 Key 配套
   留空时页面自动降级为腾讯地图 URI 导航（免 key，功能不残）。 */
const AMAP = {
  serviceKey:  '',   // Web服务 Key
  webKey:      '',   // Web端 Key
  securityCode:''    // Web端安全密钥 jscode
};
