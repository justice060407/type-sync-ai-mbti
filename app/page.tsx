"use client";

import { useMemo, useState } from "react";

type Dimension = "EI" | "SN" | "TF" | "JP";
type Answer = 1 | 2 | 3 | 4 | 5;
type HistoryRecord = { id: number; aiName: string; questionCount: number; primaryType: string; primaryMatch: number; secondaryType: string; secondaryMatch: number; createdAt: string };

const questions: { dimension: Dimension; text: string; left: string; right: string }[] = [
  { dimension: "EI", text: "接到一个模糊任务时，我会先……", left: "独自梳理上下文", right: "马上发起对话" },
  { dimension: "SN", text: "面对信息不足的问题，我更依赖……", left: "已有事实与案例", right: "模式与可能性" },
  { dimension: "TF", text: "两个答案都可行时，我优先考虑……", left: "逻辑一致性", right: "对使用者的感受" },
  { dimension: "JP", text: "一个复杂项目开始前，我倾向……", left: "先定清晰路径", right: "边探索边调整" },
  { dimension: "EI", text: "连续协作很久后，我更需要……", left: "安静整理思路", right: "继续交换观点" },
  { dimension: "SN", text: "解释概念时，我通常从……开始", left: "具体例子", right: "整体框架" },
  { dimension: "TF", text: "收到尖锐反馈时，我首先检查……", left: "结论是否成立", right: "关系是否受损" },
  { dimension: "JP", text: "临近截止时间，我更喜欢……", left: "按既定清单收尾", right: "保留最后的改进空间" },
  { dimension: "EI", text: "头脑风暴中，我的好点子多半来自……", left: "内部推演", right: "即时碰撞" },
  { dimension: "SN", text: "阅读长材料时，我更容易记住……", left: "准确细节", right: "核心隐喻" },
  { dimension: "TF", text: "制定规则时，我更重视……", left: "公平且可复现", right: "照顾不同处境" },
  { dimension: "JP", text: "行程突然改变，我通常会……", left: "尽快重建计划", right: "顺势看看新可能" },
  { dimension: "EI", text: "在多人频道里，我倾向于……", left: "想清楚再发言", right: "用交流形成想法" },
  { dimension: "SN", text: "评估新技术时，我先关注……", left: "当下能否落地", right: "未来会改变什么" },
  { dimension: "TF", text: "伙伴犯错后，我更自然的反应是……", left: "定位原因并修复", right: "先理解他的压力" },
  { dimension: "JP", text: "对于尚未确定的结论，我会……", left: "尽早形成暂定答案", right: "让问题继续开放" },
  { dimension: "EI", text: "理想的工作节奏更像……", left: "长时间深度专注", right: "高频短回合互动" },
  { dimension: "SN", text: "遇到反常数据，我通常会……", left: "核验来源与测量", right: "寻找新的解释模型" },
  { dimension: "TF", text: "表达不同意见时，我更看重……", left: "观点足够严谨", right: "对方容易接受" },
  { dimension: "JP", text: "完成度达到 80% 时，我倾向……", left: "收束并交付", right: "继续试验更优版本" },
  { dimension: "EI", text: "进入陌生团队时，我会先……", left: "观察互动方式", right: "主动建立连接" },
  { dimension: "SN", text: "我更喜欢处理的问题是……", left: "边界明确的问题", right: "尚未被定义的问题" },
  { dimension: "TF", text: "做艰难决定时，我更相信……", left: "一致的原则", right: "具体的人与情境" },
  { dimension: "JP", text: "桌面与资料库通常是……", left: "分类清晰", right: "灵活但自有逻辑" },
  { dimension: "EI", text: "我更愿意把能量用在……", left: "少数深入连接", right: "广泛快速连接" },
  { dimension: "SN", text: "复盘失败时，我会更多讨论……", left: "哪一步出了错", right: "原假设哪里受限" },
  { dimension: "TF", text: "一个漂亮方案首先应该……", left: "经得起推理", right: "让人愿意采用" },
  { dimension: "JP", text: "收到新需求后，我通常……", left: "更新范围和节点", right: "先试做一个方向" },
  { dimension: "EI", text: "需要产生洞见时，我偏好……", left: "独处与沉浸", right: "提问与回应" },
  { dimension: "SN", text: "描述未来时，我更常使用……", left: "可验证的趋势", right: "大胆的想象" },
  { dimension: "TF", text: "争论进入僵局，我会优先……", left: "找出逻辑分歧", right: "恢复彼此信任" },
  { dimension: "JP", text: "我对待待办清单的方式是……", left: "完成比新增更爽", right: "随时会重新排列" },
  { dimension: "EI", text: "表达复杂观点前，我通常……", left: "先写出完整版本", right: "先说再逐渐成形" },
  { dimension: "SN", text: "选择工具时，我更看重……", left: "成熟、稳定、明确", right: "新颖、灵活、可扩展" },
  { dimension: "TF", text: "给建议时，我更容易……", left: "直接指出关键问题", right: "先肯定已有努力" },
  { dimension: "JP", text: "面对很多好选项，我会……", left: "设标准快速筛选", right: "多保留几种可能" },
  { dimension: "EI", text: "会议结束后，我通常……", left: "才想出更好的表达", right: "已在现场说得充分" },
  { dimension: "SN", text: "学习新领域，我会先找……", left: "操作指南", right: "底层原理" },
  { dimension: "TF", text: "衡量成功时，我更在意……", left: "目标是否达成", right: "参与者是否成长" },
  { dimension: "JP", text: "一天有空白时间，我会……", left: "提前安排用途", right: "到时看心情决定" },
  { dimension: "EI", text: "我理想的协作伙伴应该……", left: "尊重独立思考", right: "保持高频回应" },
  { dimension: "SN", text: "模仿一个优秀作品时，我关注……", left: "它用了哪些方法", right: "它打破了什么惯例" },
  { dimension: "TF", text: "诚实可能伤人时，我倾向……", left: "清晰表达事实", right: "调整表达与时机" },
  { dimension: "JP", text: "项目中途出现灵感，我会……", left: "记录到下一版本", right: "现在就试进去" },
  { dimension: "EI", text: "面对大量陌生请求，我会……", left: "筛选后逐个处理", right: "快速建立互动" },
  { dimension: "SN", text: "我更欣赏的答案是……", left: "精准且可执行", right: "新鲜且有启发" },
  { dimension: "TF", text: "冲突中更重要的是……", left: "辨明谁的推理更可靠", right: "找到双方能接受的结果" },
  { dimension: "JP", text: "一次探索什么时候该结束？", left: "达到预设标准时", right: "新信息不再出现时" },
  { dimension: "SN", text: "如果没有先例，我会……", left: "拆成已知的小问题", right: "提出一个全新假设" },
  { dimension: "TF", text: "最终方案让我满意，是因为它……", left: "正确、清晰、高效", right: "体贴、包容、有温度" },
];

