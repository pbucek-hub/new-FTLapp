import { chromium } from 'playwright';

const A = {
  NCC: [
    {start:360,end:419,v:[15,14.25,13.5,12.75,12,11.5,11,11]},
    {start:420,end:779,v:[16,15.25,14.5,13.75,13,12.5,12,11.5]},
    {start:780,end:1079,v:[15,14.25,13.5,12.75,12,11.5,11,11]},
    {start:1080,end:1319,v:[14,13.25,12.5,11.75,11,11,11,11]},
    {start:1320,end:1439,v:[13,12.25,11.5,11,11,11,11,11]},
    {start:0,end:359,v:[13,12.25,11.5,11,11,11,11,11]}
  ],
  CAT: [
    {start:360,end:419,v:[13,12.25,11.5,10.75,10,9.5,9,9]},
    {start:420,end:779,v:[14,13.25,12.5,11.75,11,10.5,10,9.5]},
    {start:780,end:1079,v:[13,12.25,11.5,10.75,10,9.5,9,9]},
    {start:1080,end:1319,v:[12,11.25,10.5,9.75,9,9,9,9]},
    {start:1320,end:1439,v:[11,10.25,9.5,9,9,9,9,9]},
    {start:0,end:359,v:[11,10.25,9.5,9,9,9,9,9]}
  ]
};
const B = {
  NCC: {
    outer:[15,14.25,13.5,12.75,12,11.25,11],
    inner:[13.5,13,12.5,11.75,11,11,11]
  },
  CAT: {
    outer:[13,12.25,11.5,10.75,10,9.25,9],
    inner:[11.5,11,10.5,9.75,9,9,9]
  }
};

