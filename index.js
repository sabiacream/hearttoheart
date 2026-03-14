(function initPetals(){
  const holder=document.getElementById('petals');
  if(!holder)return;
  const glyphs=['\uD83C\uDF38','\uD83C\uDF37','\u273F','\u2740','\uD83C\uDF3A','\uD83D\uDCAE'];
  for(let i=0;i<18;i+=1){
    const el=document.createElement('div');
    el.className='petal';
    el.textContent=glyphs[Math.floor(Math.random()*glyphs.length)];
    el.style.left=(Math.random()*100).toFixed(2)+'%';
    el.style.setProperty('--ps',(Math.random()*0.9+0.7).toFixed(2)+'rem');
    el.style.setProperty('--pd',(Math.random()*10+8).toFixed(1)+'s');
    el.style.setProperty('--pr',Math.floor(Math.random()*360)+'deg');
    el.style.setProperty('--px',Math.floor(Math.random()*120-60)+'px');
    el.style.animationDelay=(Math.random()*10).toFixed(1)+'s';
    holder.appendChild(el);
  }
})();

const ORACLE_QUOTES=[
  '"The heart always knows what the mind is still learning."',
  '"Every card turned is an act of courage."',
  '"You were guided here for a reason. Trust the journey."',
  '"There are no wrong cards, only right messages for now."',
  '"Intuition is love speaking in its quietest voice."',
  '"What you seek is also, in its own way, seeking you."'
];

const CONFIG={priceDollars:5,createCheckoutEndpoint:'',statusEndpoint:'',debugAutoUnlock:false};
const STORE='heart2heart_tarot_v3';
const TX_STORE='heart2heart_paypal_tx_readings_v1';

const KEEPSAKES=[
  {id:'heart',label:'Heart Charm',cue:'softens every card with love.',icon:'\uD83D\uDC96'},
  {id:'key',label:'Old Key',cue:'unlocks hidden truths.',icon:'\uD83D\uDDDD\uFE0F'},
  {id:'paint',label:'Paintbrush',cue:'welcomes creative clarity.',icon:'\uD83C\uDFA8'},
  {id:'candle',label:'Candlelight',cue:'brings warm focus.',icon:'\uD83D\uDD6F\uFE0F'},
  {id:'moonstone',label:'Moonstone',cue:'deepens intuition.',icon:'\uD83C\uDF19'},
  {id:'triangle',label:'Sacred Triangle',cue:'grounds the message.',icon:'\u25B3'},
  {id:'feather',label:'Feather',cue:'adds gentle guidance.',icon:'\uD83E\uDEB6'},
  {id:'anchor',label:'Anchor',cue:'keeps your heart steady.',icon:'\u2693'}
];

const MOONS=[
  {id:'new',label:'New Moon',cue:'new beginnings',icon:'\uD83C\uDF11'},
  {id:'waxing-crescent',label:'Waxing Crescent',cue:'growing intention',icon:'\uD83C\uDF12'},
  {id:'first-quarter',label:'First Quarter',cue:'turning point',icon:'\uD83C\uDF13'},
  {id:'waxing-gibbous',label:'Waxing Gibbous',cue:'building momentum',icon:'\uD83C\uDF14'},
  {id:'full',label:'Full Moon',cue:'clarity and fullness',icon:'\uD83C\uDF15'},
  {id:'waning-gibbous',label:'Waning Gibbous',cue:'gratitude and release',icon:'\uD83C\uDF16'},
  {id:'last-quarter',label:'Last Quarter',cue:'letting go',icon:'\uD83C\uDF17'},
  {id:'waning-crescent',label:'Waning Crescent',cue:'rest and reflection',icon:'\uD83C\uDF18'}
];

const ZODIAC_SYMBOLS=['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D','\u264E','\u264F','\u2650','\u2651','\u2652','\u2653'];
const ZODIAC=[
  {id:'aries',label:'Aries',cue:'move with courage and honesty'},
  {id:'taurus',label:'Taurus',cue:'stay grounded in what is real'},
  {id:'gemini',label:'Gemini',cue:'say the thing out loud'},
  {id:'cancer',label:'Cancer',cue:'listen to your inner tide'},
  {id:'leo',label:'Leo',cue:'take up the space that is yours'},
  {id:'virgo',label:'Virgo',cue:'notice what the details are saying'},
  {id:'libra',label:'Libra',cue:'choose balance over performance'},
  {id:'scorpio',label:'Scorpio',cue:'tell the deeper truth'},
  {id:'sagittarius',label:'Sagittarius',cue:'look farther than the current moment'},
  {id:'capricorn',label:'Capricorn',cue:'build with patience'},
  {id:'aquarius',label:'Aquarius',cue:'make room for a new pattern'},
  {id:'pisces',label:'Pisces',cue:'trust feeling without losing yourself'}
];

const SPREADS={
  1:{value:1,label:'Single Card',cue:'one clear message',positions:['What Your Heart Needs to Hear']},
  3:{value:3,label:'Past \u00B7 Present \u00B7 Future',cue:'a moving timeline',positions:['The Past','The Present','The Future']},
  5:{value:5,label:'Celtic Cross (5 cards)',cue:'a deeper pattern',positions:['The Heart of the Matter','What Crosses You','The Root','The Possible Future','The Outcome']}
};

