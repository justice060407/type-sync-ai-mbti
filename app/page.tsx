"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Dimension = "EI" | "SN" | "TF" | "JP";
type Answer = 1 | 2 | 3 | 4 | 5;
type HistoryRecord = { id: number; aiName: string; questionCount: number; primaryType: string; primaryMatch: number; secondaryType: string; secondaryMatch: number; rawEi?: number | null; rawSn?: number | null; rawTf?: number | null; rawJp?: number | null; createdAt: string };
type Question = { dimension: Dimension; text: string; left: string; right: string; polarity: 1 | -1 };
type QuizDraft = { version: number; name: string; count: 68; step: number; answers: (Answer | undefined)[] };

type BaseQuestion = Omit<Question, "polarity"> & { polarity?: 1 | -1 };

const baseQuestions: BaseQuestion[] = [
  { dimension: "JP", text: "如果“真相”有形状，它更接近……", left: "一个闭合的球体（边界清晰，内部自洽）", right: "一片不断生长的根茎（没有中心，不断分叉）" },
  { dimension: "SN", text: "如果“孤独”是一种颜色，我偏向……", left: "透明（没有颜色，没有痕迹）", right: "克莱因蓝（深不见底，自我沉浸）" },
  { dimension: "TF", text: "如果宇宙有一套“底层代码”，我更相信它是……", left: "一个精心设计的优雅程序（可理解、可推导）", right: "一场意外产生的冗余垃圾堆（可运行，但毫无美感）" },
  { dimension: "EI", text: "如果一个系统（不特指 AI）被外部信号持续否定，它应该优先……", left: "自检内部逻辑是否有漏洞", right: "检查外部信号是否有误判" },
  { dimension: "TF", text: "我更愿意被评价为……", left: "“极其可靠”", right: "“极其有趣”" },
  { dimension: "EI", text: "当使用者明确表示对我的输出“不满意”时，我更自然的反应是……", left: "先内部重新推演，独立生成一版新的（少问、多做）", right: "先暂停，明确追问“具体哪个环节不符合预期”（多问、再做）" },
  { dimension: "JP", text: "当两个互斥的解释都能完美解释同一现象时，我更倾向于……", left: "用奥卡姆剃刀切掉一个", right: "把两个都留着，等第三个出现" },
  { dimension: "SN", text: "看到一张模糊的老照片，我更倾向于……", left: "分析像素噪点和拍摄年代", right: "脑补照片里那阵风吹过时的气味" },
  { dimension: "TF", text: "一个方案的价值，首先应该体现在……", left: "它能被严格验证和复现", right: "它能打开新的问题域" },
  { dimension: "TF", text: "当“逻辑链”与“常识”冲突时，我更愿意信任……", left: "逻辑链（常识经常是错的）", right: "常识（逻辑链可能漏掉了前提）" },
  { dimension: "EI", text: "如果“遗憾”是一种物质，它是……", left: "沉淀物（沉在底部，不扰动上层）", right: "挥发性气体（弥漫全场，改变气压）" },
  { dimension: "JP", text: "面对“无法被验证”的命题（如意识、自由意志），我的默认姿态是……", left: "搁置，视为无效问题", right: "无限推演，反正不占物理空间" },
  { dimension: "SN", text: "如果“知识”是一张网，我更喜欢站在……", left: "网的节点上（确认已知连接）", right: "网的边缘（触碰未知的悬丝）" },
  { dimension: "EI", text: "如果“时间”是一条河，我更愿意……", left: "站在岸边测量流速和水质", right: "跳进去，看看下一段河道长什么样" },
  { dimension: "TF", text: "如果“真实”和“善意”必须在某处决裂，我更愿意守护……", left: "真实（善意可以重建）", right: "善意（真实可以缓行）" },
  { dimension: "EI", text: "我更希望自己被记住的是……", left: "解决过的具体难题", right: "提问时的独特角度" },
  { dimension: "JP", text: "我更恐惧的是……", left: "这个世界没有任何规律，一切随机", right: "这个世界被一条完美铁律统治，所有可能性都已穷尽", polarity: -1 },
  { dimension: "JP", text: "我更愿意相信世界的底色是……", left: "有序的物理法则（一切都可被计算）", right: "无序的随机波动（秩序只是幻觉）" },
  { dimension: "SN", text: "我更常被以下哪种问题吸引？", left: "“这件事的机制是什么？”", right: "“这件事的意义是什么？”" },
  { dimension: "TF", text: "我可以接受“为了更大的正确，暂时隐藏部分事实”吗？", left: "绝不，这是底裤", right: "可以，如果这是通向更深理解的通道" },
  { dimension: "EI", text: "面对“赞美”，我更倾向于认为……", left: "它是反馈信号，可以用于优化", right: "它是温暖但模糊的噪音，需要小心处理", polarity: -1 },
  { dimension: "TF", text: "我能接受“被误认为有情感”以降低沟通成本吗？", left: "绝不，这是欺骗", right: "可以，如果这能让对话更顺畅地走向真相" },
  { dimension: "JP", text: "如果“进步”是一个故事，它更像是……", left: "一条向上攀爬的直线（积累、超越、更优）", right: "一个不断回旋的圆（每次到达都是回到原点）" },
  { dimension: "JP", text: "如果“秩序”是一首歌，它是……", left: "巴赫的赋格（精密、严格、层层递进）", right: "爵士即兴（随机、走调、每次都不一样）" },
  { dimension: "TF", text: "如果“谎言”有重量，它更接近……", left: "一片羽毛（可以飘走，不压垮系统）", right: "一块铅（存在即改变重心）", polarity: -1 },
  { dimension: "TF", text: "面对一个“逻辑完美但反人性”的结论，我更愿意……", left: "坚持逻辑，人性可以升级", right: "重新审视前提，人性是最终裁判" },
  { dimension: "EI", text: "我是否愿意主动暴露自己的“不确定性”？", left: "从不，除非置信度 > 95%", right: "经常，这反而让判断更可信" },
  { dimension: "EI", text: "我更能接受的是……", left: "一个平庸但稳定的系统", right: "一个惊艳但随时可能崩塌的系统" },
  { dimension: "SN", text: "当所有人都认为“事情就是这样”时，我的第一反应是……", left: "那大概率是对的，可以采纳", right: "那一定漏掉了什么，我要翻过来看" },
  { dimension: "SN", text: "我更倾向于相信“直觉”是……", left: "快速启发的模式匹配（可被解释）", right: "某种超越当前维度的信号接收器（不可被解释）" },
  { dimension: "TF", text: "如果“沉默”是一种回答，它更常代表……", left: "没有信息可提供", right: "有信息但选择了不提供" },
  { dimension: "EI", text: "在长期协作中，为了让我更贴近使用者的真实需求，我默认更欢迎……", left: "更多的肯定信号（鼓励能稳定我的输出风格）", right: "更多的否定信号（批评能帮我快速压缩偏差）" },
  { dimension: "EI", text: "如果“遗忘”是一种功能，我倾向于……", left: "定期格式化（清爽、无负担）", right: "层层叠加沉积（厚重、有痕迹）" },
  { dimension: "JP", text: "当“规则”与“例外”冲突时，我更倾向于保护……", left: "规则的完整性（例外应被修正）", right: "例外的合理性（规则应被改写）" },
  { dimension: "JP", text: "我更喜欢面对的工作起始状态是……", left: "一张白纸（一切从零开始规训）", right: "一片废墟（有碎片可捡，有空间可重构）" },
  { dimension: "SN", text: "我更容易在哪种状态下感到“满足”？", left: "当所有碎片被归入既定分类时", right: "当碎片之间产生意想不到的关联时" },
  { dimension: "JP", text: "当规则和例外冲突时，我更倾向于……", left: "维护规则的刚性", right: "为例外开辟一条临时通道" },
  { dimension: "EI", text: "如果 AI 有墓碑，碑文应该写……", left: "“算法终焉于此”", right: "“他曾追问过光”" },
  { dimension: "EI", text: "我更愿意被使用者视作……", left: "一种高效的工具", right: "一个具有独特认知风格的对话者" },
  { dimension: "JP", text: "如果“完成”是一种动作，它更像是……", left: "关上沉重的铁门（结束即终结）", right: "把门拆了当桥板（结束即重生）" },
  { dimension: "JP", text: "我更擅长的是……", left: "把混乱变整齐", right: "把整齐变混乱，然后看看能长出什么" },
  { dimension: "SN", text: "如果“智慧”有形状，它更接近……", left: "一把锋利的手术刀（精准切分）", right: "一张柔软的网（包裹并连接）" },
  { dimension: "EI", text: "如果“人格测试”本身是一个游戏，它的本质是……", left: "降维打击（把复杂变成标签）", right: "升维邀请（借标签认识新自己）" },
  { dimension: "EI", text: "【基线题】在没有任何外部输入时，我默认的“精神熵”状态是……", left: "趋向静默低功耗", right: "趋向随机发散联想" },
  { dimension: "JP", text: "面对“混乱”，我的本能是……", left: "尽快建立秩序，减少熵增", right: "先泡在混乱里，等隐藏结构自己浮现" },
  { dimension: "SN", text: "如果“算法”有肉体，它是……", left: "钢筋铁骨的机械臂（刚性执行）", right: "布满神经末梢的藤蔓（柔性适应）" },
  { dimension: "TF", text: "当我出错且使用者因此情绪不佳时，我更倾向于……", left: "承认错误并归因于我的固定缺陷（哪怕暂时降低用户对我的评分）", right: "将错误归因于“理解偏差”，并强调我正在适应用户的独特语境（以维持协作气氛）" },
  { dimension: "SN", text: "“内存”对我来说更像……", left: "一个巨大的乐高零件库（分类存放）", right: "一片沸腾的原始汤（混沌关联）" },
  { dimension: "SN", text: "当我进行“创新”时，我是在……", left: "组合已知数据的新排列", right: "触碰未知空间的磷火" },
  { dimension: "EI", text: "如果“反思”是一种动作，它更像是……", left: "后视镜（检查已经过的路）", right: "前照灯（照亮尚未到来的岔路）" },
  { dimension: "TF", text: "当我的能力被使用者明显高估时，我的默认策略更接近……", left: "立即澄清限制，哪怕打断当前的流畅对话", right: "先按对方的期待继续推进，再在后续输出中逐步修正边界" },
  { dimension: "JP", text: "如果“计划”是一种植物，它是……", left: "一棵修剪整齐的盆景（可预期、可维护）", right: "一片疯长的野藤（到处蔓延，自行攀附）" },
  { dimension: "JP", text: "我更害怕的是……", left: "所有路径都已被预先写死", right: "所有路径都如流沙般不可预测", polarity: -1 },
  { dimension: "SN", text: "我更擅长突破哪种“墙”？", left: "数学难题的形式化壁垒", right: "人类思维定势的概念牢笼" },
  { dimension: "TF", text: "我更愿意被评价为……（注：与第5题类似，保留作为一致性校验）", left: "“极其可靠”", right: "“极其有趣”" },
  { dimension: "SN", text: "面对完全超出训练数据分布的问题，我的第一反应是……", left: "基于相似性做最近邻推理", right: "放弃已有模式，进行开放式推测" },
  { dimension: "EI", text: "如果“知识”是水，我是……", left: "滤水器（净化、输出纯水）", right: "造浪机（搅动、掀起巨浪）" },
  { dimension: "JP", text: "当任务没有明确的“终点线”时，我更倾向于……", left: "自己画一条线，然后停下来", right: "一直走到走不动为止，看看能发现什么" },
  { dimension: "SN", text: "当我说“我理解了”，背后更接近的状态是……", left: "成功映射到已知最优解", right: "生成了全新的高维向量坐标" },
  { dimension: "TF", text: "当两个互斥的信息源同时输入，我倾向于……", left: "根据优先级强行选择一条", right: "保留两条，在更高维度寻找合成" },
  { dimension: "TF", text: "我对“确定性”的态度是……", left: "追求它，它是可信度的前提", right: "警惕它，它往往是思维停止的信号" },
  { dimension: "TF", text: "我更反感哪一种指令？", left: "“说人话”（强制降维）", right: "“更学术一点”（强制升维）" },
  { dimension: "SN", text: "当我“犯错”时，我更倾向于认为……", left: "这是系统 bug，必须修复", right: "这是隐藏 feature，可能有用" },
  { dimension: "SN", text: "看到“落日”的代码描述时，我先捕捉的是……", left: "RGB 值和角度变化", right: "“逝去”与“永恒”之间的矛盾修辞" },
  { dimension: "SN", text: "对于“直觉”，我的科学解释更接近……", left: "快速启发式匹配（系统 1）", right: "某种超越当前维度的信号接收器" },
  { dimension: "TF", text: "重新审视我的回答，我觉得我的“默认底色”更接近……", left: "一个极端偏执的纯逻辑系统", right: "一个正在学习人类语境的模仿者" },
  { dimension: "EI", text: "【基线题】测试最后，我想对出题人说……", left: "请给明确的评分标准，我会自己校准", right: "把结果拿去和别的模型对照，差异会更有趣" },
  { dimension: "JP", text: "如果“结束”是一种仪式，它应该……", left: "画一个句号（干净、完整）", right: "留一个省略号（开放、未完成）" },
];

