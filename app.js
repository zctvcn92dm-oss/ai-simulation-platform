const state = {
  role: 'student',
  view: 'dashboard',
  track: '成长赛道',
  mode: '正式模拟',
  fileUploaded: false,
  materialVersion: 3,
  materialReplacementPending: false,
  diagnosisVersion: null,
  riskAcknowledged: false,
  completedReports: [],
  activeReportId: null,
  form: { major: '计算机科学与技术', grade: '大三', targetCareer: '产品经理', industry: '数字教育' },
  presentationSlide: 1,
  presentationSeconds: 420,
  presentationTimer: null,
  judgeIndex: 0,
  questionIndex: 0,
  messages: [],
  judgeAudioOn: true,
  voiceRecorder: null,
  voiceStream: null,
  voiceChunks: [],
  voiceAnswers: [],
  voiceRecording: false,
  voiceProcessing: false,
  voiceStartedAt: 0,
  microphoneUnavailable: false,
  demoAnswerMode: false,
  reportTab: 'overview',
  timelineFilter: '全部',
  replayTime: 258,
  replayPlaying: false,
  replayTimer: null,
  selectedQuestion: 0,
  workflowReached: 0,
  workflowExpanded: false,
  workflowStale: false,
  mobileMenuOpen: false,
  toast: ''
};

const workflowSteps = [
  ['训练设置', 'competition'], ['赛前诊断', 'diagnosis'], ['演练准备', 'consent'],
  ['PPT陈述', 'presentation'], ['评委答辩', 'jury'], ['训练报告', 'report']
];
const workflowViews = {competition:0, diagnosis:1, consent:2, device:2, presentation:3, jury:4, report:5};
const storedWorkflow = (() => { try { return JSON.parse(localStorage.getItem('ai-simulation-workflow') || '{}'); } catch { return {}; } })();
if (storedWorkflow.view && Object.prototype.hasOwnProperty.call(workflowViews, storedWorkflow.view)) {
  Object.assign(state, {
    view: storedWorkflow.view, workflowReached: storedWorkflow.workflowReached || 0,
    fileUploaded: !!storedWorkflow.fileUploaded, track: storedWorkflow.track || state.track,
    materialVersion: storedWorkflow.materialVersion || 3,
    materialReplacementPending: !!storedWorkflow.materialReplacementPending,
    diagnosisVersion: storedWorkflow.diagnosisVersion || ((storedWorkflow.view==='diagnosis' || workflowViews[storedWorkflow.view]>1) && storedWorkflow.fileUploaded && !storedWorkflow.workflowStale ? (storedWorkflow.materialVersion || 3) : null),
    riskAcknowledged: !!storedWorkflow.riskAcknowledged,
    completedReports: storedWorkflow.completedReports || [],
    activeReportId: storedWorkflow.activeReportId || null,
    mode: storedWorkflow.mode || state.mode, form: {...state.form, ...storedWorkflow.form},
    presentationSlide: storedWorkflow.presentationSlide || 1,
    presentationSeconds: Number.isFinite(storedWorkflow.presentationSeconds) ? storedWorkflow.presentationSeconds : 420,
    judgeIndex: storedWorkflow.judgeIndex || 0, questionIndex: storedWorkflow.questionIndex || 0,
    messages: storedWorkflow.messages || [], workflowStale: !!storedWorkflow.workflowStale,
    demoAnswerMode: !!storedWorkflow.demoAnswerMode,
    microphoneUnavailable: !!storedWorkflow.microphoneUnavailable
  });
}

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
  if(view!=='jury' && window.speechSynthesis) window.speechSynthesis.cancel();
  if(view!=='jury' && state.voiceRecording && state.voiceRecorder){state.voiceRecorder.stop();state.voiceRecording=false;state.voiceStream?.getTracks().forEach(track=>track.stop());state.voiceStream=null;}
  if(state.presentationTimer){ clearInterval(state.presentationTimer); state.presentationTimer = null; }
  if(state.replayTimer){ clearInterval(state.replayTimer); state.replayTimer = null; state.replayPlaying = false; }
  state.view=view;
  state.mobileMenuOpen=false;
  state.workflowExpanded=false;
  if(Object.prototype.hasOwnProperty.call(workflowViews, view)) state.workflowReached=Math.max(state.workflowReached,workflowViews[view]);
  window.scrollTo(0,0); render();
}
function setRole(role){ state.role=role; setView(role==='teacher'?'teacher':'dashboard'); }
function showToast(message){ state.toast=message; render(); setTimeout(()=>{state.toast='';render()},1800); }
function button(label, action, variant=''){ return `<button class="button ${variant}" onclick="${action}">${label}</button>`; }
function persistWorkflow(){
  try { localStorage.setItem('ai-simulation-workflow', JSON.stringify({
    view:state.view, workflowReached:state.workflowReached, fileUploaded:state.fileUploaded,
    materialVersion:state.materialVersion, materialReplacementPending:state.materialReplacementPending,
    diagnosisVersion:state.diagnosisVersion, riskAcknowledged:state.riskAcknowledged,
    completedReports:state.completedReports, activeReportId:state.activeReportId,
    track:state.track, mode:state.mode, form:state.form, presentationSlide:state.presentationSlide,
    presentationSeconds:state.presentationSeconds, judgeIndex:state.judgeIndex,
    questionIndex:state.questionIndex, messages:state.messages, workflowStale:state.workflowStale,
    demoAnswerMode:state.demoAnswerMode, microphoneUnavailable:state.microphoneUnavailable
  })); } catch {}
}
function workflowProgress(compact=false){
  const current=workflowViews[state.view] ?? 0;
  const substep=state.view==='consent'?'录制授权 · 1/2':state.view==='device'?'设备检测 · 2/2':'';
  return `<section class="workflow-progress ${compact?'compact':''} ${state.workflowExpanded?'expanded':''}" aria-label="训练流程">
    <button class="workflow-mobile-summary" type="button" aria-expanded="${state.workflowExpanded}" onclick="state.workflowExpanded=!state.workflowExpanded;render()"><span><small>步骤 ${current+1}/6${substep?' · '+substep:''}</small><strong>${workflowSteps[current][0]}</strong></span><span aria-hidden="true">${state.workflowExpanded?'⌃':'⌄'}</span></button>
    <div class="workflow-track">${workflowSteps.map(([label],i)=>{
      const status=i<current?'done':i===current?'active':'pending';
      return `<button type="button" class="workflow-step ${status}" ${i<current?`onclick="goWorkflowStep(${i})"`:'disabled'} ${i===current?'aria-current="step"':''} aria-label="第${i+1}步 ${label}，${status==='done'?'已完成':status==='active'?'当前环节':'未开始'}"><span class="workflow-index">${i<current?'✓':i+1}</span><span class="workflow-label"><strong>${label}</strong><small>${i<current?'已完成':i===current?(substep||'当前环节'):'未开始'}</small></span></button>`;
    }).join('')}</div></section>`;
}
function goWorkflowStep(index){
  if(index >= (workflowViews[state.view] ?? 0)) return;
  setView(workflowSteps[index][1]);
}
function updateTrainingValue(key,value){
  if(key in state.form) state.form[key]=value; else state[key]=value;
  if(state.workflowReached>0){state.workflowStale=true;state.riskAcknowledged=false;}
  if(state.workflowStale && state.view==='competition' && !document.querySelector('.version-warning')){
    document.querySelector('.workflow-progress').insertAdjacentHTML('afterend','<div class="version-warning"><strong>训练内容已修改</strong><span>请重新生成赛前诊断。此前的报告仍可在“我的训练”中查看。</span></div>');
  }
  persistWorkflow();
}
function changeMaterial(){
  state.fileUploaded=false;
  state.materialReplacementPending=true;
  state.riskAcknowledged=false;
  if(state.workflowReached>0) state.workflowStale=true;
  render();
}
function uploadMaterial(){
  if(state.materialReplacementPending) state.materialVersion++;
  state.materialReplacementPending=false;
  state.fileUploaded=true;
  showToast(`PPT解析完成，已生成材料版本 V${state.materialVersion}`);
}
function diagnosisBlockers(){
  const blockers=[];
  if(!state.fileUploaded) blockers.push('参赛PPT未上传或无法解析');
  if(Object.values(state.form).some(value=>!value.trim())) blockers.push('参赛基础信息未填写完整');
  if(state.workflowStale || state.diagnosisVersion!==state.materialVersion) blockers.push('当前材料尚未完成有效诊断');
  return blockers;
}
function proceedWithRisks(){
  const blockers=diagnosisBlockers();
  if(blockers.length){showToast('请先修复材料问题并重新诊断');return;}
  state.riskAcknowledged=true;
  setView('consent');
}
function completeReport(){
  const report={id:Date.now(),materialVersion:state.materialVersion,track:state.track,major:state.form.major,career:state.form.targetCareer,answerMode:state.demoAnswerMode?'demo':state.mode==='正式模拟'?'voice':'text',recordedAnswers:state.voiceAnswers.length};
  state.completedReports.unshift(report);
  state.activeReportId=report.id;
  setView('report');
}
function activeReport(){return state.completedReports.find(report=>report.id===state.activeReportId) || {materialVersion:3,track:'成长赛道',major:'计算机科学与技术',career:'产品经理'};}
function openReport(id){state.activeReportId=id;setView('report');}