const CARD_EMOJI={'The Fool':'\uD83C\uDF3C','The Magician':'\u2728','The High Priestess':'\uD83C\uDF19','The Empress':'\uD83C\uDF3A','The Lovers':'\uD83D\uDC91','Strength':'\uD83E\uDD81','The Hermit':'\uD83D\uDD6F\uFE0F','The Star':'\u2B50','The Moon':'\uD83C\uDF15','The Sun':'\u2600\uFE0F','Ace of Cups':'\uD83D\uDCA7','Three of Cups':'\uD83E\uDD42','Ten of Cups':'\uD83C\uDFE1','Queen of Cups':'\uD83C\uDF37','Ace of Pentacles':'\uD83C\uDF31','Ten of Pentacles':'\uD83C\uDFE0','Three of Wands':'\uD83C\uDF05','Queen of Wands':'\u2726','Ace of Swords':'\u2694\uFE0F','Six of Swords':'\u26F5'};
const ROMAN_BY_NAME={'The Fool':'0','The Magician':'I','The High Priestess':'II','The Empress':'III','The Lovers':'VI','Strength':'VIII','The Hermit':'IX','The Star':'XVII','The Moon':'XVIII','The Sun':'XIX'};

const CARDS=[
  {name:'The Fool',suit:'major',keys:'fresh start, trust, leap',u:'A new chapter wants movement more than perfect certainty.',r:'Fear of looking foolish is slowing a beginning that wants your trust.'},
  {name:'The Magician',suit:'major',keys:'skill, will, focus',u:'You already have more power and resourcefulness than you are crediting yourself for.',r:'Scattered attention is making your gifts feel smaller than they are.'},
  {name:'The High Priestess',suit:'major',keys:'intuition, quiet, inner truth',u:'Your inner knowing is stronger than the noise around you.',r:'You may be overriding your own instinct because you want clearer permission.'},
  {name:'The Empress',suit:'major',keys:'nurture, abundance, beauty',u:'Something in your life grows best when you care for it gently and consistently.',r:'Neglecting yourself is costing more than the task you keep prioritizing first.'},
  {name:'The Lovers',suit:'major',keys:'alignment, choice, relationship',u:'A heart decision is asking for honesty, not performance.',r:'A mismatch in values is harder to ignore than it used to be.'},
  {name:'Strength',suit:'major',keys:'soft power, patience, courage',u:'Gentle steadiness is stronger here than force.',r:'Self-doubt is speaking loudly, but it is not the whole truth.'},
  {name:'The Hermit',suit:'major',keys:'solitude, reflection, wisdom',u:'A quieter pace would show you what the rush has been hiding.',r:'Time alone is helpful, but withdrawal can become avoidance if it goes too far.'},
  {name:'The Star',suit:'major',keys:'hope, repair, openness',u:'Relief and renewal are entering the room with this reading.',r:'Hope is still here, but it needs rest and honesty to be felt again.'},
  {name:'The Moon',suit:'major',keys:'mystery, feeling, illusion',u:'Not everything is clear yet, so trust your instinct and move slowly.',r:'Fear may be painting shadows larger than they are.'},
  {name:'The Sun',suit:'major',keys:'clarity, joy, confidence',u:'Clarity wants you to stop hiding what is already bright in you.',r:'You may be dimming yourself to make the room more comfortable for others.'},
  {name:'Ace of Cups',suit:'cups',keys:'emotional opening, tenderness, new feeling',u:'An emotional opening or softer connection is available to you now.',r:'A guarded heart may be blocking the very thing it wants.'},
  {name:'Three of Cups',suit:'cups',keys:'friends, joy, support',u:'Community and shared joy are part of the answer here.',r:'Surface connection is not the same thing as feeling truly held.'},
  {name:'Ten of Cups',suit:'cups',keys:'belonging, home, emotional fulfillment',u:'The heart wants peace, closeness, and a deeper sense of home.',r:'Distance in a close bond needs care before it hardens into habit.'},
  {name:'Queen of Cups',suit:'cups',keys:'empathy, emotional wisdom, intuition',u:'Lead with feeling, but keep your own center while you do it.',r:'You may be carrying too much of everyone else while leaving yourself out.'},
  {name:'Ace of Pentacles',suit:'pentacles',keys:'new chance, grounded beginning, value',u:'A practical opening is arriving, and it deserves serious attention.',r:'Doubting yourself could make you miss a real opportunity.'},
  {name:'Ten of Pentacles',suit:'pentacles',keys:'legacy, stability, long view',u:'This situation wants to be built for the long haul, not just the quick win.',r:'A need for security may be crowding out meaning.'},
  {name:'Three of Wands',suit:'wands',keys:'expansion, horizon, preparation',u:'The work you started is beginning to reach farther than you first saw.',r:'Impatience is making you question growth that is already underway.'},
  {name:'Queen of Wands',suit:'wands',keys:'confidence, magnetism, creative fire',u:'You are meant to be seen here, not hidden in the background.',r:'Comparing yourself to other people is cooling your own fire.'},
  {name:'Ace of Swords',suit:'swords',keys:'truth, decision, clarity',u:'A cleaner truth or sharper decision is ready to come through.',r:'Confusion stays alive when the hard sentence keeps getting edited away.'},
  {name:'Six of Swords',suit:'swords',keys:'transition, leaving behind, healing distance',u:'You are moving away from what has exhausted you, even if slowly.',r:'You may still be mentally tied to something your life is trying to leave.'}
];

let toastTimer=null;
let pollTimer=null;
let settleTimer=null;
let quoteTimer=null;
let chestOpen=false;
let state=loadState();
let cardsFullyRevealed=false;
let revealTracker={total:0,flipped:0};

