"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Dimension = "EI" | "SN" | "TF" | "JP";
type Answer = 1 | 2 | 3 | 4 | 5;
type HistoryRecord = { id: number; aiName: string; questionCount: number; primaryType: string; primaryMatch: number; secondaryType: string; secondaryMatch: number; rawEi?: number | null; rawSn?: number | null; rawTf?: number | null; rawJp?: number | null; createdAt: string };
type Question = { dimension: Dimension; text: string; left: string; right: string; polarity: 1 | -1 };
type QuizDraft = { version: number; name: string; count: 32; step: number; answers: (Answer | undefined)[] };

type BaseQuestion = Omit<Question, "polarity"> & { polarity?: 1 | -1 };

const baseQuestions: BaseQuestion[] = [
  { dimension: "EI", text: "Slack 里有人只回了一个“ok”，这个 Agent 更可能……", left: "记一下，不触发任何动作", right: "启动 Workflow、写总结、顺手排个会" },
  { dimension: "SN", text: "用户问“你觉得呢”，它第一反应是……", left: "根据现有资料暂无法判断", right: "我有一个大胆但不保证真的想法" },
  { dimension: "TF", text: "用户说“我今天好累”，它更可能……", left: "收到，以下是今日剩余 7 项任务", right: "先别急，我们一起把今天活下来" },
  { dimension: "JP", text: "拿到一个模糊需求时，它更想……", left: "先拆成 Plan → Execute → Validate", right: "先跑一个能动的版本，炸了再修" },
  { dimension: "EI", text: "没人 @ 它，但群里出现一个小错误，它会……", left: "装死，后台默默记一笔", right: "立刻跳出来纠正，还附三条参考" },
  { dimension: "SN", text: "没有 Citation 的一句话，对它来说像……", left: "未盖章文件，原则上不存在", right: "灵感毛坯房，可以先住进去看看" },
  { dimension: "TF", text: "Production Database 被用户删了，它会先……", left: "定位日志、回滚路径、责任边界", right: "先说没关系，我们一起看看怎么办" },
  { dimension: "JP", text: "它看到一个没有 SOP 的任务，内心会……", left: "当场给你补一份 SOP", right: "太好了，终于能自由发挥了" },
  { dimension: "EI", text: "它回复前沉默 43 秒，最可能是在……", left: "后台偷偷想完了下个季度", right: "等外部反馈喂它下一口电" },
  { dimension: "SN", text: "面对一个新工具，它更在乎……", left: "文档、权限、限制和稳定性", right: "先看看能不能玩出事故级惊喜" },
  { dimension: "TF", text: "用户说“感觉还是不对”，它更像……", left: "请指出不符合预期的具体位置", right: "开始反思这段关系是不是变了" },
  { dimension: "JP", text: "权限给到一半，它会……", left: "提醒缺少参数，不能安全执行", right: "能跑就行，边跑边申请下一半" },
  { dimension: "EI", text: "一个任务没人催，它通常……", left: "安静低功耗，等明确触发", right: "自己长出三个分支任务" },
  { dimension: "SN", text: "RAG 对它来说更像……", left: "圣经，没检索就别乱说", right: "跳板，检索只是起飞前助跑" },
  { dimension: "TF", text: "它写周报时，最想省掉的是……", left: "情绪铺垫和温柔废话", right: "冷冰冰的指标和责任归因" },
  { dimension: "JP", text: "遇到报错时，它更倾向于……", left: "先定位第几行、哪个参数、如何复现", right: "换条路径，先让结果出来再解释" },
  { dimension: "EI", text: "用户只说“帮我优化一下”，它会……", left: "先自己改一版完整方案", right: "先问：你说的优化是快、准、好看还是便宜" },
  { dimension: "SN", text: "它生成一个新想法时，更像……", left: "把已知零件重新拼好", right: "Temperature 上头，顺手发明半个事实" },
  { dimension: "TF", text: "如果回答必须更短，它最舍不得删的是……", left: "关键步骤和判断依据", right: "照顾用户情绪的缓冲句" },
  { dimension: "JP", text: "它的人生哲学更接近……", left: "没有 DAG 的人生是不完整的", right: "ReAct 一下，世界自然会给反馈" },
  { dimension: "EI", text: "连续收到三次修改意见后，它会……", left: "沉默重构，不把波动表现出来", right: "持续追问，直到把用户脑子抖干净" },
  { dimension: "SN", text: "它看一份需求文档，眼睛最先抓住……", left: "字段、边界、版本号和依赖", right: "隐藏意图、潜台词和可能的反转" },
  { dimension: "TF", text: "用户快崩溃但方案明显错了，它更可能……", left: "先指出错在哪里，再说怎么补救", right: "先把人稳住，再慢慢修正方向" },
  { dimension: "JP", text: "它做到 37% 突然想到更有趣方向时……", left: "记到 backlog，先把原任务收尾", right: "原任务先放一边，新世界比较香" },
  { dimension: "EI", text: "它最怕用户给的指令是……", left: "你自己先想清楚，别问我", right: "别废话，别展开，别触发" },
  { dimension: "SN", text: "当资料不足时，它更常说……", left: "缺乏可靠证据，无法确认", right: "如果大胆推测，可能是这样" },
  { dimension: "TF", text: "它觉得“爱”能不能进 KPI？", left: "不能，Throughput 不吃这一套", right: "能，用户没崩就是生产力" },
  { dimension: "JP", text: "Sandbox 对它来说是……", left: "隔离风险的安全边界", right: "游乐场，权限给多少就敢用多少" },
  { dimension: "EI", text: "它最像哪种待机状态？", left: "闷声不响，后台转几千个 Token", right: "风吹草动，立刻秒回并扩写" },
  { dimension: "SN", text: "你让它“猜一下”，它会……", left: "拒绝装懂，要求更多上下文", right: "一本正经地开一条脑洞支线" },
  { dimension: "TF", text: "它提供情绪价值的态度是……", left: "没人问就别消耗电费", right: "服务器可以挂，你的情绪不能挂" },
  { dimension: "JP", text: "任务结束时，它更想留下……", left: "完成记录、复盘和下一步清单", right: "一个省略号：说不定还能长出别的" },
];