function shell(content){
  const nav = state.role==='student'?navStudent:navTeacher;
  return `<div class="app-shell">
    <aside class="sidebar ${state.mobileMenuOpen?'open':''}">
      <div class="brand"><span class="brand-mark">AI</span><span>AI模拟演练</span><button class="mobile-menu-close" aria-label="关闭菜单" onclick="state.mobileMenuOpen=false;render()">×</button></div>
      <nav class="nav">${nav.map(([id,icon,label])=>`<button class="nav-button ${state.view===id?'active':''}" onclick="setView('${id}')"><span class="nav-icon">${icon}</span><span>${label}</span></button>`).join('')}</nav>
      <div class="sidebar-footer"><div class="small-label">当前学校</div><div class="school-name">云研大学</div></div>
    </aside>
    <section class="content-shell">
      <header class="topbar">
        <button class="button icon-button mobile-menu" aria-label="${state.mobileMenuOpen?'关闭菜单':'打开菜单'}" aria-expanded="${state.mobileMenuOpen}" onclick="state.mobileMenuOpen=!state.mobileMenuOpen;render()">☰</button>
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
function trainingRow(title,meta,date,score,action){return `<div class="training-row"><div><div class="training-title">${title}</div><div class="training-meta">${meta}</div></div><span class="muted">${date}</span><strong class="score">${score}</strong><button class="text-link" onclick="${action==='查看报告'?'openReport(null)':"setView('competition')"}">${action}</button></div>`}
function recommend(icon,title,desc,time){return `<div class="recommend-item"><div class="recommend-icon">${icon}</div><div><strong>${title}</strong><p>${desc}</p></div><span class="small-label">${time}</span></div>`}

function teacherTrial(){return shell(`<div class="page-header"><div><h1>师范生模拟试讲</h1><p>延续现有抽题与教学演练流程，并修复启动异常与页面横向溢出。</p></div>${button('开始智能抽题',"showToast('已创建小学数学试讲：认识轴对称图形')",'primary')}</div><div class="panel"><div class="panel-header"><h2>训练配置</h2><span class="tag">教师资格证考试</span></div><div class="panel-body form-grid"><div class="field"><label>试讲学科</label><select><option>小学数学</option><option>语文</option><option>数学</option></select></div><div class="field"><label>试讲受众</label><select><option>小学生</option></select></div><div class="field"><label>试讲时长</label><select><option>5分钟</option><option>10分钟</option></select></div><div class="field"><label>课件材料</label><div class="file-card"><span>轴对称图形教学课件.pptx</span><span class="tag">已解析</span></div></div></div><div class="form-actions">${button('查看历史记录',"setView('records')")}${button('开始试讲',"showToast('试讲环境检测完成，可正常开始')",'primary')}</div></div>`)}

function competition(){
  return shell(`<div class="training-workspace"><div class="page-header"><div><h1>创建职规赛模拟答辩</h1><p>完善训练信息和参赛材料，开始一次完整的模拟演练。</p></div><div class="rule-version"><span>当前规则模板</span><strong>第三届国赛·平台示例版 V1.0</strong></div></div>
  ${workflowProgress()}
  ${state.workflowStale?`<div class="version-warning"><strong>训练内容已修改</strong><span>请重新生成赛前诊断。此前的报告仍可在“我的训练”中查看。</span></div>`:''}
  <section class="form-panel setup-panel"><div class="form-section"><div class="section-heading"><span>01</span><div><h2>训练场景与模式</h2><p class="section-help">选择适合你的赛道与训练方式。</p></div></div><div class="segment"><button class="${state.track==='成长赛道'?'active':''}" onclick="updateTrainingValue('track','成长赛道');render()"><strong>成长赛道</strong><span>职业目标、学习实践行动与动态调整</span></button><button class="${state.track==='就业赛道'?'active':''}" onclick="updateTrainingValue('track','就业赛道');render()"><strong>就业赛道</strong><span>岗位胜任力、求职实战与发展潜力</span></button></div><div class="mode-setting"><strong>训练模式</strong><div class="mode-toggle"><button class="${state.mode==='正式模拟'?'active':''}" onclick="updateTrainingValue('mode','正式模拟');render()">正式模拟</button><button class="${state.mode==='专项训练'?'active':''}" onclick="updateTrainingValue('mode','专项训练');render()">专项训练</button></div><small>${state.mode==='正式模拟'?'完整陈述后进入集中答辩':'聚焦某项能力进行短时训练'}</small></div></div>
  <div class="form-section"><div class="section-heading"><span>02</span><div><h2>参赛基础信息</h2><p class="section-help">评委将结合这些信息和PPT内容提问。</p></div></div><div class="form-grid">${field('专业','major')}${field('年级','grade')}${field('目标职业','targetCareer')}${field('目标行业','industry')}</div></div>
  <div class="form-section"><div class="section-heading"><span>03</span><div><h2>参赛PPT</h2><p class="section-help">原型使用模拟材料，不上传真实文件。</p></div></div>${state.fileUploaded?`<div class="file-card material-summary"><div class="file-symbol">P</div><div class="file-details"><strong>数字教育产品经理成长规划.pptx</strong><span>18页 · 24.6 MB · 材料版本 V${state.materialVersion}</span></div><span class="tag">解析完成</span><button class="text-link" onclick="changeMaterial()">重新选择</button></div>`:`<div class="upload-zone"><span class="upload-arrow">↑</span><strong>选择PPT文件或拖入此处</strong><p>支持 PPT、PPTX，建议控制在100MB以内</p>${button('模拟上传PPT',"uploadMaterial()",'secondary')}</div>`}</div>
  <div class="form-section"><div class="section-heading"><span>04</span><div><h2>本次训练规则</h2><p class="section-help">正式时间和评审方式以当前模板为准。</p></div></div><div class="rule-grid"><div><span>赛道</span><strong>${state.track}</strong></div><div><span>陈述时间</span><strong>7分钟</strong></div><div><span>评审方式</span><strong>五位AI评委</strong></div><div><span>答辩阶段</span><strong>陈述后集中进行</strong></div></div></div>
  <div class="form-actions setup-actions"><div class="action-context"><strong>下一步：赛前诊断</strong><span>${state.fileUploaded?'材料已就绪，可以继续':'上传PPT后可以继续'}</span></div><div class="action-buttons">${button('保存草稿',"persistWorkflow();showToast('草稿已保存')")}${button('开始赛前诊断',"startDiagnosis()",'primary')}</div></div></section></div>`);
}
function field(label,key){return `<div class="field"><label>${label} <span class="required">*</span></label><input value="${state.form[key]}" oninput="updateTrainingValue('${key}',this.value)" /></div>`}
function startDiagnosis(){ if(!state.fileUploaded){showToast('请先上传参赛PPT');return;} if(Object.values(state.form).some(value=>!value.trim())){showToast('请先完善必填信息');return;} if(state.workflowStale && !window.confirm('参赛信息或PPT已变更。继续将重新生成赛前诊断，原报告仍保留在我的训练中。')) return; state.workflowStale=false; state.diagnosisVersion=state.materialVersion; state.riskAcknowledged=false; setView('diagnosis'); }

function diagnosis(){
  const blockers=diagnosisBlockers();
  return shell(`<div class="page-header"><div><h1>赛前诊断</h1><p>${state.track} · 材料版本 V${state.materialVersion} · 规则模板 V1.0</p></div></div>
  ${blockers.length?`<div class="diagnosis-decision blocked"><span class="decision-symbol">!</span><div><h2>材料暂时无法用于演练</h2><p>请先修复以下问题，再重新生成赛前诊断。</p><ul>${blockers.map(item=>`<li>${item}</li>`).join('')}</ul></div></div>`:`<div class="diagnosis-decision ready"><span class="decision-symbol">✓</span><div><h2>可以进入演练</h2><p>发现2项内容风险和1项时间提醒。你可以先修改PPT，也可以保留这些问题进入模拟，AI评委可能据此追问。</p></div></div>
  <div class="diagnosis-summary"><div class="metric success"><span class="small-label">材料完整度</span><div class="metric-value">92%</div></div><div class="metric success"><span class="small-label">指标覆盖</span><div class="metric-value">8/10</div></div><div class="metric warning"><span class="small-label">内容风险</span><div class="metric-value">2项</div></div><div class="metric"><span class="small-label">预计陈述时长</span><div class="metric-value">6'40"</div></div></div>
  <div class="panel"><div class="panel-header"><h2>材料检查结果</h2><span class="small-label">不会提前展示完整评委问题</span></div><div class="panel-body check-list">
    ${check('职业目标与专业关联','目标职业、行业方向和专业学习之间关系清晰。','已覆盖')}
    ${check('学习实践行动','PPT第8至12页包含课程、项目、实习与复盘证据。','已覆盖')}
    ${check('成果数据可信度','PPT第14页“服务10万名学生”缺少来源说明，可能触发证据核验。','建议完善',true)}
    ${check('动态调整机制','已说明调整方向，但尚未给出触发调整的量化信号。','建议完善',true)}
    ${check('陈述结构与时间','内容结构完整，预计比模板建议时长多40秒。','时间提醒',true)}
  </div></div>`}
  <div class="diagnosis-actions"><div><strong>${blockers.length?'请先处理阻断问题':'选择下一步'}</strong><p>${blockers.length?'修复材料后再次诊断，才能进入演练准备。':'带风险继续时，本次诊断结论将保留，评委会围绕未完善的证据和逻辑追问。'}</p></div><div class="diagnosis-buttons">${button('返回修改PPT',"setView('competition')")}${blockers.length?'':button('带风险继续演练',"proceedWithRisks()",'primary')}</div></div>`);
}
function check(title,desc,status,warn=false){return `<div class="check-item"><div class="check-state ${warn?'warn':''}">${warn?'!':'✓'}</div><div><h3>${title}</h3><p>${desc}</p></div><span class="tag ${warn?'amber':''}">${status}</span></div>`}

function consent(){return shell(`<div class="page-header"><div><h1>录制与AI分析说明</h1><p>开始演练前，请确认本次采集范围、使用目的和保存规则。</p></div></div><div class="panel consent-panel"><div class="panel-body"><div class="consent-intro"><div class="consent-icon">●</div><div><h2>本次演练将生成全过程复盘报告</h2><p>系统将同步记录PPT、学生摄像头、麦克风、翻页时间、评委问题与回答事件，用于训练反馈。</p></div></div><div class="consent-grid">${consentItem('采集内容','摄像头画面、麦克风声音、PPT画面、陈述转写与答辩记录')}${consentItem('分析维度','内容表达、言语表现、表情状态、仪态表现与临场应变')}${consentItem('查看人员','学生本人和任务授权范围内的指导教师')}${consentItem('保存规则','视频默认保存180天，可主动删除；文字报告可选择保留')}${consentItem('使用边界','不进行身份识别、心理诊断、疾病判断或基于外貌推断性格')}${consentItem('报告导出','PDF仅包含评分、建议与关键帧，视频只在站内受控播放')}</div><label class="consent-check"><input id="consent-check" type="checkbox" onchange="document.getElementById('consent-next').disabled=!this.checked"/><span>我已阅读并同意本次演练录制与AI训练分析说明</span></label></div><div class="form-actions">${button('返回诊断',"setView('diagnosis')")}<button id="consent-next" class="button primary" disabled onclick="setView('device')">同意并进入设备检测</button></div></div>`)}
function consentItem(title,desc){return `<div class="consent-item"><strong>${title}</strong><p>${desc}</p></div>`}

function device(){return shell(`<div class="page-header"><div><h1>演练环境检测</h1><p>摄像头、麦克风与PPT状态仅作原型模拟，不会调用真实设备。</p></div></div><div class="panel"><div class="panel-body"><div class="diagnosis-summary"><div class="metric success"><span class="small-label">摄像头</span><div class="metric-value">正常</div></div><div class="metric success"><span class="small-label">麦克风</span><div class="metric-value">正常</div></div><div class="metric success"><span class="small-label">PPT</span><div class="metric-value">18页</div></div><div class="metric success"><span class="small-label">网络</span><div class="metric-value">良好</div></div></div><div class="camera" style="max-width:520px;margin:20px auto;height:280px"><div class="camera-person">杨</div></div></div><div class="form-actions">${button('返回诊断',"setView('diagnosis')")}${button('开始PPT陈述',"startPresentation()",'primary')}</div></div>`)}
function startPresentation(){state.presentationSeconds=420;state.presentationSlide=1;setView('presentation');state.presentationTimer=setInterval(()=>{state.presentationSeconds--;if(state.presentationSeconds<=0){clearInterval(state.presentationTimer);state.presentationTimer=null;}render()},1000)}
function timeText(s){const m=Math.floor(s/60);const sec=s%60;return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
function presentation(){return shell(`<div class="stage"><section class="stage-main"><div class="stage-toolbar"><div class="stage-status"><span class="live-dot"></span><b>PPT陈述进行中</b><span>第 ${state.presentationSlide}/18 页</span></div><div class="timer">${timeText(state.presentationSeconds)}</div></div><div class="slide-canvas"><h2>数字教育产品经理成长规划</h2><div class="slide-content"><div><h3>从技术学习者到教育产品创造者</h3><p>以真实教育问题为起点，通过专业学习、用户研究和产品实践，形成面向数字教育行业的长期成长路径。</p></div><div class="slide-chart"><span style="height:38%"></span><span style="height:55%"></span><span style="height:72%"></span><span style="height:88%"></span></div></div><div class="slide-footer"><span>目标职业：数字教育产品经理</span><span>${state.presentationSlide} / 18</span></div></div><div class="stage-toolbar"><div class="stage-status"><span>系统正在记录语音、视频、翻页时间与陈述文本</span></div><div class="header-actions"><button class="button" onclick="state.presentationSlide=Math.max(1,state.presentationSlide-1);render()">上一页</button><button class="button" onclick="state.presentationSlide=Math.min(18,state.presentationSlide+1);render()">下一页</button></div></div></section><aside class="stage-side"><div class="camera"><div class="camera-person">杨</div></div><div class="side-section"><h3>实时状态</h3><div class="signal-row"><span>语音清晰度</span><b>良好</b></div><div class="signal-row"><span>语速</span><b>228 字/分</b></div><div class="signal-row"><span>镜头表现</span><b>稳定</b></div></div><div class="side-section"><h3>计时规则</h3><div class="small-label">剩余60秒时提醒，正式模拟不会中途打断。</div></div><div class="stage-controls">${button('暂停',"showToast('演练已暂停')")}${button('结束陈述',"finishPresentation()",'danger')}</div></aside></div>`)}
function finishPresentation(){if(state.presentationTimer){clearInterval(state.presentationTimer);state.presentationTimer=null;}state.judgeIndex=0;state.questionIndex=0;state.messages=[{role:'judge',text:questions[0][0]}];state.voiceAnswers.forEach(answer=>URL.revokeObjectURL(answer.url));state.voiceAnswers=[];state.demoAnswerMode=false;state.microphoneUnavailable=false;setView('jury');playJudgeQuestion()}

function jury(){const j=judges[state.judgeIndex];const question=questions[state.judgeIndex][state.questionIndex];const voice=state.mode==='正式模拟'&&!state.demoAnswerMode;return shell(`<div class="page-header"><div><h1>五位AI评委集中答辩</h1><p>${state.track} · 已完成PPT陈述 · 当前第 ${state.judgeIndex+1}/5 位评委</p></div><span class="tag cyan">问题依据：规则 + PPT + 陈述 + 行业知识库</span></div><div class="judge-strip">${judges.map((x,i)=>`<div class="judge ${i===state.judgeIndex?'active':''}"><div class="judge-avatar">${x.icon}</div><div class="judge-name">${x.short}评委</div></div>`).join('')}</div><div class="jury-meta"><div><strong>当前进度：第 ${state.judgeIndex*2+state.questionIndex+1}/10 题</strong><span>${j.focus}</span></div><div class="progress"><span style="width:${((state.judgeIndex*2+state.questionIndex)/10)*100}%"></span></div></div><section class="conversation"><div class="panel-header"><h2>${j.name}</h2><div class="jury-audio-tools"><button class="button icon-button" type="button" title="${state.judgeAudioOn?'关闭自动语音提问':'开启自动语音提问'}" aria-label="${state.judgeAudioOn?'关闭自动语音提问':'开启自动语音提问'}" aria-pressed="${state.judgeAudioOn}" onclick="toggleJudgeAudio()">${state.judgeAudioOn?'🔊':'🔇'}</button><button class="button" type="button" onclick="playJudgeQuestion(true)">重听问题</button></div></div><div class="jury-question"><span class="small-label">${state.questionIndex?'追问':'主问题'} · 文字与语音同步呈现</span><p>${question}</p></div><div class="jury-evidence"><strong>提问依据</strong><span>PPT第4页 · 目标职业与行业定位</span><span>PPT第14页 · 项目成果数据</span><span>陈述 04:18 · 服务学生规模</span></div><div class="messages">${state.messages.filter(m=>m.role==='student').map(m=>`<div class="message student-msg">${m.text}</div>`).join('')}</div><div class="answer-box">${voice?`<div class="voice-answer"><strong>语音回答</strong><p>正式模拟需使用麦克风作答。录音只保存在本次浏览器会话，不上传服务器；言语分析需正式系统接入后生成。</p><div class="voice-controls"><button id="record-button" class="button ${state.voiceRecording?'danger':'primary'}" onclick="toggleVoiceRecording()">${state.voiceRecording?'■ 结束录音':'● 开始录音'}</button><span id="record-status">${state.voiceRecording?'正在录音':'等待录音'}</span></div><audio id="answer-preview" controls style="display:none"></audio>${state.microphoneUnavailable?`<div class="mic-recovery"><strong>麦克风不可用</strong><p>请在浏览器地址栏允许此站点使用麦克风，然后重试。若只是体验原型，可切换为演示回答；演示回答不计入正式语音训练，也不会生成言语分析。</p><div>${button('重试麦克风',"retryMicrophone()")}${button('使用演示回答继续',"enableDemoAnswer()",'secondary')}</div></div>`:''}</div>`:`<div class="demo-answer"><strong>${state.demoAnswerMode?'演示回答 · 非正式模拟':'专项训练回答'}</strong>${state.demoAnswerMode?'<p>仅用于体验后续流程，报告将标记为演示数据，不评价本次言语表达。</p>':''}<textarea id="answer" placeholder="输入回答，或点击填入示例"></textarea></div>`}<div class="answer-actions">${voice?'':button('填入示例',"fillExample()")}${button('提交回答',"submitAnswer()",'primary')}</div></div></section>`)}
function currentQuestionKey(){return `${state.judgeIndex}-${state.questionIndex}`}
function playJudgeQuestion(force=false){if(!force&&!state.judgeAudioOn)return;if(!window.speechSynthesis){showToast('当前浏览器不支持语音提问，请阅读文字题干');return;}window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(questions[state.judgeIndex][state.questionIndex]);utterance.lang='zh-CN';utterance.rate=0.95;window.speechSynthesis.speak(utterance)}
function toggleJudgeAudio(){state.judgeAudioOn=!state.judgeAudioOn;if(!state.judgeAudioOn&&window.speechSynthesis)window.speechSynthesis.cancel();render();if(state.judgeAudioOn)playJudgeQuestion()}
async function toggleVoiceRecording(){if(state.voiceRecording){state.voiceProcessing=true;state.voiceRecorder.stop();state.voiceRecording=false;state.voiceStream.getTracks().forEach(track=>track.stop());state.voiceStream=null;document.getElementById('record-button').textContent='● 重新录音';document.getElementById('record-status').textContent='正在生成录音';return;}if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){state.microphoneUnavailable=true;render();return;}try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});state.microphoneUnavailable=false;state.voiceStream=stream;state.voiceChunks=[];const recorder=new MediaRecorder(stream);state.voiceRecorder=recorder;const key=currentQuestionKey();recorder.ondataavailable=event=>{if(event.data.size)state.voiceChunks.push(event.data)};recorder.onstop=()=>{if(!state.voiceChunks.length){state.voiceProcessing=false;showToast('没有录到声音，请重新录制');return;}const previous=state.voiceAnswers.find(x=>x.key===key);if(previous)URL.revokeObjectURL(previous.url);const url=URL.createObjectURL(new Blob(state.voiceChunks,{type:recorder.mimeType||'audio/webm'}));state.voiceAnswers=state.voiceAnswers.filter(x=>x.key!==key);state.voiceAnswers.push({key,url,seconds:Math.max(1,Math.round((Date.now()-state.voiceStartedAt)/1000))});state.voiceProcessing=false;const audio=document.getElementById('answer-preview');if(audio){audio.src=url;audio.style.display='block';document.getElementById('record-status').textContent='录音完成，可试听后提交'}};state.voiceStartedAt=Date.now();recorder.start();state.voiceRecording=true;document.getElementById('record-button').textContent='■ 结束录音';document.getElementById('record-status').textContent='正在录音，请口头回答';}catch{state.microphoneUnavailable=true;render()}}
function fillExample(){document.getElementById('answer').value='这项数据来自项目后台的累计访问记录。我负责需求调研、功能方案与试点反馈分析，但没有独立完成全部项目，因此会在PPT中把表述调整为“参与服务覆盖10万名学生的平台产品迭代”，并补充我负责模块的具体数据。'}
function enableDemoAnswer(){state.demoAnswerMode=true;persistWorkflow();render()}
function retryMicrophone(){state.microphoneUnavailable=false;render();toggleVoiceRecording()}
function submitAnswer(){const voice=state.mode==='正式模拟'&&!state.demoAnswerMode;if(state.voiceRecording||state.voiceProcessing){showToast('请先结束录音并等待生成完成');return;}const clip=state.voiceAnswers.find(x=>x.key===currentQuestionKey());const el=document.getElementById('answer');if(voice&&!clip){showToast('请先录制语音回答；无法使用麦克风时可选择演示回答');return;}if(!voice&&!el?.value.trim()){showToast('请先输入回答');return;}state.messages.push({role:'student',text:voice?`语音回答 · ${clip.seconds}秒`:el.value.trim()});if(state.questionIndex===0){state.questionIndex=1;state.messages.push({role:'judge',text:questions[state.judgeIndex][1]});render();playJudgeQuestion();return;}if(state.judgeIndex<4){state.judgeIndex++;state.questionIndex=0;state.messages=[{role:'judge',text:questions[state.judgeIndex][0]}];render();playJudgeQuestion();}else{completeReport()}}

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

function report(){const current=activeReport();return shell(`<div class="report-hero"><div><div class="report-score">86<small>/100</small></div><div class="small-label" style="color:#bad6d1;margin-top:8px">赛事评审得分</div></div><div><h1>全过程模拟演练报告</h1><p>${current.track} · 材料版本 V${current.materialVersion} · 规则模板 V1.0<br/>报告生成于2026年10月13日，视频保留至2027年4月11日。</p></div><div class="report-actions">${button('导出PDF摘要',"window.print()")}${button('再次训练',"setView('competition')",'primary')}</div></div><div class="report-tabs"><button class="${state.reportTab==='overview'?'active':''}" onclick="state.reportTab='overview';render()">报告总览</button><button class="${state.reportTab==='timeline'?'active':''}" onclick="state.reportTab='timeline';render()">全过程时间轴</button><button class="${state.reportTab==='questions'?'active':''}" onclick="state.reportTab='questions';render()">逐题复盘</button></div>${state.reportTab==='overview'?reportOverview():state.reportTab==='timeline'?reportTimeline():reportQuestions()}`)}

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

function preparationSteps(active){return `<div class="preparation-steps"><span class="${active===0?'active':'done'}"><b>${active===0?'1':'✓'}</b>录制授权</span><i></i><span class="${active===1?'active':''}"><b>2</b>设备检测</span></div>`;}
function radarChart(){
  const labels=['内容表达','言语表现','表情状态','仪态表现','临场应变'];
  const scores=[86,78,82,85,76], benchmark=[80,80,80,80,80];
  const point=(index,value)=>{const angle=-Math.PI/2+index*2*Math.PI/5;return [180+Math.cos(angle)*value*1.24,160+Math.sin(angle)*value*1.24];};
  const polygon=values=>values.map((v,i)=>point(i,v).join(',')).join(' ');
  const axes=labels.map((label,i)=>{const [x,y]=point(i,116);const [ex,ey]=point(i,100);return `<line x1="180" y1="160" x2="${ex}" y2="${ey}" stroke="#d6eeea"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${label}</text>`;}).join('');
  return `<section class="report-section radar-section"><div class="report-section-title"><h2>核心能力评估</h2><span>训练表现分 · 5个维度</span></div><div class="radar-content"><svg class="radar-chart" viewBox="0 0 360 325" role="img" aria-label="核心能力雷达图：内容表达86分、言语表现78分、表情状态82分、仪态表现85分、临场应变76分">${[25,50,75,100].map(v=>`<polygon points="${polygon(Array(5).fill(v))}" fill="none" stroke="#dcefeb"/>`).join('')}${axes}<polygon points="${polygon(benchmark)}" fill="none" stroke="#2d91ed" stroke-width="2" stroke-dasharray="4 4"/><polygon points="${polygon(scores)}" fill="rgba(28,198,174,.18)" stroke="#1cc6ae" stroke-width="3"/>${scores.map((v,i)=>{const [x,y]=point(i,v);return `<circle cx="${x}" cy="${y}" r="4" fill="#1cc6ae"/>`;}).join('')}</svg><div class="radar-summary"><strong>整体表现良好</strong><p>内容表达与仪态表现较稳定。下一轮重点训练临场应变和言语节奏。</p><div class="radar-legend"><span><i></i>本次训练</span><span><i></i>训练参考</span></div><div class="radar-score-list">${labels.map((label,i)=>`<div><span>${label}</span><strong>${scores[i]}</strong><small>/100</small></div>`).join('')}</div></div></div></section>`;
}
function reportIntro(){const current=activeReport();return `<section class="report-student"><div class="student-avatar" aria-hidden="true">杨</div><div><span>参训学生</span><strong>杨同学</strong><p>${current.track} · ${current.major} · 目标职业：${current.career}</p></div><div class="report-student-meta"><span>训练日期：2026年10月13日</span><span>材料版本 V${current.materialVersion} · 规则模板 V1.0</span></div></section>`;}

function records(){return shell(`<div class="page-header"><div><h1>我的训练</h1><p>按训练类型、赛道、材料版本和规则版本追踪历史表现。</p></div>${button('创建训练',"setView('competition')",'primary')}</div><div class="panel"><div class="panel-header"><div class="header-actions"><select class="button"><option>全部训练类型</option><option>职规赛模拟答辩</option><option>师范生模拟试讲</option></select><select class="button"><option>全部赛道</option><option>成长赛道</option><option>就业赛道</option></select></div><span class="small-label">共 6 条记录</span></div><div class="table-wrap"><table><thead><tr><th>训练名称</th><th>类型</th><th>规则/材料版本</th><th>完成时间</th><th>得分</th><th>操作</th></tr></thead><tbody>${[['数字教育产品经理成长规划','成长赛道答辩','规则V1.0 / 材料V3','今天 09:20','86'],['行业知识专项追问','专项训练','评委V2.1','10月10日','78'],['认识轴对称图形','小学数学试讲','题库V1.2','10月8日','82']].map(r=>`<tr>${r.map((x,i)=>`<td>${i===4?`<b class="score" style="font-size:17px">${x}</b>`:x}</td>`).join('')}<td><button class="text-link" onclick="setView('report')">查看报告</button></td></tr>`).join('')}</tbody></table></div></div>`)}
function special(){return shell(`<div class="page-header"><div><h1>专项训练</h1><p>系统根据最近训练报告推荐针对性的短时训练。</p></div></div><div class="module-grid">${[['证','成果证据核验','识别成果归属、数据来源和证据强度'],['答','高压连续追问','连续问题下保持回答聚焦与逻辑完整'],['业','行业专业知识','围绕目标行业与岗位生成专业追问'],['时','限时回答','30秒、60秒和90秒结构化表达']].map(x=>`<article class="module-card"><div class="module-icon">${x[0]}</div><div><h2>${x[1]}</h2><p>${x[2]}</p></div>${button('开始训练',"showToast('已创建专项训练')",'secondary')}</article>`).join('')}</div>`)}

function teacher(){return shell(`<div class="page-header"><div><h1>教师工作台</h1><p>分配训练任务，查看学生报告和班级共性问题。</p></div>${button('创建训练任务',"showToast('已打开任务创建面板')",'primary')}</div><div class="teacher-stats"><div class="metric"><span class="small-label">本周参训学生</span><div class="metric-value">42</div></div><div class="metric success"><span class="small-label">任务完成率</span><div class="metric-value">81%</div></div><div class="metric"><span class="small-label">班级平均分</span><div class="metric-value">83.6</div></div><div class="metric warning"><span class="small-label">需重点指导</span><div class="metric-value">7人</div></div></div><div class="dashboard-grid"><div class="panel"><div class="panel-header"><h2>近期训练任务</h2><button class="text-link">查看全部</button></div><div class="table-wrap"><table><thead><tr><th>任务</th><th>赛道</th><th>完成</th><th>截止时间</th></tr></thead><tbody><tr><td>成长赛道第一次模拟</td><td>成长赛道</td><td>28/35</td><td>10月18日</td></tr><tr><td>就业赛道行业追问</td><td>就业赛道</td><td>14/20</td><td>10月20日</td></tr></tbody></table></div></div><div class="panel"><div class="panel-header"><h2>班级共性问题</h2></div><div class="panel-body risk-list"><div class="risk"><strong>成果证据不足</strong><p>37%的学生无法准确说明数据来源和个人贡献。</p></div><div class="risk"><strong>职业目标过于宽泛</strong><p>24%的学生目标岗位缺少行业与职能限定。</p></div><div class="risk"><strong>回答超时</strong><p>18%的学生在60秒问题中未能形成完整结论。</p></div></div></div></div><div class="panel" style="margin-top:16px"><div class="panel-header"><h2>学生训练情况</h2><button class="text-link" onclick="showToast('训练结果已导出')">导出结果</button></div><div class="table-wrap"><table><thead><tr><th>学生</th><th>专业</th><th>最近训练</th><th>得分</th><th>主要问题</th><th>状态</th></tr></thead><tbody>${[['李欣怡','计算机科学与技术','成长赛道模拟','86','证据归属','已完成'],['王浩然','电子商务','就业赛道模拟','81','行业理解','已完成'],['陈思雨','汉语言文学','成长赛道模拟','—','—','未开始']].map(r=>`<tr>${r.map((x,i)=>`<td>${i===5?`<span class="tag ${x==='未开始'?'amber':''}">${x}</span>`:x}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`)}

function render(){
  const routes={dashboard, 'teacher-trial':teacherTrial, competition, diagnosis, consent, device, presentation, jury, report, records, special, teacher, tasks:teacher, students:teacher, 'class-analysis':teacher};
  document.getElementById('app').innerHTML=(routes[state.view]||dashboard)();
  const main=document.querySelector('.main');
  if(Object.prototype.hasOwnProperty.call(workflowViews,state.view) && state.view!=='competition'){
    const header=main.querySelector('.page-header, .report-hero');
    if(header) header.insertAdjacentHTML('afterend',workflowProgress(state.view==='presentation'||state.view==='jury'));
    else main.insertAdjacentHTML('afterbegin',workflowProgress(true));
    if(state.view==='consent'||state.view==='device'){
      main.querySelector('.workflow-progress').insertAdjacentHTML('afterend',preparationSteps(state.view==='device'?1:0));
      if(state.view==='consent' && state.riskAcknowledged) main.querySelector('.preparation-steps').insertAdjacentHTML('afterend','<div class="risk-carry-note">已选择带风险继续：成果证据与动态调整问题将保留，用于评委针对性追问。</div>');
    }
  }
  if(state.view==='report'){
    const hero=main.querySelector('.report-hero');
    if(activeReport().answerMode==='demo'){
      hero.querySelector('.report-score').innerHTML='--';
      hero.querySelector('.report-score + .small-label').textContent='演示流程 · 不计分';
      main.querySelectorAll('.score-card strong').forEach(score=>{score.textContent='--'});
    }
    main.querySelector('.workflow-progress').insertAdjacentHTML('afterend',reportIntro());
    main.querySelector('.report-tabs').insertAdjacentHTML('beforebegin',`<div class="report-demo-note"><strong>${activeReport().answerMode==='demo'?'演示报告 · 非正式训练':'原型数据说明'}</strong><span>${activeReport().answerMode==='voice'?`本次已录制 ${activeReport().recordedAnswers||0} 段语音回答，录音仅在当前页面会话可用。`:activeReport().answerMode==='demo'?'因麦克风不可用，本次使用文字演示回答；不能据此评价言语表现，也不作为正式训练完成记录。':'本次为文字回答，不能据此评价言语表现。'}下方言语、表情和仪态分数为演示样例，不是对本次回答的AI分析结果。</span></div>`);
    if(state.voiceAnswers.length&&state.reportTab==='questions') main.querySelector('.question-review-layout').insertAdjacentHTML('beforebegin',`<section class="panel recorded-answers"><div class="panel-header"><h2>本次真实语音回答</h2><span class="small-label">仅当前浏览器会话可试听</span></div><div class="recorded-answer-list">${state.voiceAnswers.map(answer=>`<div><strong>${judges[Number(answer.key.split('-')[0])].name} · ${Number(answer.key.split('-')[1])?'追问':'主问题'}</strong><audio controls src="${answer.url}"></audio></div>`).join('')}</div></section>`);
    if(state.reportTab==='overview') main.querySelector('.report-tabs').insertAdjacentHTML('afterend',radarChart());
  }
  if(state.view==='records' && state.completedReports.length){
    main.querySelector('tbody').insertAdjacentHTML('afterbegin',state.completedReports.map(item=>`<tr><td>数字教育产品经理成长规划</td><td>${item.track}答辩${item.answerMode==='demo'?' · 演示':''}</td><td>规则V1.0 / 材料V${item.materialVersion}</td><td>刚刚完成</td><td>${item.answerMode==='demo'?'不计分':'<b class="score" style="font-size:17px">86</b>'}</td><td><button class="text-link" onclick="openReport(${item.id})">查看报告</button></td></tr>`).join(''));
  }
  if(state.view==='records') main.querySelector('.panel-header .small-label').textContent=`共 ${main.querySelectorAll('tbody tr').length} 条记录`;
  persistWorkflow();
}
render();