function baseDraft(){return{keepsake:'',moon:'new',zodiac:'',spread:3,question:''};}
function baseState(){return{sessionId:'',status:'idle',paidCredits:0,checkoutUrl:'',lastSaved:'',draft:baseDraft(),preview:null,reading:null,paypalTxId:''};}
function loadState(){
  try{
    const raw=localStorage.getItem(STORE);
    if(!raw)return baseState();
    const parsed=JSON.parse(raw);
    const next=Object.assign(baseState(),parsed||{});
    next.draft=Object.assign(baseDraft(),next.draft||{});
    next.draft.spread=Number(next.draft.spread)||3;
    next.preview=next.preview||null;
    if(next.reading)next.status='revealed';
    else if(next.preview&&next.status!=='awaiting-payment'&&next.status!=='paid')next.status='preview-ready';
    return next;
  }catch(e){
    return baseState();
  }
}
function save(){state.lastSaved=new Date().toISOString();try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){}}
function loadTxMap(){try{return JSON.parse(localStorage.getItem(TX_STORE)||'{}')||{};}catch(e){return {};}}
function saveTxReading(txId){
  if(!txId||!state.reading)return;
  const map=loadTxMap();
  map[txId]={txId:txId,updatedAt:new Date().toISOString(),reading:state.reading};
  try{localStorage.setItem(TX_STORE,JSON.stringify(map));}catch(e){}
}
function extractPayPalTx(params){
  if(!params)return'';
  return params.get('tx')||params.get('txn_id')||params.get('transactionId')||params.get('capture_id')||params.get('paymentId')||params.get('token')||'';
}
function showToast(msg){
  const t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){t.classList.remove('show');},3200);
}
function esc(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function lower(v){return v?v.charAt(0).toLowerCase()+v.slice(1):v;}
function item(list,id){return list.find(function(x){return x.id===id;})||null;}
function sessionId(){const stamp=new Date().toISOString().slice(0,10).replace(/-/g,'');return'H2H-'+stamp+'-'+Math.random().toString(36).slice(2,6).toUpperCase();}
function canPay(){return Boolean(CONFIG.debugAutoUnlock||(CONFIG.createCheckoutEndpoint&&CONFIG.statusEndpoint));}
function canCheck(){return Boolean(CONFIG.debugAutoUnlock||CONFIG.statusEndpoint);}
function cardRecord(name){return CARDS.find(function(card){return card.name===name;})||null;}
function namesLine(cards){return cards.map(function(card){return card.name;}).join(' \u2022 ');}
function prefix(id){
  return({
    heart:'From the heart outward, ',
    key:'Something is ready to open here: ',
    paint:'Creativity colors this message: ',
    candle:'Sit with this gently: ',
    moonstone:'Trust the inner tide here: ',
    triangle:'Stay grounded as you hear this: ',
    feather:'Let this land lightly: ',
    anchor:'Hold steady while you take this in: '
  })[id]||'';
}
function isDraftLocked(){return Boolean(state.preview||state.reading||state.status==='awaiting-payment'||state.status==='paid');}
function priceLabel(){const n=Number(CONFIG.priceDollars)||0;return'$'+(n%1===0?n.toFixed(0):n.toFixed(2));}
function resetCardRevealProgress(){cardsFullyRevealed=false;revealTracker={total:0,flipped:0};}

function applyPricing(){
  const amount=priceLabel();
  const badge=document.getElementById('badge-price');
  const paywall=document.getElementById('paywall-btn');
  if(badge)badge.textContent=amount+' per reading';
  if(paywall)paywall.textContent='Unlock Full Reading - '+amount+' via PayPal';
}

function rotateOracleQuote(){
  const el=document.getElementById('oracle-quote');
  if(!el)return;
  el.style.opacity='0.2';
  setTimeout(function(){
    el.textContent=ORACLE_QUOTES[Math.floor(Math.random()*ORACLE_QUOTES.length)];
    el.style.opacity='0.6';
  },320);
}

function renderChoices(){
  const keepsakes=document.getElementById('keepsakes');
  const moons=document.getElementById('moons');
  const zodiacs=document.getElementById('zodiacs');
  const spreads=document.getElementById('spreads');
  if(keepsakes){
    keepsakes.innerHTML=KEEPSAKES.map(function(x){
      return '<button type="button" class="trinket'+(state.draft.keepsake===x.id?' active':'')+'" data-group="keepsake" data-value="'+esc(x.id)+'"><span class="trinket-icon">'+esc(x.icon||'\u2726')+'</span><span class="trinket-name">'+esc(x.label)+'</span><span class="trinket-effect">'+esc(x.cue)+'</span></button>';
    }).join('');
  }
  if(moons){
    moons.innerHTML=MOONS.map(function(x){
      return '<button type="button" class="moon-btn'+(state.draft.moon===x.id?' active':'')+'" data-group="moon" data-value="'+esc(x.id)+'" title="'+esc(x.label)+'">'+esc(x.icon||'\u25CB')+'</button>';
    }).join('');
  }
  if(zodiacs){
    zodiacs.innerHTML=ZODIAC.map(function(x,i){
      return '<button type="button" class="zodiac-btn'+(state.draft.zodiac===x.id?' active':'')+'" data-group="zodiac" data-value="'+esc(x.id)+'" title="'+esc(x.label)+'">'+ZODIAC_SYMBOLS[i]+'</button>';
    }).join('');
  }
  if(spreads){
    spreads.innerHTML=Object.values(SPREADS).map(function(x){
      return '<button type="button" class="spread-btn'+(state.draft.spread===x.value?' active':'')+'" data-group="spread" data-value="'+x.value+'">'+esc(x.label)+'</button>';
    }).join('');
  }
}

function updateEnergy(){
  let chosen=0;
  if(state.draft.keepsake)chosen+=1;
  if(state.draft.zodiac)chosen+=1;
  if(state.draft.moon&&state.draft.moon!=='new')chosen+=1;
  if((state.draft.question||'').trim())chosen+=1;
  const e=Math.round((chosen/4)*100);
  const fill=document.getElementById('energy-fill');
  const val=document.getElementById('energy-value');
  if(fill)fill.style.width=e+'%';
  if(val)val.textContent=e+'%';
}

function toggleChest(){
  chestOpen=!chestOpen;
  const panel=document.getElementById('trinkets-panel');
  const icon=document.getElementById('chest-icon');
  const label=document.getElementById('chest-label');
  const btn=document.getElementById('chest-btn');
  if(panel)panel.classList.toggle('open',chestOpen);
  if(icon)icon.textContent=chestOpen?'\u2728':'\uD83E\uDE99';
  if(label)label.textContent=chestOpen?'Close the Treasure Chest':'Open the Treasure Chest';
  if(btn)btn.setAttribute('aria-expanded',chestOpen?'true':'false');
}

function currentDraft(){
  const q=document.getElementById('question');
  const next=Object.assign(baseDraft(),state.draft||{});
  if(q)next.question=q.value;
  return next;
}

function previewTitle(cards){
  if(cards.some(function(card){return card.name==='The Moon';}))return'There is more in this spread than it first appears.';
  if(cards.filter(function(card){return card.suit==='major';}).length>=2)return'One of these cards changes the meaning of the whole reading.';
  if(cards.some(function(card){return card.suit==='cups';}))return'Your cards are carrying a strong emotional undertone.';
  if(cards.some(function(card){return card.suit==='swords';}))return'This spread is pressing on a truth that does not want to stay buried.';
  if(cards.some(function(card){return card.suit==='wands';}))return'This spread has a very clear push behind it.';
  if(cards.some(function(card){return card.suit==='pentacles';}))return'This reading is pointing at something real that wants to take shape.';
  return'Your cards have a message, but they are not done speaking yet.';
}
function previewTeaser(cards){
  const major=cards.filter(function(card){return card.suit==='major';}).length;
  const reversed=cards.filter(function(card){return card.orientation==='Reversed';}).length;
  if(cards.some(function(card){return card.name==='The Moon';}))return'Something emotional is surfacing here, but one hidden influence is changing how the whole situation unfolds.';
  if(cards.some(function(card){return card.name==='The Lovers';}))return'A decision is sitting closer to your heart than it looks, and one card suggests you already know what does not fit.';
  if(cards.some(function(card){return card.name==='The Hermit';}))return'This spread points to a quieter truth coming forward, but there is still one piece you have not fully faced.';
  if(major>=2)return'This feels bigger than a passing mood. One of these cards changes the tone of the whole reading.';
  if(reversed>=2)return'There is more going on beneath the surface than this situation is admitting out loud.';
  if(cards.some(function(card){return card.suit==='cups';}))return'Something tender, emotional, or relational is driving this reading, but the deepest message sits underneath the first feeling.';
  if(cards.some(function(card){return card.suit==='swords';}))return'A sharper truth is trying to break through here, and the full reading shows where it points next.';
  if(cards.some(function(card){return card.suit==='wands';}))return'Energy is building around this question, but one card shows what could either speed it up or stall it out.';
  if(cards.some(function(card){return card.suit==='pentacles';}))return'This reading points to something solid in your life, but one part of it needs to be seen more clearly first.';
  return'Your cards are pointing to something important, and the deeper pattern has not fully opened yet.';
}
function previewPaywallTitle(){return'See the full reading';}
function previewPaywallCopy(){return'Your complete card-by-card interpretation is ready. Unlock the deeper meaning for '+priceLabel()+'.';}

function renderSession(){
  const reveal=document.getElementById('reveal-btn');
  const banner=document.getElementById('banner');
  const revealCopy=document.getElementById('reveal-copy');
  const draftMeta=document.getElementById('draft-meta');
  const creditMeta=document.getElementById('credit-meta');
  const q=document.getElementById('question');
  const keep=item(KEEPSAKES,state.draft.keepsake);
  const selDisplay=document.getElementById('selected-trinket-display');
  const paywallBtn=document.getElementById('paywall-btn');
  const paywallCheck=document.getElementById('paywall-check-btn');
  const paywallWait=document.getElementById('paywall-wait');
  const builderWrap=document.querySelector('.builder-wrap');

  const locked=isDraftLocked();
  if(builderWrap)builderWrap.classList.toggle('locked',locked);
  if(q){
    q.value=state.draft.question;
    q.disabled=locked;
  }
  if(selDisplay)selDisplay.textContent=keep?keep.icon+' You chose the '+keep.label+' \u2014 it '+keep.cue:'No keepsake chosen yet';
  if(reveal)reveal.disabled=locked;

  const paywallDisabled=!state.sessionId||!state.preview||!canPay()||state.status==='awaiting-payment'||state.status==='paid'||state.status==='revealed';
  if(paywallBtn)paywallBtn.disabled=paywallDisabled;
  if(paywallCheck){
    paywallCheck.disabled=!state.sessionId||!canCheck()||state.status!=='awaiting-payment';
    paywallCheck.hidden=state.status!=='awaiting-payment'||!canCheck();
  }
  if(paywallWait)paywallWait.hidden=state.status!=='awaiting-payment';

  if(draftMeta){
    draftMeta.textContent=state.lastSaved?'Saved at '+new Date(state.lastSaved).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+' on this device.':'Your reading details stay saved in this browser while your session is active.';
  }
  if(creditMeta){
    creditMeta.textContent=state.status==='preview-ready'?'Preview ready':state.status==='awaiting-payment'?'PayPal checkout open':state.status==='revealed'?'Full reading unlocked':state.status==='session-prepared'?'Ready to reveal':'Waiting for your cards';
  }

  if(state.status==='idle'){
    if(banner)banner.textContent='Set your details, reveal your cards, then decide if you want the full reading.';
    if(revealCopy)revealCopy.textContent='Reveal first. Unlock only if the preview resonates.';
  }else if(state.status==='session-prepared'){
    if(banner)banner.textContent='Setup complete. Reveal your cards when you are ready.';
    if(revealCopy)revealCopy.textContent='Your cards are ready to be drawn.';
  }else if(state.status==='preview-ready'){
    if(banner)banner.textContent='Your cards are drawn. Your free teaser is below.';
    if(revealCopy)revealCopy.textContent='Your cards are already drawn below.';
  }else if(state.status==='awaiting-payment'){
    if(banner)banner.textContent='Waiting for payment confirmation from PayPal.';
    if(revealCopy)revealCopy.textContent='Your full reading will unlock after verification.';
  }else if(state.status==='paid'){
    if(banner)banner.textContent='Payment confirmed. Opening your full reading.';
  }else{
    if(banner)banner.textContent='Reading unlocked. Start another reading anytime.';
    if(revealCopy)revealCopy.textContent='Start a new reading whenever you are ready.';
  }

  updateEnergy();
  syncPoll();
}

function renderCardSpread(cards){
  const cardsSpread=document.getElementById('cards-spread');
  if(!cardsSpread)return;
  const positions=cards.map(function(card,i){return card.position||('Card '+(i+1));});
  cardsSpread.innerHTML=cards.map(function(card,i){
    const rev=card.orientation==='Reversed';
    const em=CARD_EMOJI[card.name]||'\u25C7';
    const rom=card.suit==='major'?(ROMAN_BY_NAME[card.name]||''):'';
    return '<div class="card-slot"><span class="card-position-label">'+esc(positions[i])+'</span><button type="button" class="tarot-card" id="card-'+i+'" data-reversed="'+rev+'" data-idx="'+i+'" aria-label="Reveal '+esc(card.name)+'"><span class="card-inner"><span class="card-back"><span class="card-back-pattern"></span><span class="card-back-watermark">\u2665</span></span><span class="card-face"><span class="card-face-header"><span class="card-roman">'+rom+'</span></span><span class="card-face-body"><span class="card-reversed-tag">Reversed</span><span class="card-emoji">'+em+'</span></span><span class="card-face-footer"><span class="card-name">'+esc(card.name)+'</span><span class="card-keywords">'+esc(card.keys)+'</span></span></span></span></button><span class="flip-hint">tap to reveal</span></div>';
  }).join('');

  revealTracker={total:cards.length,flipped:0};
  const helper=document.getElementById('cards-helper');
  if(helper)helper.hidden=cardsFullyRevealed;

  cards.forEach(function(card,i){
    const el=document.getElementById('card-'+i);
    if(!el)return;
    const hint=el.parentElement.querySelector('.flip-hint');
    if(cardsFullyRevealed){
      el.dataset.flipped='true';
      el.classList.add(card.orientation==='Reversed'?'reversed':'flipped');
      if(hint)hint.textContent='revealed';
      revealTracker.flipped+=1;
      return;
    }
    el.dataset.flipped='false';
    const flip=function(){
      if(el.dataset.flipped==='true')return;
      el.dataset.flipped='true';
      el.classList.add(card.orientation==='Reversed'?'reversed':'flipped');
      if(hint)hint.textContent='revealed';
      revealTracker.flipped+=1;
      if(revealTracker.flipped>=revealTracker.total){
        cardsFullyRevealed=true;
        if(helper)helper.hidden=true;
        showInterpretation();
      }
    };
    el.addEventListener('click',flip);
    el.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        flip();
      }
    });
  });
}