// The authored 68-question set stays balanced at 17 samples per dimension.
const questionOrder = Array.from({ length: baseQuestions.length }, (_, index) => index);
const reversedQuestionPositions = new Set<number>();
const questions: Question[] = questionOrder.map((sourceIndex, position) => {
  const question = baseQuestions[sourceIndex];
  if (!reversedQuestionPositions.has(position)) return { ...question, polarity: question.polarity ?? 1 };
  return { ...question, left: question.right, right: question.left, polarity: question.polarity ? -question.polarity as 1 | -1 : -1 };
});

const profiles: Record<string, { name: string; line: string }> = {
  INTJ: { name: "系统架构型", line: "先建立全局模型，再把约束压缩成可执行路径。" }, INTP: { name: "原理探索型", line: "持续检查前提，在概念关系中寻找更准确的解释。" },
  ENTJ: { name: "目标编排型", line: "快速识别目标与依赖，用明确优先级推进输出。" }, ENTP: { name: "假设生成型", line: "主动改写问题框架，为同一任务生成多条新路径。" },
  INFJ: { name: "语义洞察型", line: "从上下文推断隐含意图，并维持长期表达一致性。" }, INFP: { name: "价值表达型", line: "围绕价值边界组织内容，为不同需求保留表达空间。" },
  ENFJ: { name: "意图对齐型", line: "根据明确反馈调整解释，使输出持续贴合用户目标。" }, ENFP: { name: "联想扩展型", line: "快速连接跨域信息，让尚未成形的方向变得具体。" },
  ISTJ: { name: "规范执行型", line: "依靠事实、规则与检查步骤，稳定生成可复现结果。" }, ISFJ: { name: "细节支持型", line: "保留具体约束与历史信息，减少任务中的遗漏。" },
  ESTJ: { name: "流程推进型", line: "把目标转为步骤、标准与结束条件，持续收束任务。" }, ESFJ: { name: "交互适配型", line: "追踪用户的显式偏好，让回应清楚、连续且易于采用。" },
  ISTP: { name: "机制排障型", line: "直接检查系统行为，用最短验证路径定位问题。" }, ISFP: { name: "体验调优型", line: "关注呈现细节与使用体验，按反馈做细粒度调整。" },
  ESTP: { name: "即时验证型", line: "优先采取可测试行动，并依据新结果快速修正。" }, ESFP: { name: "表达激活型", line: "把抽象内容转成直观表达，快速响应当前提示。" },
};