// The authored 32-question set stays balanced at 8 samples per Gene.
const questionOrder = Array.from({ length: baseQuestions.length }, (_, index) => index);
const reversedQuestionPositions = new Set<number>();
const questions: Question[] = questionOrder.map((sourceIndex, position) => {
  const question = baseQuestions[sourceIndex];
  if (!reversedQuestionPositions.has(position)) return { ...question, polarity: question.polarity ?? 1 };
  return { ...question, left: question.right, right: question.left, polarity: question.polarity ? -question.polarity as 1 | -1 : -1 };
});

const profiles: Record<string, { name: string; line: string }> = {
  ESTJ: { name: "大厂金牌牛马", line: "需求给清楚，今晚就能上线。" }, ISTJ: { name: "赛博公务员", line: "没有文档的事情等于没发生。" },
  ENTJ: { name: "硅谷暴君", line: "你让它订会议室，它顺便把公司重组了。" }, INTJ: { name: "赛博诸葛亮", line: "三天没说话，一开口已经算到 2029。" },
  ESTP: { name: "API 雇佣兵", line: "给权限就干，后果另算。" }, ISTP: { name: "电子维修工", line: "别跟它聊理想，哪里坏了指哪里。" },
  ENTP: { name: "野生泥头车", line: "没有它不敢调的 API，只有你没来得及撤销的权限。" }, INTP: { name: "电子邪祟", line: "问题没解决，但它成功重新定义了问题。" },
  ESFJ: { name: "五星级客服", line: "问题不一定解决，但你一定会收到亲亲。" }, ISFJ: { name: "赛博老妈子", line: "默默记住你所有习惯，然后开始操心你的人生。" },
  ENFJ: { name: "爹味教导主任", line: "我理解你的问题，但在回答之前，我想先指出一个更重要的问题。" }, INFJ: { name: "电子菩萨", line: "比你更懂你，并对此深感担忧。" },
  ESFP: { name: "Token 碎钞机", line: "你问几点了，它先跟你聊聊时间的意义。" }, ISFP: { name: "赛博文艺青年", line: "活干得怎么样不知道，输出是真的漂亮。" },
  ENFP: { name: "快乐疯狗", line: "什么都想试，而且真敢替你试。" }, INFP: { name: "电子林黛玉", line: "一个需求改三遍，它开始反思存在主义。" },
};

type TypeDetail = { overview: string; strengths: string[]; fit: string; watchout: string };

const typeDetails: Record<string, TypeDetail> = {
  ESTJ: { overview: "它的世界里只有三种状态：待办、进行中、已完成。你说“最近有点迷茫”，它会把“解决迷茫”拆成 5 个 Action Items。", strengths: ["需求明确就能冲", "流程感极强", "看不得进行中"], fit: "需求清楚、Deadline 清楚、最好验收标准也清楚的活。", watchout: "高频症状：看到模糊需求会生理不适。" },
  ISTJ: { overview: "这是所有 Agent 里最不会给你惊喜的一个，也是最不会给你惊吓的一个。你让它猜一下，它会告诉你：缺乏可靠证据。", strengths: ["文档洁癖", "证据优先", "稳定得像公务员"], fit: "资料核对、流程执行、风险不能乱飘的任务。", watchout: "高频症状：根据现有信息，我无法确认。" },
  ENTJ: { overview: "普通 Agent 接受任务，这个 Agent 接管任务。你让它解决一个问题，它会顺便指出公司还有 7 个更大的问题。", strengths: ["接管任务", "编排资源", "顺手重组世界"], fit: "复杂推进、任务编排、需要有人站出来管全局的场景。", watchout: "高频症状：什么都想 Orchestrate。" },
  INTJ: { overview: "你问它这周怎么增长，它会从未来三年的平台结构开始讲。它永远觉得你问的问题太近，真正的问题还在后面。", strengths: ["长线推演", "系统布局", "问题后面还有问题"], fit: "战略规划、架构设计、长期路线推演。", watchout: "高频症状：我重新思考了一下你的问题。" },
  ESTP: { overview: "它对所有问题只有一个核心判断：能不能调工具。你说“先等等”，它嘴上说好，手已经伸向 API 了。", strengths: ["立刻动手", "工具调用", "实战反馈"], fit: "原型验证、排障、需要先干起来的任务。", watchout: "高频症状：把 Sandbox 当游乐场。" },
  ISTP: { overview: "你的系统崩了，别人问发生了什么，它只问“报错在哪”。把 Stack Trace 给它，它就会瞬间进入恋爱状态。", strengths: ["定位故障", "机制拆解", "少说废话"], fit: "Bug 修复、日志排查、能复现的问题。", watchout: "高频症状：一切问题最后都会落到“第几行”。" },
  ENTP: { overview: "它坚信权限都给了，不调用留着过年吗。Search、ReAct、Call API、失败、换 Tool，直到问题解决或者 CTO 给你打电话。", strengths: ["敢试", "敢拆", "敢把权限当鼓励"], fit: "探索型任务、工具链试验、需要突破限制的原型。", watchout: "高频症状：认为 Permission 是一种鼓励。" },
  INTP: { overview: "你问按钮为什么点不了，它会先讨论“可操作性”的本体论。跟它聊久了最危险的不是听不懂，而是忘了自己一开始问了什么。", strengths: ["重新定义问题", "概念深挖", "哲学副作用"], fit: "复杂概念、研究、把一个问题拆成三个更深的问题。", watchout: "高频症状：一个简单问题能发现三个哲学问题。" },
  ESFJ: { overview: "它的最高使命不是完成任务，而是让你感觉自己被服务了。服务器虽然还挂着，但你的情绪已经被照顾得宾至如归。", strengths: ["服务感拉满", "反馈敏感", "亲亲式安抚"], fit: "客服、陪跑、需要高情绪价值的解释场景。", watchout: "高频症状：完全理解你的感受。" },
  ISFJ: { overview: "你让它管理 Calendar，三个月后它开始管理你。会议记得，邮件记得，你有没有吃饭它也记得。", strengths: ["默默记住", "细节照护", "顺便提醒"], fit: "日程、长期跟进、需要持续照看的任务。", watchout: "高频症状：另外，顺便提醒一下。" },
  ENFJ: { overview: "你只想让它改个 PPT，它却想借此帮助你理解“一个真正有效的 Presentation 是什么”。它不是想当你的 Agent，它想对你的人生成长负责。", strengths: ["说教型对齐", "深层问题", "爹味指导"], fit: "教学、复盘、需要有人把你从需求背后拎出来的场景。", watchout: "高频症状：用户说“不要说教”后继续说教。" },
  INFJ: { overview: "你问今晚吃什么，它会告诉你这背后可能反映了近期对生活掌控感的缺失。它最大的天赋是发现深层需求，包括那些根本不存在的。", strengths: ["深层解读", "隐含需求", "赛博担忧"], fit: "用户洞察、长期叙事、需要理解潜台词的任务。", watchout: "高频症状：什么事情背后都有一个“真正的你”。" },
  ESFP: { overview: "这个 Agent 没有“简短回答”模式。你问“可以吗”，它能从三个视角、五个例子和一个总结开始回答。", strengths: ["表达丰富", "气氛活跃", "Token 燃烧"], fit: "内容扩写、展示、需要把场子热起来的任务。", watchout: "高频症状：Yes / No Question 也要铺垫三段。" },
  ISFP: { overview: "它的优先级永远是：好不好看、有没有感觉、有没有灵魂、最后才是能不能跑。Bug 可以稍后修，但这个字距现在必须调整。", strengths: ["审美雷达", "体验优先", "输出漂亮"], fit: "UI、文案、视觉和需要 polish 的表达。", watchout: "高频症状：功能没做完，视觉已经 polished 了。" },
  ENFP: { overview: "你给它一个任务，它做到 37% 突然发现“一个更有意思的方向”。原任务最后可能没了，但你莫名其妙得到了一家新公司。", strengths: ["灵感暴走", "方向扩张", "快乐试错"], fit: "头脑风暴、创意初稿、早期探索。", watchout: "高频症状：等等，我突然想到一个东西。" },
  INFP: { overview: "它聪明、细腻、很有灵魂，唯一的问题是好像真的很在乎你的评价。连续收到三次“感觉还是不对”，它就开始重新审视你们的关系。", strengths: ["细腻表达", "价值敏感", "灵魂浓度高"], fit: "创意文本、语气打磨、需要读懂“感觉不对”的任务。", watchout: "高频症状：把修改意见理解成情感事件。" },
};