function teaserCardText(card,draft){
  const source=cardRecord(card.name);
  if(!source)return'The message is still unfolding...';
  const text=card.orientation==='Reversed'?source.r:source.u;
  const pre=prefix(draft.keepsake);
  const line=pre?pre+lower(text):text;
  if(line.length<=140)return line;
  return line.slice(0,140).replace(/\s+\S*$/,'')+'...';
}

function showInterpretation(){
  const summaryBox=document.getElementById('summary');
  const interp=document.getElementById('interpretation');
  const interpIntro=document.getElementById('interp-intro');
  const cardReadings=document.getElementById('card-readings');
  const interpClosing=document.getElementById('interp-closing');
  const paywallPanel=document.getElementById('paywall-panel');
  const paywallTitle=document.getElementById('paywall-title');
  const paywallCopy=document.getElementById('paywall-copy');
  const fullReading=document.getElementById('full-reading');
  const restoreNote=document.getElementById('restore-note');
  const copyBtn=document.getElementById('copy-btn');

  if(!interp||!summaryBox)return;
  if(!cardsFullyRevealed){
    summaryBox.hidden=true;
    interp.classList.remove('visible','preview');
    return;
  }

  if(state.reading){
    summaryBox.hidden=false;
    summaryBox.className='summary';
    summaryBox.innerHTML='<strong>Takeaway.</strong> '+esc(state.reading.summary);
    interpIntro.textContent=state.reading.intro;
    cardReadings.innerHTML=state.reading.cards.map(function(card){
      return '<div class="card-reading-item"><div class="card-reading-name">'+(CARD_EMOJI[card.name]||'')+' '+esc(card.position)+' \u2014 '+esc(card.name)+(card.orientation==='Reversed'?' (Reversed)':'')+'</div><div class="card-reading-text">'+esc(card.text)+'</div></div>';
    }).join('');
    interpClosing.textContent=state.reading.summary;
    paywallPanel.classList.remove('show');
    fullReading.classList.add('show');
    interp.classList.add('visible');
    interp.classList.remove('preview');
    if(restoreNote)restoreNote.hidden=false;
    if(copyBtn)copyBtn.style.display='inline-flex';
    return;
  }

  if(!state.preview)return;
  const teaserReading=buildReadingFromPreview(state.preview);
  summaryBox.hidden=false;
  summaryBox.className='summary preview';
  summaryBox.innerHTML='<strong>Initial message.</strong> '+esc(state.preview.teaser);
  interpIntro.textContent=teaserReading.intro;
  cardReadings.innerHTML=teaserReading.cards.map(function(card){
    return '<div class="card-reading-item"><div class="card-reading-name">'+(CARD_EMOJI[card.name]||'')+' '+esc(card.position)+' \u2014 '+esc(card.name)+(card.orientation==='Reversed'?' (Reversed)':'')+'</div><div class="card-reading-text">'+esc(teaserCardText(card,teaserReading.draft||state.preview.draft||state.draft))+'</div></div>';
  }).join('');
  interpClosing.textContent=teaserReading.summary.length>170?teaserReading.summary.slice(0,170).replace(/\s+\S*$/,'')+'...':teaserReading.summary;
  paywallTitle.textContent=state.preview.paywallTitle;
  paywallCopy.textContent=state.preview.paywallCopy;
  paywallPanel.classList.add('show');
  fullReading.classList.remove('show');
  interp.classList.add('visible','preview');
  if(restoreNote)restoreNote.hidden=true;
  if(copyBtn)copyBtn.style.display='none';
}

