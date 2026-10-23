(function (global) {
  'use strict';
  let sequence = 0;
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = (lang, zh, en) => lang === 'en' ? en : zh;
  const list = value => value == null ? [] : Object.prototype.toString.call(value) === '[object Set]' ? [...value] : Array.isArray(value) ? value : typeof value === 'object' ? Object.keys(value).filter(id => value[id]) : [value];
  const ids = value => new Set(list(value).map(item => String(item && typeof item === 'object' ? item.id : item)));
  const title = (node, lang) => String(node['title_' + lang] || node.title_en || node.title_zh || node.title || node.id);
  const statusText = (state, lang) => ({completed:text(lang,'已完成','Completed'),next:text(lang,'下一门可学','Ready next'),planned:text(lang,'待学习','Planned'),unavailable:text(lang,'课程暂不可用','Unavailable'),blocked:text(lang,'先修受阻','Prerequisite blocked')})[state];
  const weekText = (node, lang) => Number.isFinite(node.start_week) && Number.isFinite(node.end_week) ? text(lang,'第 ' + node.start_week + '–' + node.end_week + ' 周','Weeks ' + node.start_week + '–' + node.end_week) : '';

  function layout(options) {
    const input = options || {}, lang = input.lang === 'en' ? 'en' : 'zh';
    const raw = Array.isArray(input.nodes) ? input.nodes : [];
    const rows = Array.isArray(input.rows) ? input.rows : [];
    const completed = ids(input.completed), unavailable = ids(input.unavailable);
    const lookup = new Map(), rowById = new Map();
    rows.forEach(row => { if (row && row.id != null) rowById.set(String(row.id), row); });
    raw.forEach((node, index) => {
      if (!node || node.id == null || String(node.id).trim() === '') throw new Error(text(lang,'路线包含缺少 ID 的学习单元。','A learning unit has no ID.'));
      const id = String(node.id);
      if (lookup.has(id)) throw new Error(text(lang,'路线 ID 重复：','Duplicate learning unit ID: ') + id);
      lookup.set(id, {...node, id, input_index:index, predecessors:[], successors:[], depth:0});
    });
    const unique = new Set(), edges = [];
    (Array.isArray(input.edges) ? input.edges : []).forEach(edge => {
      if (!edge || (edge.type && edge.type !== 'required')) return;
      const from = String(edge.from == null ? edge.source : edge.from), to = String(edge.to == null ? edge.target : edge.to);
      if (!lookup.has(from) || !lookup.has(to)) throw new Error(text(lang,'先修关系缺少对应课程：','A prerequisite refers to a missing learning unit: ') + from + ' → ' + to);
      const key = JSON.stringify([from,to]);
      if (unique.has(key)) return;
      unique.add(key); edges.push({from,to});
      lookup.get(from).successors.push(to); lookup.get(to).predecessors.push(from);
    });
    const rowOrder = new Map(rows.map((row,index) => [String(row.id),index]));
    const order = (a,b) => (rowOrder.get(a) ?? Number.MAX_SAFE_INTEGER) - (rowOrder.get(b) ?? Number.MAX_SAFE_INTEGER) || lookup.get(a).input_index - lookup.get(b).input_index;
    const indegree = new Map([...lookup].map(([id,node]) => [id,node.predecessors.length]));
    const queue = [...lookup.keys()].filter(id => indegree.get(id) === 0).sort(order), sorted = [];
    while (queue.length) {
      const id = queue.shift(), node = lookup.get(id); sorted.push(node);
      node.successors.forEach(next => {
        lookup.get(next).depth = Math.max(lookup.get(next).depth,node.depth + 1);
        indegree.set(next,indegree.get(next) - 1);
        if (indegree.get(next) === 0) { queue.push(next); queue.sort(order); }
      });
    }
    if (sorted.length !== lookup.size) throw new Error(text(lang,'先修关系存在循环，请先修正路线。','The prerequisite graph has a cycle. Correct the route first.'));
    sorted.forEach(node => {
      node.state = completed.has(node.id) ? 'completed' : unavailable.has(node.id) ? 'unavailable' : node.predecessors.some(id => ['unavailable','blocked'].includes(lookup.get(id).state)) ? 'blocked' : 'planned';
      const row = rowById.get(node.id) || {};
      if (Number.isFinite(row.start_week)) node.start_week = row.start_week;
      if (Number.isFinite(row.end_week)) node.end_week = row.end_week;
    });
    const next = [...sorted].sort((a,b) => order(a.id,b.id)).find(node => node.state === 'planned' && node.predecessors.every(id => completed.has(id)));
    if (next) next.state = 'next';
    const groups = new Map();
    sorted.forEach(node => { if (!groups.has(node.depth)) groups.set(node.depth,[]); groups.get(node.depth).push(node); });
    let visualRow = 0;
    [...groups.keys()].sort((a,b) => a-b).forEach(depth => {
      const group = groups.get(depth).sort((a,b) => order(a.id,b.id));
      for (let first=0;first<group.length;first+=3) {
        const chunk = group.slice(first,first+3), left = (840 - (chunk.length*204 + (chunk.length-1)*30))/2;
        chunk.forEach((node,column) => Object.assign(node,{x:left + column*234,y:38 + visualRow*166,width:204,height:116,visual_row:visualRow}));
        visualRow++;
      }
    });
    return {nodes:sorted,edges:edges.map(edge => ({...edge,state:['unavailable','blocked'].includes(lookup.get(edge.to).state) ? 'blocked' : completed.has(edge.from) ? 'completed' : 'planned'})),width:840,height:Math.max(162,visualRow*166+30),next_id:next ? next.id : null,lang};
  }

  function wrapTitle(value, lang) {
    const limit = lang === 'en' ? 25 : 13, chars = [...value], lines=[];
    while (chars.length && lines.length < 2) lines.push(chars.splice(0,limit).join(''));
    if (chars.length) lines[1] = [...lines[1]].slice(0,-1).join('') + '…';
    return lines;
  }

  function render(options) {
    const lang = options && options.lang === 'en' ? 'en' : 'zh';
    let graph;
    try { graph = layout(options); } catch (error) { return '<div class="cs-route-error" role="alert">' + escape(error.message) + '</div>'; }
    if (!graph.nodes.length) return '<div class="cs-route-empty">' + text(lang,'这条路线暂时没有学习单元。','This path has no learning units yet.') + '</div>';
    const uid = 'cs-route-' + (++sequence), lookup = new Map(graph.nodes.map(node => [node.id,node]));
    const arrow = edge => {
      const from=lookup.get(edge.from), to=lookup.get(edge.to), sx=from.x+102, sy=from.y+116, tx=to.x+102, ty=to.y;
      const distance=to.visual_row-from.visual_row;
      let d;
      if (distance === 1) d='M '+sx+' '+sy+' C '+sx+' '+(sy+25)+' '+tx+' '+(ty-25)+' '+tx+' '+(ty-5);
      else {
        const index=graph.edges.indexOf(edge), lane=index%2 ? 802+(index%4)*6 : 38-(index%4)*6;
        d='M '+sx+' '+sy+' V '+(sy+16)+' H '+lane+' V '+(ty-19)+' H '+tx+' V '+(ty-5);
      }
      return '<path class="cs-route-edge '+edge.state+'" d="'+d+'" marker-end="url(#'+uid+'-arrow)"><title>'+escape(from.id+' → '+to.id)+'</title></path>';
    };
    const nodes=graph.nodes.map(node => {
      const fullTitle=title(node,lang), words=wrapTitle(fullTitle,lang), status=statusText(node.state,lang), weeks=weekText(node,lang);
      const accessible=node.id+' · '+fullTitle+' · '+status+(weeks ? ' · '+weeks : '');
      return '<a class="cs-route-node '+node.state+'" href="#course/'+escape(encodeURIComponent(node.id))+'" tabindex="0" aria-label="'+escape(accessible)+'"><title>'+escape(accessible)+'</title><rect x="'+node.x+'" y="'+node.y+'" width="204" height="116" rx="12"/><text class="cs-route-code" x="'+(node.x+13)+'" y="'+(node.y+22)+'">'+escape(node.id)+'</text>'+words.map((word,index)=>'<text class="cs-route-name" x="'+(node.x+13)+'" y="'+(node.y+44+index*18)+'">'+escape(word)+'</text>').join('')+'<text class="cs-route-status" x="'+(node.x+13)+'" y="'+(node.y+88)+'">'+escape(status)+'</text><text class="cs-route-week" x="'+(node.x+13)+'" y="'+(node.y+104)+'">'+escape(weeks)+'</text></a>';
    }).join('');
    const legend=['completed','next','planned','unavailable','blocked'].map(state => '<span class="cs-route-key '+state+'"><i aria-hidden="true"></i>'+statusText(state,lang)+'</span>').join('');
    return '<style>.cs-route-legend{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0;font:12px system-ui,sans-serif;color:#4d5d59}.cs-route-key{display:inline-flex;align-items:center;gap:5px}.cs-route-key i{display:inline-block;width:9px;height:9px;border-radius:50%;background:#b8c9c2}.cs-route-key.completed i{background:#23806c}.cs-route-key.next i{background:#d49c29}.cs-route-key.unavailable i,.cs-route-key.blocked i{background:#b76c5a}.cs-route-viewport{max-height:600px;overflow:auto;border:1px solid #e1e8e3;border-radius:14px;background:#f8fbf9}.cs-route-viewport svg{display:block;width:100%;min-width:740px;height:auto}.cs-route-edge{fill:none;stroke:#bbc9c2;stroke-width:1.5;opacity:.8}.cs-route-edge.completed{stroke:#4b9b85}.cs-route-edge.blocked{stroke:#ba8e80;stroke-dasharray:5 5}.cs-route-node rect{fill:#fff;stroke:#bfcfc5;stroke-width:1.5}.cs-route-node.completed rect{fill:#edf7f1;stroke:#5a9e87}.cs-route-node.next rect{fill:#fff8e5;stroke:#d49c29;stroke-width:2}.cs-route-node.unavailable rect,.cs-route-node.blocked rect{fill:#fff2ed;stroke:#bb8979;stroke-dasharray:5 3}.cs-route-node:focus{outline:none}.cs-route-node:hover rect,.cs-route-node:focus rect{stroke:#183f34;stroke-width:3}.cs-route-node text{font-family:system-ui,-apple-system,sans-serif;fill:#233d33;pointer-events:none}.cs-route-code{font-size:11px;font-weight:700}.cs-route-name{font-size:13px;font-weight:600}.cs-route-status{font-size:11px;font-weight:600}.cs-route-week{font-size:10px;fill:#61716a!important}.cs-route-error,.cs-route-empty{padding:18px;border:1px solid #e4cec2;border-radius:12px;color:#745143;background:#fff8f2}.cs-route-hint{font:12px system-ui,sans-serif;color:#64716a;margin:10px 0}</style><div class="cs-route-legend" aria-label="'+text(lang,'学习状态','Learning status')+'">'+legend+'</div><div class="cs-route-viewport" tabindex="0" aria-label="'+text(lang,'可滚动的学习路线图','Scrollable learning path')+'"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+graph.width+' '+graph.height+'" width="'+graph.width+'" height="'+graph.height+'" role="group" aria-labelledby="'+uid+'-title '+uid+'-desc"><title id="'+uid+'-title">'+text(lang,'学习路线与先修关系','Learning path and prerequisites')+'</title><desc id="'+uid+'-desc">'+escape(text(lang,'箭头由先修指向后续课程。节点显示学习状态与预计学习周；按 Tab 选择课程，按回车打开课程详情。','Arrows point from prerequisites to later courses. Nodes show status and estimated study weeks. Press Tab to select a course and Enter to open its details.'))+'</desc><defs><marker id="'+uid+'-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 8 4 L 0 8 Z" fill="#829a8b"/></marker></defs>'+graph.edges.map(arrow).join('')+nodes+'</svg></div><p class="cs-route-hint">'+text(lang,'箭头表示当前路线的必需先修；学习周按下方排程更新。点击节点查看课程。','Arrows show required prerequisites within this path. Study weeks follow the schedule below. Select a node for course details.')+'</p>';
  }

  global.CS_ROUTE_MAP={layout,render};
})(typeof window !== 'undefined' ? window : globalThis);
