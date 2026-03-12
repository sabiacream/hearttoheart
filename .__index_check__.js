
(function initBackground(){
  const canvas=document.getElementById('bg-canvas');
  if(!canvas||!canvas.getContext)return;
  const ctx=canvas.getContext('2d');
  let stars=[];
  function resize(){
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    stars=Array.from({length:120},function(){
      return{
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        r:Math.random()*1.4+0.3,
        a:Math.random()*0.6+0.15,
        d:(Math.random()*0.005+0.001)*(Math.random()>.5?1:-1)
      };
    });
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    stars.forEach(function(s){
      s.a+=s.d;
      if(s.a>.95||s.a<.08)s.d*=-1;
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle='rgba(184,131,46,'+s.a.toFixed(3)+')';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize);
  resize();
  requestAnimationFrame(draw);
})();

(function initPetals(){
  const holder=document.getElementById('petals');
  if(!holder)return;
  const glyphs=['✿','❀','✶'];
  for(let i=0;i<14;i+=1){
    const el=document.createElement('div');
    el.className='petal';
    el.textContent=glyphs[Math.floor(Math.random()*glyphs.length)];
    el.style.left=(Math.random()*100).toFixed(2)+'%';
    el.style.setProperty('--ps',(Math.random()*0.6+0.65).toFixed(2)+'rem');
    el.style.setProperty('--pd',(Math.random()*9+9).toFixed(1)+'s');
    el.style.setProperty('--pr',Math.floor(Math.random()*360)+'deg');
    el.style.setProperty('--px',Math.floor(Math.random()*120-60)+'px');
    el.style.animationDelay=(Math.random()*10).toFixed(1)+'s';
    holder.appendChild(el);
  }
})();

const CONFIG={priceDollars:5,createCheckoutEndpoint:'',statusEndpoint:'',debugAutoUnlock:false};
const STORE='heart2heart_tarot_v3';
const KEEPSAKES=[{id:'heart',label:'Heart charm',cue:'love, softness, and connection.',icon:'\u2665'},{id:'key',label:'Old key',cue:'truths that are ready to open.',icon:'\u2731'},{id:'paint',label:'Paintbrush',cue:'creative answers and expression.',icon:'\u273f'},{id:'candle',label:'Candlelight',cue:'warmth, patience, and clear focus.',icon:'\u2736'},{id:'moonstone',label:'Moon stone',cue:'intuition and emotional honesty.',icon:'\u25cf'},{id:'triangle',label:'Wood triangle',cue:'grounding, structure, and calm.',icon:'\u25b3'},{id:'feather',label:'Feather',cue:'lightness and gentle guidance.',icon:'\u273d'},{id:'anchor',label:'Anchor',cue:'stability when emotions move fast.',icon:'\u2693'}];
const MOONS=[{id:'new',label:'New moon',cue:'quiet beginnings',icon:'\u25cb'},{id:'waxing',label:'Waxing',cue:'building momentum',icon:'\u25d4'},{id:'full',label:'Full moon',cue:'full light and truth',icon:'\u25cf'},{id:'waning',label:'Waning',cue:'release and reset',icon:'\u25d1'}];
const ZODIAC_SYMBOLS=['\u2648','\u2649','\u264a','\u264b','\u264c','\u264d','\u264e','\u264f','\u2650','\u2651','\u2652','\u2653'];
const ZODIAC=[{id:'aries',label:'Aries',cue:'move with courage and honesty'},{id:'taurus',label:'Taurus',cue:'stay grounded in what is real'},{id:'gemini',label:'Gemini',cue:'say the thing out loud'},{id:'cancer',label:'Cancer',cue:'listen to your inner tide'},{id:'leo',label:'Leo',cue:'take up the space that is yours'},{id:'virgo',label:'Virgo',cue:'notice what the details are saying'},{id:'libra',label:'Libra',cue:'choose balance over performance'},{id:'scorpio',label:'Scorpio',cue:'tell the deeper truth'},{id:'sagittarius',label:'Sagittarius',cue:'look farther than the current moment'},{id:'capricorn',label:'Capricorn',cue:'build with patience'},{id:'aquarius',label:'Aquarius',cue:'make room for a new pattern'},{id:'pisces',label:'Pisces',cue:'trust feeling without losing yourself'}];
const SPREADS={1:{value:1,label:'Single card',cue:'one clear message',positions:['Your message right now']},3:{value:3,label:'Past, present, future',cue:'a moving timeline',positions:['What is behind you','What is with you now','What is opening next']},5:{value:5,label:'Five-card heart spread',cue:'a fuller look',positions:['Center of the matter','What challenges it','What grounds it','What wants to grow','Where it can lead']}};
const CARD_EMOJI={'The Fool':'\u273f','The Magician':'\u2726','The High Priestess':'\u263d','The Empress':'\u273f','The Lovers':'\u2665','Strength':'\u2605','The Hermit':'\u25ce','The Star':'\u2606','The Moon':'\u263e','The Sun':'\u2600','Ace of Cups':'\u25c7','Three of Cups':'\u2661','Ten of Cups':'\u2302','Queen of Cups':'\u273d','Ace of Pentacles':'\u25c6','Ten of Pentacles':'\u25a0','Three of Wands':'\u25b3','Queen of Wands':'\u2726','Ace of Swords':'\u2020','Six of Swords':'\u27a4'};
const CARDS=[{name:'The Fool',suit:'major',keys:'fresh start, trust, leap',u:'A new chapter wants movement more than perfect certainty.',r:'Fear of looking foolish is slowing a beginning that wants your trust.'},{name:'The Magician',suit:'major',keys:'skill, will, focus',u:'You already have more power and resourcefulness than you are crediting yourself for.',r:'Scattered attention is making your gifts feel smaller than they are.'},{name:'The High Priestess',suit:'major',keys:'intuition, quiet, inner truth',u:'Your inner knowing is stronger than the noise around you.',r:'You may be overriding your own instinct because you want clearer permission.'},{name:'The Empress',suit:'major',keys:'nurture, abundance, beauty',u:'Something in your life grows best when you care for it gently and consistently.',r:'Neglecting yourself is costing more than the task you keep prioritizing first.'},{name:'The Lovers',suit:'major',keys:'alignment, choice, relationship',u:'A heart decision is asking for honesty, not performance.',r:'A mismatch in values is harder to ignore than it used to be.'},{name:'Strength',suit:'major',keys:'soft power, patience, courage',u:'Gentle steadiness is stronger here than force.',r:'Self-doubt is speaking loudly, but it is not the whole truth.'},{name:'The Hermit',suit:'major',keys:'solitude, reflection, wisdom',u:'A quieter pace would show you what the rush has been hiding.',r:'Time alone is helpful, but withdrawal can become avoidance if it goes too far.'},{name:'The Star',suit:'major',keys:'hope, repair, openness',u:'Relief and renewal are entering the room with this reading.',r:'Hope is still here, but it needs rest and honesty to be felt again.'},{name:'The Moon',suit:'major',keys:'mystery, feeling, illusion',u:'Not everything is clear yet, so trust your instinct and move slowly.',r:'Fear may be painting shadows larger than they are.'},{name:'The Sun',suit:'major',keys:'clarity, joy, confidence',u:'Clarity wants you to stop hiding what is already bright in you.',r:'You may be dimming yourself to make the room more comfortable for others.'},{name:'Ace of Cups',suit:'cups',keys:'emotional opening, tenderness, new feeling',u:'An emotional opening or softer connection is available to you now.',r:'A guarded heart may be blocking the very thing it wants.'},{name:'Three of Cups',suit:'cups',keys:'friends, joy, support',u:'Community and shared joy are part of the answer here.',r:'Surface connection is not the same thing as feeling truly held.'},{name:'Ten of Cups',suit:'cups',keys:'belonging, home, emotional fulfillment',u:'The heart wants peace, closeness, and a deeper sense of home.',r:'Distance in a close bond needs care before it hardens into habit.'},{name:'Queen of Cups',suit:'cups',keys:'empathy, emotional wisdom, intuition',u:'Lead with feeling, but keep your own center while you do it.',r:'You may be carrying too much of everyone else while leaving yourself out.'},{name:'Ace of Pentacles',suit:'pentacles',keys:'new chance, grounded beginning, value',u:'A practical opening is arriving, and it deserves serious attention.',r:'Doubting yourself could make you miss a real opportunity.'},{name:'Ten of Pentacles',suit:'pentacles',keys:'legacy, stability, long view',u:'This situation wants to be built for the long haul, not just the quick win.',r:'A need for security may be crowding out meaning.'},{name:'Three of Wands',suit:'wands',keys:'expansion, horizon, preparation',u:'The work you started is beginning to reach farther than you first saw.',r:'Impatience is making you question growth that is already underway.'},{name:'Queen of Wands',suit:'wands',keys:'confidence, magnetism, creative fire',u:'You are meant to be seen here, not hidden in the background.',r:'Comparing yourself to other people is cooling your own fire.'},{name:'Ace of Swords',suit:'swords',keys:'truth, decision, clarity',u:'A cleaner truth or sharper decision is ready to come through.',r:'Confusion stays alive when the hard sentence keeps getting edited away.'},{name:'Six of Swords',suit:'swords',keys:'transition, leaving behind, healing distance',u:'You are moving away from what has exhausted you, even if slowly.',r:'You may still be mentally tied to something your life is trying to leave.'}];
let toastTimer=null,pollTimer=null,settleTimer=null,state=loadState();
function baseDraft(){return{keepsake:'',moon:'new',zodiac:'',spread:3,question:''}}
function baseState(){return{sessionId:'',status:'idle',paidCredits:0,checkoutUrl:'',lastSaved:'',draft:baseDraft(),preview:null,reading:null}}
function loadState(){try{const raw=localStorage.getItem(STORE);if(!raw)return baseState();const parsed=JSON.parse(raw);const next=Object.assign(baseState(),parsed||{});next.draft=Object.assign(baseDraft(),next.draft||{});next.draft.spread=Number(next.draft.spread)||3;next.preview=next.preview||null;if(next.reading)next.status='revealed';else if(next.preview&&next.status!=='awaiting-payment'&&next.status!=='paid')next.status='preview-ready';return next}catch(e){return baseState()}}
function save(){state.lastSaved=new Date().toISOString();try{localStorage.setItem(STORE,JSON.stringify(state))}catch(e){}}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3200)}
function sessionId(){const stamp=new Date().toISOString().slice(0,10).replace(/-/g,'');return'H2H-'+stamp+'-'+Math.random().toString(36).slice(2,6).toUpperCase()}
function canPay(){return Boolean(CONFIG.debugAutoUnlock||(CONFIG.createCheckoutEndpoint&&CONFIG.statusEndpoint))}
function canCheck(){return Boolean(CONFIG.debugAutoUnlock||CONFIG.statusEndpoint)}
function item(list,id){return list.find(x=>x.id===id)||null}
function esc(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function lower(v){return v?v.charAt(0).toLowerCase()+v.slice(1):v}
function prefix(id){return({heart:'From the heart outward, ',key:'Something is ready to open here: ',paint:'Creativity colors this message: ',candle:'Sit with this gently: ',moonstone:'Trust the inner tide here: ',triangle:'Stay grounded as you hear this: ',feather:'Let this land lightly: ',anchor:'Hold steady while you take this in: '})[id]||''}
function priceLabel(){const n=Number(CONFIG.priceDollars)||0;return '$'+(n%1===0?n.toFixed(0):n.toFixed(2))}
function isDraftLocked(){return Boolean(state.preview||state.reading||state.status==='awaiting-payment'||state.status==='paid')}
function applyPricing(){
  const amount=priceLabel();
  const badge=document.getElementById('badge-price');
  const chip=document.getElementById('price-chip');
  const heroPrice=document.getElementById('hero-price');
  const howPrice=document.getElementById('how-price');
  const policy=document.getElementById('policy-price');
  const pay=document.getElementById('pay-btn');
  const paywall=document.getElementById('paywall-btn');
  if(badge)badge.textContent=amount+' online tarot reading';
  if(chip)chip.textContent=amount+' per reading';
  if(heroPrice)heroPrice.textContent=amount;
  if(howPrice)howPrice.textContent=amount;
  if(policy)policy.textContent=amount+' per reading';
  if(pay)pay.textContent='Unlock with PayPal - '+amount;
  if(paywall)paywall.textContent='Unlock Full Reading - '+amount+' with PayPal';
}
function currentDraft(){const q=document.getElementById('question');const next=Object.assign(baseDraft(),state.draft||{});if(q)next.question=q.value;return next}
function cardRecord(name){return CARDS.find(card=>card.name===name)||null}
function namesLine(cards){return cards.map(card=>card.name).join(' • ')}
function choice(group,x,active){const value='value' in x?x.value:x.id;return'<button type="button" class="choice'+(active?' active':'')+'" data-group="'+group+'" data-value="'+value+'"><strong>'+esc(x.label)+'</strong><span>'+esc(x.cue)+'</span></button>'}
const ROMAN_BY_NAME={'The Fool':'0','The Magician':'I','The High Priestess':'II','The Empress':'III','The Lovers':'VI','Strength':'VIII','The Hermit':'IX','The Star':'XVII','The Moon':'XVIII','The Sun':'XIX'};
function renderChoices(){
  document.getElementById('keepsakes').innerHTML=KEEPSAKES.map(x=>'<div class="trinket'+(state.draft.keepsake===x.id?' active':'')+'" data-id="'+esc(x.id)+'" data-group="keepsake" data-value="'+esc(x.id)+'"><span class="trinket-icon">'+(x.icon||'\u2726')+'</span><span class="trinket-name">'+esc(x.label)+'</span><span class="trinket-effect">'+esc(x.cue)+'</span></div>').join('');
  document.getElementById('moons').innerHTML=MOONS.map(x=>'<button type="button" class="moon-btn'+(state.draft.moon===x.id?' active':'')+'" data-group="moon" data-value="'+esc(x.id)+'" title="'+esc(x.label)+'">'+(x.icon||'\u25cb')+'</button>').join('');
  document.getElementById('zodiacs').innerHTML=ZODIAC.map((x,i)=>'<button type="button" class="zodiac-btn'+(state.draft.zodiac===x.id?' active':'')+'" data-group="zodiac" data-value="'+esc(x.id)+'" title="'+esc(x.label)+'">'+ZODIAC_SYMBOLS[i]+'</button>').join('');
  document.getElementById('spreads').innerHTML=Object.values(SPREADS).map(x=>'<button type="button" class="spread-btn'+(state.draft.spread===x.value?' active':'')+'" data-group="spread" data-value="'+x.value+'">'+esc(x.label)+'</button>').join('');
}
function updateEnergy(){
  let e=20;
  if(state.draft.keepsake)e+=25;
  if(state.draft.zodiac)e+=20;
  if(state.draft.moon&&state.draft.moon!=='new')e+=15;
  const q=document.getElementById('question');
  if(q&&q.value.trim().length>5)e+=20;
  e=Math.min(e,100);
  const fill=document.getElementById('energy-fill');
  const val=document.getElementById('energy-value');
  if(fill)fill.style.width=e+'%';
  if(val)val.textContent=e+'%';
}
let chestOpen=false;
function toggleChest(){
  chestOpen=!chestOpen;
  document.getElementById('trinkets-panel').classList.toggle('open',chestOpen);
  document.getElementById('chest-icon').textContent=chestOpen?'\u2726':'\u25c7';
  document.getElementById('chest-label').textContent=chestOpen?'Hide keepsakes':'Choose a keepsake for this reading';
}
function previewTitle(cards){
  if(cards.some(card=>card.name==='The Moon'))return'There is more in this spread than it first appears.';
  if(cards.filter(card=>card.suit==='major').length>=2)return'One of these cards changes the meaning of the whole reading.';
  if(cards.some(card=>card.suit==='cups'))return'Your cards are carrying a strong emotional undertone.';
  if(cards.some(card=>card.suit==='swords'))return'This spread is pressing on a truth that does not want to stay buried.';
  if(cards.some(card=>card.suit==='wands'))return'This spread has a very clear push behind it.';
  if(cards.some(card=>card.suit==='pentacles'))return'This reading is pointing at something real that wants to take shape.';
  return'Your cards have a message, but they are not done speaking yet.';
}
function previewTeaser(cards){
  const major=cards.filter(card=>card.suit==='major').length;
  const reversed=cards.filter(card=>card.orientation==='Reversed').length;
  if(cards.some(card=>card.name==='The Moon'))return'Something emotional is surfacing here, but one hidden influence is changing how the whole situation unfolds.';
  if(cards.some(card=>card.name==='The Lovers'))return'A decision is sitting closer to your heart than it looks, and one card suggests you already know what does not fit.';
  if(cards.some(card=>card.name==='The Hermit'))return'This spread points to a quieter truth coming forward, but there is still one piece you have not fully faced.';
  if(major>=2)return'This feels bigger than a passing mood. One of these cards changes the tone of the whole reading.';
  if(reversed>=2)return'There is more going on beneath the surface than this situation is admitting out loud.';
  if(cards.some(card=>card.suit==='cups'))return'Something tender, emotional, or relational is driving this reading, but the deepest message sits underneath the first feeling.';
  if(cards.some(card=>card.suit==='swords'))return'A sharper truth is trying to break through here, and the full reading shows where it points next.';
  if(cards.some(card=>card.suit==='wands'))return'Energy is building around this question, but one card shows what could either speed it up or stall it out.';
  if(cards.some(card=>card.suit==='pentacles'))return'This reading points to something solid in your life, but one part of it needs to be seen more clearly first.';
  return'Your cards are pointing to something important, and the deeper pattern has not fully opened yet.';
}
function previewPaywallTitle(){return'There is more in this spread than it first appears.'}
function previewPaywallCopy(){return'Unlock the deeper message, hidden influences, and next steps within this reading.'}
function renderSession(){
  const s=document.getElementById('status'),code=document.getElementById('session-code'),copy=document.getElementById('session-copy'),pay=document.getElementById('pay-btn'),check=document.getElementById('check-btn'),reveal=document.getElementById('reveal-btn'),banner=document.getElementById('banner'),revealCopy=document.getElementById('reveal-copy'),draftMeta=document.getElementById('draft-meta'),creditMeta=document.getElementById('credit-meta'),q=document.getElementById('question'),keep=item(KEEPSAKES,state.draft.keepsake),selDisplay=document.getElementById('selected-trinket-display'),paywallBtn=document.getElementById('paywall-btn'),paywallCheck=document.getElementById('paywall-check-btn'),builderWrap=document.querySelector('.builder-wrap');
  const locked=isDraftLocked();
  if(builderWrap)builderWrap.classList.toggle('locked',locked);
  if(q)q.value=state.draft.question;
  if(q)q.disabled=locked;
  if(selDisplay)selDisplay.textContent=keep?keep.icon+' '+keep.label+' carries '+keep.cue:'No keepsake chosen yet';
  code.textContent=state.sessionId||'A code appears here when a new reading starts.';
  code.className='code'+(state.sessionId?'':' empty');
  pay.disabled=!state.sessionId||!state.preview||!canPay()||state.status==='awaiting-payment'||state.status==='paid'||state.status==='revealed';
  check.disabled=!state.sessionId||!canCheck()||!['awaiting-payment','paid','preview-ready'].includes(state.status);
  reveal.disabled=locked;
  if(paywallBtn)paywallBtn.disabled=pay.disabled;
  if(paywallCheck)paywallCheck.disabled=!state.sessionId||!canCheck()||!['awaiting-payment','paid','preview-ready'].includes(state.status);
  if(draftMeta)draftMeta.textContent=state.lastSaved?'Saved at '+new Date(state.lastSaved).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+' on this device.':'Your reading details and code stay saved on this device while your session is active.';
  if(creditMeta)creditMeta.textContent=state.status==='preview-ready'?'Preview ready':state.status==='awaiting-payment'?'PayPal checkout open':state.status==='revealed'?'Full reading unlocked':state.status==='session-prepared'?'Ready to reveal':'Waiting for your cards';
  if(state.status==='idle'){s.className='status';s.textContent='Not started';if(copy)copy.textContent='Start your reading to create your reading code.';banner.className='banner';banner.textContent='Set your intention, choose your details, and reveal your cards when you feel ready.';if(revealCopy)revealCopy.textContent='Reveal your cards first. Unlock the full interpretation only if it resonates.'}
  else if(state.status==='session-prepared'){s.className='status await';s.textContent='Ready';if(copy)copy.textContent='Your reading code is active. Reveal your cards whenever you feel ready.';banner.className='banner await';banner.textContent='Your session is saved. Reveal your cards when it feels right.';if(revealCopy)revealCopy.textContent='Reveal your cards to see the first message before deciding whether to unlock more.'}
  else if(state.status==='preview-ready'){s.className='status await';s.textContent='Cards drawn';if(copy)copy.textContent='Your preview is ready below. Unlock the deeper reading with PayPal if it resonates.';banner.className='banner await';banner.textContent='Your preview is ready. The fuller interpretation opens after payment confirmation.';if(revealCopy)revealCopy.textContent='Your cards are already revealed below.'}
  else if(state.status==='awaiting-payment'){s.className='status await';s.textContent='PayPal open';if(copy)copy.textContent=canCheck()?'PayPal checkout started. Use Check Payment in the reading area if this page does not update on its own.':'PayPal checkout started. Keep your reading code until confirmation is complete.';banner.className='banner await';banner.textContent='Waiting for your PayPal purchase to clear.';if(revealCopy)revealCopy.textContent='Your full reading opens after payment confirmation.'}
  else if(state.status==='paid'){s.className='status paid';s.textContent='Paid';if(copy)copy.textContent='Your PayPal purchase is confirmed. Opening your full reading now.';banner.className='banner paid';banner.textContent='Your payment is confirmed.';if(revealCopy)revealCopy.textContent='Opening your full reading.'}
  else{s.className='status used';s.textContent='Unlocked';if(copy)copy.textContent='Your full reading is open and saved below.';banner.className='banner used';banner.textContent='Your reading is unlocked below.';if(revealCopy)revealCopy.textContent='Start another reading whenever you are ready.'}
  updateEnergy();
  syncPoll();
}
function renderCardSpread(cards){
  const cardsSpread=document.getElementById('cards-spread');
  const positions=cards.map(function(card,i){return card.position||('Card '+(i+1))});
  cardsSpread.innerHTML=cards.map(function(card,i){
    const rev=card.orientation==='Reversed';
    const em=CARD_EMOJI[card.name]||'\u25c7';
    const rom=card.suit==='major'?(ROMAN_BY_NAME[card.name]||''):'';
    return '<div class="card-slot"><span class="card-position-label">'+esc(positions[i]||('Card '+(i+1)))+'</span><div class="tarot-card" id="card-'+i+'" data-reversed="'+rev+'" data-idx="'+i+'"><div class="card-inner"><div class="card-back"><div class="card-back-pattern"></div><div class="card-back-watermark">&#10084;</div></div><div class="card-face"><div class="card-face-header"><span class="card-roman">'+rom+'</span></div><div class="card-face-body"><div class="card-reversed-tag">Reversed</div><span class="card-emoji">'+em+'</span></div><div class="card-face-footer"><span class="card-name">'+esc(card.name)+'</span><span class="card-keywords">'+esc(card.keys)+'</span></div></div></div></div><span class="flip-hint">revealing...</span></div>';
  }).join('');
  cards.forEach(function(card,i){
    setTimeout(function(){
      const el=document.getElementById('card-'+i);
      if(el)el.classList.add(card.orientation==='Reversed'?'reversed':'flipped');
    },500+i*600);
  });
}
function renderReading(){
  const result=document.getElementById('result'),grid=document.getElementById('draw-grid'),summaryBox=document.getElementById('summary'),interp=document.getElementById('interpretation'),interpIntro=document.getElementById('interp-intro'),cardReadings=document.getElementById('card-readings'),interpClosing=document.getElementById('interp-closing'),paywallPanel=document.getElementById('paywall-panel'),paywallTitle=document.getElementById('paywall-title'),paywallCopy=document.getElementById('paywall-copy'),fullReading=document.getElementById('full-reading');
  if(!state.preview&&!state.reading){
    result.classList.remove('show');
    grid.innerHTML='';
    document.getElementById('cards-spread').innerHTML='';
    summaryBox.innerHTML='';
    summaryBox.className='summary';
    interp.classList.remove('visible','preview');
    paywallPanel.classList.remove('show');
    fullReading.classList.remove('show');
    interpIntro.textContent='';
    cardReadings.innerHTML='';
    interpClosing.textContent='';
    document.getElementById('result-intro').textContent='';
    document.getElementById('result-title').textContent='Your cards are ready';
    return;
  }
  result.classList.add('show');
  if(state.reading){
    renderCardSpread(state.reading.cards);
    document.getElementById('result-title').textContent=state.reading.title;
    document.getElementById('result-intro').textContent=state.reading.intro;
    summaryBox.className='summary';
    summaryBox.innerHTML='<strong>Takeaway.</strong> '+esc(state.reading.summary);
    grid.innerHTML=state.reading.cards.map(function(card){return'<article class="draw"><div class="pos">'+esc(card.position)+'</div><h4>'+esc(card.name)+'</h4><div class="ori'+(card.orientation==='Reversed'?' rev':'')+'">'+esc(card.orientation)+'</div><div class="keys">'+esc(card.keys)+'</div><p>'+esc(card.text)+'</p></article>'}).join('');
    interpIntro.textContent=state.reading.intro;
    cardReadings.innerHTML=state.reading.cards.map(function(card){return'<div class="card-reading-item"><div class="card-reading-name">'+(CARD_EMOJI[card.name]||'')+' '+esc(card.position)+' - '+esc(card.name)+(card.orientation==='Reversed'?' (Reversed)':'')+'</div><div class="card-reading-text">'+esc(card.text)+'</div></div>'}).join('');
    interpClosing.textContent=state.reading.summary;
    interp.classList.add('visible');
    interp.classList.remove('preview');
    paywallPanel.classList.remove('show');
    fullReading.classList.add('show');
    return;
  }
  renderCardSpread(state.preview.cards);
  document.getElementById('result-title').textContent='Your cards are ready';
  document.getElementById('result-intro').textContent=state.preview.teaserTitle;
  summaryBox.className='summary preview';
  summaryBox.innerHTML='<strong>Initial message.</strong> '+esc(state.preview.teaser);
  grid.innerHTML='';
  interpIntro.textContent='';
  cardReadings.innerHTML='';
  interpClosing.textContent='';
  paywallTitle.textContent=state.preview.paywallTitle;
  paywallCopy.textContent=state.preview.paywallCopy;
  fullReading.classList.remove('show');
  interp.classList.add('visible','preview');
  paywallPanel.classList.add('show');
}
function render(){applyPricing();renderChoices();renderSession();renderReading()}
function startSession(){
  const replacing=Boolean(state.preview||state.reading||state.status==='awaiting-payment');
  if(replacing&&!window.confirm('Start a new reading? The current reading on this device will be replaced.'))return;
  const draft=currentDraft();
  state=baseState();
  state.draft=draft;
  state.sessionId=sessionId();
  state.status='session-prepared';
  save();
  render();
  document.getElementById('restore-input').value=state.sessionId;
  showToast('Reading started. Your code is saved on this device.');
}
async function launchCheckout(){
  if(!state.sessionId)startSession();
  if(!state.sessionId)return;
  if(!state.preview){showToast('Reveal your cards first so the reading can begin before PayPal opens.');return}
  if(!canPay()){showToast('PayPal checkout is not available right now. Please contact the shop.');return}
  if(!CONFIG.createCheckoutEndpoint||!CONFIG.statusEndpoint){
    state.status='preview-ready';
    save();
    render();
    showToast('Checkout is temporarily unavailable. Please text the shop and we will help you complete your reading.');
    return;
  }
  state.status='awaiting-payment';
  save();
  render();
  if(CONFIG.debugAutoUnlock){setTimeout(function(){grantPaid('Demo PayPal purchase confirmed. Your full reading is open.')},700);return}
  try{
    const res=await fetch(CONFIG.createCheckoutEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:state.sessionId,amountDollars:CONFIG.priceDollars,draft:state.preview&&state.preview.draft?state.preview.draft:state.draft,preview:state.preview})});
    if(!res.ok)throw new Error('checkout failed');
    const data=await res.json();
    const url=data.checkoutUrl||data.url||'';
    if(!url)throw new Error('missing url');
    state.checkoutUrl=url;
    save();
    window.location.href=url;
    return;
  }catch(e){
    state.status='preview-ready';
    save();
    render();
    showToast('PayPal checkout did not open this time. Try once more, then text the shop if you need help.');
    return;
  }
}
function unlockPurchasedReading(msg,serverReading){
  if(serverReading)state.reading=serverReading;
  else{
    if(!state.preview)state.preview=buildPreview();
    state.reading=buildReadingFromPreview(state.preview);
  }
  state.paidCredits=0;
  state.status='revealed';
  save();
  render();
  document.getElementById('result').scrollIntoView({behavior:'smooth',block:'start'});
  const interp=document.getElementById('interpretation');
  if(interp)interp.scrollIntoView({behavior:'smooth',block:'start'});
  if(msg)showToast(msg);
}
function grantPaid(msg){
  state.paidCredits=Math.max(1,state.paidCredits);
  if(state.preview&&!state.reading){unlockPurchasedReading(msg||'PayPal purchase confirmed. Your full reading is open.');return}
  state.status=state.reading?'revealed':'paid';
  save();
  render();
  if(msg)showToast(msg);
}
async function checkPayment(forceToast){
  if(!state.sessionId){if(forceToast)showToast('Start a reading first.');return}
  if(CONFIG.debugAutoUnlock){grantPaid(forceToast?'Demo PayPal purchase confirmed. Your full reading is open.':'');return}
  if(!CONFIG.statusEndpoint){if(forceToast)showToast('Your purchase may still be processing. Keep your reading code and text the shop for a quick confirmation.');return}
  try{
    const url=new URL(CONFIG.statusEndpoint,window.location.origin);
    url.searchParams.set('sessionId',state.sessionId);
    const res=await fetch(url.toString(),{headers:{Accept:'application/json'}});
    if(!res.ok)throw new Error('status failed');
    const data=await res.json();
    if(data.status==='paid'||data.status==='revealed'){
      state.paidCredits=Math.max(1,Number(data.paidCredits)||1);
      if(data.reading){unlockPurchasedReading(forceToast?'PayPal purchase confirmed. Your full reading is open.':'',data.reading);return}
      if(!state.preview&&!state.reading)state.preview=buildPreview();
      if(state.preview&&!state.reading){unlockPurchasedReading(forceToast?'PayPal purchase confirmed. Your full reading is open.':'');return}
      state.status='paid';
      save();
      render();
      if(forceToast)showToast('PayPal purchase confirmed. Your reading is ready.');
      return;
    }
    if(forceToast)showToast('Your PayPal purchase is still processing. Keep your reading code handy.');
  }catch(e){
    if(forceToast)showToast('We are still waiting on payment confirmation. Keep your reading code and try again in a moment.');
  }
  renderSession();
}
function syncPoll(){clearInterval(pollTimer);if(state.status==='awaiting-payment'&&canCheck())pollTimer=setInterval(()=>checkPayment(false),6000)}
function updateChoice(group,value){if(isDraftLocked()){showToast('Start a new reading to change keepsake, spread, or question.');return}if(group==='keepsake')state.draft.keepsake=state.draft.keepsake===value?'':value;else if(group==='moon')state.draft.moon=value;else if(group==='zodiac')state.draft.zodiac=state.draft.zodiac===value?'':value;else if(group==='spread')state.draft.spread=Number(value);save();render()}
function shuffle(deck){const copy=deck.slice();for(let i=copy.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));const hold=copy[i];copy[i]=copy[j];copy[j]=hold}return copy}
function introFromDraft(draft){const spread=SPREADS[draft.spread],moon=item(MOONS,draft.moon)||MOONS[0],keep=item(KEEPSAKES,draft.keepsake),z=item(ZODIAC,draft.zodiac),parts=['This '+spread.label.toLowerCase()+' landed with a '+moon.label.toLowerCase()+' feeling and a sense of '+moon.cue+'.'];if(keep)parts.push('The keepsake in the room was '+keep.label.toLowerCase()+', which points toward '+keep.cue);if(z)parts.push(z.label+' energy is present here, asking you to '+z.cue+'.');if(draft.question.trim())parts.push('The question held in the reading was "'+draft.question.trim().slice(0,140)+'".');else parts.push('You left the question open, so the cards spoke to the strongest feeling already sitting with you.');return parts.join(' ')}
function intro(){return introFromDraft(state.draft)}
function summary(cards,draft){const activeDraft=draft||state.draft;const counts={};cards.forEach(card=>{counts[card.suit]=(counts[card.suit]||0)+1});const dominant=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];const revs=cards.filter(card=>card.orientation==='Reversed').length;const lines=[];if(dominant==='cups')lines.push('This reading is led by feeling, relationship, and emotional honesty.');else if(dominant==='pentacles')lines.push('This reading leans toward practical choices, value, and what can actually hold up in real life.');else if(dominant==='wands')lines.push('The energy here is active and creative, with movement pushing for expression or change.');else if(dominant==='swords')lines.push('The sharpest thread in this reading is truth, communication, and mental clarity.');else if(dominant==='major')lines.push('Major Arcana leads the spread, which usually points to a bigger life lesson or turning point.');if(revs>=Math.ceil(cards.length/2))lines.push('More than half the cards turn inward, so slowing down is wiser than forcing a fast answer.');else if(revs>0)lines.push('At least one card turns inward, which suggests there is still something important to notice beneath the obvious story.');if(activeDraft.zodiac){const z=item(ZODIAC,activeDraft.zodiac);if(z)lines.push(z.label+' colors the whole spread: '+z.cue+'.')}lines.push('Keep what lands cleanly, let the rest breathe overnight, and come back to it before making any big move.');return lines.join(' ')}
function buildPreview(){const draft=Object.assign(baseDraft(),state.draft),spread=SPREADS[draft.spread],deck=shuffle(CARDS),cards=spread.positions.map(function(position,i){const card=deck[i],rev=Math.random()<.26;return{position:position,name:card.name,suit:card.suit,keys:card.keys,orientation:rev?'Reversed':'Upright'}});return{title:spread.label,intro:'Your cards: '+namesLine(cards),teaserTitle:previewTitle(cards),teaser:previewTeaser(cards),paywallTitle:previewPaywallTitle(cards),paywallCopy:previewPaywallCopy(cards),draft:draft,cards:cards}}
function buildReadingFromPreview(preview){const draft=Object.assign(baseDraft(),preview.draft||state.draft),pre=prefix(draft.keepsake),cards=preview.cards.map(function(card){const source=cardRecord(card.name),text=card.orientation==='Reversed'?source.r:source.u;return{position:card.position,name:card.name,suit:card.suit,keys:card.keys,orientation:card.orientation,text:pre?pre+lower(text):text}});return{title:preview.title,intro:introFromDraft(draft),summary:summary(cards,draft),cards:cards}}
function reveal(){
  if(state.status==='awaiting-payment'){showToast('Your PayPal checkout is already open. Finish that before starting another reading.');return}
  if(state.preview||state.reading){showToast('Your cards are already drawn. Start another reading if you want a fresh spread.');return}
  if(!state.sessionId)startSession();
  if(!state.sessionId)return;
  state.draft=currentDraft();
  save();
  var revealBtn=document.getElementById('reveal-btn');
  var portal=document.getElementById('ritual-portal');
  var portalMsg=document.getElementById('portal-message');
  revealBtn.classList.add('casting');
  portal.classList.add('active');
  var msgs=['Preparing your spread...','Shuffling the deck...','Building your preview...','Almost ready...'];
  var mi=0;
  var iv=setInterval(function(){mi=(mi+1)%msgs.length;if(portalMsg)portalMsg.textContent=msgs[mi];},650);
  setTimeout(function(){
    clearInterval(iv);
    portal.classList.remove('active');
    revealBtn.classList.remove('casting');
    document.getElementById('settling').classList.add('show');
    document.getElementById('result').classList.remove('show');
    clearTimeout(settleTimer);
    settleTimer=setTimeout(function(){
      state.preview=buildPreview();
      state.status='preview-ready';
      save();
      document.getElementById('settling').classList.remove('show');
      render();
      document.getElementById('result').scrollIntoView({behavior:'smooth',block:'start'});
      showToast('Preview ready. Your full reading is waiting below.');
    },1250);
  },2800);
}
function restore(){const code=document.getElementById('restore-input').value.trim().toUpperCase();if(!code){showToast('Enter a reading code first.');return}if(!state.sessionId){showToast('No saved reading was found in this browser yet.');return}if(code!==state.sessionId){showToast('That code is not saved in this browser. If the reading started on another device, text the shop with the reading code.');return}render();if(state.reading){document.getElementById('result').scrollIntoView({behavior:'smooth',block:'start'});showToast('Your saved reading has been restored.');return}if(state.preview){document.getElementById('result').scrollIntoView({behavior:'smooth',block:'start'});if(state.status==='awaiting-payment'||state.status==='paid'){checkPayment(true);return}showToast('Your saved preview has been restored.');return}if(state.status==='session-prepared'){const builder=document.querySelector('.builder-wrap');if(builder)builder.scrollIntoView({behavior:'smooth',block:'start'});showToast('Your saved session is ready to continue.');return}showToast('That reading is already open in this browser.')}
function handleReturn(){const params=new URLSearchParams(window.location.search),returned=params.get('reading');if(returned&&state.sessionId&&returned.toUpperCase()===state.sessionId){checkPayment(true);params.delete('reading');const next=params.toString()?window.location.pathname+'?'+params.toString():window.location.pathname;window.history.replaceState({},document.title,next+window.location.hash)}}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-group]');if(btn)updateChoice(btn.dataset.group,btn.dataset.value)});
document.getElementById('start-btn').addEventListener('click',startSession);
document.getElementById('pay-btn').addEventListener('click',launchCheckout);
document.getElementById('check-btn').addEventListener('click',()=>checkPayment(true));
document.getElementById('paywall-btn').addEventListener('click',launchCheckout);
document.getElementById('paywall-check-btn').addEventListener('click',()=>checkPayment(true));
document.getElementById('restore-btn').addEventListener('click',restore);
document.getElementById('reveal-btn').addEventListener('click',reveal);
document.getElementById('new-reading-btn').addEventListener('click',startSession);
document.getElementById('question').addEventListener('input',e=>{if(isDraftLocked()){e.target.value=state.draft.question;return}state.draft.question=e.target.value;save();renderSession()});
document.getElementById('restore-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();restore()}});
document.getElementById('chest-btn').addEventListener('click',toggleChest);
document.getElementById('new-reading-btn-2').addEventListener('click',startSession);
render();
handleReturn();