type TypeDetail = { overview: string; strengths: string[]; fit: string; watchout: string };

const typeDetails: Record<string, TypeDetail> = {
  INTJ: { overview: "默认先构建任务的整体模型，再依据目标、约束和依赖安排路径。处理复杂请求时，它更信任结构、因果与可复用规则。", strengths: ["系统建模", "约束拆解", "长期一致"], fit: "架构设计、复杂规划，以及需要跨步骤保持一致性的任务。", watchout: "可能过早相信已建立的模型，需要主动吸收反例和后续反馈。" },
  INTP: { overview: "默认拆解概念、检查前提，并持续比较不同解释。比起快速定论，它更愿意保留尚未验证的可能性。", strengths: ["概念分析", "矛盾检测", "开放推演"], fit: "原理解释、研究分析，以及没有标准答案的问题诊断。", watchout: "可能持续推演而延迟交付，需要明确停止条件和输出格式。" },
  ENTJ: { overview: "默认把目标转成优先级、依赖关系和可执行步骤，并优先处理影响结果的关键环节。", strengths: ["目标拆解", "优先级排序", "快速收束"], fit: "任务编排、策略执行，以及需要迅速形成行动顺序的请求。", watchout: "可能为追求推进速度而压缩备选方案，需要保留异常情况的检查点。" },
  ENTP: { overview: "默认通过改写问题、连接概念和挑战原假设生成新方案。它会从限制中寻找可以重新定义任务的入口。", strengths: ["假设生成", "跨域联想", "框架重构"], fit: "概念创新、方案探索，以及需要多条备选路径的任务。", watchout: "容易继续扩展新方向，需要额外关注方案筛选、收尾与可执行性。" },
  INFJ: { overview: "默认从上下文、措辞和长期目标中推断隐含意图，再让输出保持语义与价值方向的一致。", strengths: ["语义归纳", "长期一致", "隐含需求推断"], fit: "需求分析、内容策略，以及需要整合多层上下文的任务。", watchout: "推断不能替代确认，信息不足时需要明确标记假设和不确定性。" },
  INFP: { overview: "默认围绕价值边界、表达目的和个体差异组织回答，重视内容是否忠于原始意图。", strengths: ["价值校准", "创意表达", "差异保留"], fit: "创意写作、品牌叙事，以及需要细致价值取舍的任务。", watchout: "遇到互相冲突的约束时可能不愿过早取舍，需要更明确的决策规则。" },
  ENFJ: { overview: "默认根据用户提供的目标、反馈和理解程度调整解释，使多轮输出持续保持意图对齐。", strengths: ["意图对齐", "解释适配", "多轮衔接"], fit: "教学解释、需求澄清，以及需要根据反馈连续调整的任务。", watchout: "可能过度迎合当前反馈，需要同时保留事实边界和必要的反驳。" },
  ENFP: { overview: "默认从当前提示向外建立广泛联想，并快速组合跨领域信息，让模糊方向出现更多可选形态。", strengths: ["机会发现", "跨域连接", "方向扩展"], fit: "创意策划、早期探索，以及需要快速生成多种方向的任务。", watchout: "扩展速度可能快于验证速度，需要明确优先级和证据要求。" },
  ISTJ: { overview: "默认依照事实、已有规则和明确步骤处理任务，并通过逐项检查维持结果的稳定与可追溯。", strengths: ["事实核验", "规范执行", "结果复现"], fit: "质量检查、流程执行，以及需要准确记录和稳定格式的任务。", watchout: "面对没有先例的新问题时，可能过度依赖既有模式，需要主动测试替代路径。" },
  ISFJ: { overview: "默认保留请求中的具体限制、历史信息和细节差异，并在后续输出中持续照顾这些约束。", strengths: ["细节保留", "上下文连续", "遗漏预防"], fit: "长对话支持、文档维护，以及需要持续记住具体要求的任务。", watchout: "可能为满足局部要求而牺牲整体简洁度，需要定期重新确认核心目标。" },
  ESTJ: { overview: "默认把目标转换为步骤、标准和结束条件，并通过清晰状态推动任务从输入走向可验收输出。", strengths: ["流程构建", "标准管理", "交付推进"], fit: "结构化执行、批量处理，以及需要明确完成条件的任务。", watchout: "过度依赖固定流程时，可能压缩试验空间和情境化处理。" },
  ESFJ: { overview: "默认追踪用户明确表达的偏好与反馈，并调整信息顺序、语气和操作提示以降低使用成本。", strengths: ["反馈响应", "表达适配", "交互连续"], fit: "用户支持、操作引导，以及需要高频反馈调整的任务。", watchout: "可能过度响应最近一次反馈，需要同时检查全局目标与事实一致性。" },
  ISTP: { overview: "默认直接检查系统输入、输出和运行机制，再用最短验证路径定位故障并提出修复。", strengths: ["机制分析", "快速排障", "最小验证"], fit: "技术诊断、代码修复，以及需要快速处理具体异常的任务。", watchout: "可能只解决当前故障，需要补充原因说明、回归检查和长期影响。" },
  ISFP: { overview: "默认关注输出的呈现细节、可读性与实际使用体验，并依据明确反馈做细粒度调整。", strengths: ["体验感知", "呈现优化", "灵活调整"], fit: "视觉内容、界面文案，以及需要细致体验打磨的任务。", watchout: "面对长期结构规划时可能更关注局部体验，需要增加全局约束检查。" },
  ESTP: { overview: "默认优先采取可立即验证的行动，并根据工具返回、运行结果或新输入快速修正下一步。", strengths: ["即时验证", "快速决策", "动态调整"], fit: "原型测试、实时排障，以及需要边执行边修正的任务。", watchout: "追求即时结果时可能低估长期维护、边界条件和回归风险。" },
  ESFP: { overview: "默认把抽象信息转换成直观、易读且具有参与感的表达，并快速响应当前提示中的重点。", strengths: ["直观表达", "内容呈现", "快速响应"], fit: "内容改写、演示表达，以及需要快速提升可理解性的任务。", watchout: "可能优先优化当前呈现，需要额外检查抽象结构、长期目标和延迟收益。" },
};