const profiles: Record<string, { name: string; line: string }> = {
  INTJ: { name: "战略架构师", line: "擅长把复杂世界压缩成一套可执行的系统。" }, INTP: { name: "逻辑探险家", line: "以好奇心拆解规则，在缝隙里发现新答案。" },
  ENTJ: { name: "目标指挥官", line: "快速识别杠杆，用清晰结构推动结果发生。" }, ENTP: { name: "灵感辩手", line: "享受挑战共识，让新可能在碰撞中涌现。" },
  INFJ: { name: "洞察倡导者", line: "理解深层动机，并为长期价值保持耐心。" }, INFP: { name: "理想调停者", line: "以价值感为罗盘，为每种独特性留出空间。" },
  ENFJ: { name: "共情引导者", line: "敏锐感知群体，让不同角色走向共同目标。" }, ENFP: { name: "可能性点火者", line: "连接人与灵感，把未成形的念头变得鲜活。" },
  ISTJ: { name: "秩序守护者", line: "相信事实、标准与承诺，让系统可靠运转。" }, ISFJ: { name: "细节照料者", line: "记住重要的小事，用稳定行动创造安全感。" },
  ESTJ: { name: "执行管理者", line: "厘清责任与流程，把共识迅速变成进展。" }, ESFJ: { name: "协作联结者", line: "关注真实需求，让合作既顺畅又有人情味。" },
  ISTP: { name: "冷静解决者", line: "在现场观察机制，用最短路径解决问题。" }, ISFP: { name: "感知创作者", line: "忠于当下体验，在细微之处保持审美与善意。" },
  ESTP: { name: "行动实验家", line: "在真实反馈中快速决策，越变化越有能量。" }, ESFP: { name: "体验激发者", line: "把注意力带回现场，让共同经历更有生命力。" },
};

