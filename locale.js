(function(root){
  'use strict';
  function initialLanguage(saved,preferences){
    if(saved && ['zh','en'].includes(saved.lang))return saved.lang;
    for(const entry of preferences||[]){
      const tag=String(entry).toLowerCase();
      if(tag==='zh'||tag.startsWith('zh-'))return 'zh';
      if(tag==='en'||tag.startsWith('en-'))return 'en';
    }
    return 'en';
  }
  root.CS_LOCALE={initialLanguage};
})(typeof window==='undefined'?globalThis:window);
