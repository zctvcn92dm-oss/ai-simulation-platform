const state = {
  role: 'student',
  view: 'dashboard',
  track: '成长赛道',
  mode: '正式模拟',
  fileUploaded: false,
  form: { major: '计算机科学与技术', grade: '大三', targetCareer: '产品经理', industry: '数字教育' },
  presentationSlide: 1,
  presentationSeconds: 420,
  presentationTimer: null,
  judgeIndex: 0,
  questionIndex: 0,
  messages: [],
  reportTab: 'overview',
  timelineFilter: '全部',
  replayTime: 258,
  replayPlaying: false,
  replayTimer: null,
  selectedQuestion: 0,
  toast: ''
};

const navStudent = [
  ['dashboard','⌂','工作台'], ['teacher-trial','▤','师范生模拟试讲'], ['competition','◈','职规赛模拟答辩'],
  ['records','▱','我的训练'], ['special','◎','专项训练']
];
const navTeacher = [['teacher','⌂','教师工作台'],['tasks','▣','训练任务'],['students','♙','学生报告'],['class-analysis','◫','班级分析']];
const judges = [
  {name:'赛事规则评委', short:'规则', icon:'规', focus:'评分标准匹配、材料完整性和证据可信度'},
  {name:'生涯教育评委', short:'生涯', icon:'涯', focus:'自我认知、职业目标、行动路径与动态调整'},
  {name:'行业企业评委', short:'行业', icon:'企', focus:'行业理解、岗位胜任力与实践成果'},
  {name:'高校就业评委', short:'就业', icon:'校', focus:'专业学习、就业准备与学校资源利用'},
  {name:'综合表达评委', short:'表达', icon:'言', focus:'PPT逻辑、表达效果、临场反应与时间控制'}
];
const questions = [
  ['你的目标职业是产品经理。PPT第4页提到“服务10万名学生”，请说明该数据的来源，以及你本人在项目中承担的具体职责。','如果无法提供10万名学生的直接后台数据，你会如何修改这项成果表述，使其真实、准确且仍有说服力？'],
  ['你将数字教育产品经理作为目标职业，自我认知部分主要依据兴趣测评。除了兴趣，你还有哪些经历能够证明这一选择具有稳定性？','如果未来行业环境变化，你会依据哪些信号调整职业目标，而不是简单坚持原计划？'],
  ['请从用人单位角度说明：你目前与一名合格教育产品经理之间最大的能力差距是什么？未来半年如何用可验证的成果弥补？','你的计划中提到学习AI应用，请给出一个教育场景中的具体产品问题，并说明你准备怎样验证需求。'],
  ['你的专业学习与目标职业之间如何形成支撑关系？请分别举出一门课程、一次实践和一项学校资源。','如果学校资源无法直接提供产品实习机会，你会如何主动构建替代性的实践经历？'],
  ['你的陈述用了6分42秒，其中行动成果部分信息较密。请用60秒重新概括“目标、行动、结果、反思”四个要点。','刚才的回答仍然偏重过程，请只保留能够证明岗位胜任力的三项结果。']
];

function setView(view){
  if(state.presentationTimer){ clearInterval(state.presentationTimer); state.presentationTimer = null; }
  if(state.replayTimer){ clearInterval(state.replayTimer); state.replayTimer = null; state.replayPlaying = false; }
  state.view=view; window.scrollTo(0,0); render();
}
function setRole(role){ state.role=role; setView(role==='teacher'?'teacher':'dashboard'); }
function showToast(message){ state.toast=message; render(); setTimeout(()=>{state.toast='';render()},1800); }
function button(label, action, variant=''){ return `<button class="button ${variant}" onclick="${action}">${label}</button>`; }