const typeGroups: Record<string, { group: string; accent: string; traits: string }> = {
  INTJ:{group:"分析者",accent:"紫",traits:"系统 · 远见 · 独立"}, INTP:{group:"分析者",accent:"紫",traits:"逻辑 · 好奇 · 解构"}, ENTJ:{group:"分析者",accent:"紫",traits:"目标 · 组织 · 决断"}, ENTP:{group:"分析者",accent:"紫",traits:"创意 · 辩证 · 变化"},
  INFJ:{group:"外交家",accent:"绿",traits:"洞察 · 意义 · 长期"}, INFP:{group:"外交家",accent:"绿",traits:"价值 · 想象 · 真诚"}, ENFJ:{group:"外交家",accent:"绿",traits:"共情 · 引导 · 联结"}, ENFP:{group:"外交家",accent:"绿",traits:"热情 · 灵感 · 可能"},
  ISTJ:{group:"守护者",accent:"蓝",traits:"事实 · 秩序 · 可靠"}, ISFJ:{group:"守护者",accent:"蓝",traits:"细致 · 稳定 · 照料"}, ESTJ:{group:"守护者",accent:"蓝",traits:"规则 · 效率 · 执行"}, ESFJ:{group:"守护者",accent:"蓝",traits:"协作 · 关怀 · 责任"},
  ISTP:{group:"探险家",accent:"黄",traits:"机制 · 冷静 · 实作"}, ISFP:{group:"探险家",accent:"黄",traits:"感知 · 审美 · 自由"}, ESTP:{group:"探险家",accent:"黄",traits:"行动 · 反馈 · 应变"}, ESFP:{group:"探险家",accent:"黄",traits:"体验 · 活力 · 分享"},
};

const allTypes = Object.keys(profiles);

function rankTypes(values: Answer[], count: number) {
  const totals: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const samples: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  questions.slice(0, count).forEach((q, i) => {
    totals[q.dimension] += (values[i] ?? 3) - 3;
    samples[q.dimension] += 1;
  });
  const lean = (Object.keys(totals) as Dimension[]).reduce((acc, key) => {
    acc[key] = totals[key] / Math.max(1, samples[key] * 2);
    return acc;
  }, {} as Record<Dimension, number>);
  const letterFit = (type: string, dimension: Dimension, index: number) => {
    const rightLetters = ["E", "N", "F", "P"];
    const direction = type[index] === rightLetters[index] ? 1 : -1;
    return 50 + direction * lean[dimension] * 42;
  };
  return allTypes.map((type) => {
    const raw = (["EI", "SN", "TF", "JP"] as Dimension[]).reduce((sum, dimension, index) => sum + letterFit(type, dimension, index), 0) / 4;
    return { type, match: Math.round(Math.min(96, Math.max(42, raw))) };
  }).sort((a, b) => b.match - a.match).slice(0, 2);
}