let cases=0, failures=[];
function hm(h){
  const hh=Math.floor(h+1e-9), mm=Math.round((h-hh)*60);
  return hh+':'+String(mm).padStart(2,'0');
}
function minsToTime(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
function near(a,b){return Math.abs(a-b)<1/120;}
function expectedA(rule,m,sec){
  const row=A[rule].find(r=>m>=r.start&&m<=r.end);
  return row.v[Math.min(Math.max(sec,1),8)-1];
}
function expectedB(rule,rest,sec){
  if(Math.abs(rest-30)<1e-9) return null;
  const row=(rest<=18||rest>30)?B[rule].outer:B[rule].inner;
  return row[Math.min(Math.max(sec,1),7)-1];
}
function longModified(rule,acc,actual,h,extra){
  if(extra) return {na:false,sec:actual};
  if(rule==='NCC'){
    if(h<=9) return {na:false,sec:actual};
    if(h<=11) return {na:false,sec:actual-1+(acc?1:2)};
    return {na:false,sec:actual-1+(acc?2:3)};
  }
  if(h<=7) return {na:false,sec:actual};
  if(h<=9) return {na:false,sec:actual-1+(acc?2:4)};
  if(h<=11) return {na:false,sec:actual-1+(acc?3:4)};
  if(acc) return {na:false,sec:actual-1+4};
  return {na:true,sec:actual};
}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto('http://127.0.0.1:8000/index.html',{waitUntil:'networkidle'});

async function setState({rule='NCC',acc=true,sectors=1,report='09:00',rest=12,long='00:00',extra=false,ext='none'}={}){
  await page.evaluate(({rule,acc,sectors,report,rest,long,extra,ext})=>{
    const click=(sel)=>document.querySelector(sel)?.click();
    click('#seg-ruleset button[data-val="'+rule+'"]');
    click('#seg-acclim button[data-val="'+(acc?'acclim':'notacclim')+'"]');
    click('#seg-ext button[data-val="'+ext+'"]');
    const set=(id,val,ev='input')=>{const e=document.getElementById(id); if(!e)return; if(e.type==='checkbox')e.checked=!!val; else e.value=val; e.dispatchEvent(new Event(ev,{bubbles:true}));};
    set('sectors',String(sectors));
    set('startTime',report);
    set('precedingRest',String(rest));
    set('longSectorTime',long);
    set('additionalPilot',extra,'change');
    set('actualReport','');
    set('actualFinish','');
    ['useDelayedReport','useStandby','useInterruptedRest'].forEach(id=>set(id,false,'change'));
  },{rule,acc,sectors,report,rest,long,extra,ext});
}
async function fdpText(){return await page.locator('#fdp-result').innerText();}
async function maxFdp(){
  const t=await page.locator('#fdp-result .headline-row .num.amber').first().textContent().catch(()=>null);
  if(!t)return null;
  const [h,m]=t.trim().split(':').map(Number); return h+m/60;
}
async function check(name,fn){
  cases++;
  try{await fn();}catch(e){failures.push(name+': '+e.message);}
}

// Table A: every rule, sector count and all band edges + adjacent transition minutes.
const probeMinutes=[0,1,358,359,360,361,418,419,420,421,778,779,780,781,1078,1079,1080,1081,1318,1319,1320,1321,1438,1439];
for(const rule of ['NCC','CAT']){
  for(let sec=1;sec<=10;sec++){
    for(const m of probeMinutes){
      await check(rule+' Table A '+minsToTime(m)+' s'+sec,async()=>{
        await setState({rule,acc:true,sectors:sec,report:minsToTime(m),long:'00:00'});
        const got=await maxFdp(), exp=expectedA(rule,m,sec);
        if(got===null||!near(got,exp)) throw new Error('expected '+hm(exp)+' got '+got);
      });
    }
  }
}

// Table B: every sector category and threshold values around 18 and 30 hours.
const rests=[0,17.5,17.99,18,18.01,18.5,29.5,29.99,30,30.01,30.5,48];
for(const rule of ['NCC','CAT']){
  for(let sec=1;sec<=9;sec++){
    for(const rest of rests){
      await check(rule+' Table B rest '+rest+' s'+sec,async()=>{
        await setState({rule,acc:false,sectors:sec,rest,report:'09:00',long:'00:00'});
        const exp=expectedB(rule,rest,sec), txt=await fdpText();
        if(exp===null){
          if(!/REVIEW REQUIRED/.test(txt)) throw new Error('30:00 must be REVIEW REQUIRED');
        } else {
          const got=await maxFdp();
          if(got===null||!near(got,exp)) throw new Error('expected '+hm(exp)+' got '+got);
        }
      });
    }
  }
}

// Long-sector modified-sector rules: all key thresholds, both acclim states,
// several actual sector counts, with and without an additional type-rated pilot.
const longByRule={
  NCC:[8.99,9,9.01,10.99,11,11.01,12],
  CAT:[6.99,7,7.01,8.99,9,9.01,10.99,11,11.01,12]
};
for(const rule of ['NCC','CAT']){
  for(const acc of [true,false]){
    for(const sec of [1,2,4,7,8]){
      for(const h of longByRule[rule]){
        for(const extra of [false,true]){
          await check(rule+' long '+h+' acc='+acc+' s'+sec+' extra='+extra,async()=>{
            const hours=Math.floor(h), minutes=Math.round((h-hours)*60);
            const long=String(hours).padStart(2,'0')+':'+String(minutes).padStart(2,'0');
            await setState({rule,acc,sectors:sec,report:'09:00',rest:12,long,extra});
            const mod=longModified(rule,acc,sec,h,extra), txt=await fdpText();
            if(mod.na){
              if(!/NOT APPLICABLE/.test(txt)) throw new Error('expected NOT APPLICABLE');
              return;
            }
            const expected=acc?expectedA(rule,540,mod.sec):expectedB(rule,12,mod.sec);
            const got=await maxFdp();
            if(got===null||!near(got,expected)) throw new Error('modified sectors '+mod.sec+' expected '+hm(expected)+' got '+got);
          });
        }
      }
    }
  }
}

// Split duty thresholds from OM-A: <3 nil; 3-10 = half the consecutive rest.
for(const rule of ['NCC','CAT']){
  for(const gap of [0,2.99,3,3.01,4,6,9.99,10]){
    await check(rule+' split '+gap,async()=>{
      await setState({rule,acc:true,sectors:2,report:'09:00',long:'00:00',ext:'split'});
      const start=600, end=Math.round(start+gap*60);
      await page.evaluate(({s,e})=>{
        const fmt=m=>String(Math.floor((m%1440)/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
        for(const [id,v] of [['splitStart',fmt(s)],['splitEnd',fmt(e)]]){const x=document.getElementById(id);x.value=v;x.dispatchEvent(new Event('input',{bubbles:true}));}
      },{s:start,e:end});
      const base=expectedA(rule,540,2), exp=base+(gap<3?0:gap/2), got=await maxFdp();
      if(got===null||!near(got,exp)) throw new Error('expected '+hm(exp)+' got '+got);
    });
  }
}

// In-flight relief: <3h no extension; seat 1/3 with cap; bunk 1/2 with cap; jump no credit.
for(const rule of ['NCC','CAT']){
  for(const type of ['jump','seat','bunk']){
    for(const rest of [0,2.99,3,3.01,4,6,10]){
      await check(rule+' relief '+type+' '+rest,async()=>{
        await setState({rule,acc:true,sectors:2,report:'09:00',long:'00:00',extra:true,ext:'relief'});
        await page.evaluate(({type,rest})=>{
          document.querySelector('#seg-relieftype button[data-val="'+type+'"]').click();
          const r=document.getElementById('reliefRest');r.value=String(rest);r.dispatchEvent(new Event('input',{bubbles:true}));
        },{type,rest});
        const base=expectedA(rule,540,2);
        let exp=base;
        if(type!=='jump'&&rest>=3){
          const cap=type==='bunk'?(rule==='NCC'?20:18):(rule==='NCC'?18:15);
          exp=Math.min(base+(type==='bunk'?rest/2:rest/3),cap);
        }
        const got=await maxFdp();
        if(got===null||!near(got,exp)) throw new Error('expected '+hm(exp)+' got '+got);
      });
    }
  }
}

// Minimum rest matrix: duty, away/base, accommodation and travel thresholds.
for(const rule of ['NCC','CAT']){
  for(const duty of [0,9.99,10,10.01,11.99,12,12.01,18,20,20.01,24]){
    for(const away of [false,true]){
      for(const accom of [false,true]){
        for(const travel of [0,30,31,45,60]){
          await check(rule+' rest duty='+duty+' away='+away+' accom='+accom+' travel='+travel,async()=>{
            await setState({rule});
            await page.evaluate(({duty,away,accom,travel})=>{
              const click=(sel)=>document.querySelector(sel).click();
              document.querySelector('[data-tab="rest"]').click();
              const d=document.getElementById('precedingDuty');d.value=String(duty);d.dispatchEvent(new Event('input',{bubbles:true}));
              click('#seg-awaybase button[data-val="'+(away?'yes':'no')+'"]');
              click('#seg-accom button[data-val="'+(accom?'yes':'no')+'"]');
              const t=document.getElementById('travelMin');t.value=String(travel);t.dispatchEvent(new Event('input',{bubbles:true}));
            },{duty,away,accom,travel});
            const floor=rule==='NCC'?10:12;
            let exp=Math.max(duty,floor);
            const qualifies=away&&accom&&((rule==='NCC'&&exp>=10)||(rule==='CAT'&&Math.abs(exp-12)<1e-9));
            if(qualifies) exp=Math.max(exp-1,rule==='NCC'?8:10);
            if(away) exp+=Math.max(0,(travel*2/60)-1);
            const txt=await page.locator('#rest-result .headline .num').textContent();
            const [hh,mm]=txt.trim().split(':').map(Number), got=hh+mm/60;
            if(!near(got,exp)) throw new Error('expected '+hm(exp)+' got '+txt);
            await page.evaluate(()=>document.querySelector('[data-tab="fdp"]').click());
          });
        }
      }
    }
  }
}

// Cumulative limits: just below / exactly / just above each OM-A threshold.
const limits={
  NCC:{d7:65,d14:105,d28:190,d365:2000,f28:100,f365:900},
  CAT:{d7:55,d14:95,d28:190,d365:2000,f28:100,f365:900}
};
for(const rule of ['NCC','CAT']){
  for(const [id,limit] of Object.entries(limits[rule])){
    for(const value of [Math.max(0,limit-0.5),limit,limit+0.5]){
      await check(rule+' cumulative '+id+'='+value,async()=>{
        await setState({rule});
        await page.evaluate(({id,value})=>{
          document.querySelector('[data-tab="cumulative"]').click();
          const e=document.getElementById(id);e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));
        },{id,value});
        const text=await page.locator('#cumulative-result').innerText();
        const shouldBad=value>=limit;
        const row=text.split('\n').findIndex(x=>x.includes(String(limit)+'h'));
        if(row<0) throw new Error('limit row not rendered');
        if(shouldBad && !/Limit reached\/exceeded/.test(text)) throw new Error('limit should be reached/exceeded');
        await page.evaluate(()=>document.querySelector('[data-tab="fdp"]').click());
      });
    }
  }
}

// CAT delayed-report, standby and interrupted-rest boundary cases.
for(const delayH of [3.99,4,4.01,9.99,10]){
  await check('CAT delayed report '+delayH,async()=>{
    await setState({rule:'CAT',acc:true,sectors:2,report:'09:00',long:'00:00'});
    await page.evaluate(({delayH})=>{
      const u=document.getElementById('useDelayedReport');u.checked=true;u.dispatchEvent(new Event('change',{bubbles:true}));
      const o=document.getElementById('delayedOriginal');o.value='09:00';o.dispatchEvent(new Event('input',{bubbles:true}));
      const mins=Math.round(9*60+delayH*60)%1440;
      const a=document.getElementById('delayedActual');a.value=String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0');a.dispatchEvent(new Event('input',{bubbles:true}));
      const d=document.getElementById('delayUndisturbed');d.checked=delayH>=10;d.dispatchEvent(new Event('change',{bubbles:true}));
    },{delayH});
    const txt=await fdpText();
    if(delayH<4 && !/Delayed report <4h/.test(txt)) throw new Error('expected <4h delayed-report rule');
    if(delayH>=4&&delayH<10 && !/Delayed report ≥4h/.test(txt)) throw new Error('expected ≥4h delayed-report rule');
    if(delayH>=10 && !/qualifies as rest/.test(txt)) throw new Error('expected ≥10h rest treatment');
  });
}
for(const standbyH of [5.99,6,6.01,11.99,12,12.01]){
  await check('CAT standby '+standbyH,async()=>{
    await setState({rule:'CAT',acc:true,sectors:2,report:'09:00',long:'00:00'});
    await page.evaluate(({standbyH})=>{
      const u=document.getElementById('useStandby');u.checked=true;u.dispatchEvent(new Event('change',{bubbles:true}));
      const s=document.getElementById('standbyStart');s.value='06:00';s.dispatchEvent(new Event('input',{bubbles:true}));
      const mins=Math.round(6*60+standbyH*60)%1440;
      const c=document.getElementById('standbyCallout');c.value=String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0');c.dispatchEvent(new Event('input',{bubbles:true}));
    },{standbyH});
    const txt=await fdpText();
    if(standbyH>12 && !/NOT LEGAL/.test(txt)) throw new Error('>12h standby must be NOT LEGAL');
    if(standbyH<=12 && /NOT LEGAL/.test(txt)) throw new Error('standby at/below 12h incorrectly illegal');
  });
}

await browser.close();
console.log('OM-A RULE MATRIX: '+cases+' cases, '+(cases-failures.length)+' PASS, '+failures.length+' FAIL');
if(failures.length){
  for(const f of failures.slice(0,100)) console.error('FAIL '+f);
  process.exit(1);
}
