(function(){
  if(window.CoreUpFinalMathV42 && window.CoreUpFinalMathV42.installed) return;
  var api = window.CoreUpFinalMathV42 = window.CoreUpFinalMathV42 || {};
  api.installed = true;

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];});}
  function readGroup(str, pos){
    if(str[pos] !== '{') return {text:'', end:pos};
    var depth=0, out='', i=pos;
    for(; i<str.length; i++){
      var ch=str[i];
      if(ch==='{'){ if(depth>0) out+=ch; depth++; continue; }
      if(ch==='}'){ depth--; if(depth===0){ i++; break; } out+=ch; continue; }
      out+=ch;
    }
    return {text:out, end:i};
  }
  function normalize(raw){
    var s = String(raw==null?'':raw);
    for(var k=0;k<3;k++) s = s.replace(/\\\\/g,'\\');
    s = s.replace(/[\u000c]/g,'\\f'); // in case \frac became a form-feed through an old JS escape
    s = s.replace(/\u000d/g,'');
    s = s.replace(/\\dfrac/g,'\\frac');
    s = s.replace(/\\left\s*/g,'').replace(/\\right\s*/g,'');
    s = s.replace(/leftceil/g,'\\lceil').replace(/rightceil|ightceil/g,'\\rceil');
    s = s.replace(/leftfloor/g,'\\lfloor').replace(/rightfloor|ightfloor/g,'\\rfloor');
    s = s.replace(/\bphi_i\b/g,'\\phi_i').replace(/\btheta_i\b/g,'\\theta_i');
    s = s.replace(/\bphi\b/g,'\\phi').replace(/\btheta\b/g,'\\theta');
    s = s.replace(/\bfrac\{/g,'\\frac{').replace(/\blfloor\b/g,'\\lfloor').replace(/\brfloor\b/g,'\\rfloor');
    s = s.replace(/\blceil\b/g,'\\lceil').replace(/\brceil\b/g,'\\rceil');
    return s.trim();
  }
  function command(name){
    var map={phi:'φ',theta:'θ',times:'×',cdots:'…',ldots:'…',leq:'≤',geq:'≥',approx:'≈',neq:'≠',sum:'Σ',ln:'ln',log:'log',max:'max',min:'min',lceil:'⌈',rceil:'⌉',lfloor:'⌊',rfloor:'⌋',circ:'°',degree:'°'};
    return map[name] || name;
  }
  function renderExpr(expr){
    expr = normalize(expr).replace(/^\\\(/,'').replace(/\\\)$/,'').replace(/^\\\[/,'').replace(/\\\]$/,'');
    var i=0, out='';
    while(i<expr.length){
      var ch=expr[i];
      if(ch==='\\'){
        var j=i+1;
        if(expr[j]==='%'){ out += '%'; i=j+1; continue; }
        while(j<expr.length && /[A-Za-z]+/.test(expr[j])) j++;
        var name=expr.slice(i+1,j);
        if((name==='frac'||name==='dfrac') && expr[j]==='{'){
          var a=readGroup(expr,j), b=readGroup(expr,a.end);
          out += '<span class="cu42-frac"><span class="cu42-num">'+renderExpr(a.text)+'</span><span class="cu42-den">'+renderExpr(b.text)+'</span></span>';
          i=b.end; continue;
        }
        if((name==='text'||name==='mathrm'||name==='operatorname') && expr[j]==='{'){
          var tg=readGroup(expr,j); out += '<span class="cu42-text">'+esc(tg.text)+'</span>'; i=tg.end; continue;
        }
        if(name==='bar' && expr[j]==='{'){
          var bg=readGroup(expr,j); out += '<span class="cu42-over">'+renderExpr(bg.text)+'</span>'; i=bg.end; continue;
        }
        if(name==='sqrt' && expr[j]==='{'){
          var sg=readGroup(expr,j); out += '<span class="cu42-sqrt">√<span>'+renderExpr(sg.text)+'</span></span>'; i=sg.end; continue;
        }
        if(name==='left'||name==='right'){ i=j; continue; }
        out += esc(command(name)); i=j; continue;
      }
      if(ch==='_'){
        var sub='', end=i+1;
        if(expr[i+1]==='{'){ var g=readGroup(expr,i+1); sub=g.text; end=g.end; }
        else { sub=expr[i+1]||''; end=i+2; }
        out += '<sub>'+renderExpr(sub)+'</sub>'; i=end; continue;
      }
      if(ch==='^'){
        var sup='', end2=i+1;
        if(expr[i+1]==='{'){ var g2=readGroup(expr,i+1); sup=g2.text; end2=g2.end; }
        else if(expr.slice(i+1,i+6)==='\\circ'){ sup='\\circ'; end2=i+6; }
        else { sup=expr[i+1]||''; end2=i+2; }
        var supHtml = renderExpr(sup);
        if(supHtml==='°') out += '°'; else out += '<sup>'+supHtml+'</sup>';
        i=end2; continue;
      }
      if(ch==='{' || ch==='}') { i++; continue; }
      if(ch==='*'){ out+='×'; i++; continue; }
      out += esc(ch); i++;
    }
    return out.replace(/\s+/g,' ');
  }
  function mathSpan(expr, display){
    return '<span class="cu42-math '+(display?'cu42-display':'cu42-inline')+'" dir="ltr">'+renderExpr(expr)+'</span>';
  }
  function looksLikeMath(s){
    return /\\\(|\\\[|\\frac|\\phi|\\theta|\\lfloor|\\lceil|\\rfloor|\\rceil|\bphi_i\b|\btheta_i\b|\bf_i\b|\bx_i\b|\bF_i\b|\bb_i\b|\bC\s*=|\bk\s*=|\bR\s*=/.test(String(s));
  }
  function renderTextToHtml(text){
    text = String(text==null?'':text);
    if(!looksLikeMath(text)) return null;
    var re = /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
    var out='', last=0, m;
    while((m=re.exec(text))){
      out += esc(text.slice(last,m.index));
      out += mathSpan(m[1]!==undefined ? m[1] : m[2], m[2]!==undefined);
      last = re.lastIndex;
    }
    out += esc(text.slice(last));
    if(out===esc(text)){
      var trimmed = text.trim();
      if(/[=]|\\frac|\\lceil|\\lfloor|phi_i|f_i|x_i|F_i/.test(trimmed)) return mathSpan(trimmed.replace(/^\(|\)$/g,''), false);
      return null;
    }
    return out;
  }
  function skipNode(n){
    if(!n || !n.parentNode) return true;
    var p=n.parentNode;
    if(p.closest && p.closest('script,style,textarea,input,select,option,.cu42-math,.katex,.MathJax')) return true;
    return false;
  }
  function processTextNode(n){
    if(skipNode(n)) return;
    var html = renderTextToHtml(n.nodeValue);
    if(!html) return;
    var span=document.createElement('span');
    span.className='cu42-rendered-wrap';
    span.innerHTML=html;
    n.parentNode.replaceChild(span,n);
  }
  function render(root){
    root = root || document.body;
    if(!root) return;
    try{
      root.querySelectorAll && root.querySelectorAll('.mathBlock,.mathInline').forEach(function(el){
        if(el.querySelector('.cu42-math,.katex,.MathJax')) return;
        var html = renderTextToHtml(el.textContent || '');
        if(html){ el.innerHTML = html; el.classList.add('cu42-processed'); }
      });
      var walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode:function(n){
        if(skipNode(n)) return NodeFilter.FILTER_REJECT;
        if(!looksLikeMath(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }});
      var nodes=[], node;
      while((node=walker.nextNode())) nodes.push(node);
      nodes.forEach(processTextNode);
    }catch(e){ console.warn('CoreUp math render skipped', e); }
  }
  api.render = render;
  window.CoreUpTypesetMathV42 = render;
  window.CoreUpTypesetMathV36 = render;
  window.typesetMath = render;
  function install(){
    render(document.body);
    if(typeof window.renderAll==='function' && !window.renderAll.__cu42MathWrapped){
      var old=window.renderAll;
      window.renderAll=function(){
        var r=old.apply(this,arguments);
        setTimeout(function(){render(document.body);},0);
        setTimeout(function(){render(document.body);},80);
        return r;
      };
      window.renderAll.__cu42MathWrapped=true;
    }
    if(typeof window.openModal==='function' && !window.openModal.__cu42MathWrapped){
      var oldM=window.openModal;
      window.openModal=function(){
        var r=oldM.apply(this,arguments);
        setTimeout(function(){ var b=document.getElementById('modalBody'); if(b) render(b);},0);
        return r;
      };
      window.openModal.__cu42MathWrapped=true;
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install); else install();
  setTimeout(install, 250);
  setTimeout(function(){render(document.body);}, 1000);
})();
