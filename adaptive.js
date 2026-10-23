/* Original diagnostic sampling and exact minimum-inversion replanning.
   Pure functions: no network, storage writes or automatic course completion. */
(function (root) {
  'use strict';
  const DOMAIN_DATA = [["python", "Python编程", "Python programming", ["HARVARD-CS50P", "UCB-CS61A"], "练习变量、引用、控制流和函数；完成两题后再做一份独立编程练习。", "Practice variables, references, control flow and functions, then solve an independent programming exercise."], ["data_structures", "数据结构", "Data structures", ["UCB-CS61B"], "比较查找复杂度，并用小图手算BFS；补做边界情况测试。", "Compare search complexity and trace BFS on a small graph, including boundary cases."], ["discrete", "离散数学", "Discrete mathematics", ["UCB-CS70"], "复习命题逻辑与组合计数，写清条件后再进行证明或计算。", "Review propositional logic and counting; state conditions before proving or calculating."], ["calculus", "微积分", "Calculus", ["MIT18.01", "PREP-MULTIVARIABLE"], "先复习导数与反常积分；多变量补修还需按四单元另行验证。", "Review derivatives and improper integrals; verify all four multivariable units separately."], ["linear_algebra", "线性代数", "Linear algebra", ["MIT18.06"], "从线性相关、秩和投影补起，用手算与几何解释互相检查。", "Review dependence, rank and projection, checking hand calculations against geometry."], ["systems", "系统基础", "Systems foundations", ["UCB-CS61C", "CMU15-213"], "复习进程/线程的内存与字节序，再做C内存和调试练习。", "Review process/thread memory and byte order, then practice C memory handling and debugging."]];
  const questions = [
  {
    "id": "PY1",
    "domain": "python",
    "domain_zh": "Python编程",
    "domain_en": "Python programming",
    "stem_zh": "Python中执行 a=[1,2]; b=a; b.append(3) 后，len(a)是多少？",
    "stem_en": "In Python, after a=[1,2]; b=a; b.append(3), what is len(a)?",
    "options": [
      {
        "id": "A",
        "text_zh": "2",
        "text_en": "2"
      },
      {
        "id": "B",
        "text_zh": "3",
        "text_en": "3"
      },
      {
        "id": "C",
        "text_zh": "1",
        "text_en": "1"
      },
      {
        "id": "D",
        "text_zh": "报错",
        "text_en": "An error"
      }
    ],
    "answer": "B",
    "explanation_zh": "b和a引用同一个列表。append修改该列表，a也看到第三个元素。",
    "explanation_en": "a and b refer to the same list. append changes that list, so a also sees three elements."
  },
  {
    "id": "PY2",
    "domain": "python",
    "domain_zh": "Python编程",
    "domain_en": "Python programming",
    "stem_zh": "Python执行 total=0; 随后对 i in range(4) 逐次执行 total += i，最终total是多少？",
    "stem_en": "Starting with total=0, add i for every i in range(4). What is the final total?",
    "options": [
      {
        "id": "A",
        "text_zh": "3",
        "text_en": "3"
      },
      {
        "id": "B",
        "text_zh": "4",
        "text_en": "4"
      },
      {
        "id": "C",
        "text_zh": "6",
        "text_en": "6"
      },
      {
        "id": "D",
        "text_zh": "10",
        "text_en": "10"
      }
    ],
    "answer": "C",
    "explanation_zh": "range(4)依次产生0、1、2、3，和为6；不包含4。",
    "explanation_en": "range(4) yields 0, 1, 2 and 3, whose sum is 6. It excludes 4."
  },
  {
    "id": "DS1",
    "domain": "data_structures",
    "domain_zh": "数据结构",
    "domain_en": "Data structures",
    "stem_zh": "对已排序、支持常数时间随机访问的n个元素数组，二分查找最坏时间复杂度是？",
    "stem_en": "What is the worst-case time complexity of binary search on a sorted array of n elements with constant-time random access?",
    "options": [
      {
        "id": "A",
        "text_zh": "O(1)",
        "text_en": "O(1)"
      },
      {
        "id": "B",
        "text_zh": "O(log n)",
        "text_en": "O(log n)"
      },
      {
        "id": "C",
        "text_zh": "O(n)",
        "text_en": "O(n)"
      },
      {
        "id": "D",
        "text_zh": "O(n log n)",
        "text_en": "O(n log n)"
      }
    ],
    "answer": "B",
    "explanation_zh": "每次比较将候选区间约减半，最坏比较次数随log n增长；随机访问是此结论的条件。",
    "explanation_en": "Each comparison roughly halves the remaining interval, requiring logarithmically many comparisons; random access is part of the assumption."
  },
  {
    "id": "DS2",
    "domain": "data_structures",
    "domain_zh": "数据结构",
    "domain_en": "Data structures",
    "stem_zh": "在边权相同的有限无向图中，求起点到各可达顶点的最少边数，通常采用什么？",
    "stem_en": "In a finite undirected graph whose edges have equal weight, which algorithm finds the fewest edges from a source to every reachable vertex?",
    "options": [
      {
        "id": "A",
        "text_zh": "深度优先搜索DFS",
        "text_en": "Depth-first search"
      },
      {
        "id": "B",
        "text_zh": "按顶点编号排序",
        "text_en": "Sort vertices by ID"
      },
      {
        "id": "C",
        "text_zh": "广度优先搜索BFS",
        "text_en": "Breadth-first search"
      },
      {
        "id": "D",
        "text_zh": "只访问起点的邻居",
        "text_en": "Visit only the source neighbors"
      }
    ],
    "answer": "C",
    "explanation_zh": "BFS按距离层扩展，首次发现顶点时的层数就是最少边数。DFS的首次路径一般不最短。",
    "explanation_en": "BFS explores distance layers, so first discovery gives minimum edge count. A first DFS path need not be shortest."
  },
  {
    "id": "DM1",
    "domain": "discrete",
    "domain_zh": "离散数学",
    "domain_en": "Discrete mathematics",
    "stem_zh": "命题“P推出Q”何时为假？",
    "stem_en": "When is the proposition “P implies Q” false?",
    "options": [
      {
        "id": "A",
        "text_zh": "P真且Q假",
        "text_en": "P true and Q false"
      },
      {
        "id": "B",
        "text_zh": "P假且Q真",
        "text_en": "P false and Q true"
      },
      {
        "id": "C",
        "text_zh": "P假且Q假",
        "text_en": "Both false"
      },
      {
        "id": "D",
        "text_zh": "P真且Q真",
        "text_en": "Both true"
      }
    ],
    "answer": "A",
    "explanation_zh": "只有前件为真而后件为假，蕴含才为假；不能把蕴含与双条件混淆。",
    "explanation_en": "An implication is false only when its antecedent is true and its consequent false; it is not a biconditional."
  },
  {
    "id": "DM2",
    "domain": "discrete",
    "domain_zh": "离散数学",
    "domain_en": "Discrete mathematics",
    "stem_zh": "长度为4且恰好含两个1的二进制字符串共有多少个？",
    "stem_en": "How many binary strings of length four contain exactly two ones?",
    "options": [
      {
        "id": "A",
        "text_zh": "4",
        "text_en": "4"
      },
      {
        "id": "B",
        "text_zh": "6",
        "text_en": "6"
      },
      {
        "id": "C",
        "text_zh": "8",
        "text_en": "8"
      },
      {
        "id": "D",
        "text_zh": "16",
        "text_en": "16"
      }
    ],
    "answer": "B",
    "explanation_zh": "从4个位置选2个放1，共C(4,2)=6种；其余位置必须为0。",
    "explanation_en": "Choose two of four positions for the ones: C(4,2)=6. The other positions are zero."
  },
  {
    "id": "CA1",
    "domain": "calculus",
    "domain_zh": "微积分",
    "domain_en": "Calculus",
    "stem_zh": "f(x)=x²sin(x)的导数是？",
    "stem_en": "What is the derivative of f(x)=x²sin(x)?",
    "options": [
      {
        "id": "A",
        "text_zh": "2x cos(x)",
        "text_en": "2x cos(x)"
      },
      {
        "id": "B",
        "text_zh": "x² cos(x)",
        "text_en": "x² cos(x)"
      },
      {
        "id": "C",
        "text_zh": "2x sin(x)+x² cos(x)",
        "text_en": "2x sin(x)+x² cos(x)"
      },
      {
        "id": "D",
        "text_zh": "2x sin(x)−x² cos(x)",
        "text_en": "2x sin(x)−x² cos(x)"
      }
    ],
    "answer": "C",
    "explanation_zh": "乘积法则给出(x²)′sin(x)+x²(sin(x))′，即2x sin(x)+x² cos(x)。",
    "explanation_en": "The product rule gives (x²)′sin(x)+x²(sin(x))′ = 2x sin(x)+x² cos(x)."
  },
  {
    "id": "CA2",
    "domain": "calculus",
    "domain_zh": "微积分",
    "domain_en": "Calculus",
    "stem_zh": "实数p满足什么条件时，从1到正无穷的积分∫x^(−p) dx收敛？",
    "stem_en": "For real p, when does the improper integral of x^(−p) from 1 to positive infinity converge?",
    "options": [
      {
        "id": "A",
        "text_zh": "p>1",
        "text_en": "p>1"
      },
      {
        "id": "B",
        "text_zh": "p≥1",
        "text_en": "p≥1"
      },
      {
        "id": "C",
        "text_zh": "p>0",
        "text_en": "p>0"
      },
      {
        "id": "D",
        "text_zh": "所有实数p",
        "text_en": "Every real p"
      }
    ],
    "answer": "A",
    "explanation_zh": "p>1时积分为1/(p−1)。p=1为对数发散；p<1时上限幂项发散。",
    "explanation_en": "For p>1 the value is 1/(p−1). At p=1 the logarithm diverges; for p<1 the power term diverges."
  },
  {
    "id": "LA1",
    "domain": "linear_algebra",
    "domain_zh": "线性代数",
    "domain_en": "Linear algebra",
    "stem_zh": "矩阵 [[1,2],[2,4]] 的秩是多少？",
    "stem_en": "What is the rank of [[1,2],[2,4]]?",
    "options": [
      {
        "id": "A",
        "text_zh": "0",
        "text_en": "0"
      },
      {
        "id": "B",
        "text_zh": "1",
        "text_en": "1"
      },
      {
        "id": "C",
        "text_zh": "2",
        "text_en": "2"
      },
      {
        "id": "D",
        "text_zh": "4",
        "text_en": "4"
      }
    ],
    "answer": "B",
    "explanation_zh": "第二行是第一行的2倍，且第一行非零，所以恰有一行线性独立，秩为1。",
    "explanation_en": "The second row is twice the first and the first is nonzero. Exactly one row is independent, giving rank one."
  },
  {
    "id": "LA2",
    "domain": "linear_algebra",
    "domain_zh": "线性代数",
    "domain_en": "Linear algebra",
    "stem_zh": "在标准欧氏内积下，向量(2,0)在span{(1,1)}上的正交投影是？",
    "stem_en": "Under the usual Euclidean inner product, what is the orthogonal projection of (2,0) onto span{(1,1)}?",
    "options": [
      {
        "id": "A",
        "text_zh": "(2,0)",
        "text_en": "(2,0)"
      },
      {
        "id": "B",
        "text_zh": "(0,2)",
        "text_en": "(0,2)"
      },
      {
        "id": "C",
        "text_zh": "(2,2)",
        "text_en": "(2,2)"
      },
      {
        "id": "D",
        "text_zh": "(1,1)",
        "text_en": "(1,1)"
      }
    ],
    "answer": "D",
    "explanation_zh": "投影系数为((2,0)·(1,1))/((1,1)·(1,1))=2/2=1，因此投影为(1,1)。",
    "explanation_en": "The projection coefficient is ((2,0)·(1,1))/((1,1)·(1,1))=2/2=1, yielding (1,1)."
  },
  {
    "id": "SY1",
    "domain": "systems",
    "domain_zh": "系统基础",
    "domain_en": "Systems foundations",
    "stem_zh": "通常在同一进程内运行的多个线程，共享以下哪一项？",
    "stem_en": "What do multiple threads in the same process normally share?",
    "options": [
      {
        "id": "A",
        "text_zh": "同一份线程栈",
        "text_en": "One thread stack"
      },
      {
        "id": "B",
        "text_zh": "相同的程序计数器",
        "text_en": "One program counter"
      },
      {
        "id": "C",
        "text_zh": "进程虚拟地址空间",
        "text_en": "The process virtual address space"
      },
      {
        "id": "D",
        "text_zh": "相同的寄存器值",
        "text_en": "Identical register values"
      }
    ],
    "answer": "C",
    "explanation_zh": "同进程线程共享地址空间和堆；各线程仍有自己的执行上下文和栈。",
    "explanation_en": "Threads share the process address space and heap, while each has its own execution context and stack."
  },
  {
    "id": "SY2",
    "domain": "systems",
    "domain_zh": "系统基础",
    "domain_en": "Systems foundations",
    "stem_zh": "将16位整数0x1234按大端序写入两个连续字节，低地址处先放什么？",
    "stem_en": "When the 16-bit integer 0x1234 is stored in two consecutive bytes in big-endian order, what appears at the lower address?",
    "options": [
      {
        "id": "A",
        "text_zh": "0x12",
        "text_en": "0x12"
      },
      {
        "id": "B",
        "text_zh": "0x34",
        "text_en": "0x34"
      },
      {
        "id": "C",
        "text_zh": "0x00",
        "text_en": "0x00"
      },
      {
        "id": "D",
        "text_zh": "取决于正负号",
        "text_en": "It depends on the sign"
      }
    ],
    "answer": "A",
    "explanation_zh": "大端序将最高有效字节放在低地址，因此顺序是0x12、0x34。",
    "explanation_en": "Big-endian order puts the most significant byte first: 0x12, then 0x34."
  }
];

  function diagnose(answerMap) {
    const answers = answerMap && typeof answerMap === 'object' && !Array.isArray(answerMap) ? answerMap : {};
    const known = new Set(questions.map(q => q.id));
    const invalid = Object.keys(answers).filter(k => !known.has(k));
    const domains = DOMAIN_DATA.map(d => {
      let answered = 0, correct = 0;
      for (const q of questions.filter(q => q.domain === d[0])) {
        const a = answers[q.id];
        if (a == null || a === '') continue;
        if (!q.options.some(o => o.id === a)) { invalid.push(q.id); continue; }
        answered++;
        if (a === q.answer) correct++;
      }
      const status = !answered ? 'not_assessed' : answered < 2 ? 'partial' : correct === 2 ? 'ready_sample' : 'review';
      return {id:d[0],label_zh:d[1],label_en:d[2],total:2,answered,correct,status,
        course_ids:d[3].slice(),advice_zh:d[4],advice_en:d[5]};
    });
    const skip = domains[0].correct === 2 && domains[0].answered === 2 ? [{
      id:'HARVARD-CS50P',requires_confirmation:true,
      reason_zh:'这两道Python基础题均答对。可先独立完成一项小程序，再由你决定是否跳过可选入门桥接；CS61A等后续单元仍保留。',
      reason_en:'Both sampled Python basics are correct. Try an independent small program before choosing whether to skip the optional introduction; CS61A and later units remain.'
    }] : [];
    return {total:12,answered:domains.reduce((n,d)=>n+d.answered,0),correct:domains.reduce((n,d)=>n+d.correct,0),
      invalid_answers:[...new Set(invalid)].sort(),domains,
      weak_domains:domains.filter(d=>d.status==='review'||d.status==='partial').map(d=>d.id),
      skip_candidates:skip,auto_completed:[],
      notice_zh:'每类仅抽查2题。结果用于挑选补练内容；课程完成状态由你单独记录。',
      notice_en:'Two questions sample each area. Use the result to choose practice; record course completion separately.'};
  }

  function empty(status, errors = [], completed = []) {
    return {status,blocked:status!=='ok',rows:[],completed:completed.slice(),order:[],changeCost:null,
      previousOrder:[],required_units:[],unavailable_required:[],affected_units:[],suggestions:[],bounds:{},proof:null,errors};
  }

  function replan(data, options = {}) {
    const o = options, list = [...(data.courses||[]),...(data.bridge_units||[]),...(data.project_units||[])];
    const nodes = new Map(list.map(n=>[n.id,n])), errors = [];
    if (nodes.size !== list.length) errors.push('duplicate learning unit ID');
    const budget = o.budget ?? 12, goal = o.goal ?? 'systems', level = o.level ?? 'beginner', bound = o.bound ?? 'mid';
    if (typeof budget !== 'number' || !Number.isFinite(budget) || budget<2 || budget>40) errors.push('weekly budget must be a finite number from 2 to 40');
    if (!Object.hasOwn(data.paths||{},goal)) errors.push('unknown goal '+String(goal));
    if (!['beginner','experienced'].includes(level)) errors.push('unknown level '+String(level));
    if (!['low','mid','high'].includes(bound)) errors.push('unknown workload bound '+String(bound));
    const seqs = {};
    for (const key of ['completed','previousOrder','unavailable']) {
      let seq = o[key] ?? [];
      if (!Array.isArray(seq) || seq.some(x=>typeof x!=='string')) { errors.push(key+' must be an array of IDs'); seq=[]; }
      if (new Set(seq).size!==seq.length) errors.push('duplicate ID in '+key);
      for (const k of seq) if (!nodes.has(k)) errors.push('unknown '+key+' node '+k);
      seqs[key] = seq.slice();
    }
    const completed = seqs.completed, done = new Set(completed);
    const before = new Map([...nodes.keys()].map(k=>[k,new Set()])), after = new Map([...nodes.keys()].map(k=>[k,new Set()]));
    const edges = [...(data.prerequisite_edges||[]),...(o.extraEdges||[])];
    for (const e of edges) {
      if ((e.type??'required')!=='required') continue;
      const a=e.from,b=e.to;
      if (!nodes.has(a)||!nodes.has(b)) errors.push('unknown prerequisite edge '+String(a)+' -> '+String(b));
      else { before.get(b).add(a);after.get(a).add(b); }
    }
    const seen=new Set(),active=new Set();
    function cycle(k) {
      if (active.has(k)) return true;
      if (seen.has(k)) return false;
      active.add(k);
      for (const p of [...before.get(k)].sort()) if (cycle(p)) return true;
      active.delete(k);seen.add(k);return false;
    }
    if ([...nodes.keys()].sort().some(k=>!seen.has(k)&&cycle(k))) errors.push('prerequisite cycle');
    if (errors.length) return empty('invalid',[...new Set(errors)].sort(),completed);
    let targets=data.paths[goal];
    if (level==='experienced') targets=targets.filter(k=>k!=='HARVARD-CS50P');
    const required=new Set();
    function include(k) {
      if (!nodes.has(k)) { errors.push('unknown goal node '+String(k));return; }
      if (done.has(k)||required.has(k)) return;
      required.add(k);
      for (const p of [...before.get(k)].sort()) include(p);
    }
    targets.forEach(include);
    if (errors.length) return empty('invalid',[...new Set(errors)].sort(),completed);
    const ids=[...required].sort();
    if (ids.length>20) return empty('invalid',['exact replanning supports at most 20 remaining units'],completed);
    const old=seqs.previousOrder.filter(k=>required.has(k)), unavailable=seqs.unavailable.filter(k=>required.has(k)).sort();
    if (unavailable.length) {
      const impacted=new Set(unavailable),stack=unavailable.slice();
      while(stack.length) for (const child of after.get(stack.pop())) if (required.has(child)&&!impacted.has(child)) { impacted.add(child);stack.push(child); }
      return {...empty('blocked',[],completed),previousOrder:old,required_units:ids,unavailable_required:unavailable,affected_units:[...impacted].sort(),
        suggestions:[{kind:'restore_or_verify_equivalent',ids:unavailable,
          message_zh:'先恢复这些必需单元，或核验等价学习材料并更新课程资料；再重新排程。当前不将受阻课程删除或记为完成。',
          message_en:'Restore these required units or verify equivalent materials and update the course record, then replan. Blocked units are neither removed nor marked complete.'}]};
    }
    for (const k of ids) {
      const h=nodes.get(k).workload_hours||{},lo=h.low,hi=h.high;
      if (![lo,hi].every(x=>typeof x==='number'&&Number.isFinite(x))||!(0<lo&&lo<=hi)) errors.push('invalid workload for '+k);
    }
    if (errors.length) return empty('invalid',errors,completed);
    const n=ids.length,index=new Map(ids.map((k,i)=>[k,i])),rank=new Map(old.map((k,i)=>[k,i]));
    const pred=ids.map(k=>[...before.get(k)].reduce((m,p)=>required.has(p)?m|(1<<index.get(p)):m,0));
    const invMasks=ids.map(k=>rank.has(k)?old.reduce((m,j)=>rank.get(j)>rank.get(k)?m|(1<<index.get(j)):m,0):0);
    const full=(1<<n)-1,inf=65535,cost=new Uint16Array(full+1),popcount=new Uint8Array(full+1);
    cost.fill(inf);cost[full]=0;
    for(let m=1;m<=full;m++)popcount[m]=popcount[m>>1]+(m&1);
    let visited=0;
    for(let mask=full-1;mask>=0;mask--) {
      let ideal=true;
      for(let i=0;i<n;i++)if((mask&(1<<i))&&(pred[i]&mask)!==pred[i]){ideal=false;break;}
      if(!ideal)continue;
      visited++;
      let best=inf;
      for(let i=0;i<n;i++) {
        const bit=1<<i;
        if((mask&bit)||(pred[i]&mask)!==pred[i])continue;
        const value=popcount[mask&invMasks[i]]+cost[mask|bit];
        if(value<best)best=value;
      }
      cost[mask]=best;
    }
    let mask=0,cumulative=0;const order=[],certificate=[];
    while(mask!==full) {
      let found=false;
      for(let i=0;i<n;i++) {
        const bit=1<<i;
        if((mask&bit)||(pred[i]&mask)!==pred[i])continue;
        const inc=popcount[mask&invMasks[i]];
        if(cost[mask]===inc+cost[mask|bit]) {
          order.push(ids[i]);cumulative+=inc;certificate.push({id:ids[i],increment:inc,cumulative_cost:cumulative});
          mask|=bit;found=true;break;
        }
      }
      if(!found)return empty('invalid',['no feasible topological continuation'],completed);
    }
    const rows=[],totals={low:0,mid:0,high:0};let cursor=0;
    for(const k of order) {
      const h=nodes.get(k).workload_hours,vals={low:h.low,mid:Math.floor((h.low+h.high)/2+0.5),high:h.high};
      for(const b of Object.keys(totals))totals[b]+=vals[b];
      const hours=vals[bound],start=cursor;cursor+=hours;
      rows.push({id:k,hours,start_hour:start,end_hour:cursor,start_week:Math.floor(start/budget)+1,end_week:Math.ceil(cursor/budget)});
    }
    return {status:'ok',blocked:false,rows,completed:completed.slice(),order,changeCost:cost[0],previousOrder:old,required_units:ids,
      unavailable_required:[],affected_units:[],suggestions:[],errors:[],
      bounds:Object.fromEntries(Object.entries(totals).map(([b,v])=>[b,{total_hours:v,total_weeks:Math.ceil(v/budget)}])),
      proof:{method:'subset_dynamic_programming',objective:'Kendall inversions among surviving previous-order units; lexicographic ID tie-break',
        optimal_cost:cost[0],remaining_nodes:n,visited_states:visited+1,certificate,
        recurrence_zh:'F(S)=min_v[已选旧单元中原排在v之后的数量+F(S并{v})]；v须先修已满足，F(全集)=0。按位掩码数值倒序求解，每个后继掩码均更大；每对旧单元的逆序恰在后放入者处计一次，故递推覆盖全部可行拓扑序且得到全局最小值。新单元无旧成对顺序。预算只缩放串行周数，不改变此排序目标。',
        recurrence_en:'F(S)=min_v[number of selected old units originally after v + F(S union {v})], over prerequisite-ready v, with F(all)=0. Backward subset DP covers all feasible topological orders. Each inverted old pair is charged exactly once when its second member is appended. New units have no previous pair order. The weekly budget rescales serial weeks, not this ordering objective.'}};
  }
  root.CS_ADAPTIVE=Object.freeze({questions,diagnose,replan});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.CS_ADAPTIVE;
})(typeof window!=='undefined'?window:globalThis);
