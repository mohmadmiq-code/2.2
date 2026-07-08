/* STAT102 Core Up Local Adaptive Assistant. Rule-based/offline with typed responses; it does not claim to be an external LLM. */
(function(){
  // This file intentionally overrides older assistant launchers so the assistant cannot disappear.
  window.__STAT102_CH1_COREUP_V6__ = true;
  window.CoreUpAssistantInfo = {type:'rule_based_local_adaptive', usesExternalLLM:false};

  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function stripHtml(v){var d=document.createElement('div'); d.innerHTML=String(v==null?'':v); return (d.textContent||d.innerText||'').replace(/\s+/g,' ').trim();}
  function data(){return window.STAT102_CH1_TRAINING || window.STAT102_TRAINING || {lessons:{},common_error_types:{generic:{name:'خطأ عام',diagnosis:'راجع المفهوم المطلوب.',hint:'حدد المصطلح أولًا ثم طابقه مع المثال.',check:'استبعد الخيارات غير المناسبة.'}},chat_templates:{}};}
  function lesson(){var s=(document.title||'')+' '+(location.pathname||''); var m=s.match(/1\.[12]/); return m?m[0]:(/1_2|STAT102_1_2/.test(s)?'1.2':'1.1');}
  function currentQuestion(){try{ if(Array.isArray(BANK) && typeof state!=='undefined' && BANK[state.currentIndex]) return BANK[state.currentIndex]; }catch(e){} return null;}
  function qidOf(p){var q=(p&&p.q)||currentQuestion(); return String((q&&q.id)||'current');}
  function branchOf(p){var q=(p&&p.q)||currentQuestion(); if(p&&p.b) return p.b; try{return q&&q.branches?q.branches[0]:null;}catch(e){return null;}}
  function currentSig(p){try{var qid=qidOf(p), bi=(p&&p.branchIndex!=null)?p.branchIndex:0, v=(typeof state!=='undefined'&&state.variants&&qid)?(state.variants[qid]||0):0; return lesson()+'|'+qid+'|'+bi+'|'+v;}catch(e){return lesson()+'|current';}}
  function lessonData(){var d=data(); return (d.lessons&&d.lessons[lesson()]) || (d.lessons&&d.lessons['1.1']) || {};}
  function errorPack(key){var d=data(), e=(d.common_error_types||{})[key] || (d.common_error_types||{}).generic || {}; return {name:e.name||'خطأ عام',diagnosis:e.diagnosis||'راجع المفهوم المطلوب.',hint:e.hint||'حدد المصطلح أولًا.',check:e.check||''};}
  function textOfPayload(p){var b=branchOf(p), q=(p&&p.q)||currentQuestion(); return [qidOf(p), q&&q.title, b&&b.prompt, b&&b.promptHtml, (p&&p.wrongItems||[]).map(function(x){return [x.label,x.labelHtml,x.student,x.correct].join(' ')}).join(' ')].map(stripHtml).join(' ');}
  function detectErrorKey(p){
    var qid=qidOf(p), txt=textOfPayload(p), ld=lessonData(), kw=ld.question_keywords||{}, wrong=(p&&p.wrongItems)||[];
    if(kw[qid]) return kw[qid];
    for(var i=0;i<wrong.length;i++){
      var st=String(wrong[i].student||''), co=String(wrong[i].correct||'');
      if(/N|n|معلمة|إحصاءة|Parameter|Statistic/.test(txt)) return 'parameter_statistic_confusion';
      if(/رقم الهوية|رقم الطالب|ID|تعريف/.test(txt+st+co)) return 'coding_number_confusion';
      if(/درجة الحرارة|فئوي|Interval|نسبي|Ratio|صفر/.test(txt+st+co)) return 'interval_ratio_confusion';
      if(/اسمي|Nominal|ترتيبي|Ordinal|رتبة/.test(txt+st+co)) return 'nominal_ordinal_confusion';
    }
    var ordered=Object.keys(kw).sort(function(a,b){return b.length-a.length;});
    for(var j=0;j<ordered.length;j++){var k=ordered[j]; if(k && txt.indexOf(k)>=0) return kw[k];}
    if(lesson()==='1.1'){
      if(/مسح|معاينة|جميع|جزء|كل/.test(txt)) return 'census_sampling_confusion';
      if(/عشوائية|عمدية|اختيار|سحب|قرعة/.test(txt)) return 'intentional_random_sample_confusion';
      if(/معلمة|إحصاءة|Statistic|Parameter|N|n/.test(txt)) return 'parameter_statistic_confusion';
      if(/بيانات|قياس|مشاهدة|معملية|اختبار/.test(txt)) return 'data_source_confusion';
      if(/مجتمع|عينة/.test(txt)) return 'population_sample_confusion';
      return 'population_sample_confusion';
    }
    if(/متقطع|مستمر|Discrete|Continuous|عد|قياس/.test(txt)) return 'discrete_continuous_confusion';
    if(/اسمي|ترتيبي|Nominal|Ordinal|رتبة/.test(txt)) return 'nominal_ordinal_confusion';
    if(/فئوي|نسبي|Interval|Ratio|صفر|نسبة/.test(txt)) return 'interval_ratio_confusion';
    if(/رقم الهوية|رقم الطالب|ID|ترميز/.test(txt)) return 'coding_number_confusion';
    if(/نوعي|كمي|Qualitative|Quantitative/.test(txt)) return 'qual_quant_confusion';
    return 'generic';
  }
  function lawsFor(p){var b=branchOf(p), direct=[]; if(b){ if(Array.isArray(b.formula)) direct=b.formula; else if(Array.isArray(b.law)) direct=b.law; }
    if(direct&&direct.length) return direct; var ld=lessonData(); return (ld.laws||[]).slice(0,9);
  }
  function conceptLines(p){
    var ld=lessonData(), key=detectErrorKey(p), concepts=ld.concepts||{}, map={
      population_sample_confusion:'population', parameter_statistic_confusion:'population', census_sampling_confusion:'census', intentional_random_sample_confusion:'samples', data_source_confusion:'data',
      qual_quant_confusion:'qualitative_quantitative', discrete_continuous_confusion:'discrete_continuous', nominal_ordinal_confusion:'nominal', interval_ratio_confusion:'interval', coding_number_confusion:'qualitative_quantitative'
    };
    var arr=concepts[map[key]]||[];
    if(key==='nominal_ordinal_confusion') arr=(concepts.nominal||[]).concat(concepts.ordinal||[]);
    if(key==='interval_ratio_confusion') arr=(concepts.interval||[]).concat(concepts.ratio||[]);
    return arr;
  }
  function finalAnswerText(p){var b=branchOf(p); if(!b||!b.answers) return 'راجع الإجابة الصحيحة الظاهرة في السؤال.'; var parts=b.parts||[], out=[]; parts.forEach(function(part){var lab=stripHtml(part.label||part.labelHtml||part.key||'المطلوب'); var ans=b.answers[part.key]; if(ans!=null) out.push(lab+' → '+String(ans));}); return out.length?('الإجابة الصحيحة:\n'+out.join('\n')):'راجع الإجابة الصحيحة الظاهرة في السؤال.';}
  function stepsFor(p,reveal){var b=branchOf(p), arr=[]; if(b&&Array.isArray(b.solutionSteps)&&b.solutionSteps.length) arr=b.solutionSteps.slice(); var key=detectErrorKey(p);
    if(!arr.length){
      if(key==='population_sample_confusion') arr=['حدّد المفردات التي يريد السؤال دراستها.','إذا كانت كل المفردات مطلوبة فهي مجتمع، وإذا اختير جزء منها فهي عينة.'];
      else if(key==='parameter_statistic_confusion') arr=['حدّد هل القيمة محسوبة من المجتمع كاملًا أم من عينة.','إذا كانت من المجتمع فهي معلمة، وإذا كانت من العينة فهي إحصاءة.'];
      else if(key==='census_sampling_confusion') arr=['ابحث عن كلمة جميع/كل أو جزء/بعض.','كل العناصر تعني مسحًا شاملًا، وجزء من العناصر يعني معاينة.'];
      else if(key==='intentional_random_sample_confusion') arr=['حدّد من اختار العناصر: الباحث أم السحب العشوائي.','تدخل الباحث يعني عينة عمدية، والسحب بالقرعة أو الأرقام العشوائية يعني عينة عشوائية.'];
      else if(key==='qual_quant_confusion') arr=['اسأل: هل الناتج صفة/فئة أم عدد/مقدار؟','الصفة أو الفئة نوعية، والعدد أو القياس كمي.'];
      else if(key==='discrete_continuous_confusion') arr=['اسأل: هل القيمة ناتجة عن عدّ أم قياس؟','العدّ متقطع، والقياس على فترة مستمر غالبًا.'];
      else if(key==='nominal_ordinal_confusion') arr=['افحص هل توجد رتبة طبيعية بين الفئات.','بلا ترتيب = اسمي، ومع ترتيب = ترتيبي.'];
      else if(key==='interval_ratio_confusion') arr=['افحص معنى الصفر.','إذا كان الصفر لا يعني العدم فهو فئوي، وإذا كان يعني العدم وتصح النسب فهو نسبي.'];
      else if(key==='coding_number_confusion') arr=['لا تحكم من شكل القيمة كرقم.','إذا كان الرقم مجرد بطاقة تعريف فهو نوعي اسمي وليس كميًا.'];
      else arr=['حدد المفهوم المطلوب في السؤال.','طابق المثال مع التعريف المناسب.','استبعد الاختيارات التي تصف مفهومًا آخر.'];
    }
    if(reveal) arr.push(finalAnswerText(p));
    return arr;
  }
  function similar(p){var ld=lessonData(), key=detectErrorKey(p), ex=ld.similar_examples||{}; if(key==='population_sample_confusion') return ex.population || 'مثال مشابه: إذا قيل جميع طلاب الجامعة فهذا مجتمع، وإذا قيل 50 طالبًا مختارين فهذا عينة.'; if(key==='census_sampling_confusion') return ex.census || 'مثال مشابه: دراسة الجميع مسح شامل، ودراسة جزء من المجتمع معاينة.'; if(key==='parameter_statistic_confusion') return ex.parameter || 'مثال مشابه: متوسط أعمار كل الطلاب معلمة، ومتوسط أعمار عينة منهم إحصاءة.'; if(key==='qual_quant_confusion'||key==='coding_number_confusion') return ex.qualitative || 'مثال مشابه: اللون نوعي، والعمر كمي. ورقم الطالب ترميز لا كمية.'; if(key==='discrete_continuous_confusion') return ex.discrete || 'مثال مشابه: عدد الطلاب متقطع، والطول مستمر.'; if(key==='nominal_ordinal_confusion') return ex.nominal || 'مثال مشابه: فصيلة الدم اسمية، ومستوى الرضا ترتيبي.'; if(key==='interval_ratio_confusion') return ex.interval || 'مثال مشابه: الحرارة المئوية فئوية، والوزن نسبي.'; return 'مثال مشابه: غيّر المثال فقط وطبّق القاعدة نفسها خطوة بخطوة.';}
  function typeset(el){try{ if(typeof window.typesetMath==='function'){ window.typesetMath(el||document.body); } else if(window.renderMathInElement){ window.renderMathInElement(el||document.body,{delimiters:[{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}]}); } else if(window.MathJax&&MathJax.typesetPromise){ MathJax.typesetPromise([el||document.body]); }}catch(e){} }
  function renderRich(t){var raw=String(t||'');var lines=raw.split(/\n+/).map(function(x){return x.trim();}).filter(Boolean);if(lines.length>1){return '<ul>'+lines.map(function(x){return '<li>'+esc(x.replace(/^[-•]\s*/,''))+'</li>';}).join('')+'</ul>';}return esc(raw).replace(/\n/g,'<br>');}

  var payload=null, sig=null, messages=[], busy=false;

  function css(){ if(document.getElementById('stat102-ch1-v6-style')) return; var st=document.createElement('style'); st.id='stat102-ch1-v6-style'; st.textContent=`
    .core-up-header-logo-v21{position:absolute!important;right:14px!important;top:50%!important;transform:translateY(-50%)!important;width:58px!important;height:58px!important;border-radius:16px!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.18)!important;border:1px solid rgba(255,255,255,.35)!important;box-shadow:0 10px 24px rgba(0,0,0,.18)!important;z-index:20!important;overflow:hidden!important}.core-up-header-logo-v21 img{width:46px!important;height:46px!important;object-fit:contain!important;display:block!important}.topbar .row .topbarRight{margin-right:74px!important}@media(max-width:720px){.core-up-header-logo-v21{width:44px!important;height:44px!important;right:8px!important}.core-up-header-logo-v21 img{width:36px!important;height:36px!important}.topbar .row .topbarRight{margin-right:54px!important}}
    #saiLauncherV21{position:fixed!important;left:22px!important;bottom:22px!important;z-index:2147483600!important;direction:rtl!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;transform:none!important}
    #saiLauncherV21 button{border:0!important;border-radius:999px!important;padding:12px 18px!important;background:linear-gradient(135deg,#0369a1,#0c4a6e)!important;color:#fff!important;font-family:Tahoma,Arial,"Segoe UI",sans-serif!important;font-size:13px!important;font-weight:900!important;box-shadow:0 14px 35px rgba(3,105,161,.30)!important;cursor:pointer!important;display:inline-flex!important;align-items:center!important;gap:8px!important;visibility:visible!important;opacity:1!important;min-width:auto!important;height:auto!important}
    #saiLauncherV21 button::before{content:"";width:18px;height:18px;background:url('../assets/img/core_up_icon.png') center/contain no-repeat;display:inline-block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.18))}
    #saiOverlayV21{position:fixed!important;inset:0!important;background:rgba(15,23,42,.12)!important;z-index:2147483400!important;opacity:0;pointer-events:none;transition:opacity .2s ease}#saiOverlayV21.open{opacity:1!important;pointer-events:auto!important}
    #saiDrawerV21{position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:min(430px,92vw)!important;z-index:2147483500!important;background:#fff!important;border-right:1px solid #dbe7f2!important;box-shadow:24px 0 60px rgba(15,23,42,.20)!important;transform:translateX(-105%)!important;transition:transform .28s cubic-bezier(.4,0,.2,1)!important;display:flex!important;flex-direction:column!important;direction:rtl!important;font-family:Tahoma,Arial,"Segoe UI",sans-serif!important;color:#0f172a!important}#saiDrawerV21.open{transform:translateX(0)!important}
    .sai21-head{padding:16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:10px;background:linear-gradient(180deg,#f8fbff,#fff)}.sai21-brand{display:flex;align-items:center;gap:10px}.sai21-brand img{width:34px;height:34px;object-fit:contain;border-radius:10px}.sai21-title{font-size:15px;font-weight:900;line-height:1.3}.sai21-sub{font-size:11px;color:#64748b;font-weight:800}.sai21-close{border:1px solid #dbe7f2;background:#fff;border-radius:10px;padding:8px 10px;font-weight:900;cursor:pointer;font-family:inherit;font-size:12px}.sai21-body{flex:1;overflow:auto;padding:14px;background:linear-gradient(180deg,#f8fbff,#fff)}.sai21-empty{height:100%;min-height:220px}.sai21-msg{max-width:92%;border:1px solid #e2e8f0;border-radius:16px;padding:11px 12px;margin:9px 0;background:#fff;box-shadow:0 8px 22px rgba(15,23,42,.06);font-size:12.5px;line-height:1.9;font-weight:600;white-space:normal}.sai21-msg.user{margin-right:auto;background:#e0f2fe;border-color:#bae6fd}.sai21-msg-title{font-size:12px;color:#0369a1;font-weight:900;margin-bottom:4px}.sai21-msg-content{font-size:12.5px;line-height:1.95;font-weight:600}.sai21-msg-content ul{margin:0;padding-right:18px}.sai21-msg-content li{margin:5px 0}.sai21-actions{padding:10px 12px;border-top:1px solid #e2e8f0;display:flex;gap:8px;flex-wrap:wrap;background:#fff}.sai21-actions button{border:1px solid #cfe0ee;background:#fff;border-radius:12px;padding:8px 10px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer}.sai21-actions button:hover{background:#f0f9ff;border-color:#7dd3fc}.sai21-actions button[disabled]{display:none!important}.sai21-inputbar{padding:10px 12px;border-top:1px solid #e2e8f0;background:#fff;display:flex;gap:8px}.sai21-inputbar input{flex:1;min-width:0!important;border:1px solid #dbe7f2;border-radius:12px;padding:9px 10px;font-family:inherit;font-size:12.5px}.sai21-inputbar button{border:0;border-radius:12px;background:#0369a1;color:#fff;padding:9px 12px;font-family:inherit;font-size:12px;font-weight:900;cursor:pointer}.sai21-typing{display:inline-flex;gap:4px;border:1px solid #e2e8f0;border-radius:16px;padding:10px 12px;background:#fff;margin:8px 0}.sai21-typing span{width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:sai21blink 1s infinite ease-in-out}.sai21-typing span:nth-child(2){animation-delay:.15s}.sai21-typing span:nth-child(3){animation-delay:.3s}@keyframes sai21blink{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
    #saiDrawerV21 .katex,#saiDrawerV21 .katex-display,#saiDrawerV21 mjx-container{direction:ltr!important;unicode-bidi:isolate!important}@media(max-width:720px){#saiLauncherV21{left:14px!important;bottom:14px!important}#saiLauncherV21 button{padding:11px 14px!important;font-size:12px!important}}
  `; document.head.appendChild(st); }
  function canReveal(){return !!(payload && (Number(payload.attempt||0)>=2 || payload.includeSolution===true));}
  function updateSolutionButton(){try{var d=document.getElementById('saiDrawerV21'); if(!d)return; var b=d.querySelector('[data-sai21="solution"]'); if(!b)return; b.disabled=!canReveal(); b.title=canReveal()?'عرض الحل بعد المحاولة الثانية':'الحل الكامل لا يظهر إلا بعد المحاولة الثانية';}catch(e){}}
  function ensureDrawer(){css(); var ov=document.getElementById('saiOverlayV21'); if(!ov){ov=document.createElement('div');ov.id='saiOverlayV21';ov.onclick=closeDrawer;document.body.appendChild(ov);} var d=document.getElementById('saiDrawerV21'); if(!d){d=document.createElement('section');d.id='saiDrawerV21';d.innerHTML='<div class="sai21-head"><div class="sai21-brand"><img src="../assets/img/core_up_icon.png" alt="Core Up"><div><div class="sai21-title">المساعد الذكي</div><div class="sai21-sub">Core Up</div></div></div><button class="sai21-close" type="button">إغلاق</button></div><div class="sai21-body" id="saiBodyV21"><div class="sai21-empty"></div></div><div class="sai21-actions"><button data-sai21="more" type="button">اشرح أكثر</button><button data-sai21="law" type="button">اعرض القاعدة</button><button data-sai21="example" type="button">مثال مشابه</button><button data-sai21="solution" type="button">اعرض الحل</button></div><div class="sai21-inputbar"><input id="saiInputV21" placeholder="اكتب سؤالك هنا"><button id="saiSendV21" type="button">إرسال</button></div>';document.body.appendChild(d);d.querySelector('.sai21-close').onclick=closeDrawer;d.querySelectorAll('[data-sai21]').forEach(function(b){b.onclick=function(){addUser(b.textContent.trim());handle(b.getAttribute('data-sai21'));};});var send=function(){var inp=document.getElementById('saiInputV21'),t=(inp.value||'').trim();if(!t)return;inp.value='';addUser(t);handle(/قانون|قاعدة|formula|law/.test(t)?'law':/مثال|similar|example/.test(t)?'example':/حل|answer|solution/.test(t)?'solution':'more');};d.querySelector('#saiSendV21').onclick=send;d.querySelector('#saiInputV21').addEventListener('keydown',function(e){if(e.key==='Enter')send();});} updateSolutionButton(); return d;}
  function openDrawer(){ensureDrawer().classList.add('open'); var ov=document.getElementById('saiOverlayV21'); if(ov)ov.classList.add('open'); updateSolutionButton(); render(); return true;}
  function closeDrawer(){var d=document.getElementById('saiDrawerV21'), ov=document.getElementById('saiOverlayV21'); if(d)d.classList.remove('open'); if(ov)ov.classList.remove('open');}
  function render(){var body=document.getElementById('saiBodyV21');if(!body)return;body.innerHTML='';if(!messages.length){body.innerHTML='<div class="sai21-empty"></div>';return;}messages.forEach(function(m){var n=document.createElement('div');n.className='sai21-msg '+(m.role==='user'?'user':'bot');n.innerHTML=(m.title?'<div class="sai21-msg-title">'+esc(m.title)+'</div>':'')+'<div class="sai21-msg-content">'+renderRich(m.text)+'</div>';body.appendChild(n);typeset(n);});body.scrollTop=body.scrollHeight;}
  function addUser(t){messages.push({role:'user',text:t});render();}
  function typing(){var b=document.getElementById('saiBodyV21');if(!b)return null;var n=document.createElement('div');n.className='sai21-typing';n.innerHTML='<span></span><span></span><span></span>';b.appendChild(n);b.scrollTop=b.scrollHeight;return n;}
  function typeBot(title,text){if(busy)return Promise.resolve();busy=true;var ind=typing();return new Promise(function(resolve){setTimeout(function(){if(ind)ind.remove();var b=document.getElementById('saiBodyV21');if(!b){busy=false;resolve();return;}var node=document.createElement('div');node.className='sai21-msg bot';node.innerHTML=(title?'<div class="sai21-msg-title">'+esc(title)+'</div>':'')+'<div class="sai21-msg-content"></div>';b.appendChild(node);var c=node.querySelector('.sai21-msg-content'),full=String(text||''),i=0;(function tick(){if(i<=full.length){c.textContent=full.slice(0,i++);b.scrollTop=b.scrollHeight;setTimeout(tick,full.length>260?7:13);}else{c.innerHTML=renderRich(full);messages.push({role:'bot',title:title||'',text:full});typeset(node);busy=false;b.scrollTop=b.scrollHeight;resolve();}})();},240);});}
  function queue(list){var p=Promise.resolve();list.forEach(function(m){p=p.then(function(){return typeBot(m.title,m.text);});});return p;}
  function setPayload(p){var s=currentSig(p);if(sig!==null&&s!==sig){messages=[];}sig=s;payload=p||{};updateSolutionButton();}
  function auto(p){var att=Number((p&&p.attempt)||1),key=detectErrorKey(p),e=errorPack(key),tmpl=(data().chat_templates||{});var list=[];list.push({title:'المساعدة',text:(att<=1?tmpl.opening_first:tmpl.opening_second)||''});list.push({title:'نوع الخطأ المحتمل',text:e.name}); if(att<=1){list.push({title:'التشخيص',text:e.diagnosis});list.push({title:'القاعدة المناسبة',text:lawsFor(p).slice(0,4).join('\n')});list.push({title:'تلميح دون الحل',text:e.hint+'\n'+(e.check||'')});}else{list.push({title:'القانون والتطبيق خطوة بخطوة',text:stepsFor(p,true).map(function(x){return '• '+x;}).join('\n')});} return list;}
  function handle(mode){var p=payload||{}; if(mode==='law')return queue([{title:'القاعدة المناسبة',text:lawsFor(p).join('\n')}]); if(mode==='example')return queue([{title:'مثال مشابه',text:similar(p)}]); if(mode==='solution'){if(!canReveal())return queue([{title:'تنبيه',text:'الحل الكامل يظهر بعد المحاولة الثانية. يمكنني الآن عرض القاعدة أو مثال مشابه.'}]);return queue([{title:'خطوات الحل',text:stepsFor(p,true).map(function(x){return '• '+x;}).join('\n')}]);} return queue([{title:'توضيح إضافي',text:(conceptLines(p).concat([errorPack(detectErrorKey(p)).check]).filter(Boolean).join('\n')) || errorPack(detectErrorKey(p)).hint}]);}

  window.InternalAiTrainingAPI={
    __chapter1CoreUpV6:true,
    loadTraining:function(){return Promise.resolve({ok:true,source:'chapter1_coreup_v6_6_1_logic'});},
    getTraining:function(){return data();},
    detectErrorType:function(p){return errorPack(detectErrorKey(p||payload||{})).name;},
    handleWrongAnswer:function(p){setPayload(p||{});openDrawer();queue(auto(payload));return true;},
    openChat:function(){payload=null;messages=[];sig=currentSig(null);openDrawer();return true;},
    openDemo:function(){payload=null;messages=[];sig=currentSig(null);openDrawer();return true;},
    ask:function(p){if(p)setPayload(p);return handle((p&&p.mode)||'more').then(function(){return {ok:true};});}
  };
  function patchLauncher(){css(); ['saiLauncherCh1','saiLauncherV14','saiLauncherV18'].forEach(function(id){var old=document.getElementById(id); if(old) old.style.display='none';}); var l=document.getElementById('saiLauncherV21'); if(!l){l=document.createElement('div');l.id='saiLauncherV21';document.body.appendChild(l);} l.style.display='block';l.style.visibility='visible';l.style.opacity='1';l.innerHTML='<button type="button">المساعد الذكي</button>'; l.querySelector('button').onclick=function(){payload=null;messages=[];sig=currentSig(null);openDrawer();};}
  function patchBrand(){var row=document.querySelector('.topbar .row'); if(row&&!document.querySelector('.core-up-header-logo-v21')){var logo=document.createElement('div');logo.className='core-up-header-logo-v21';logo.title='Core Up';logo.innerHTML='<img src="../assets/img/core_up_icon.png" alt="Core Up">';row.appendChild(logo);} }
  function boot(){patchBrand();patchLauncher();setTimeout(function(){patchBrand();patchLauncher();typeset(document.body);},120);setTimeout(patchLauncher,600);setTimeout(patchLauncher,1400);try{window.addEventListener('load',function(){patchBrand();patchLauncher();setTimeout(patchLauncher,700);});}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  try{if(typeof renderAll==='function'&&!renderAll.__ch1V6Wrapped){var oldRender=renderAll;renderAll=function(){var before=currentSig(null);var out=oldRender.apply(this,arguments);var after=currentSig(null);if(sig!==null&&before!==after){messages=[];payload=null;sig=after;}setTimeout(function(){patchBrand();patchLauncher();typeset(document.body);},120);return out;};renderAll.__ch1V6Wrapped=true;}}catch(e){}
  document.addEventListener('keydown',function(e){if(e.key==='Escape') closeDrawer();});
})();