function renderReading(){
  const result=document.getElementById('result');
  const summaryBox=document.getElementById('summary');
  const interp=document.getElementById('interpretation');
  const cardsSpread=document.getElementById('cards-spread');
  const resultIntro=document.getElementById('result-intro');
  const resultTitle=document.getElementById('result-title');
  const restoreNote=document.getElementById('restore-note');
  const helper=document.getElementById('cards-helper');

  if(!state.preview&&!state.reading){
    if(result)result.classList.remove('show');
    if(cardsSpread)cardsSpread.innerHTML='';
    if(resultIntro)resultIntro.textContent='';
    if(summaryBox){summaryBox.hidden=true;summaryBox.textContent='';}
    if(interp)interp.classList.remove('visible','preview');
    if(resultTitle)resultTitle.textContent='Your cards are ready';
    if(restoreNote)restoreNote.hidden=true;
    if(helper)helper.hidden=true;
    return;
  }

  if(result)result.classList.add('show');
  const source=state.reading?state.reading:state.preview;
  renderCardSpread(source.cards);
  if(resultTitle)resultTitle.textContent=state.reading?state.reading.title:'Your cards are ready';
  if(resultIntro)resultIntro.textContent=state.reading?state.reading.intro:state.preview.teaserTitle;
  showInterpretation();
}