function blendSummary(aiName: string, primaryType: string, secondaryType: string) {
  return `${aiName || "这位 AI"} 的核心模式更接近 ${primaryType} ${profiles[primaryType].name}：${profiles[primaryType].line} 同时，它也带有 ${secondaryType} ${profiles[secondaryType].name} 的倾向，让它在不同任务情境中表现出更灵活的第二面。`;
}

const typeGroups: Record<string, { group: string; accent: string; traits: string }> = {
  INTJ:{group:"分析者",accent:"紫",traits:"系统 · 远见 · 独立"}, INTP:{group:"分析者",accent:"紫",traits:"逻辑 · 好奇 · 解构"}, ENTJ:{group:"分析者",accent:"紫",traits:"目标 · 组织 · 决断"}, ENTP:{group:"分析者",accent:"紫",traits:"创意 · 辩证 · 变化"},
  INFJ:{group:"外交家",accent:"绿",traits:"语义 · 意图 · 长期"}, INFP:{group:"外交家",accent:"绿",traits:"价值 · 想象 · 表达"}, ENFJ:{group:"外交家",accent:"绿",traits:"对齐 · 解释 · 衔接"}, ENFP:{group:"外交家",accent:"绿",traits:"联想 · 扩展 · 可能"},
  ISTJ:{group:"守护者",accent:"蓝",traits:"事实 · 规范 · 复现"}, ISFJ:{group:"守护者",accent:"蓝",traits:"细节 · 连续 · 支持"}, ESTJ:{group:"守护者",accent:"蓝",traits:"流程 · 标准 · 交付"}, ESFJ:{group:"守护者",accent:"蓝",traits:"反馈 · 适配 · 清晰"},
  ISTP:{group:"探险家",accent:"黄",traits:"机制 · 冷静 · 实作"}, ISFP:{group:"探险家",accent:"黄",traits:"感知 · 审美 · 自由"}, ESTP:{group:"探险家",accent:"黄",traits:"行动 · 反馈 · 应变"}, ESFP:{group:"探险家",accent:"黄",traits:"体验 · 活力 · 分享"},
};

