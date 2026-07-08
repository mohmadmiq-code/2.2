/* Local adaptive learning helper for STAT 102. Offline only.
   V10: model files are actually used; numeric features are normalized; one canonical BKT source. */
(function(){
  if(window.AdaptiveLearning && window.AdaptiveLearning.__v10) return;

  const KEY = 'stat102_local_training_events_v2';
  const DEFAULT_BKT = {
    prior_mastery: 0.35,
    learn_rate: 0.12,
    guess: 0.20,
    slip: 0.10
  };
  const DEFAULT_LR = {
    weights: {
      bias: -1.10,
      difficulty: -0.35,
      attempts_count: -0.45,
      used_help: -0.25,
      time_spent_sec: -0.10,
      showed_solution: -0.65,
      bkt_mastery: 3.20
    },
    support_thresholds: { none: 0.75, hint: 0.50, guided_steps: 0.0 }
  };

  const mastery = {};
  let models = { bkt: DEFAULT_BKT, lr: DEFAULT_LR };
  try{ window.COREUP_BKT_CONFIG = Object.assign({}, DEFAULT_BKT); window.COREUP_LR_CONFIG = Object.assign({}, DEFAULT_LR); }catch(e){}

  function clamp(v, min, max){
    v = Number(v);
    if(!Number.isFinite(v)) v = min;
    return Math.max(min, Math.min(max, v));
  }
  function sigmoid(x){ return 1 / (1 + Math.exp(-x)); }
  function bool01(v){ return v ? 1 : 0; }
  function loadEvents(){ try{ return JSON.parse(localStorage.getItem(KEY) || '[]') || []; }catch(e){ return []; } }
  function saveEvents(events){ try{ localStorage.setItem(KEY, JSON.stringify(events.slice(-1000))); }catch(e){} }

  function difficultyValue(raw){
    const s = String(raw == null ? 'medium' : raw).toLowerCase();
    if(s.indexOf('hard') >= 0 || s.indexOf('صعب') >= 0) return 1;
    if(s.indexOf('easy') >= 0 || s.indexOf('سهل') >= 0) return -1;
    return 0;
  }

  function normalizedFeatures(payload){
    payload = payload || {};
    const attempts = Number(payload.attempts_count == null ? 1 : payload.attempts_count);
    const spent = Number(payload.time_spent_sec == null ? 0 : payload.time_spent_sec);
    return {
      difficulty: difficultyValue(payload.difficulty),
      attempts_count: clamp((attempts - 1) / 3, 0, 1),
      used_help: bool01(payload.used_help),
      time_spent_sec: clamp(spent / 300, 0, 1),
      showed_solution: bool01(payload.showed_solution),
      bkt_mastery: clamp(payload.bkt_mastery == null ? DEFAULT_BKT.prior_mastery : payload.bkt_mastery, 0.01, 0.99)
    };
  }

  function supportLabel(prob){
    const thresholds = (models.lr && models.lr.support_thresholds) || DEFAULT_LR.support_thresholds;
    if(prob >= (thresholds.none == null ? 0.75 : thresholds.none)) return 'none';
    if(prob >= (thresholds.hint == null ? 0.50 : thresholds.hint)) return 'hint';
    return 'guided_steps';
  }

  window.AdaptiveLearning = {
    __v10: true,

    getLoadedModels:function(){ return JSON.parse(JSON.stringify(models)); },

    updateBKT:function(skillId, isCorrect){
      const id = String(skillId || 'general');
      const cfg = Object.assign({}, DEFAULT_BKT, models.bkt || {});
      const prior = clamp(mastery[id] == null ? cfg.prior_mastery : mastery[id], 0.001, 0.999);
      const T = clamp(cfg.learn_rate, 0, 1);
      const G = clamp(cfg.guess, 0.001, 0.999);
      const S = clamp(cfg.slip, 0.001, 0.999);
      let posterior = isCorrect
        ? (prior * (1 - S)) / ((prior * (1 - S)) + ((1 - prior) * G))
        : (prior * S) / ((prior * S) + ((1 - prior) * (1 - G)));
      posterior = posterior + (1 - posterior) * T;
      mastery[id] = clamp(posterior, 0.01, 0.99);
      return { skill_id:id, mastery:mastery[id], model:'bkt', parameters:{prior_mastery:cfg.prior_mastery, learn_rate:T, guess:G, slip:S} };
    },

    predictMastery:function(payload){
      const lr = Object.assign({}, DEFAULT_LR, models.lr || {});
      const weights = Object.assign({}, DEFAULT_LR.weights, lr.weights || {});
      const x = normalizedFeatures(payload || {});
      let logit = Number(weights.bias || 0);
      Object.keys(x).forEach(function(k){ logit += Number(weights[k] || 0) * x[k]; });
      const p = clamp(sigmoid(logit), 0.01, 0.99);
      return {
        probability_mastered:p,
        recommended_support:supportLabel(p),
        model:'logistic_regression_light',
        normalized_features:x,
        logit:logit
      };
    },

    collectStudentEvent:function(payload){
      const events = loadEvents();
      events.push(Object.assign({ timestamp:new Date().toISOString() }, payload || {}));
      saveEvents(events);
      return { ok:true, count:events.length };
    },

    exportTrainingData:function(){
      const events = loadEvents();
      const blob = new Blob([JSON.stringify({ course:'STAT102', events:events }, null, 2)], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stat102_training_events.json';
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
      return { ok:true, count:events.length };
    },

    loadModelWeights:function(paths){
      paths = paths || {};
      const bktPath = paths.bktPath;
      const lrPath = paths.lrPath;
      const read = function(path){
        if(!path) return Promise.resolve(null);
        return fetch(path).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
      };
      return Promise.all([read(bktPath), read(lrPath)]).then(function(res){
        if(res[0]) models.bkt = Object.assign({}, DEFAULT_BKT, res[0]);
        if(res[1]) models.lr  = Object.assign({}, DEFAULT_LR, res[1]);
        try{ window.COREUP_BKT_CONFIG = Object.assign({}, models.bkt); window.COREUP_LR_CONFIG = Object.assign({}, models.lr); }catch(e){}
        if(!res[0] && !res[1]) throw new Error('model files not loaded');
        return { ok:true, models:models, loaded:{ bkt:!!res[0], lr:!!res[1] } };
      });
    }
  };
})();