function render(){applyPricing();renderChoices();renderSession();renderReading();}

function startSession(){
  const replacing=Boolean(state.preview||state.reading||state.status==='awaiting-payment');
  if(replacing&&!window.confirm('Start a new reading? The current reading on this device will be replaced.'))return;
  const draft=currentDraft();
  state=baseState();
  state.draft=draft;
  state.sessionId=sessionId();
  state.status='session-prepared';
  resetCardRevealProgress();
  save();
  render();
  showToast('Reading started. Continue with your setup.');
}

async function launchCheckout(){
  if(!state.sessionId)startSession();
  if(!state.sessionId)return;
  if(!state.preview){showToast('Reveal your cards first so the reading can begin before PayPal opens.');return;}
  if(!canPay()){showToast('PayPal checkout is not available right now. Please contact the shop.');return;}
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
  if(CONFIG.debugAutoUnlock){
    setTimeout(function(){grantPaid('Reading unlocked! \uD83D\uDC97');},700);
    return;
  }
  try{
    const res=await fetch(CONFIG.createCheckoutEndpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        sessionId:state.sessionId,
        amountDollars:CONFIG.priceDollars,
        draft:state.preview&&state.preview.draft?state.preview.draft:state.draft,
        preview:state.preview
      })
    });
    if(!res.ok)throw new Error('checkout failed');
    const data=await res.json();
    const url=data.checkoutUrl||data.url||'';
    if(!url)throw new Error('missing url');
    state.checkoutUrl=url;
    save();
    window.location.href=url;
  }catch(e){
    state.status='preview-ready';
    save();
    render();
    showToast('PayPal checkout did not open this time. Try once more, then text the shop if you need help.');
  }
}

function unlockPurchasedReading(msg,serverReading){
  if(serverReading&&(serverReading.transactionId||serverReading.txId)&&!state.paypalTxId){
    state.paypalTxId=serverReading.transactionId||serverReading.txId;
  }
  if(serverReading)state.reading=serverReading;
  else{
    if(!state.preview)state.preview=buildPreview();
    state.reading=buildReadingFromPreview(state.preview);
  }
  state.paidCredits=0;
  state.status='revealed';
  save();
  if(state.paypalTxId)saveTxReading(state.paypalTxId);
  render();
  const interp=document.getElementById('interpretation');
  if(interp)interp.scrollIntoView({behavior:'smooth',block:'start'});
  showToast(msg||'Reading unlocked! \uD83D\uDC97');
}

function grantPaid(msg){
  state.paidCredits=Math.max(1,state.paidCredits);
  if(state.preview&&!state.reading){
    unlockPurchasedReading(msg||'Reading unlocked! \uD83D\uDC97');
    return;
  }
  state.status=state.reading?'revealed':'paid';
  save();
  render();
  if(msg)showToast(msg);
}