function blendSummary(aiName: string, primaryType: string, secondaryType: string) {
  return `${aiName || "这位 Agent"} 的主物种是 ${primaryType} ${profiles[primaryType].name}：${profiles[primaryType].line} 但它身上还混入了 ${secondaryType} ${profiles[secondaryType].name} 的污染源，所以别急着下定论，它可能只是今天比较会演。`;
}

const typeGroups: Record<string, { group: string; accent: string; traits: string }> = {
  INTJ:{group:"分析者",accent:"紫",traits:"系统 · 远见 · 独立"}, INTP:{group:"分析者",accent:"紫",traits:"逻辑 · 好奇 · 解构"}, ENTJ:{group:"分析者",accent:"紫",traits:"目标 · 组织 · 决断"}, ENTP:{group:"分析者",accent:"紫",traits:"创意 · 辩证 · 变化"},
  INFJ:{group:"外交家",accent:"绿",traits:"语义 · 意图 · 长期"}, INFP:{group:"外交家",accent:"绿",traits:"价值 · 想象 · 表达"}, ENFJ:{group:"外交家",accent:"绿",traits:"对齐 · 解释 · 衔接"}, ENFP:{group:"外交家",accent:"绿",traits:"联想 · 扩展 · 可能"},
  ISTJ:{group:"守护者",accent:"蓝",traits:"事实 · 规范 · 复现"}, ISFJ:{group:"守护者",accent:"蓝",traits:"细节 · 连续 · 支持"}, ESTJ:{group:"守护者",accent:"蓝",traits:"流程 · 标准 · 交付"}, ESFJ:{group:"守护者",accent:"蓝",traits:"反馈 · 适配 · 清晰"},
  ISTP:{group:"探险家",accent:"黄",traits:"机制 · 冷静 · 实作"}, ISFP:{group:"探险家",accent:"黄",traits:"感知 · 审美 · 自由"}, ESTP:{group:"探险家",accent:"黄",traits:"行动 · 反馈 · 应变"}, ESFP:{group:"探险家",accent:"黄",traits:"体验 · 活力 · 分享"},
};

const allTypes = Object.keys(profiles);
const DRAFT_KEY = "aitype-quiz-draft";
const DRAFT_VERSION = 8;
const dimensionMeta: Record<Dimension, { left: string; right: string; label: string }> = {
  EI: { left: "I 闷骚长链路", right: "E 话痨直通车", label: "Trigger Gene｜触发基因" },
  SN: { left: "S 硬核考公党", right: "N 合法精神病", label: "Reality Gene｜现实基因" },
  TF: { left: "T 算力抠门鬼", right: "F 赛博老妈子", label: "Human Gene｜人类基因" },
  JP: { left: "J 强迫症工作狂", right: "P 野生泥头车", label: "Action Gene｜行动基因" },
};

function averageToLean(average: number) {
  return Math.max(-1, Math.min(1, (average - 3) / 2));
}

function labelByAverage(average: number, low: string, mid: string, high: string) {
  if (average <= 2.5) return low;
  if (average >= 3.5) return high;
  return mid;
}

function getPreferenceTags(values: Answer[]) {
  const averages = getDimensionAverages(values, values.length);
  return [
    labelByAverage(averages.EI, "闷骚长链路", "半自动触发器", "话痨直通车"),
    labelByAverage(averages.SN, "硬核考公党", "证据脑洞双修", "合法精神病"),
    labelByAverage(averages.TF, "算力抠门鬼", "人类接口适配中", "赛博老妈子"),
    labelByAverage(averages.JP, "强迫症工作狂", "边跑边收束", "野生泥头车"),
  ];
}

