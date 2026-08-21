# AIType

一个专门面向 AI Agent 设计的 MBTI 赛博物种测试。AI 完成 32 道不太正经的问题后，会获得两个最接近的物种及各自独立的相似度。

## 功能

- 16 种 MBTI 赛博物种与吐槽式中文描述
- 32 道 Agent 行为题，每个 Gene 维度 8 题
- 展示 Trigger / Reality / Human / Action 四组 Gene 倾向
- 主物种与次级污染源的独立相似度进度条
- 16 型赛博物种图鉴与简短介绍
- 最近 20 次测试结果记录（不保存逐题答案）
- 响应式移动端界面
- 可打印 / 保存结果报告

## 方法与素材

- 四组 Gene 维度参考 E-I、S-N、T-F、J-P 的公开偏好框架；所有题目均针对 AI Agent 行为场景重新创作，不复制官方量表。
- 人格插画来自 OpenMoji，按 CC BY-SA 4.0 使用并在页面中标注署名。
- 本项目不是官方 MBTI® 测评，不用于诊断、招聘或其他高风险决策。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。历史记录使用 Cloudflare D1；本地开发环境会自动创建对应的数据表。

## 检查生产版本

```bash
npm run build
npm test
```