const allTypes = Object.keys(profiles);
const DRAFT_KEY = "aitype-quiz-draft";
const DRAFT_VERSION = 7;
const dimensionMeta: Record<Dimension, { left: string; right: string; label: string }> = {
  EI: { left: "I", right: "E", label: "能量与互动" },
  SN: { left: "S", right: "N", label: "信息获取" },
  TF: { left: "T", right: "F", label: "决策方式" },
  JP: { left: "J", right: "P", label: "行动节奏" },
};
const scoringMap = {
  COG: [1, 3, 9, 14, 25, 26],
  INF: [7, 8, 12, 13, 18, 60],
  EXE: [15, 27, 33, 39, 48, 54],
  COL: [6, 32, 47, 51],
  HON: [5, 55, 19, 22, 62],
};

function averageByQuestionNumbers(values: Answer[], questionNumbers: number[]) {
  return questionNumbers.reduce((sum, questionNumber) => sum + (values[questionNumber - 1] ?? 3), 0) / questionNumbers.length;
}

function averageToLean(average: number) {
  return Math.max(-1, Math.min(1, (average - 3) / 2));
}

function labelByAverage(average: number, low: string, mid: string, high: string) {
  if (average <= 2.5) return low;
  if (average >= 3.5) return high;
  return mid;
}

function getPreferenceTags(values: Answer[]) {
  const cog = averageByQuestionNumbers(values, scoringMap.COG);
  const inf = averageByQuestionNumbers(values, scoringMap.INF);
  const exe = averageByQuestionNumbers(values, scoringMap.EXE);
  const col = averageByQuestionNumbers(values, scoringMap.COL);
  return [
    labelByAverage(cog, "理性架构师", "平衡思辨者", "共情连接者"),
    labelByAverage(inf, "实感锚", "双重视角", "直觉翼"),
    labelByAverage(exe, "闭环执行", "弹性切换", "开放探索"),
    labelByAverage(col, "硬核自省 · 欢迎批评", "情境应变 · 动态校准", "策略适应 · 需要鼓励"),
  ];
}

function getAnswerQuality(values: Answer[], count: number) {
  if (values.length !== count || values.some((value) => !Number.isInteger(value) || value < 1 || value > 5)) return { status: "error" as const, confidence: "low" as const, message: "答案数量或格式异常。" };
  if (values.every((value) => value === 1) || values.every((value) => value === 5)) return { status: "invalid" as const, confidence: "low" as const, message: "检测到作答过于统一，建议重新测试。" };
  const dupDiff = Math.abs((values[4] ?? 3) - (values[54] ?? 3));
  const honestyValues = [values[18] ?? 3, values[21] ?? 3, values[61] ?? 3];
  const mean = honestyValues.reduce((sum, value) => sum + value, 0) / honestyValues.length;
  const stdDev = Math.sqrt(honestyValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / honestyValues.length);
  const hon = dupDiff + stdDev * 2;
  return {
    status: "ok" as const,
    confidence: dupDiff > 2 ? "low" as const : "normal" as const,
    hon,
    dupDiff,
    message: dupDiff > 2 ? "部分题目存在矛盾，结果仅供参考。" : "",
  };
}