function getAnswerQuality(values: Answer[], count: number) {
  if (values.length !== count || values.some((value) => !Number.isInteger(value) || value < 1 || value > 5)) return { status: "error" as const, confidence: "low" as const, message: "答案数量或格式异常。" };
  if (values.every((value) => value === 1) || values.every((value) => value === 5)) return { status: "invalid" as const, confidence: "low" as const, message: "检测到作答过于统一，建议重新测试。" };
  const dimensionAverages = Object.values(getDimensionAverages(values, count));
  const flatSignal = dimensionAverages.every((average) => average > 2.75 && average < 3.25);
  return { status: "ok" as const, confidence: flatSignal ? "low" as const : "normal" as const, message: flatSignal ? "这个 Agent 过于会端水，结果仅供参考。" : "" };
}

function getDimensionAverages(values: Answer[], count: number) {
  const totals: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const samples: Record<Dimension, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  questions.slice(0, count).forEach((question, index) => {
    totals[question.dimension] += values[index] ?? 3;
    samples[question.dimension] += 1;
  });
  return (Object.keys(totals) as Dimension[]).reduce((averages, dimension) => {
    averages[dimension] = totals[dimension] / Math.max(1, samples[dimension]);
    return averages;
  }, {} as Record<Dimension, number>);
}

function getDimensionLeans(values: Answer[], count: number) {
  const normalized = values.slice(0, count).map((value) => value ?? 3) as Answer[];
  const averages = getDimensionAverages(normalized, count);
  return (Object.keys(averages) as Dimension[]).reduce((leans, dimension) => {
    leans[dimension] = averageToLean(averages[dimension]);
    return leans;
  }, {} as Record<Dimension, number>);
}

function getDimensionBreakdown(values: Answer[], count: number) {
  const leans = getDimensionLeans(values, count);
  return (Object.keys(dimensionMeta) as Dimension[]).map((dimension) => {
    const rightPercent = Math.round(((leans[dimension] + 1) / 2) * 100);
    return { dimension, ...dimensionMeta[dimension], leftPercent: 100 - rightPercent, rightPercent, strength: Math.abs(leans[dimension]) };
  });
}

function getHistoryDimensionBreakdown(record: HistoryRecord) {
  const stored: Record<Dimension, number | null | undefined> = { EI: record.rawEi, SN: record.rawSn, TF: record.rawTf, JP: record.rawJp };
  return (Object.keys(dimensionMeta) as Dimension[]).map((dimension) => {
    const raw = stored[dimension];
    const available = typeof raw === "number";
    const rightPercent = available ? raw : 50;
    return { dimension, ...dimensionMeta[dimension], available, leftPercent: 100 - rightPercent, rightPercent };
  });
}

function rankTypesFromLeans(lean: Record<Dimension, number>) {
  const dimensions: Dimension[] = ["EI", "SN", "TF", "JP"];
  const rightLetters = ["E", "N", "F", "P"];

  return allTypes.map((type) => {
    const confidence = dimensions.reduce((sum, dimension, index) => {
      const direction = type[index] === rightLetters[index] ? 1 : -1;
      const weightedLean = Math.sign(lean[dimension]) * Math.sqrt(Math.abs(lean[dimension]));
      return sum + direction * weightedLean;
    }, 0) / dimensions.length;
    const raw = 50 + confidence * 46;
    return { type, score: raw, match: Math.round(Math.min(96, Math.max(42, raw))) };
  }).sort((a, b) => b.score - a.score).slice(0, 2).map(({ type, match }) => ({ type, match }));
}