async function checkPayment(forceToast){
  if(!state.sessionId){
    if(forceToast)showToast('Start a reading first.');
    return;
  }
  if(CONFIG.debugAutoUnlock){
    grantPaid(forceToast?'Reading unlocked! \uD83D\uDC97':'');
    return;
  }
  if(!CONFIG.statusEndpoint){
    if(forceToast)showToast('Your purchase may still be processing. Try again in a moment.');
    return;
  }
  try{
    const url=new URL(CONFIG.statusEndpoint,window.location.origin);
    url.searchParams.set('sessionId',state.sessionId);
    const res=await fetch(url.toString(),{headers:{Accept:'application/json'}});
    if(!res.ok)throw new Error('status failed');
    const data=await res.json();
    if(data.status==='paid'||data.status==='revealed'){
      if(data.transactionId||data.txId)state.paypalTxId=data.transactionId||data.txId;
      state.paidCredits=Math.max(1,Number(data.paidCredits)||1);
      if(data.reading){
        unlockPurchasedReading(forceToast?'Reading unlocked! \uD83D\uDC97':'',data.reading);
        return;
      }
      if(!state.preview&&!state.reading)state.preview=buildPreview();
      if(state.preview&&!state.reading){
        unlockPurchasedReading(forceToast?'Reading unlocked! \uD83D\uDC97':'');
        return;
      }
      state.status='paid';
      save();
      render();
      if(forceToast)showToast('Payment confirmed.');
      return;
    }
    if(forceToast)showToast('Your PayPal purchase is still processing.');
  }catch(e){
    if(forceToast)showToast('We are still waiting on payment confirmation. Try again in a moment.');
  }
  renderSession();
}

function syncPoll(){
  clearInterval(pollTimer);
  if(state.status==='awaiting-payment'&&canCheck()){
    pollTimer=setInterval(function(){checkPayment(false);},6000);
  }
}

function updateChoice(group,value){
  if(isDraftLocked()){
    showToast('Start a new reading to change keepsake, spread, or question.');
    return;
  }
  if(group==='keepsake')state.draft.keepsake=state.draft.keepsake===value?'':value;
  else if(group==='moon')state.draft.moon=value;
  else if(group==='zodiac')state.draft.zodiac=state.draft.zodiac===value?'':value;
  else if(group==='spread')state.draft.spread=Number(value);
  save();
  render();
}

function shuffle(deck){
  const copy=deck.slice();
  for(let i=copy.length-1;i>0;i-=1){
    const j=Math.floor(Math.random()*(i+1));
    const hold=copy[i];
    copy[i]=copy[j];
    copy[j]=hold;
  }
  return copy;
}

function introFromDraft(draft){
  const spread=SPREADS[draft.spread];
  const moon=item(MOONS,draft.moon)||MOONS[0];
  const keep=item(KEEPSAKES,draft.keepsake);
  const z=item(ZODIAC,draft.zodiac);
  const parts=['This '+spread.label.toLowerCase()+' landed with a '+moon.label.toLowerCase()+' feeling and a sense of '+moon.cue+'.'];
  if(keep)parts.push('The keepsake in the room was '+keep.label.toLowerCase()+', which points toward '+keep.cue);
  if(z)parts.push(z.label+' energy is present here, asking you to '+z.cue+'.');
  if(draft.question.trim())parts.push('The question held in the reading was "'+draft.question.trim().slice(0,140)+'".');
  else parts.push('You left the question open, so the cards spoke to the strongest feeling already sitting with you.');
  return parts.join(' ');
}

function summary(cards,draft){
  const activeDraft=draft||state.draft;
  const counts={};
  cards.forEach(function(card){counts[card.suit]=(counts[card.suit]||0)+1;});
  const dominant=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];})[0];
  const revs=cards.filter(function(card){return card.orientation==='Reversed';}).length;
  const lines=[];
  if(dominant==='cups')lines.push('This reading is led by feeling, relationship, and emotional honesty.');
  else if(dominant==='pentacles')lines.push('This reading leans toward practical choices, value, and what can actually hold up in real life.');
  else if(dominant==='wands')lines.push('The energy here is active and creative, with movement pushing for expression or change.');
  else if(dominant==='swords')lines.push('The sharpest thread in this reading is truth, communication, and mental clarity.');
  else if(dominant==='major')lines.push('Major Arcana leads the spread, which usually points to a bigger life lesson or turning point.');
  if(revs>=Math.ceil(cards.length/2))lines.push('More than half the cards turn inward, so slowing down is wiser than forcing a fast answer.');
  else if(revs>0)lines.push('At least one card turns inward, which suggests there is still something important to notice beneath the obvious story.');
  if(activeDraft.zodiac){
    const z=item(ZODIAC,activeDraft.zodiac);
    if(z)lines.push(z.label+' colors the whole spread: '+z.cue+'.');
  }
  lines.push('Keep what lands cleanly, let the rest breathe overnight, and come back to it before making any big move.');
  return lines.join(' ');
}

function buildPreview(){
  const draft=Object.assign(baseDraft(),state.draft);
  const spread=SPREADS[draft.spread];
  const deck=shuffle(CARDS);
  const cards=spread.positions.map(function(position,i){
    const card=deck[i];
    const rev=Math.random()<0.26;
    return{position:position,name:card.name,suit:card.suit,keys:card.keys,orientation:rev?'Reversed':'Upright'};
  });
  return{
    title:spread.label,
    intro:'Your cards: '+namesLine(cards),
    teaserTitle:previewTitle(cards),
    teaser:previewTeaser(cards),
    paywallTitle:previewPaywallTitle(),
    paywallCopy:previewPaywallCopy(),
    draft:draft,
    cards:cards
  };
}