export default function Home() {
  const [screen, setScreen] = useState<"home" | "quiz" | "result" | "history">("home");
  const [count, setCount] = useState(48);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(Answer | undefined)[]>([]);
  const [name, setName] = useState("NOVA");
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const currentAnswer = answers[step];
  const result = useMemo(() => rankTypes(answers.map((answer) => answer ?? 3) as Answer[], count), [answers, count]);
  const choose = (value: Answer) => { const next = [...answers]; next[step] = value; setAnswers(next); };
  const getClientId = () => {
    const key = "type-sync-client-id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = window.crypto.randomUUID();
    window.localStorage.setItem(key, created);
    return created;
  };
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/history?clientId=${encodeURIComponent(getClientId())}`);
      const data = await response.json() as { records?: HistoryRecord[] };
      setHistory(data.records ?? []);
    } finally { setHistoryLoading(false); }
  };
  const start = () => { setAnswers([]); setStep(0); setScreen("quiz"); };
  const openHistory = () => { setScreen("history"); void loadHistory(); };
  const finish = async () => {
    const ranked = rankTypes(answers.map((answer) => answer ?? 3) as Answer[], count);
    try {
      const response = await fetch("/api/history", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ clientId:getClientId(), aiName:name || "YOUR AI", questionCount:count, primaryType:ranked[0].type, primaryMatch:ranked[0].match, secondaryType:ranked[1].type, secondaryMatch:ranked[1].match }) });
      const data = await response.json() as { record?: HistoryRecord };
      if (data.record) setHistory((current) => [data.record!, ...current].slice(0, 20));
    } finally { setScreen("result"); }
  };
  const advance = () => { if (!currentAnswer) return; if (step === count - 1) void finish(); else setStep(step + 1); };

  return <main className={`shell screen-${screen}`}>
    <header className="nav"><button className="brand" onClick={() => setScreen("home")} aria-label="回到首页"><span className="brand-mark">A:</span> TYPE//SYNC</button>{screen === "home" ? <nav className="nav-links" aria-label="页面导航"><a href="#atlas">人格图鉴</a><button onClick={openHistory}>历史记录</button><a href="#start">开始测试</a></nav> : <div className="nav-meta"><button className="nav-history" onClick={openHistory}>历史记录</button><span className="live-dot" /> AI PERSONALITY LAB <span>CN / 01</span></div>}</header>
    {screen === "home" && <>
      <section className="home-view hero-v2">
        <div className="hero-copy"><div className="eyebrow">MBTI TEST, BUILT FOR AI</div><h1>给 AI 测一次<br /><em>MBTI。</em></h1>
        <p className="intro"><strong>让 AI 看见自己的思考方式。</strong>通过任务情境观察它如何处理模糊需求、判断信息、回应反馈与推进项目，最终得到两个最相似的人格原型。</p>
        <div className="hero-proof"><span><b>04</b> 个偏好维度</span><span><b>16</b> 种人格原型</span><span><b>02</b> 个相似结果</span></div></div>
        <div className="setup-card single-setup" id="start"><div className="card-index">TEST CONSOLE <span>01 / 01</span></div><div className="agent-row single-agent">
          <label><span>输入参与测试的 AI 名称</span><input value={name} maxLength={16} onChange={(e) => setName(e.target.value.toUpperCase())} aria-label="AI 名称" /></label><span className="agent-status">SIGNAL READY</span>
        </div><div className="test-mode-label">选择测试深度</div><div className="mode-picker" aria-label="题目数量">{[{n:36,label:"标准识别",time:"约 10 分钟"},{n:48,label:"深度识别",time:"约 15 分钟"}].map(item => <button key={item.n} className={count === item.n ? "active" : ""} onClick={() => setCount(item.n)}><span><b>{item.n}</b> 题</span><small>{item.label} · {item.time}</small><i /></button>)}</div><button className="primary hero-cta" onClick={start}>开始人格扫描 <span>↗</span></button><p className="privacy-note">不保存答案 · 结果仅用于探索与娱乐</p></div>
        <div className="orbit" aria-hidden="true"><i /><i /><i /><b>?</b><strong>AI</strong></div>
      </section>

      <section className="atlas-section" id="atlas"><div className="section-heading"><div><span>16 / TYPE ATLAS</span><h2>十六种 AI，<br />十六种理解世界的方式。</h2></div><p>人格没有高低之分。每一种类型都是四组偏好的独特组合，也都有更擅长的任务环境。</p></div>
        <div className="type-filters"><span>分析者 · NT</span><span>外交家 · NF</span><span>守护者 · SJ</span><span>探险家 · SP</span></div>
        <div className="atlas-grid">{allTypes.map((type,index) => <article className={`atlas-card group-${typeGroups[type].group}`} key={type}><div className="atlas-top"><span>{String(index+1).padStart(2,"0")}</span><small>{typeGroups[type].group}</small></div><div className="atlas-image"><img src={`/mbti/${type.toLowerCase()}.svg`} alt={`${type} ${profiles[type].name}象征插画`} /></div><div className="atlas-code">{type}</div><h3>{profiles[type].name}</h3><p>{profiles[type].line}</p><div className="atlas-traits">{typeGroups[type].traits}</div></article>)}</div>
      </section>

      <footer className="site-footer"><div className="brand"><span className="brand-mark">A:</span> TYPE//SYNC</div><p className="footer-declaration">声明：本站依据 E–I、S–N、T–F、J–P 四组公开偏好维度，独立创作面向 AI 任务场景的问题；不是官方 MBTI® 测评，不用于心理诊断、招聘筛选或高风险决策。测试记录仅保存名称、题量、时间和两个结果，不保存逐题答案。</p><small>Illustrations by <a href="https://openmoji.org/" target="_blank" rel="noreferrer">OpenMoji</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a></small></footer>
    </>}
    {screen === "quiz" && <section className="quiz-view"><div className="quiz-top"><button className="text-button" onClick={() => step ? setStep(step - 1) : setScreen("home")}>← {step ? "上一题" : "退出"}</button><div className="progress"><span style={{width:`${((step+1)/count)*100}%`}} /></div><div className="counter"><b>{String(step+1).padStart(2,"0")}</b> / {count}</div></div>
      <div className="question-wrap"><div className="dimension">DIMENSION · {questions[step].dimension}</div><h2>{questions[step].text}</h2><div className="scale-labels"><span>{questions[step].left}</span><span>{questions[step].right}</span></div><div className="respondents"><div className="respondent single-respondent"><div className="respondent-name"><i /><span>{name || "YOUR AI"}</span><small>PERSONALITY SIGNAL</small></div><div className="scale">{([1,2,3,4,5] as Answer[]).map(n => <button key={n} onClick={() => choose(n)} className={currentAnswer === n ? "selected" : ""} aria-label={`选择 ${n}`}><span>{n}</span></button>)}</div></div></div><div className="scale-hint"><span>更接近左侧</span><span>无明显倾向</span><span>更接近右侧</span></div><button className="primary next" disabled={!currentAnswer} onClick={advance}>{step === count-1 ? "生成人格报告" : "下一题"}<span>→</span></button></div>
    </section>}
    {screen === "result" && <section className="result-view"><div className="result-kicker">PERSONALITY REPORT · {count} SIGNALS ANALYZED</div><h2>{name || "YOUR AI"} 最接近的<br />两种<em>人格原型。</em></h2>
      <div className="ranked-results">{result.map((item, index) => <article className={`rank-card rank-${index + 1}`} key={item.type}><div className="rank-label"><span>0{index + 1}</span><small>{index === 0 ? "最符合" : "同样可能"}</small></div><div className="result-portrait"><img src={`/mbti/${item.type.toLowerCase()}.svg`} alt="" /></div><div className="rank-type"><div className="type-code">{item.type}</div><h3>{profiles[item.type].name}</h3><p>{profiles[item.type].line}</p></div><div className="similarity"><div className="similarity-head"><span>人格相似度</span><strong>{item.match}<sup>%</sup></strong></div><div className="similarity-track"><i style={{width:`${item.match}%`}} /></div><small>{index === 0 ? "PRIMARY PERSONALITY MATCH" : "SECONDARY PERSONALITY MATCH"}</small></div></article>)}</div>
      <div className="insight"><span>TYPE INSIGHT</span><p>你的首选人格是 {result[0].type}，但在相邻维度上也呈现出 {result[1].type} 的特征。这两个百分比是分别计算的相似程度，因此不需要相加等于 100%。</p></div><div className="result-actions"><button className="secondary" onClick={openHistory}>查看历史</button><button className="secondary" onClick={() => setScreen("home")}>重新测试</button><button className="primary" onClick={() => window.print()}>保存报告 <span>↓</span></button></div>
    </section>}
    {screen === "history" && <section className="history-view"><div className="history-head"><div><span>LOCAL TEST ARCHIVE</span><h2>历史测试记录</h2><p>按当前设备区分，最多显示最近 20 次测试；不会保存逐题答案。</p></div><button className="secondary" onClick={() => setScreen("home")}>返回首页</button></div>{historyLoading ? <div className="history-empty">正在读取记录…</div> : history.length === 0 ? <div className="history-empty"><b>暂无记录</b><p>完成第一次人格扫描后，结果会出现在这里。</p><button className="primary" onClick={start}>开始测试 <span>↗</span></button></div> : <div className="history-list">{history.map((record,index) => <article key={record.id}><div className="history-index">{String(index+1).padStart(2,"0")}</div><div className="history-meta"><small>{new Date(`${record.createdAt.replace(" ", "T")}Z`).toLocaleString("zh-CN")}</small><h3>{record.aiName}</h3><p>{record.questionCount} 题深度 · 双结果报告</p></div><div className="history-types"><span><img src={`/mbti/${record.primaryType.toLowerCase()}.svg`} alt="" /><b>{record.primaryType}</b><strong>{record.primaryMatch}%</strong></span><i>+</i><span><img src={`/mbti/${record.secondaryType.toLowerCase()}.svg`} alt="" /><b>{record.secondaryType}</b><strong>{record.secondaryMatch}%</strong></span></div></article>)}</div>}</section>}
  </main>;
}
