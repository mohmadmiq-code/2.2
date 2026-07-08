// CoreUp V35 math asset fix. Kept separate so HTML and assets agree on TeX normalization.
(function(){
  window.CoreUpMathAssetFixV35 = {
    normalize: function(s){ return String(s==null?'':s).replace(/\\/g,'\\'.slice(0,1)); }
  };
})();