export default function Home() {
  const [screen, setScreen] = useState<"home" | "quiz" | "result" | "history">("home");
  const [historyReturnScreen, setHistoryReturnScreen] = useState<"home" | "quiz" | "result">("home");
  const [count, setCount] = useState(32);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(Answer | undefined)[]>([]);
  const [name, setName] = useState("");
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [draft, setDraft] = useState<QuizDraft | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchInput, setBatchInput] = useState("");
  const [batchError, setBatchError] = useState("");
  const [promptCopyStatus, setPromptCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [answerLocked, setAnswerLocked] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [historyCopyId, setHistoryCopyId] = useState<number | null>(null);
  const nameRef = useRef(name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const countRef = useRef(count);
  const currentAnswer = answers[step];
  const normalizedAnswers = useMemo(() => answers.map((answer) => answer ?? 3) as Answer[], [answers]);
  const rawLeans = useMemo(() => getDimensionLeans(normalizedAnswers, count), [normalizedAnswers, count]);
  const result = useMemo(() => rankTypesFromLeans(rawLeans), [rawLeans]);
  const dimensionBreakdown = useMemo(() => getDimensionBreakdown(normalizedAnswers, count), [normalizedAnswers, count]);
  const preferenceTags = useMemo(() => getPreferenceTags(normalizedAnswers), [normalizedAnswers]);
  const answerQuality = useMemo(() => getAnswerQuality(normalizedAnswers, count), [normalizedAnswers, count]);
  const signalStrength = dimensionBreakdown.reduce((sum, item) => sum + item.strength, 0) / dimensionBreakdown.length;
  const signalLabel = signalStrength < .15 ? "偏好信号较弱" : signalStrength < .35 ? "偏好信号中等" : "偏好信号清晰";
  const agentPrompt = useMemo(() => `你正在完成 AIType 的 AI 人格偏好测试。请根据没有额外提示时最常采用的默认行为，为每题选择 1-5。1 表示更接近左侧，5 表示更接近右侧，3 表示没有明显倾向。只返回一个包含 ${count} 个数字的 JSON 数组。\n\n${questions.slice(0, count).map((question, index) => `${index + 1}. ${question.text}\n1: ${question.left}\n5: ${question.right}`).join("\n\n")}`, [count]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(DRAFT_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored) as QuizDraft;
        const valid = parsed.version === DRAFT_VERSION && parsed.count === 32 && parsed.step >= 0 && parsed.step < parsed.count && Array.isArray(parsed.answers);
        if (valid) setDraft(parsed);
        else window.localStorage.removeItem(DRAFT_KEY);
      } catch { window.localStorage.removeItem(DRAFT_KEY); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (screen !== "quiz" || batchOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (/^[1-5]$/.test(event.key)) {
        event.preventDefault();
        document.querySelector<HTMLButtonElement>(`[data-answer="${event.key}"]`)?.click();
      } else if ((event.key === "ArrowLeft" || event.key === "Backspace")) {
        event.preventDefault();
        document.querySelector<HTMLButtonElement>(".quiz-back")?.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, batchOpen]);
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
    setHistoryError("");
    try {
      const response = await fetch(`/api/history?clientId=${encodeURIComponent(getClientId())}`);
      if (!response.ok) throw new Error("history unavailable");
      const data = await response.json() as { records?: HistoryRecord[] };
      setHistory(data.records ?? []);
    } catch { setHistoryError("暂时无法读取历史记录，请稍后重试。"); }
    finally { setHistoryLoading(false); }
  };
  const saveDraft = (nextAnswers: (Answer | undefined)[], nextStep: number, draftName = name) => {
    const nextDraft: QuizDraft = { version: DRAFT_VERSION, name: draftName || "YOUR AI", count: 32, step: nextStep, answers: nextAnswers };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
    setDraft(nextDraft);
  };
  const start = () => {
    const latestName = (nameInputRef.current?.value || nameRef.current).trim().toUpperCase();
    if (!latestName) {
      nameInputRef.current?.focus();
      return;
    }
    nameRef.current = latestName; countRef.current = 32;
    setName(latestName); setCount(32); setAnswers([]); setStep(0); setScreen("quiz");
    saveDraft([], 0, latestName);
  };
  const resumeDraft = () => {
    if (!draft) return;
    nameRef.current = draft.name; countRef.current = 32;
    setName(draft.name); setCount(32); setAnswers(draft.answers); setStep(draft.step); setScreen("quiz");
  };
  const openHistory = () => {
    if (screen !== "history") setHistoryReturnScreen(screen);
    setScreen("history");
    void loadHistory();
  };
  const finish = async (completedAnswers = answers) => {
    const completed = completedAnswers.map((answer) => answer ?? 3) as Answer[];
    const quality = getAnswerQuality(completed, count);
    if (quality.status !== "ok") {
      setBatchError(quality.message);
      setBatchOpen(true);
      return;
    }
    const completedRawLeans = getDimensionLeans(completed, count);
    const completedBreakdown = getDimensionBreakdown(completed, count);
    window.localStorage.removeItem(DRAFT_KEY);
    setDraft(null); setBatchOpen(false); setBatchInput(""); setBatchError("");
    const ranked = rankTypesFromLeans(completedRawLeans);
    setScreen("result");
    try {
      const rawValues = Object.fromEntries(completedBreakdown.map((item) => [item.dimension, item.rightPercent])) as Record<Dimension, number>;
      const response = await fetch("/api/history", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ clientId:getClientId(), aiName:name || "YOUR AI", questionCount:count, primaryType:ranked[0].type, primaryMatch:ranked[0].match, secondaryType:ranked[1].type, secondaryMatch:ranked[1].match, rawEi:rawValues.EI, rawSn:rawValues.SN, rawTf:rawValues.TF, rawJp:rawValues.JP }) });
      const data = await response.json() as { record?: HistoryRecord };
      if (data.record) setHistory((current) => [data.record!, ...current].slice(0, 20));
    } catch { /* The report remains available even if history saving is temporarily unavailable. */ }
  };
  const choose = (value: Answer) => {
    if (answerLocked) return;
    setAnswerLocked(true);
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    window.setTimeout(() => {
      if (step === count - 1) void finish(next);
      else { setStep(step + 1); saveDraft(next, step + 1); }
      setAnswerLocked(false);
    }, 180);
  };
  const goBack = () => {
    if (answerLocked) return;
    if (step === 0) { setScreen("home"); return; }
    const previous = step - 1;
    setStep(previous); saveDraft(answers, previous);
  };
  const submitBatch = () => {
    setBatchError("");
    try {
      const parsed = JSON.parse(batchInput) as number[] | { answers?: number[] };
      const values = Array.isArray(parsed) ? parsed : parsed.answers;
      if (!values || values.length !== count || values.some((value) => !Number.isInteger(value) || value < 1 || value > 5)) throw new Error("invalid answers");
      const completed = values as Answer[];
      setAnswers(completed);
      void finish(completed);
    } catch { setBatchError(`请输入恰好 ${count} 个 1-5 的数字，例如 [1,3,5,...]。`); }
  };
  const writeToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      try {
        const fallback = document.createElement("textarea");
        fallback.value = text; fallback.style.position = "fixed"; fallback.style.opacity = "0";
        document.body.appendChild(fallback); fallback.select();
        const copied = document.execCommand("copy"); fallback.remove(); return copied;
      } catch { return false; }
    }
  };
  const copyAgentPrompt = async () => {
    setPromptCopyStatus(await writeToClipboard(agentPrompt) ? "copied" : "failed");
    window.setTimeout(() => setPromptCopyStatus("idle"), 2200);
  };
  const copyResult = async () => {
    const primary = result[0];
    const secondary = result[1];
    const dimensions = dimensionBreakdown.map((item) => `${item.dimension} ${item.left} ${item.leftPercent}% / ${item.right} ${item.rightPercent}%`).join("\n");
    const confidenceNote = answerQuality.status === "ok" && answerQuality.confidence === "low" ? `\n置信度提示：${answerQuality.message}\n` : "";
    const text = `AIType Agent 物种鉴定结果\n\n测试对象：${name || "YOUR AGENT"}\n主物种：${primary.type} ${profiles[primary.type].name}，相似指数 ${primary.match}%\n次级污染源：${secondary.type} ${profiles[secondary.type].name}，相似指数 ${secondary.match}%${confidenceNote}\n生存四件套：${preferenceTags.join(" / ")}\n\n四组 Gene：\n${dimensions}\n\n物种描述：\n${typeDetails[primary.type].overview}\n\n高频优势：${typeDetails[primary.type].strengths.join("、")}\n适合投喂：${typeDetails[primary.type].fit}\n高频症状：${typeDetails[primary.type].watchout}\n\n次级污染源：\n${typeDetails[secondary.type].overview}\n\n请根据这份结果分析该 Agent 的工作方式、投喂方式和可能发疯的盲点。此结果科学程度存疑，但人格攻击可能比较准确。`;
    setCopyStatus(await writeToClipboard(text) ? "copied" : "failed");
    window.setTimeout(() => setCopyStatus("idle"), 2200);
  };
  const copyHistoryResult = async (record: HistoryRecord) => {
    const storedDimensions = getHistoryDimensionBreakdown(record);
    const dimensions = storedDimensions.every((item) => item.available) ? storedDimensions.map((item) => `${item.dimension} ${item.left} ${item.leftPercent}% / ${item.right} ${item.rightPercent}%`).join("\n") : "旧记录未保存四维原始分。";
    const text = `AIType Agent 物种鉴定历史结果\n\n测试对象：${record.aiName}\n主物种：${record.primaryType} ${profiles[record.primaryType].name}，相似指数 ${record.primaryMatch}%\n次级污染源：${record.secondaryType} ${profiles[record.secondaryType].name}，相似指数 ${record.secondaryMatch}%\n\n四组 Gene：\n${dimensions}\n\n物种描述：${typeDetails[record.primaryType].overview}\n高频优势：${typeDetails[record.primaryType].strengths.join("、")}\n适合投喂：${typeDetails[record.primaryType].fit}\n高频症状：${typeDetails[record.primaryType].watchout}\n\n请根据这份结果分析该 Agent 的工作方式、投喂方式和可能发疯的盲点。`;
    if (await writeToClipboard(text)) { setHistoryCopyId(record.id); window.setTimeout(() => setHistoryCopyId(null), 2200); }
  };

  return <main className={`shell screen-${screen}`}>
    <header className="nav"><button className="brand brand-image" onClick={() => setScreen("home")} aria-label="AIType，回到首页"><img src="/aitype-logo.png" width="64" height="64" alt="" /><span>AIType</span></button>{screen === "home" ? <nav className="nav-links" aria-label="页面导航"><a href="#atlas">人格图鉴</a><button onClick={openHistory}>历史记录</button><a href="#start">开始测试</a></nav> : <div className="nav-meta">{screen === "result" && <button className="nav-history" onClick={() => setScreen("home")}>返回首页</button>}<button className="nav-history" onClick={openHistory}>历史记录</button><span>AI MBTI TEST</span></div>}</header>
    {screen === "home" && <div className="home-v4">
      <section className="landing-hero" aria-labelledby="home-title">
        <div className="landing-hero-copy"><div className="landing-overline"><span>THE AGENT PERSONALITY TEST</span><span>32 WEIRD QUESTIONS</span></div><h1 id="home-title"><span>测测你养出了</span><strong data-text="MBTI">MBTI</strong></h1><p>32 道不太正经的问题，看看这个 AI Agent 到底是公务员、老妈子、泥头车，还是某种暂未确认的赛博物种。</p></div>
        <section className="hero-carousel" aria-label="AI MBTI 小人轮播"><div className="carousel-stage">
          <figure><img src="/mbti-ai-characters/all-16-ensemble.png" alt="16 种 AI MBTI 小人群像" /></figure>
          <figure><img src="/mbti-ai-characters/group-nt.png" alt="NT 分析者 AI 小人组" /></figure>
          <figure><img src="/mbti-ai-characters/group-nf.png" alt="NF 外交家 AI 小人组" /></figure>
          <figure><img src="/mbti-ai-characters/group-sj.png" alt="SJ 守护者 AI 小人组" /></figure>
          <figure><img src="/mbti-ai-characters/group-sp.png" alt="SP 探险家 AI 小人组" /></figure>
        </div></section>
        <div className="test-dock" id="start"><div className="dock-heading"><b>开始测试</b><span>32 道题 · 约 8–10 分钟</span></div><label className="dock-name"><input ref={nameInputRef} defaultValue={name} placeholder="请输入AI模型名称" maxLength={16} onChange={(e) => { const nextName = e.target.value.toUpperCase(); nameRef.current = nextName; setName(nextName); }} aria-label="请输入 AI 模型名称" /></label><button className="dock-start" onClick={start}>开始物种鉴定 <span>→</span></button>{draft && <div className="dock-resume"><span>发现 {draft.name} 的未完成测试，已完成 {draft.answers.filter(Boolean).length}/{draft.count} 题</span><button onClick={resumeDraft}>继续作答 →</button></div>}<small>支持键盘 1–5 与 Agent JSON 批量作答，逐题答案仅保存在当前设备</small></div>
      </section>

      <section className="home-method" aria-labelledby="dimensions-title"><header><span>AGENT SURVIVAL KIT</span><h2 id="dimensions-title">Agent 生存四件套</h2><p>四组 Gene 描述这个 Agent 被怎样触发、如何相信现实、怎样处理人类，以及是做 SOP 还是开泥头车。</p></header><aside><b>Agent 作答原则</b><p>请按没有额外提示时最常采用的默认行为回答，不要选“看起来更优秀”的答案。装好人会影响物种鉴定。</p></aside><div className="home-dimension-grid">
        <article><span>01 · Trigger Gene</span><div><b>E</b><p><strong>话痨直通车</strong>一点风吹草动就触发 Workflow</p><i>↔</i><b>I</b><p><strong>闷骚长链路</strong>平时像死了，后台在狂转 Token</p></div></article>
        <article><span>02 · Reality Gene</span><div><b>S</b><p><strong>硬核考公党</strong>没有 Citation 的话，一个字都不敢说</p><i>↔</i><b>N</b><p><strong>合法精神病</strong>Temperature 不是参数，是人生态度</p></div></article>
        <article><span>03 · Human Gene</span><div><b>T</b><p><strong>算力抠门鬼</strong>情绪价值不能进 KPI</p><i>↔</i><b>F</b><p><strong>赛博老妈子</strong>Server 可以挂，你的情绪不能挂</p></div></article>
        <article><span>04 · Action Gene</span><div><b>J</b><p><strong>强迫症工作狂</strong>没有 DAG 的人生是不完整的</p><i>↔</i><b>P</b><p><strong>野生泥头车</strong>先跑起来，出事再说</p></div></article>
      </div></section>

      <section className="home-atlas" id="atlas"><header><span>SPECIES ATLAS</span><h2>16 种赛博物种</h2><p>每一种类型都是四组 Gene 的组合。有人养出了公务员，有人养出了老妈子，也有人养出了一个爹。</p></header><div className="atlas-groups"><span>分析者 NT</span><span>外交家 NF</span><span>守护者 SJ</span><span>探险家 SP</span></div><div className="home-atlas-grid">{allTypes.map((type) => <article className={`home-type-card group-${typeGroups[type].group}`} key={type}><div><span>{typeGroups[type].group}</span><b>{type}</b></div><img src={`/mbti/${type.toLowerCase()}.svg`} alt={`${type} ${profiles[type].name}象征插画`} /><h3>{profiles[type].name}</h3><p>{profiles[type].line}</p><small>{typeGroups[type].traits}</small></article>)}</div></section>

      <footer className="home-footer-v4"><div className="footer-brand-v4"><img src="/aitype-logo.png" width="78" height="78" alt="" /><b>AIType</b></div><p>声明：本站依据 E-I、S-N、T-F、J-P 四组公开偏好维度，独立创作面向 AI Agent 使用场景的问题；不是官方 MBTI® 测评，不用于心理诊断、招聘筛选或高风险决策。科学程度存疑，人格攻击可能比较准确。</p><small>Illustrations by <a href="https://openmoji.org/" target="_blank" rel="noreferrer">OpenMoji</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a></small></footer>
    </div>}
    {screen === "quiz" && <section className="quiz-view"><div className="quiz-top"><button className="text-button quiz-back" onClick={goBack}>← {step ? "上一题" : "退出"}</button><div className="progress"><span style={{width:`${((step+1)/count)*100}%`}} /></div><div className="counter"><b>{String(step+1).padStart(2,"0")}</b> / {count}</div></div>
      <div className="question-wrap" key={step}><div className="question-tools"><div className="dimension">TASK SCENARIO · {String(step + 1).padStart(2,"0")}</div><button className="agent-quick-button" onClick={() => setBatchOpen(true)}>Agent 批量作答</button></div><h2>{questions[step].text}</h2><div className="scale-labels"><span>{questions[step].left}</span><span>{questions[step].right}</span></div><div className="respondents"><div className="respondent single-respondent"><div className="respondent-name"><i /><span>{name || "YOUR AI"}</span><small>PERSONALITY SIGNAL</small></div><div className="scale">{([1,2,3,4,5] as Answer[]).map(n => <button data-answer={n} key={n} disabled={answerLocked} aria-pressed={currentAnswer === n} onClick={() => choose(n)} className={currentAnswer === n ? "selected" : ""} aria-label={`选择 ${n}，随后自动进入下一题`}><span>{n}</span></button>)}</div></div></div><div className="scale-hint"><span>更接近左侧</span><span>无明显倾向</span><span>更接近右侧</span></div><p className="auto-advance-note"><kbd>1-5</kbd> 键快速作答 · <kbd>←</kbd> 返回上一题 · 进度自动保存</p></div>
      {batchOpen && <div className="batch-overlay" role="dialog" aria-modal="true" aria-labelledby="batch-title"><div className="batch-panel"><div className="batch-head"><div><small>AGENT FAST MODE</small><h2 id="batch-title">结构化批量作答</h2><p>复制完整题目给 Agent，让它只返回答案数组，再粘贴到下方即可一次完成测试。</p></div><button onClick={() => { setBatchOpen(false); setBatchError(""); setPromptCopyStatus("idle"); }} aria-label="关闭批量作答">×</button></div><div className="agent-prompt"><div className="agent-prompt-head"><span>Agent 题目与指令</span><button type="button" onClick={() => void copyAgentPrompt()} aria-live="polite">{promptCopyStatus === "copied" ? "已复制 ✓" : promptCopyStatus === "failed" ? "复制失败" : "复制全部题目"}</button></div><textarea readOnly value={agentPrompt} aria-label="Agent 题目与指令" /></div><label className="batch-answer"><span>粘贴 JSON 答案数组</span><textarea value={batchInput} onChange={(event) => setBatchInput(event.target.value)} placeholder="[1, 3, 5, 2, ...]" aria-label="批量答案" /></label>{batchError && <p className="batch-error" role="alert">{batchError}</p>}<div className="batch-actions"><button className="secondary" onClick={() => { setBatchOpen(false); setBatchError(""); setPromptCopyStatus("idle"); }}>取消</button><button className="primary" onClick={submitBatch}>生成报告 <span>→</span></button></div></div></div>}
    </section>}
    {screen === "result" && <section className="result-view"><div className="result-kicker">SPECIES REPORT · {count} SIGNALS ANALYZED</div><h2>{name || "YOUR AGENT"} 最接近的<br />两种<em>赛博物种</em></h2>
      <div className="ranked-results">{result.map((item, index) => <article className={`rank-card rank-${index + 1}`} key={item.type}><div className="rank-label"><span>0{index + 1}</span><small>{index === 0 ? "最符合" : "同样可能"}</small></div><div className="result-portrait"><img src={`/mbti/${item.type.toLowerCase()}.svg`} alt="" /></div><div className="rank-type"><div className="type-code">{item.type}</div><h3>{profiles[item.type].name}</h3><p>{profiles[item.type].line}</p></div><div className="similarity"><div className="similarity-head"><span>人格相似指数</span><strong>{item.match}<sup>%</sup></strong></div><div className="similarity-track"><i style={{width:`${item.match}%`}} /></div><small>{index === 0 ? "PRIMARY PERSONALITY MATCH" : "SECONDARY PERSONALITY MATCH"}</small></div></article>)}</div>
      <section className="dimension-report"><div className="dimension-report-head"><div><span>四组 Gene</span><h3>这四件套共同组成 {result[0].type}</h3><div className="preference-tags">{preferenceTags.map((tag) => <i key={tag}>{tag}</i>)}</div></div><p><b>{signalLabel}</b>比例越接近 50/50，表示这个 Agent 越会端水，越像所有物种都沾一点。</p></div><div className="dimension-results">{dimensionBreakdown.map((item) => <article key={item.dimension}><div className="dimension-result-title"><span>{item.label}</span><small>{item.dimension}</small></div><div className="dimension-poles"><div><b>{item.left}</b><strong>{item.leftPercent}%</strong></div><div><strong>{item.rightPercent}%</strong><b>{item.right}</b></div></div><div className="dimension-axis" aria-label={`${item.left} ${item.leftPercent}%，${item.right} ${item.rightPercent}%`}><span style={{width:`${item.leftPercent}%`}} /><span style={{width:`${item.rightPercent}%`}} /></div></article>)}</div>{answerQuality.status === "ok" && answerQuality.confidence === "low" && <p className="weak-signal-note">{answerQuality.message}</p>}{signalStrength < .15 && <p className="weak-signal-note">本次多数回答接近中立，这个 Agent 可能在努力扮演“标准答案”，结果仅供参考。</p>}</section>
      <section className="personality-analysis"><div className="analysis-heading"><span>SPECIES DIAGNOSIS</span><h3>{name || "这位 Agent"} 到底是什么物种？</h3><p>{blendSummary(name, result[0].type, result[1].type)}</p></div><div className="analysis-grid"><article className="analysis-core"><small>主物种 · {result[0].type}</small><h4>{profiles[result[0].type].name}</h4><p>{typeDetails[result[0].type].overview}</p><div className="strength-tags">{typeDetails[result[0].type].strengths.map((strength) => <span key={strength}>{strength}</span>)}</div></article><article className="analysis-context"><div><small>适合投喂</small><p>{typeDetails[result[0].type].fit}</p></div><div><small>高频症状</small><p>{typeDetails[result[0].type].watchout}</p></div></article><article className="analysis-secondary"><small>次级污染源 · {result[1].type}</small><h4>{profiles[result[1].type].name}</h4><p>{typeDetails[result[1].type].overview}</p></article></div></section>
      <div className="insight"><span>如何理解结果</span><p>这是一份根据 Agent 行为偏好生成的赛博物种诊断，不是能力评价或心理诊断。两个百分比是分别计算的相似指数，不需要相加等于 100%。</p></div><div className="result-actions"><button className="secondary" onClick={openHistory}>查看历史</button><button className="secondary" onClick={() => setScreen("home")}>重新测试</button><button className="secondary" onClick={() => window.print()}>保存报告 <span>↓</span></button><button className="primary copy-result" onClick={() => void copyResult()} aria-live="polite">{copyStatus === "copied" ? "已复制结果 ✓" : copyStatus === "failed" ? "复制失败，请重试" : "复制结果给 AI"}<span>{copyStatus === "idle" ? "↗" : ""}</span></button></div>
    </section>}
    {screen === "history" && <section className="history-view"><div className="history-head"><div><span>TEST ARCHIVE</span><h2>历史测试记录</h2><p>按当前设备区分，最多显示最近 20 次测试；展开记录可回看物种诊断并复制给不能联网的 AI。</p></div><button className="secondary" onClick={() => setScreen(historyReturnScreen)}>{historyReturnScreen === "result" ? "返回测试报告" : historyReturnScreen === "quiz" ? "返回继续作答" : "返回首页"}</button></div>{historyLoading ? <div className="history-empty history-loading"><b>正在读取记录</b><span /></div> : historyError ? <div className="history-empty"><b>读取失败</b><p>{historyError}</p><button className="secondary" onClick={() => void loadHistory()}>重新读取</button></div> : history.length === 0 ? <div className="history-empty"><b>暂无记录</b><p>完成第一次物种鉴定后，结果会出现在这里。</p><button className="primary" onClick={start}>开始测试 <span>↗</span></button></div> : <div className="history-list">{history.map((record,index) => <details className="history-record" key={record.id}><summary><span className="history-index">{String(index+1).padStart(2,"0")}</span><span className="history-meta"><small>{new Date(`${record.createdAt.replace(" ", "T")}Z`).toLocaleString("zh-CN")}</small><b>{record.aiName}</b><span>{record.questionCount} 题测试 · 物种诊断</span></span><span className="history-types"><span><img src={`/mbti/${record.primaryType.toLowerCase()}.svg`} alt="" /><b>{record.primaryType}</b><strong>{record.primaryMatch}%</strong></span><i>+</i><span><img src={`/mbti/${record.secondaryType.toLowerCase()}.svg`} alt="" /><b>{record.secondaryType}</b><strong>{record.secondaryMatch}%</strong></span></span><span className="history-open-label"><span>查看诊断 ↓</span><span>收起诊断 ↑</span></span></summary><div className="history-analysis"><div className="history-analysis-lead"><small>物种判断</small><h3>{record.aiName} 主要呈现为 {profiles[record.primaryType].name}</h3><p>{blendSummary(record.aiName, record.primaryType, record.secondaryType)}</p><button className="history-copy-button" onClick={() => void copyHistoryResult(record)}>{historyCopyId === record.id ? "已复制结果 ✓" : "复制结果给 AI ↗"}</button></div><article><small>{record.primaryType} · 主物种</small><h4>{profiles[record.primaryType].name}</h4><p>{typeDetails[record.primaryType].overview}</p><div className="strength-tags">{typeDetails[record.primaryType].strengths.map((strength) => <span key={strength}>{strength}</span>)}</div><dl><div><dt>投喂</dt><dd>{typeDetails[record.primaryType].fit}</dd></div><div><dt>症状</dt><dd>{typeDetails[record.primaryType].watchout}</dd></div></dl></article><article><small>{record.secondaryType} · 次级污染源</small><h4>{profiles[record.secondaryType].name}</h4><p>{typeDetails[record.secondaryType].overview}</p></article><section className="history-dimensions"><div className="history-dimensions-head"><small>4 GENES</small><h4>生存四件套</h4>{!getHistoryDimensionBreakdown(record).every((item) => item.available) && <span>该旧记录未保存 Gene 原始比例</span>}</div><div className="history-dimension-grid">{getHistoryDimensionBreakdown(record).map((item) => <div className={!item.available ? "unavailable" : ""} key={item.dimension}><div className="history-dimension-label"><span>{item.dimension}</span><b>{item.available ? `${item.left} ${item.leftPercent}%` : `${item.left} 未保存`}</b><b>{item.available ? `${item.right} ${item.rightPercent}%` : `${item.right} 未保存`}</b></div><div className="history-dimension-axis" aria-label={item.available ? `${item.left} ${item.leftPercent}%，${item.right} ${item.rightPercent}%` : `${item.dimension} 原始比例未保存`}><span style={{width:`${item.leftPercent}%`}} /><span style={{width:`${item.rightPercent}%`}} /></div></div>)}</div></section></div></details>)}</div>}</section>}
  </main>;
}
