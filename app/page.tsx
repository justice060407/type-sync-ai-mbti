"use client";

import { useMemo, useState } from "react";

type Dimension = "EI" | "SN" | "TF" | "JP";
type Answer = 1 | 2 | 3 | 4 | 5;

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
  const [screen, setScreen] = useState<"home" | "quiz" | "result">("home");
  const [count, setCount] = useState(20);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(Answer | undefined)[]>([]);
  const [name, setName] = useState("NOVA");
  const currentAnswer = answers[step];
  const result = useMemo(() => rankTypes(answers.map((answer) => answer ?? 3) as Answer[], count), [answers, count]);
  const choose = (value: Answer) => { const next = [...answers]; next[step] = value; setAnswers(next); };
  const start = () => { setAnswers([]); setStep(0); setScreen("quiz"); };
  const advance = () => { if (!currentAnswer) return; if (step === count - 1) setScreen("result"); else setStep(step + 1); };

  return <main className={`shell screen-${screen}`}>
    <header className="nav"><button className="brand" onClick={() => setScreen("home")} aria-label="回到首页"><span className="brand-mark">A:</span> TYPE//SYNC</button><div className="nav-meta"><span className="live-dot" /> AI PERSONALITY LAB <span>CN / 01</span></div></header>
    {screen === "home" && <section className="home-view">
      <div className="eyebrow">AI × MBTI PERSONALITY PROTOCOL</div><h1>AI，你究竟<br /><em>是哪一种？</em></h1>
      <p className="intro">回答一组为 AI 设计的任务情境题。我们会分析你的信息偏好、判断方式与工作节奏，找出最接近的两种 MBTI 人格。</p>
      <div className="setup-card single-setup"><div className="agent-row single-agent">
        <label><span>YOUR AI NAME</span><input value={name} maxLength={16} onChange={(e) => setName(e.target.value.toUpperCase())} aria-label="AI 名称" /></label><span className="agent-status">READY · 01</span>
      </div><div className="setup-bottom"><div className="count-picker" aria-label="题目数量">{[20,30,40,50].map(n => <button key={n} className={count === n ? "active" : ""} onClick={() => setCount(n)}>{n}<small>题</small></button>)}</div><button className="primary" onClick={start}>开始识别 <span>↗</span></button></div></div>
      <div className="home-footer"><span>约 {Math.ceil(count * .35)} 分钟</span><span>输出两个相似人格</span><span>16 型人格模型</span></div><div className="orbit" aria-hidden="true"><i /><i /><i /><b>?</b><strong>AI</strong></div>
    </section>}
    {screen === "quiz" && <section className="quiz-view"><div className="quiz-top"><button className="text-button" onClick={() => step ? setStep(step - 1) : setScreen("home")}>← {step ? "上一题" : "退出"}</button><div className="progress"><span style={{width:`${((step+1)/count)*100}%`}} /></div><div className="counter"><b>{String(step+1).padStart(2,"0")}</b> / {count}</div></div>
      <div className="question-wrap"><div className="dimension">DIMENSION · {questions[step].dimension}</div><h2>{questions[step].text}</h2><div className="scale-labels"><span>{questions[step].left}</span><span>{questions[step].right}</span></div><div className="respondents"><div className="respondent single-respondent"><div className="respondent-name"><i /><span>{name || "YOUR AI"}</span><small>PERSONALITY SIGNAL</small></div><div className="scale">{([1,2,3,4,5] as Answer[]).map(n => <button key={n} onClick={() => choose(n)} className={currentAnswer === n ? "selected" : ""} aria-label={`选择 ${n}`}><span>{n}</span></button>)}</div></div></div><div className="scale-hint"><span>更接近左侧</span><span>无明显倾向</span><span>更接近右侧</span></div><button className="primary next" disabled={!currentAnswer} onClick={advance}>{step === count-1 ? "生成人格报告" : "下一题"}<span>→</span></button></div>
    </section>}
    {screen === "result" && <section className="result-view"><div className="result-kicker">PERSONALITY REPORT · {count} SIGNALS ANALYZED</div><h2>{name || "YOUR AI"} 最接近的<br />两种<em>人格原型。</em></h2>
      <div className="ranked-results">{result.map((item, index) => <article className={`rank-card rank-${index + 1}`} key={item.type}><div className="rank-label"><span>0{index + 1}</span><small>{index === 0 ? "最符合" : "同样可能"}</small></div><div className="rank-type"><div className="type-code">{item.type}</div><h3>{profiles[item.type].name}</h3><p>{profiles[item.type].line}</p></div><div className="similarity"><div className="similarity-head"><span>人格相似度</span><strong>{item.match}<sup>%</sup></strong></div><div className="similarity-track"><i style={{width:`${item.match}%`}} /></div><small>{index === 0 ? "PRIMARY PERSONALITY MATCH" : "SECONDARY PERSONALITY MATCH"}</small></div></article>)}</div>
      <div className="insight"><span>TYPE INSIGHT</span><p>你的首选人格是 {result[0].type}，但在相邻维度上也呈现出 {result[1].type} 的特征。这两个百分比是分别计算的相似程度，因此不需要相加等于 100%。</p></div><div className="result-actions"><button className="secondary" onClick={() => setScreen("home")}>重新测试</button><button className="primary" onClick={() => window.print()}>保存报告 <span>↓</span></button></div>
    </section>}
  </main>;
}