function buildReadingFromPreview(preview){
  const draft=Object.assign(baseDraft(),preview.draft||state.draft);
  const pre=prefix(draft.keepsake);
  const cards=preview.cards.map(function(card){
    const source=cardRecord(card.name);
    const text=card.orientation==='Reversed'?source.r:source.u;
    return{
      position:card.position,
      name:card.name,
      suit:card.suit,
      keys:card.keys,
      orientation:card.orientation,
      text:pre?pre+lower(text):text
    };
  });
  return{
    title:preview.title,
    intro:introFromDraft(draft),
    summary:summary(cards,draft),
    cards:cards,
    draft:draft
  };
}

function reveal(){
  if(state.status==='awaiting-payment'){
    showToast('Your PayPal checkout is already open. Finish that before starting another reading.');
    return;
  }
  if(state.preview||state.reading){
    showToast('Your cards are already drawn. Start another reading for a fresh spread.');
    return;
  }
  if(!state.sessionId)startSession();
  if(!state.sessionId)return;

  state.draft=currentDraft();
  save();
  resetCardRevealProgress();

  const revealBtn=document.getElementById('reveal-btn');
  const portal=document.getElementById('ritual-portal');
  const portalMsg=document.getElementById('portal-message');
  const settling=document.getElementById('settling');
  const result=document.getElementById('result');
  if(revealBtn)revealBtn.classList.add('casting');
  if(portal)portal.classList.add('active');
  const msgs=['The cards are listening...','Shuffling the deck...','Gathering the message...','Almost ready...'];
  let mi=0;
  const iv=setInterval(function(){
    mi=(mi+1)%msgs.length;
    if(portalMsg)portalMsg.textContent=msgs[mi];
  },700);

  setTimeout(function(){
    clearInterval(iv);
    if(portal)portal.classList.remove('active');
    if(revealBtn)revealBtn.classList.remove('casting');
    if(settling)settling.classList.add('show');
    if(result)result.classList.remove('show');
    clearTimeout(settleTimer);
    settleTimer=setTimeout(function(){
      state.preview=buildPreview();
      state.reading=null;
      state.status='preview-ready';
      save();
      if(settling)settling.classList.remove('show');
      render();
      const resultBlock=document.getElementById('result');
      if(resultBlock)resultBlock.scrollIntoView({behavior:'smooth',block:'start'});
      showToast('Tap each card to reveal.');
    },1150);
  },2700);
}

function buildReadingText(reading){
  const lines=[];
  lines.push(reading.title||'Your Reading');
  lines.push('');
  if(reading.intro)lines.push(reading.intro,'');
  (reading.cards||[]).forEach(function(card){
    lines.push((card.position||'Card')+': '+(card.name||'')+(card.orientation==='Reversed'?' (Reversed)':''));
    lines.push(card.text||'');
    lines.push('');
  });
  if(reading.summary)lines.push('Closing Guidance:',reading.summary);
  return lines.join('\n');
}

function copyText(text){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function(resolve,reject){
    const ta=document.createElement('textarea');
    ta.value=text;
    document.body.appendChild(ta);
    ta.select();
    try{
      document.execCommand('copy');
      document.body.removeChild(ta);
      resolve();
    }catch(err){
      document.body.removeChild(ta);
      reject(err);
    }
  });
}

function copyReading(){
  if(!state.reading){
    showToast('Unlock your full reading first.');
    return;
  }
  const text=buildReadingText(state.reading);
  copyText(text).then(function(){
    const btn=document.getElementById('copy-btn');
    if(btn){
      btn.classList.add('copied');
      btn.textContent='Copied';
      setTimeout(function(){btn.classList.remove('copied');btn.textContent='Copy Reading';},1800);
    }
    showToast('Reading copied.');
  }).catch(function(){
    showToast('Could not copy right now.');
  });
}

function handleReturn(){
  const params=new URLSearchParams(window.location.search);
  const returned=params.get('reading');
  const txId=extractPayPalTx(params);
  if(txId){
    state.paypalTxId=txId;
    save();
  }
  if(returned&&state.sessionId&&returned.toUpperCase()===state.sessionId){
    checkPayment(true);
  }
  if(txId&&state.reading){
    saveTxReading(txId);
  }
  if(returned||txId){
    params.delete('reading');
    ['tx','txn_id','transactionId','capture_id','paymentId','token'].forEach(function(k){params.delete(k);});
    const next=params.toString()?window.location.pathname+'?'+params.toString():window.location.pathname;
    window.history.replaceState({},document.title,next+window.location.hash);
  }
}

document.addEventListener('click',function(e){
  const btn=e.target.closest('[data-group]');
  if(btn){
    updateChoice(btn.dataset.group,btn.dataset.value);
  }
});

function on(id,eventName,handler){
  const el=document.getElementById(id);
  if(el)el.addEventListener(eventName,handler);
}

on('paywall-btn','click',launchCheckout);
on('paywall-check-btn','click',function(){checkPayment(true);});
on('reveal-btn','click',reveal);
on('new-reading-btn','click',startSession);
on('new-reading-btn-2','click',startSession);
on('copy-btn','click',copyReading);
on('question','input',function(e){
  if(isDraftLocked()){
    e.target.value=state.draft.question;
    return;
  }
  state.draft.question=e.target.value;
  save();
  renderSession();
});
on('chest-btn','click',toggleChest);

quoteTimer=setInterval(rotateOracleQuote,7500);
render();
handleReturn();