function shell(content){
  const nav = state.role==='student'?navStudent:navTeacher;
  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">AI</span><span>AI模拟演练</span></div>
      <nav class="nav">${nav.map(([id,icon,label])=>`<button class="nav-button ${state.view===id?'active':''}" onclick="setView('${id}')"><span class="nav-icon">${icon}</span><span>${label}</span></button>`).join('')}</nav>
      <div class="sidebar-footer"><div class="small-label">当前学校</div><div class="school-name">云研大学</div></div>
    </aside>
    <section class="content-shell">
      <header class="topbar">
        <button class="button icon-button mobile-menu" aria-label="打开菜单">☰</button>
        <div class="topbar-title">${state.role==='student'?'学生训练中心':'教师指导中心'}</div>
        <div class="topbar-actions">
          <div class="role-switch"><button class="${state.role==='student'?'active':''}" onclick="setRole('student')">学生</button><button class="${state.role==='teacher'?'active':''}" onclick="setRole('teacher')">教师</button></div>
          <div class="avatar">杨</div>
        </div>
      </header>
      <main class="main">${content}</main>
    </section>
    ${state.toast?`<div class="toast">${state.toast}</div>`:''}
  </div>`;
}

function dashboard(){
  return shell(`<div class="page-header"><div><h1>AI模拟演练</h1><p>围绕真实场景持续训练，让每一次表达都有证据、有反馈、有进步。</p></div><div class="header-actions">${button('查看训练记录',"setView('records')")}${button('创建职规赛训练',"setView('competition')",'primary')}</div></div>
  <section class="module-grid">
    ${moduleCard('primary-module','▤','师范生模拟试讲','面向教师资格证与师范技能比赛，完成抽题、备课、试讲和教学评价。','最近训练：认识轴对称图形','68%',"setView('teacher-trial')",'继续训练')}
    ${moduleCard('competition-module','◈','职规赛模拟答辩','上传参赛PPT，由五位AI评委依据赛道规则进行陈述评审与连续追问。','成长赛道材料已完善','82%',"setView('competition')",'创建训练')}
  </section>
  <section class="dashboard-grid">
    <div class="panel"><div class="panel-header"><h2>最近训练</h2><button class="text-link" onclick="setView('records')">查看全部</button></div><div class="training-list">
      ${trainingRow('数字教育产品经理成长规划','职规赛模拟答辩 · 成长赛道','今天 09:20','86','查看报告')}
      ${trainingRow('认识轴对称图形','师范生模拟试讲 · 小学数学','10月12日','82','继续训练')}
      ${trainingRow('行业理解专项追问','专项训练 · 行业企业评委','10月10日','78','再次训练')}
    </div></div>
    <div class="panel"><div class="panel-header"><h2>能力趋势</h2><span class="small-label">近5次训练</span></div><div class="panel-body ability-list">${[['专业知识',78],['职业认知',86],['逻辑表达',82],['临场应变',74],['时间控制',89]].map(([n,v])=>`<div class="ability-row"><span>${n}</span><div class="ability-bar"><span style="width:${v}%"></span></div><b>${v}</b></div>`).join('')}</div></div>
    <div class="panel"><div class="panel-header"><h2>推荐专项训练</h2><button class="text-link" onclick="setView('special')">更多训练</button></div><div class="panel-body recommend-list">
      ${recommend('证','成果证据核验','识别模糊成果与数据风险','12分钟')}${recommend('答','高压连续追问','训练临场反应与回答聚焦','15分钟')}${recommend('业','行业专业知识','补齐目标岗位的专业认知','10分钟')}
    </div></div>
    <div class="panel"><div class="panel-header"><h2>本周训练建议</h2></div><div class="panel-body"><p style="margin-top:0;line-height:1.8;color:var(--muted);font-size:13px">你的时间控制表现稳定，但面对证据核验类追问时回答容易泛化。建议先完成“成果证据核验”，再进行一次成长赛道正式模拟。</p>${button('开始专项训练',"setView('special')",'secondary')}</div></div>
  </section>`);
}
function moduleCard(cls,icon,title,desc,status,progress,action,cta){return `<article class="module-card ${cls}"><div class="module-icon">${icon}</div><div><h2>${title}</h2><p>${desc}</p><div class="status-row"><span>${status}</span><div class="progress"><span style="width:${progress}"></span></div></div></div>${button(cta,action,'secondary')}</article>`}
function trainingRow(title,meta,date,score,action){return `<div class="training-row"><div><div class="training-title">${title}</div><div class="training-meta">${meta}</div></div><span class="muted">${date}</span><strong class="score">${score}</strong><button class="text-link" onclick="setView('${action==='查看报告'?'report':'competition'}')">${action}</button></div>`}
function recommend(icon,title,desc,time){return `<div class="recommend-item"><div class="recommend-icon">${icon}</div><div><strong>${title}</strong><p>${desc}</p></div><span class="small-label">${time}</span></div>`}

function teacherTrial(){return shell(`<div class="page-header"><div><h1>师范生模拟试讲</h1><p>延续现有抽题与教学演练流程，并修复启动异常与页面横向溢出。</p></div>${button('开始智能抽题',"showToast('已创建小学数学试讲：认识轴对称图形')",'primary')}</div><div class="panel"><div class="panel-header"><h2>训练配置</h2><span class="tag">教师资格证考试</span></div><div class="panel-body form-grid"><div class="field"><label>试讲学科</label><select><option>小学数学</option><option>语文</option><option>数学</option></select></div><div class="field"><label>试讲受众</label><select><option>小学生</option></select></div><div class="field"><label>试讲时长</label><select><option>5分钟</option><option>10分钟</option></select></div><div class="field"><label>课件材料</label><div class="file-card"><span>轴对称图形教学课件.pptx</span><span class="tag">已解析</span></div></div></div><div class="form-actions">${button('查看历史记录',"setView('records')")}${button('开始试讲',"showToast('试讲环境检测完成，可正常开始')",'primary')}</div></div>`)}

function competition(){
  return shell(`<div class="page-header"><div><h1>创建职规赛模拟答辩</h1><p>材料将用于赛前诊断、陈述分析和五位AI评委针对性追问。</p></div><span class="tag cyan">规则模板：第三届国赛·平台示例版 V1.0</span></div>
  <div class="wizard"><aside class="steps">${['基本信息','上传材料','赛前诊断','PPT陈述','评委答辩','训练报告'].map((x,i)=>`<div class="step ${i===0?'active':''}"><span class="step-index">${i+1}</span><span>${x}</span></div>`).join('')}</aside>
  <section class="form-panel"><div class="form-section"><h2>选择训练场景</h2><p class="section-help">成长赛道与就业赛道使用独立的材料要求、问题策略和评价量表。</p><div class="segment"><button class="${state.track==='成长赛道'?'active':''}" onclick="state.track='成长赛道';render()"><strong>成长赛道</strong><span>重点评价职业目标、学习实践行动与动态调整</span></button><button class="${state.track==='就业赛道'?'active':''}" onclick="state.track='就业赛道';render()"><strong>就业赛道</strong><span>重点评价岗位胜任力、求职实战与发展潜力</span></button></div></div>
  <div class="form-section"><h2>参赛信息</h2><p class="section-help">结构化信息将和PPT内容共同用于生成专业化追问。</p><div class="form-grid">
    ${field('专业','major')}${field('年级','grade')}${field('目标职业','targetCareer')}${field('目标行业','industry')}
    <div class="field full"><label>训练模式</label><div class="segment"><button class="${state.mode==='正式模拟'?'active':''}" onclick="state.mode='正式模拟';render()"><strong>正式模拟</strong><span>完整陈述后集中答辩，严格跟随规则模板</span></button><button class="${state.mode==='专项训练'?'active':''}" onclick="state.mode='专项训练';render()"><strong>专项训练</strong><span>聚焦专业知识、证据核验或临场应变</span></button></div></div>
  </div></div>
  <div class="form-section"><h2>上传参赛PPT</h2><p class="section-help">原型使用本地模拟文件，不会上传真实材料。</p>${state.fileUploaded?`<div class="file-card"><div><strong>数字教育产品经理成长规划.pptx</strong><div class="training-meta">18页 · 24.6 MB · 已生成材料版本 V3</div></div><div><span class="tag">解析完成</span> <button class="text-link" onclick="state.fileUploaded=false;render()">重新选择</button></div></div>`:`<div class="upload-zone"><strong>选择PPT文件或拖入此处</strong><p>支持 PPT、PPTX，建议控制在100MB以内</p>${button('模拟上传PPT',"state.fileUploaded=true;showToast('PPT解析完成，已生成材料版本 V3')",'secondary')}</div>`}</div>
  <div class="form-actions">${button('保存草稿',"showToast('草稿已保存')")}${button('开始赛前诊断',"startDiagnosis()",'primary')}</div></section></div>`);
}
function field(label,key){return `<div class="field"><label>${label} <span class="required">*</span></label><input value="${state.form[key]}" oninput="state.form.${key}=this.value" /></div>`}
function startDiagnosis(){ if(!state.fileUploaded){showToast('请先上传参赛PPT');return;} setView('diagnosis'); }

function diagnosis(){return shell(`<div class="page-header"><div><h1>赛前诊断</h1><p>${state.track} · 材料版本 V3 · 规则模板 V1.0</p></div><div class="header-actions">${button('返回修改',"setView('competition')")}${button('查看录制说明',"setView('consent')",'primary')}</div></div>
  <div class="diagnosis-summary"><div class="metric success"><span class="small-label">材料完整度</span><div class="metric-value">92%</div></div><div class="metric success"><span class="small-label">指标覆盖</span><div class="metric-value">8/10</div></div><div class="metric warning"><span class="small-label">高风险表述</span><div class="metric-value">2项</div></div><div class="metric"><span class="small-label">预计陈述时长</span><div class="metric-value">6'40"</div></div></div>
  <div class="panel"><div class="panel-header"><h2>材料检查结果</h2><span class="small-label">不会提前展示完整评委问题</span></div><div class="panel-body check-list">
    ${check('职业目标与专业关联','目标职业、行业方向和专业学习之间关系清晰。','已覆盖')}
    ${check('学习实践行动','PPT第8至12页包含课程、项目、实习与复盘证据。','已覆盖')}
    ${check('成果数据可信度','PPT第14页“服务10万名学生”缺少来源说明，可能触发证据核验。','需完善',true)}
    ${check('动态调整机制','已说明调整方向，但尚未给出触发调整的量化信号。','需完善',true)}
    ${check('陈述结构与时间','内容结构完整，预计比模板建议时长多40秒。','关注',true)}
  </div></div>`)}
function check(title,desc,status,warn=false){return `<div class="check-item"><div class="check-state ${warn?'warn':''}">${warn?'!':'✓'}</div><div><h3>${title}</h3><p>${desc}</p></div><span class="tag ${warn?'amber':''}">${status}</span></div>`}

function consent(){return shell(`<div class="page-header"><div><h1>录制与AI分析说明</h1><p>开始演练前，请确认本次采集范围、使用目的和保存规则。</p></div></div><div class="panel consent-panel"><div class="panel-body"><div class="consent-intro"><div class="consent-icon">●</div><div><h2>本次演练将生成全过程复盘报告</h2><p>系统将同步记录PPT、学生摄像头、麦克风、翻页时间、评委问题与回答事件，用于训练反馈。</p></div></div><div class="consent-grid">${consentItem('采集内容','摄像头画面、麦克风声音、PPT画面、陈述转写与答辩记录')}${consentItem('分析维度','内容表达、言语表现、表情状态、仪态表现与临场应变')}${consentItem('查看人员','学生本人和任务授权范围内的指导教师')}${consentItem('保存规则','视频默认保存180天，可主动删除；文字报告可选择保留')}${consentItem('使用边界','不进行身份识别、心理诊断、疾病判断或基于外貌推断性格')}${consentItem('报告导出','PDF仅包含评分、建议与关键帧，视频只在站内受控播放')}</div><label class="consent-check"><input id="consent-check" type="checkbox" onchange="document.getElementById('consent-next').disabled=!this.checked"/><span>我已阅读并同意本次演练录制与AI训练分析说明</span></label></div><div class="form-actions">${button('返回诊断',"setView('diagnosis')")}<button id="consent-next" class="button primary" disabled onclick="setView('device')">同意并进入设备检测</button></div></div>`)}
function consentItem(title,desc){return `<div class="consent-item"><strong>${title}</strong><p>${desc}</p></div>`}

function device(){return shell(`<div class="page-header"><div><h1>演练环境检测</h1><p>摄像头、麦克风与PPT状态仅作原型模拟，不会调用真实设备。</p></div></div><div class="panel"><div class="panel-body"><div class="diagnosis-summary"><div class="metric success"><span class="small-label">摄像头</span><div class="metric-value">正常</div></div><div class="metric success"><span class="small-label">麦克风</span><div class="metric-value">正常</div></div><div class="metric success"><span class="small-label">PPT</span><div class="metric-value">18页</div></div><div class="metric success"><span class="small-label">网络</span><div class="metric-value">良好</div></div></div><div class="camera" style="max-width:520px;margin:20px auto;height:280px"><div class="camera-person">杨</div></div></div><div class="form-actions">${button('返回诊断',"setView('diagnosis')")}${button('开始PPT陈述',"startPresentation()",'primary')}</div></div>`)}
function startPresentation(){state.presentationSeconds=420;state.presentationSlide=1;setView('presentation');state.presentationTimer=setInterval(()=>{state.presentationSeconds--;if(state.presentationSeconds<=0){clearInterval(state.presentationTimer);state.presentationTimer=null;}render()},1000)}
function timeText(s){const m=Math.floor(s/60);const sec=s%60;return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
function presentation(){return shell(`<div class="stage"><section class="stage-main"><div class="stage-toolbar"><div class="stage-status"><span class="live-dot"></span><b>PPT陈述进行中</b><span>第 ${state.presentationSlide}/18 页</span></div><div class="timer">${timeText(state.presentationSeconds)}</div></div><div class="slide-canvas"><h2>数字教育产品经理成长规划</h2><div class="slide-content"><div><h3>从技术学习者到教育产品创造者</h3><p>以真实教育问题为起点，通过专业学习、用户研究和产品实践，形成面向数字教育行业的长期成长路径。</p></div><div class="slide-chart"><span style="height:38%"></span><span style="height:55%"></span><span style="height:72%"></span><span style="height:88%"></span></div></div><div class="slide-footer"><span>目标职业：数字教育产品经理</span><span>${state.presentationSlide} / 18</span></div></div><div class="stage-toolbar"><div class="stage-status"><span>系统正在记录语音、视频、翻页时间与陈述文本</span></div><div class="header-actions"><button class="button" onclick="state.presentationSlide=Math.max(1,state.presentationSlide-1);render()">上一页</button><button class="button" onclick="state.presentationSlide=Math.min(18,state.presentationSlide+1);render()">下一页</button></div></div></section><aside class="stage-side"><div class="camera"><div class="camera-person">杨</div></div><div class="side-section"><h3>实时状态</h3><div class="signal-row"><span>语音清晰度</span><b>良好</b></div><div class="signal-row"><span>语速</span><b>228 字/分</b></div><div class="signal-row"><span>镜头表现</span><b>稳定</b></div></div><div class="side-section"><h3>计时规则</h3><div class="small-label">剩余60秒时提醒，正式模拟不会中途打断。</div></div><div class="stage-controls">${button('暂停',"showToast('演练已暂停')")}${button('结束陈述',"finishPresentation()",'danger')}</div></aside></div>`)}
function finishPresentation(){if(state.presentationTimer){clearInterval(state.presentationTimer);state.presentationTimer=null;}state.judgeIndex=0;state.questionIndex=0;state.messages=[{role:'judge',text:questions[0][0]}];setView('jury')}

function jury(){const j=judges[state.judgeIndex];return shell(`<div class="page-header"><div><h1>五位AI评委集中答辩</h1><p>${state.track} · 已完成PPT陈述 · 当前第 ${state.judgeIndex+1}/5 位评委</p></div><span class="tag cyan">问题依据：规则 + PPT + 陈述 + 行业知识库</span></div><div class="judge-strip">${judges.map((x,i)=>`<div class="judge ${i===state.judgeIndex?'active':''}"><div class="judge-avatar">${x.icon}</div><div class="judge-name">${x.short}评委</div></div>`).join('')}</div><div class="jury-layout"><section class="conversation"><div class="panel-header"><h2>${j.name}</h2><span class="small-label">${j.focus}</span></div><div class="messages">${state.messages.map(m=>`<div class="message ${m.role==='judge'?'judge-msg':'student-msg'}">${m.text}</div>`).join('')}</div><div class="answer-box"><textarea id="answer" placeholder="输入模拟回答，也可以点击示例回答快速体验"></textarea><div style="display:grid;gap:8px">${button('填入示例',"fillExample()")}${button('提交回答',"submitAnswer()",'primary')}</div></div></section><aside class="jury-side"><div class="panel"><div class="panel-header"><h2>当前评审关注</h2></div><div class="panel-body evidence-list"><div class="evidence">PPT第4页：目标职业与行业定位</div><div class="evidence">PPT第14页：项目成果数据</div><div class="evidence">陈述 04:18：服务学生规模</div></div></div><div class="panel"><div class="panel-header"><h2>答辩进度</h2></div><div class="panel-body"><div class="progress" style="max-width:none"><span style="width:${((state.judgeIndex+(state.questionIndex?0.5:0))/5)*100}%"></span></div><p class="small-label">每位评委根据规则模板提出主问题，并可依据回答继续追问。</p></div></div></aside></div>`)}
function fillExample(){document.getElementById('answer').value='这项数据来自项目后台的累计访问记录。我负责需求调研、功能方案与试点反馈分析，但没有独立完成全部项目，因此会在PPT中把表述调整为“参与服务覆盖10万名学生的平台产品迭代”，并补充我负责模块的具体数据。'}
function submitAnswer(){const el=document.getElementById('answer');if(!el.value.trim()){showToast('请先输入回答');return;}state.messages.push({role:'student',text:el.value.trim()});if(state.questionIndex===0){state.questionIndex=1;state.messages.push({role:'judge',text:questions[state.judgeIndex][1]});render();return;}if(state.judgeIndex<4){state.judgeIndex++;state.questionIndex=0;state.messages=[{role:'judge',text:questions[state.judgeIndex][0]}];render();}else{setView('report')}}

const timelineEvents=[
  {time:0,type:'陈述',title:'开始PPT陈述',desc:'进入职业目标与自我认知部分'},
  {time:96,type:'言语',title:'语速偏快',desc:'连续42秒高于260字/分，建议在结论后增加停顿'},
  {time:178,type:'仪态',title:'手势有效',desc:'解释行动路径时使用分层手势，辅助信息理解'},
  {time:258,type:'表情',title:'视线偏离',desc:'查看备注时间较长，镜头交流连续中断8秒'},
  {time:403,type:'陈述',title:'陈述结束',desc:'用时6分43秒，比规则建议时长多43秒'},
  {time:432,type:'问答',title:'规则评委主问题',desc:'追问“服务10万名学生”的数据来源和个人贡献'},
  {time:503,type:'言语',title:'回答出现口头语',desc:'71秒回答中出现6次“然后”和4次“就是”'},
  {time:602,type:'问答',title:'生涯评委追问',desc:'职业选择稳定性的经历证据'},
  {time:744,type:'问答',title:'行业评委追问',desc:'教育产品需求验证方法'},
  {time:910,type:'问答',title:'综合表达评委限时回答',desc:'60秒重新概括目标、行动、结果与反思'}
];
const questionReplays=[
  {judge:0,time:432,duration:'01:11',question:'PPT第4页提到“服务10万名学生”，请说明数据来源，以及你本人承担的具体职责。',answer:'这项数据来自项目后台累计访问记录。我负责需求调研、功能方案与试点反馈分析，并没有独立完成整个项目。',score:82,good:'能够主动区分平台成果与个人贡献。',miss:'未说明本人负责模块的独立效果数据。',advice:'先给结论，再按“数据来源—个人职责—可验证结果”三步回答。'},
  {judge:1,time:602,duration:'00:58',question:'除了兴趣测评，还有哪些经历能够证明你的职业选择具有稳定性？',answer:'我持续参与了两个教育产品项目，也完成了用户研究和产品方案课程，这些经历让我确认自己更适合做连接技术和教育需求的工作。',score:88,good:'经历与职业选择建立了清晰关联。',miss:'缺少失败经历或反向验证。',advice:'补充一次职业选择受到挑战后的反思，增强稳定性证据。'},
  {judge:2,time:744,duration:'01:06',question:'请给出一个教育场景中的具体产品问题，并说明你准备怎样验证需求。',answer:'学生在职业探索阶段不知道怎样获取真实行业信息。我会先访谈学生和教师，再用轻量原型验证信息结构和使用频率。',score:84,good:'问题具体，包含访谈和原型验证。',miss:'没有给出验证成功的量化标准。',advice:'增加任务完成率、复访率或问题解决率等验证指标。'}
];

function report(){return shell(`<div class="report-hero"><div><div class="report-score">86<small>/100</small></div><div class="small-label" style="color:#bad6d1;margin-top:8px">赛事评审得分</div></div><div><h1>全过程模拟演练报告</h1><p>${state.track} · 材料版本 V3 · 规则模板 V1.0<br/>报告生成于2026年10月13日，视频保留至2027年4月11日。</p></div><div class="report-actions">${button('导出PDF摘要',"window.print()")}${button('再次训练',"setView('competition')",'primary')}</div></div><div class="report-tabs"><button class="${state.reportTab==='overview'?'active':''}" onclick="state.reportTab='overview';render()">报告总览</button><button class="${state.reportTab==='timeline'?'active':''}" onclick="state.reportTab='timeline';render()">全过程时间轴</button><button class="${state.reportTab==='questions'?'active':''}" onclick="state.reportTab='questions';render()">逐题复盘</button></div>${state.reportTab==='overview'?reportOverview():state.reportTab==='timeline'?reportTimeline():reportQuestions()}`)}

function reportOverview(){return `<div class="score-split"><div class="panel score-card official"><span class="small-label">正式赛事评分</span><strong>86</strong><p>仅依据赛事规则、材料证据与答辩内容</p></div><div class="panel score-card training"><span class="small-label">训练表现评分</span><strong>81</strong><p>表情、仪态、言语与镜头表现，不计入赛事分</p></div><div class="panel retention-card"><span class="small-label">视频权限与保存</span><strong>学生本人 + 指导教师</strong><p>剩余180天，可主动删除视频并保留脱敏文字报告</p><button class="text-link" onclick="showToast('原型仅演示删除规则，未存储真实视频')">管理视频</button></div></div><div class="report-grid"><section><div class="panel"><div class="panel-header"><h2>多维训练表现</h2><span class="tag">独立训练分</span></div><div class="behavior-grid">${behaviorMetric('内容表达',86,'结构清晰，成果证据仍需加强')}${behaviorMetric('言语表现',78,'语速偏快，口头语集中于追问阶段')}${behaviorMetric('表情状态',82,'整体自然，查看备注时视线偏离')}${behaviorMetric('仪态表现',85,'姿态稳定，手势能够辅助表达')}${behaviorMetric('临场应变',76,'回答完整，但前20秒结论不够聚焦')}</div></div><div class="panel" style="margin-top:16px"><div class="panel-header"><h2>正式指标评分</h2><span class="tag">证据可追溯</span></div><div class="rubric">${[['职业目标',88,'PPT 4-6页'],['学习实践行动',86,'PPT 8-14页'],['动态调整',78,'回答 4'],['岗位胜任力',84,'回答 2、3'],['综合表达',91,'陈述全程']].map(([a,b,c])=>`<div class="rubric-row"><strong>${a}</strong><span class="muted">${c}</span><strong>${b}</strong></div>`).join('')}</div></div></section><aside><div class="panel"><div class="panel-header"><h2>关键表现片段</h2><button class="text-link" onclick="state.reportTab='timeline';render()">查看时间轴</button></div><div class="panel-body moment-list">${timelineEvents.filter(x=>['言语','表情','仪态'].includes(x.type)).map(x=>`<button onclick="jumpReplay(${x.time},'timeline')"><span>${formatReplayTime(x.time)}</span><strong>${x.title}</strong><small>${x.type}</small></button>`).join('')}</div></div><div class="panel" style="margin-top:16px"><div class="panel-header"><h2>重点改进</h2></div><div class="panel-body risk-list"><div class="risk"><strong>成果数据需要明确个人贡献</strong><p>将平台整体数据与本人负责模块分开表述。</p></div><div class="risk"><strong>减少口头语并提前给结论</strong><p>使用“结论—证据—反思”结构，降低无效重复。</p></div><div class="risk"><strong>减少查看备注造成的视线中断</strong><p>将每页提示词控制在三个关键词以内。</p></div></div></div></aside></div>`}
function behaviorMetric(name,score,desc){return `<div class="behavior-metric"><div><strong>${name}</strong><span>${score}</span></div><div class="ability-bar"><span style="width:${score}%"></span></div><p>${desc}</p></div>`}

function reportTimeline(){const filters=['全部','陈述','问答','表情','仪态','言语'];const events=state.timelineFilter==='全部'?timelineEvents:timelineEvents.filter(x=>x.type===state.timelineFilter);return `<div class="replay-layout"><section>${replayPlayer()}<div class="panel" style="margin-top:16px"><div class="panel-header"><h2>全过程事件</h2><div class="timeline-filters">${filters.map(x=>`<button class="${state.timelineFilter===x?'active':''}" onclick="state.timelineFilter='${x}';render()">${x}</button>`).join('')}</div></div><div class="timeline-list">${events.map(x=>`<button class="timeline-event ${Math.abs(state.replayTime-x.time)<10?'active':''}" onclick="jumpReplay(${x.time},'timeline')"><span class="timeline-time">${formatReplayTime(x.time)}</span><span class="event-dot ${x.type}"></span><span><strong>${x.title}</strong><small>${x.desc}</small></span><span class="tag">${x.type}</span></button>`).join('')}</div></div></section><aside><div class="panel"><div class="panel-header"><h2>当前时刻分析</h2><span class="tag">${nearestEvent().type}</span></div><div class="panel-body"><h3 style="font-size:15px">${nearestEvent().title}</h3><p class="muted" style="font-size:13px;line-height:1.8">${nearestEvent().desc}</p><div class="analysis-note"><strong>训练建议</strong><p>保持面向镜头的自然交流，回答关键结论后停顿1至2秒，给评委明确的信息接收节点。</p></div></div></div><div class="panel" style="margin-top:16px"><div class="panel-header"><h2>分析边界</h2></div><div class="panel-body small-label" style="line-height:1.8">本报告只分析可观察的训练表现，不进行身份识别、心理诊断或疾病判断。低置信度结果应由指导教师结合视频复核。</div></div></aside></div>`}

function replayPlayer(){return `<div class="replay-player"><div class="replay-screen"><div class="replay-slide"><span>数字教育产品经理成长规划</span><strong>${state.replayTime<403?'从技术学习者到教育产品创造者':'五位AI评委集中答辩'}</strong><p>${state.replayTime<403?'以真实教育问题为起点，形成面向数字教育行业的成长路径。':'当前问题与学生回答视频同步回放'}</p></div><div class="replay-camera"><div>杨</div><span>${state.replayPlaying?'回放中':'已暂停'}</span></div></div><div class="replay-controls"><button class="replay-play" onclick="toggleReplay()">${state.replayPlaying?'Ⅱ':'▶'}</button><span>${formatReplayTime(state.replayTime)}</span><input type="range" min="0" max="1020" value="${state.replayTime}" oninput="seekReplay(this.value)"/><span>17:00</span><button class="button" onclick="showToast('已切换学生特写视图')">学生特写</button></div></div>`}
function toggleReplay(){state.replayPlaying=!state.replayPlaying;if(state.replayPlaying){state.replayTimer=setInterval(()=>{state.replayTime=Math.min(1020,state.replayTime+1);if(state.replayTime>=1020){clearInterval(state.replayTimer);state.replayTimer=null;state.replayPlaying=false}render()},1000)}else if(state.replayTimer){clearInterval(state.replayTimer);state.replayTimer=null}render()}
function seekReplay(v){state.replayTime=Number(v);render()}
function jumpReplay(time,tab){state.replayTime=time;state.reportTab=tab;render()}
function formatReplayTime(time){return `${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`}
function nearestEvent(){return timelineEvents.reduce((best,x)=>Math.abs(x.time-state.replayTime)<Math.abs(best.time-state.replayTime)?x:best,timelineEvents[0])}

function reportQuestions(){const q=questionReplays[state.selectedQuestion];const j=judges[q.judge];return `<div class="question-review-layout"><aside class="panel question-nav"><div class="panel-header"><h2>问答目录</h2></div>${questionReplays.map((x,i)=>`<button class="${i===state.selectedQuestion?'active':''}" onclick="state.selectedQuestion=${i};state.replayTime=${x.time};render()"><span>${i+1}</span><div><strong>${judges[x.judge].name}</strong><small>${x.duration} · 得分 ${x.score}</small></div></button>`).join('')}</aside><section><div class="panel"><div class="question-heading"><div class="judge-avatar">${j.icon}</div><div><span class="small-label">${j.name} · 原始语音与题干</span><h2>${q.question}</h2></div><button class="button" onclick="showToast('正在播放AI评委原始提问语音')">▶ 播放问题</button></div></div><div style="margin-top:16px">${replayPlayer()}</div><div class="panel" style="margin-top:16px"><div class="panel-header"><h2>学生回答转写</h2><span class="tag">回答 ${q.duration}</span></div><div class="panel-body answer-transcript">${q.answer}</div></div><div class="answer-analysis-grid"><div class="panel"><div class="panel-header"><h2>回答分析</h2><strong class="score">${q.score}</strong></div><div class="panel-body risk-list"><div class="risk positive"><strong>表现较好</strong><p>${q.good}</p></div><div class="risk"><strong>内容遗漏</strong><p>${q.miss}</p></div><div class="risk"><strong>改进结构</strong><p>${q.advice}</p></div></div></div><div class="panel"><div class="panel-header"><h2>回答表现</h2><span class="tag">训练分</span></div><div class="panel-body ability-list">${[['问题匹配',88],['证据强度',76],['逻辑结构',84],['言语表达',79],['临场反应',82]].map(([n,v])=>`<div class="ability-row"><span>${n}</span><div class="ability-bar"><span style="width:${v}%"></span></div><b>${v}</b></div>`).join('')}</div></div></div></section></div>`}

function records(){return shell(`<div class="page-header"><div><h1>我的训练</h1><p>按训练类型、赛道、材料版本和规则版本追踪历史表现。</p></div>${button('创建训练',"setView('competition')",'primary')}</div><div class="panel"><div class="panel-header"><div class="header-actions"><select class="button"><option>全部训练类型</option><option>职规赛模拟答辩</option><option>师范生模拟试讲</option></select><select class="button"><option>全部赛道</option><option>成长赛道</option><option>就业赛道</option></select></div><span class="small-label">共 6 条记录</span></div><div class="table-wrap"><table><thead><tr><th>训练名称</th><th>类型</th><th>规则/材料版本</th><th>完成时间</th><th>得分</th><th>操作</th></tr></thead><tbody>${[['数字教育产品经理成长规划','成长赛道答辩','规则V1.0 / 材料V3','今天 09:20','86'],['行业知识专项追问','专项训练','评委V2.1','10月10日','78'],['认识轴对称图形','小学数学试讲','题库V1.2','10月8日','82']].map(r=>`<tr>${r.map((x,i)=>`<td>${i===4?`<b class="score" style="font-size:17px">${x}</b>`:x}</td>`).join('')}<td><button class="text-link" onclick="setView('report')">查看报告</button></td></tr>`).join('')}</tbody></table></div></div>`)}
function special(){return shell(`<div class="page-header"><div><h1>专项训练</h1><p>系统根据最近训练报告推荐针对性的短时训练。</p></div></div><div class="module-grid">${[['证','成果证据核验','识别成果归属、数据来源和证据强度'],['答','高压连续追问','连续问题下保持回答聚焦与逻辑完整'],['业','行业专业知识','围绕目标行业与岗位生成专业追问'],['时','限时回答','30秒、60秒和90秒结构化表达']].map(x=>`<article class="module-card"><div class="module-icon">${x[0]}</div><div><h2>${x[1]}</h2><p>${x[2]}</p></div>${button('开始训练',"showToast('已创建专项训练')",'secondary')}</article>`).join('')}</div>`)}

function teacher(){return shell(`<div class="page-header"><div><h1>教师工作台</h1><p>分配训练任务，查看学生报告和班级共性问题。</p></div>${button('创建训练任务',"showToast('已打开任务创建面板')",'primary')}</div><div class="teacher-stats"><div class="metric"><span class="small-label">本周参训学生</span><div class="metric-value">42</div></div><div class="metric success"><span class="small-label">任务完成率</span><div class="metric-value">81%</div></div><div class="metric"><span class="small-label">班级平均分</span><div class="metric-value">83.6</div></div><div class="metric warning"><span class="small-label">需重点指导</span><div class="metric-value">7人</div></div></div><div class="dashboard-grid"><div class="panel"><div class="panel-header"><h2>近期训练任务</h2><button class="text-link">查看全部</button></div><div class="table-wrap"><table><thead><tr><th>任务</th><th>赛道</th><th>完成</th><th>截止时间</th></tr></thead><tbody><tr><td>成长赛道第一次模拟</td><td>成长赛道</td><td>28/35</td><td>10月18日</td></tr><tr><td>就业赛道行业追问</td><td>就业赛道</td><td>14/20</td><td>10月20日</td></tr></tbody></table></div></div><div class="panel"><div class="panel-header"><h2>班级共性问题</h2></div><div class="panel-body risk-list"><div class="risk"><strong>成果证据不足</strong><p>37%的学生无法准确说明数据来源和个人贡献。</p></div><div class="risk"><strong>职业目标过于宽泛</strong><p>24%的学生目标岗位缺少行业与职能限定。</p></div><div class="risk"><strong>回答超时</strong><p>18%的学生在60秒问题中未能形成完整结论。</p></div></div></div></div><div class="panel" style="margin-top:16px"><div class="panel-header"><h2>学生训练情况</h2><button class="text-link" onclick="showToast('训练结果已导出')">导出结果</button></div><div class="table-wrap"><table><thead><tr><th>学生</th><th>专业</th><th>最近训练</th><th>得分</th><th>主要问题</th><th>状态</th></tr></thead><tbody>${[['李欣怡','计算机科学与技术','成长赛道模拟','86','证据归属','已完成'],['王浩然','电子商务','就业赛道模拟','81','行业理解','已完成'],['陈思雨','汉语言文学','成长赛道模拟','—','—','未开始']].map(r=>`<tr>${r.map((x,i)=>`<td>${i===5?`<span class="tag ${x==='未开始'?'amber':''}">${x}</span>`:x}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`)}

function render(){
  const routes={dashboard, 'teacher-trial':teacherTrial, competition, diagnosis, consent, device, presentation, jury, report, records, special, teacher, tasks:teacher, students:teacher, 'class-analysis':teacher};
  document.getElementById('app').innerHTML=(routes[state.view]||dashboard)();
}
render();