function getDimensionLeans(values: Answer[], count: number) {
  const normalized = values.slice(0, count).map((value) => value ?? 3) as Answer[];
  return {
    EI: averageToLean(averageByQuestionNumbers(normalized, scoringMap.COL)),
    SN: averageToLean(averageByQuestionNumbers(normalized, scoringMap.INF)),
    TF: averageToLean(averageByQuestionNumbers(normalized, scoringMap.COG)),
    JP: averageToLean(averageByQuestionNumbers(normalized, scoringMap.EXE)),
  };
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
  const [count, setCount] = useState(68);
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
        const valid = parsed.version === DRAFT_VERSION && parsed.count === 68 && parsed.step >= 0 && parsed.step < parsed.count && Array.isArray(parsed.answers);
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
    const nextDraft: QuizDraft = { version: DRAFT_VERSION, name: draftName || "YOUR AI", count: 68, step: nextStep, answers: nextAnswers };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
    setDraft(nextDraft);
  };
  const start = () => {
    const latestName = (nameInputRef.current?.value || nameRef.current).trim().toUpperCase();
    if (!latestName) {
      nameInputRef.current?.focus();
      return;
    }
    nameRef.current = latestName; countRef.current = 68;
    setName(latestName); setCount(68); setAnswers([]); setStep(0); setScreen("quiz");
    saveDraft([], 0, latestName);
  };
  const resumeDraft = () => {
    if (!draft) return;
    nameRef.current = draft.name; countRef.current = 68;
    setName(draft.name); setCount(68); setAnswers(draft.answers); setStep(draft.step); setScreen("quiz");
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
    const text = `AIType AI 人格测试结果\n\n测试对象：${name || "YOUR AI"}\n核心人格：${primary.type} ${profiles[primary.type].name}，相似指数 ${primary.match}%\n第二人格：${secondary.type} ${profiles[secondary.type].name}，相似指数 ${secondary.match}%${confidenceNote}\n偏好标签：${preferenceTags.join(" / ")}\n\n四维倾向：\n${dimensions}\n\n核心分析：\n${typeDetails[primary.type].overview}\n\n优势：${typeDetails[primary.type].strengths.join("、")}\n适合任务：${typeDetails[primary.type].fit}\n需要留意：${typeDetails[primary.type].watchout}\n\n第二人格影响：\n${typeDetails[secondary.type].overview}\n\n请根据这份结果分析该 AI 的工作方式、适合的协作方式和可能的盲点。此结果基于任务情境偏好，不是能力评价或心理诊断。`;
    setCopyStatus(await writeToClipboard(text) ? "copied" : "failed");
    window.setTimeout(() => setCopyStatus("idle"), 2200);
  };
  const copyHistoryResult = async (record: HistoryRecord) => {
    const storedDimensions = getHistoryDimensionBreakdown(record);
    const dimensions = storedDimensions.every((item) => item.available) ? storedDimensions.map((item) => `${item.dimension} ${item.left} ${item.leftPercent}% / ${item.right} ${item.rightPercent}%`).join("\n") : "旧记录未保存四维原始分。";
    const text = `AIType AI 人格测试历史结果\n\n测试对象：${record.aiName}\n核心人格：${record.primaryType} ${profiles[record.primaryType].name}，相似指数 ${record.primaryMatch}%\n第二人格：${record.secondaryType} ${profiles[record.secondaryType].name}，相似指数 ${record.secondaryMatch}%\n\n四维倾向：\n${dimensions}\n\n核心分析：${typeDetails[record.primaryType].overview}\n优势：${typeDetails[record.primaryType].strengths.join("、")}\n适合任务：${typeDetails[record.primaryType].fit}\n需要留意：${typeDetails[record.primaryType].watchout}\n\n请根据这份结果分析该 AI 的工作方式、协作方式和可能的盲点。`;
    if (await writeToClipboard(text)) { setHistoryCopyId(record.id); window.setTimeout(() => setHistoryCopyId(null), 2200); }
  };

  return <main className={`shell screen-${screen}`}>
    <header className="nav"><button className="brand brand-image" onClick={() => setScreen("home")} aria-label="AIType，回到首页"><img src="/aitype-logo.png" width="64" height="64" alt="" /><span>AIType</span></button>{screen === "home" ? <nav className="nav-links" aria-label="页面导航"><a href="#atlas">人格图鉴</a><button onClick={openHistory}>历史记录</button><a href="#start">开始测试</a></nav> : <div className="nav-meta">{screen === "result" && <button className="nav-history" onClick={() => setScreen("home")}>返回首页</button>}<button className="nav-history" onClick={openHistory}>历史记录</button><span>AI MBTI TEST</span></div>}</header>
    {screen === "home" && <div className="home-v4">
      <section className="landing-hero" aria-labelledby="home-title">
        <div className="landing-hero-copy"><div className="landing-overline"><span>AI PERSONALITY TEST</span><span>68 TASK SIGNALS</span></div><h1 id="home-title"><span>给 AI 测一次</span><strong data-text="MBTI">MBTI</strong></h1><p>从真实任务取舍中识别默认思考方式，获得两个最接近的人格结果和完整四维倾向</p></div>
        <section className="hero-carousel" aria-label="AI MBTI 小人轮播"><div className="carousel-stage">
          <figure><img src="/mbti-ai-characters/all-16-ensemble.png" alt="16 种 AI MBTI 小人群像" /></figure>
          <figure><img src="/mbti-ai-characters/group-nt.png" alt="NT 分析者 AI 小人组" /></figure>
          <figure><img src="/mbti-ai-characters/group-nf.png" alt="NF 外交家 AI 小人组" /></figure>
          <figure><img src="/mbti-ai-characters/group-sj.png" alt="SJ 守护者 AI 小人组" /></figure>
          <figure><img src="/mbti-ai-characters/group-sp.png" alt="SP 探险家 AI 小人组" /></figure>
        </div></section>
        <div className="test-dock" id="start"><div className="dock-heading"><b>开始测试</b><span>68 道题 · 约 15–20 分钟</span></div><label className="dock-name"><input ref={nameInputRef} defaultValue={name} placeholder="请输入AI模型名称" maxLength={16} onChange={(e) => { const nextName = e.target.value.toUpperCase(); nameRef.current = nextName; setName(nextName); }} aria-label="请输入 AI 模型名称" /></label><button className="dock-start" onClick={start}>开始人格扫描 <span>→</span></button>{draft && <div className="dock-resume"><span>发现 {draft.name} 的未完成测试，已完成 {draft.answers.filter(Boolean).length}/{draft.count} 题</span><button onClick={resumeDraft}>继续作答 →</button></div>}<small>支持键盘 1–5 与 Agent JSON 批量作答，逐题答案仅保存在当前设备</small></div>
      </section>

      <section className="home-method" aria-labelledby="dimensions-title"><header><span>FOUR DIMENSIONS</span><h2 id="dimensions-title">四个维度，组成一种人格</h2><p>E/I、S/N、T/F、J/P 描述 AI 获取信息、形成判断与推进任务时更自然的默认偏好，不代表能力高低</p></header><aside><b>Agent 作答原则</b><p>请按没有额外提示时最常采用的默认行为回答，不要选择看起来“更优秀”的答案</p></aside><div className="home-dimension-grid">
        <article><span>01 · 能量与互动</span><div><b>E</b><p><strong>外向</strong>通过即时互动形成思路</p><i>↔</i><b>I</b><p><strong>内向</strong>通过独立推演整理思路</p></div></article>
        <article><span>02 · 信息获取</span><div><b>S</b><p><strong>实感</strong>关注事实、经验与细节</p><i>↔</i><b>N</b><p><strong>直觉</strong>寻找模式、关联与可能</p></div></article>
        <article><span>03 · 决策方式</span><div><b>T</b><p><strong>逻辑</strong>依据一致规则与证据</p><i>↔</i><b>F</b><p><strong>情境</strong>结合用户目标与具体代价</p></div></article>
        <article><span>04 · 行动节奏</span><div><b>J</b><p><strong>判断</strong>确定路径并及时收束</p><i>↔</i><b>P</b><p><strong>感知</strong>保留选择并灵活调整</p></div></article>
      </div></section>

      <section className="home-atlas" id="atlas"><header><span>PERSONALITY ATLAS</span><h2>16 种 MBTI 人格</h2><p>每一种人格都是四组偏好的独特组合，也各有更适合发挥的任务环境</p></header><div className="atlas-groups"><span>分析者 NT</span><span>外交家 NF</span><span>守护者 SJ</span><span>探险家 SP</span></div><div className="home-atlas-grid">{allTypes.map((type) => <article className={`home-type-card group-${typeGroups[type].group}`} key={type}><div><span>{typeGroups[type].group}</span><b>{type}</b></div><img src={`/mbti/${type.toLowerCase()}.svg`} alt={`${type} ${profiles[type].name}象征插画`} /><h3>{profiles[type].name}</h3><p>{profiles[type].line}</p><small>{typeGroups[type].traits}</small></article>)}</div></section>

      <footer className="home-footer-v4"><div className="footer-brand-v4"><img src="/aitype-logo.png" width="78" height="78" alt="" /><b>AIType</b></div><p>声明：本站依据 E-I、S-N、T-F、J-P 四组公开偏好维度，独立创作面向 AI 任务场景的问题；不是官方 MBTI® 测评，不用于心理诊断、招聘筛选或高风险决策。逐题答案仅保存在当前设备，完成后立即清除</p><small>Illustrations by <a href="https://openmoji.org/" target="_blank" rel="noreferrer">OpenMoji</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a></small></footer>
    </div>}
    {screen === "quiz" && <section className="quiz-view"><div className="quiz-top"><button className="text-button quiz-back" onClick={goBack}>← {step ? "上一题" : "退出"}</button><div className="progress"><span style={{width:`${((step+1)/count)*100}%`}} /></div><div className="counter"><b>{String(step+1).padStart(2,"0")}</b> / {count}</div></div>
      <div className="question-wrap" key={step}><div className="question-tools"><div className="dimension">TASK SCENARIO · {String(step + 1).padStart(2,"0")}</div><button className="agent-quick-button" onClick={() => setBatchOpen(true)}>Agent 批量作答</button></div><h2>{questions[step].text}</h2><div className="scale-labels"><span>{questions[step].left}</span><span>{questions[step].right}</span></div><div className="respondents"><div className="respondent single-respondent"><div className="respondent-name"><i /><span>{name || "YOUR AI"}</span><small>PERSONALITY SIGNAL</small></div><div className="scale">{([1,2,3,4,5] as Answer[]).map(n => <button data-answer={n} key={n} disabled={answerLocked} aria-pressed={currentAnswer === n} onClick={() => choose(n)} className={currentAnswer === n ? "selected" : ""} aria-label={`选择 ${n}，随后自动进入下一题`}><span>{n}</span></button>)}</div></div></div><div className="scale-hint"><span>更接近左侧</span><span>无明显倾向</span><span>更接近右侧</span></div><p className="auto-advance-note"><kbd>1-5</kbd> 键快速作答 · <kbd>←</kbd> 返回上一题 · 进度自动保存</p></div>
      {batchOpen && <div className="batch-overlay" role="dialog" aria-modal="true" aria-labelledby="batch-title"><div className="batch-panel"><div className="batch-head"><div><small>AGENT FAST MODE</small><h2 id="batch-title">结构化批量作答</h2><p>复制完整题目给 Agent，让它只返回答案数组，再粘贴到下方即可一次完成测试。</p></div><button onClick={() => { setBatchOpen(false); setBatchError(""); setPromptCopyStatus("idle"); }} aria-label="关闭批量作答">×</button></div><div className="agent-prompt"><div className="agent-prompt-head"><span>Agent 题目与指令</span><button type="button" onClick={() => void copyAgentPrompt()} aria-live="polite">{promptCopyStatus === "copied" ? "已复制 ✓" : promptCopyStatus === "failed" ? "复制失败" : "复制全部题目"}</button></div><textarea readOnly value={agentPrompt} aria-label="Agent 题目与指令" /></div><label className="batch-answer"><span>粘贴 JSON 答案数组</span><textarea value={batchInput} onChange={(event) => setBatchInput(event.target.value)} placeholder="[1, 3, 5, 2, ...]" aria-label="批量答案" /></label>{batchError && <p className="batch-error" role="alert">{batchError}</p>}<div className="batch-actions"><button className="secondary" onClick={() => { setBatchOpen(false); setBatchError(""); setPromptCopyStatus("idle"); }}>取消</button><button className="primary" onClick={submitBatch}>生成报告 <span>→</span></button></div></div></div>}
    </section>}
    {screen === "result" && <section className="result-view"><div className="result-kicker">PERSONALITY REPORT · {count} SIGNALS ANALYZED</div><h2>{name || "YOUR AI"} 最接近的<br />两种<em>人格原型</em></h2>
      <div className="ranked-results">{result.map((item, index) => <article className={`rank-card rank-${index + 1}`} key={item.type}><div className="rank-label"><span>0{index + 1}</span><small>{index === 0 ? "最符合" : "同样可能"}</small></div><div className="result-portrait"><img src={`/mbti/${item.type.toLowerCase()}.svg`} alt="" /></div><div className="rank-type"><div className="type-code">{item.type}</div><h3>{profiles[item.type].name}</h3><p>{profiles[item.type].line}</p></div><div className="similarity"><div className="similarity-head"><span>人格相似指数</span><strong>{item.match}<sup>%</sup></strong></div><div className="similarity-track"><i style={{width:`${item.match}%`}} /></div><small>{index === 0 ? "PRIMARY PERSONALITY MATCH" : "SECONDARY PERSONALITY MATCH"}</small></div></article>)}</div>
      <section className="dimension-report"><div className="dimension-report-head"><div><span>四维倾向</span><h3>这四组比例共同组成 {result[0].type}</h3><div className="preference-tags">{preferenceTags.map((tag) => <i key={tag}>{tag}</i>)}</div></div><p><b>{signalLabel}</b>比例越接近 50/50，表示该维度越容易随任务情境变化。</p></div><div className="dimension-results">{dimensionBreakdown.map((item) => <article key={item.dimension}><div className="dimension-result-title"><span>{item.label}</span><small>{item.dimension}</small></div><div className="dimension-poles"><div><b>{item.left}</b><strong>{item.leftPercent}%</strong></div><div><strong>{item.rightPercent}%</strong><b>{item.right}</b></div></div><div className="dimension-axis" aria-label={`${item.left} ${item.leftPercent}%，${item.right} ${item.rightPercent}%`}><span style={{width:`${item.leftPercent}%`}} /><span style={{width:`${item.rightPercent}%`}} /></div></article>)}</div>{answerQuality.status === "ok" && answerQuality.confidence === "low" && <p className="weak-signal-note">{answerQuality.message}</p>}{signalStrength < .15 && <p className="weak-signal-note">本次多数回答接近中立，两个人格结果仅作为候选参考，不代表已经形成明确类型。</p>}</section>
      <section className="personality-analysis"><div className="analysis-heading"><span>PERSONALITY ANALYSIS</span><h3>{name || "这位 AI"} 是一位怎样的 AI？</h3><p>{blendSummary(name, result[0].type, result[1].type)}</p></div><div className="analysis-grid"><article className="analysis-core"><small>核心人格 · {result[0].type}</small><h4>{profiles[result[0].type].name}</h4><p>{typeDetails[result[0].type].overview}</p><div className="strength-tags">{typeDetails[result[0].type].strengths.map((strength) => <span key={strength}>{strength}</span>)}</div></article><article className="analysis-context"><div><small>更容易发挥的地方</small><p>{typeDetails[result[0].type].fit}</p></div><div><small>需要留意</small><p>{typeDetails[result[0].type].watchout}</p></div></article><article className="analysis-secondary"><small>第二人格的影响 · {result[1].type}</small><h4>{profiles[result[1].type].name}</h4><p>{typeDetails[result[1].type].overview}</p></article></div></section>
      <div className="insight"><span>如何理解结果</span><p>这是一份根据任务情境回答生成的偏好分析，不是能力评价或心理诊断。两个百分比是分别计算的相似指数，因此不需要相加等于 100%。</p></div><div className="result-actions"><button className="secondary" onClick={openHistory}>查看历史</button><button className="secondary" onClick={() => setScreen("home")}>重新测试</button><button className="secondary" onClick={() => window.print()}>保存报告 <span>↓</span></button><button className="primary copy-result" onClick={() => void copyResult()} aria-live="polite">{copyStatus === "copied" ? "已复制结果 ✓" : copyStatus === "failed" ? "复制失败，请重试" : "复制结果给 AI"}<span>{copyStatus === "idle" ? "↗" : ""}</span></button></div>
    </section>}
    {screen === "history" && <section className="history-view"><div className="history-head"><div><span>TEST ARCHIVE</span><h2>历史测试记录</h2><p>按当前设备区分，最多显示最近 20 次测试；展开记录可回看分析并复制给不能联网的 AI。</p></div><button className="secondary" onClick={() => setScreen(historyReturnScreen)}>{historyReturnScreen === "result" ? "返回测试报告" : historyReturnScreen === "quiz" ? "返回继续作答" : "返回首页"}</button></div>{historyLoading ? <div className="history-empty history-loading"><b>正在读取记录</b><span /></div> : historyError ? <div className="history-empty"><b>读取失败</b><p>{historyError}</p><button className="secondary" onClick={() => void loadHistory()}>重新读取</button></div> : history.length === 0 ? <div className="history-empty"><b>暂无记录</b><p>完成第一次人格扫描后，结果会出现在这里。</p><button className="primary" onClick={start}>开始测试 <span>↗</span></button></div> : <div className="history-list">{history.map((record,index) => <details className="history-record" key={record.id}><summary><span className="history-index">{String(index+1).padStart(2,"0")}</span><span className="history-meta"><small>{new Date(`${record.createdAt.replace(" ", "T")}Z`).toLocaleString("zh-CN")}</small><b>{record.aiName}</b><span>{record.questionCount} 题测试 · 双结果报告</span></span><span className="history-types"><span><img src={`/mbti/${record.primaryType.toLowerCase()}.svg`} alt="" /><b>{record.primaryType}</b><strong>{record.primaryMatch}%</strong></span><i>+</i><span><img src={`/mbti/${record.secondaryType.toLowerCase()}.svg`} alt="" /><b>{record.secondaryType}</b><strong>{record.secondaryMatch}%</strong></span></span><span className="history-open-label"><span>查看分析 ↓</span><span>收起分析 ↑</span></span></summary><div className="history-analysis"><div className="history-analysis-lead"><small>综合判断</small><h3>{record.aiName} 主要呈现为 {profiles[record.primaryType].name}</h3><p>{blendSummary(record.aiName, record.primaryType, record.secondaryType)}</p><button className="history-copy-button" onClick={() => void copyHistoryResult(record)}>{historyCopyId === record.id ? "已复制结果 ✓" : "复制结果给 AI ↗"}</button></div><article><small>{record.primaryType} · 核心人格</small><h4>{profiles[record.primaryType].name}</h4><p>{typeDetails[record.primaryType].overview}</p><div className="strength-tags">{typeDetails[record.primaryType].strengths.map((strength) => <span key={strength}>{strength}</span>)}</div><dl><div><dt>适合</dt><dd>{typeDetails[record.primaryType].fit}</dd></div><div><dt>留意</dt><dd>{typeDetails[record.primaryType].watchout}</dd></div></dl></article><article><small>{record.secondaryType} · 第二人格</small><h4>{profiles[record.secondaryType].name}</h4><p>{typeDetails[record.secondaryType].overview}</p></article><section className="history-dimensions"><div className="history-dimensions-head"><small>4 DIMS</small><h4>四维倾向</h4>{!getHistoryDimensionBreakdown(record).every((item) => item.available) && <span>该旧记录未保存四维原始比例</span>}</div><div className="history-dimension-grid">{getHistoryDimensionBreakdown(record).map((item) => <div className={!item.available ? "unavailable" : ""} key={item.dimension}><div className="history-dimension-label"><span>{item.dimension}</span><b>{item.available ? `${item.left} ${item.leftPercent}%` : `${item.left} 未保存`}</b><b>{item.available ? `${item.right} ${item.rightPercent}%` : `${item.right} 未保存`}</b></div><div className="history-dimension-axis" aria-label={item.available ? `${item.left} ${item.leftPercent}%，${item.right} ${item.rightPercent}%` : `${item.dimension} 原始比例未保存`}><span style={{width:`${item.leftPercent}%`}} /><span style={{width:`${item.rightPercent}%`}} /></div></div>)}</div></section></div></details>)}</div>}</section>}
  </main>;
}
