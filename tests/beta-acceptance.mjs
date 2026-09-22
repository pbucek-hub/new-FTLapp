import { chromium } from 'playwright';

let cases=0, failures=[];
const check=async(name,fn)=>{cases++;try{await fn();}catch(e){failures.push(name+': '+e.message);}};
const browser=await chromium.launch({headless:true});

const airportData={
  EGLL:{icao:'EGLL',iata:'LHR',name:'London Heathrow Airport',city:'London',country:'GB',tz:'Europe/London'},
  LFPG:{icao:'LFPG',iata:'CDG',name:'Charles de Gaulle Airport',city:'Paris',country:'FR',tz:'Europe/Paris'},
  KJFK:{icao:'KJFK',iata:'JFK',name:'John F Kennedy International Airport',city:'New York',country:'US',tz:'America/New_York'},
  ZULB:{icao:'ZULB',iata:'LLB',name:'Qiannan Libo Airport',city:'Libo',country:'CN',tz:'Asia/Shanghai'},
  LLBG:{icao:'LLBG',iata:'TLV',name:'Ben Gurion International Airport',city:'Tel Aviv',country:'IL',tz:'Asia/Jerusalem'}
};

async function newPage(viewport){
  const page=await browser.newPage({viewport});
  await page.route('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(airportData)}));
  await page.goto('http://127.0.0.1:8000/index.html',{waitUntil:'networkidle'});
  return page;
}

for(const viewport of [{width:390,height:844},{width:430,height:932},{width:768,height:1024},{width:1440,height:900}]){
  await check('layout '+viewport.width+'x'+viewport.height,async()=>{
    const p=await newPage(viewport);
    const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
    if(overflow) throw new Error('horizontal overflow');
    const calc=await p.locator('#calculateBtn').boundingBox();
    if(!calc||calc.height<44) throw new Error('Calculate touch target below 44px');
    await p.close();
  });
}

const p=await newPage({width:390,height:844});
for(const [query,code] of [['EGLL','EGLL'],['LHR','EGLL'],['Heathrow','EGLL'],['London','EGLL'],['LFPG','LFPG'],['CDG','LFPG'],['Paris','LFPG'],['LLBG','LLBG']]){
  await check('airport '+query,async()=>{
    await p.locator('#reportLocation').fill('');
    await p.locator('#reportLocation').fill(query);
    await p.waitForTimeout(60);
    const val=await p.locator('#reportLocation').inputValue();
    const options=await p.locator('#airportMatches').locator('option').allTextContents();
    if(!val.includes(code)&&!options.some(x=>x.includes(code))) throw new Error('did not resolve '+code);
  });
}


await check('ICAO typing not hijacked by 3-letter IATA',async()=>{
  await p.locator('#reportLocation').fill('');
  await p.locator('#reportLocation').pressSequentially('LL',{delay:5});
  if((await p.locator('#reportLocation').inputValue())!=='LL') throw new Error('2-char input was auto-committed');
  await p.locator('#reportLocation').pressSequentially('B',{delay:5});
  if((await p.locator('#reportLocation').inputValue())!=='LLB') throw new Error('3-char input was auto-committed to IATA');
  await p.locator('#reportLocation').pressSequentially('G',{delay:5});
  await p.waitForTimeout(30);
  const v=await p.locator('#reportLocation').inputValue();
  if(!v.startsWith('LLBG')) throw new Error('LLBG did not resolve to exact ICAO; got '+v);
});

await check('airport no match',async()=>{
  await p.locator('#reportLocation').fill('ZZZZNOTREAL');
  await p.waitForTimeout(50);
  const visible=await p.locator('#airportMatches').isVisible();
  if(visible) throw new Error('no-match list should not be visible');
});

await check('time and date controls fit equally inside card',async()=>{
  const row=await p.locator('.report-datetime').boundingBox();
  const time=await p.locator('#startTime').boundingBox();
  const date=await p.locator('#reportDate').boundingBox();
  if(!row||!time||!date) throw new Error('missing date/time geometry');
  const eps=2;
  if(time.x < row.x-eps || date.x < row.x-eps) throw new Error('control starts outside row');
  if(time.x+time.width > row.x+row.width+eps) throw new Error('time exceeds row');
  if(date.x+date.width > row.x+row.width+eps) throw new Error('date exceeds row');
  if(Math.abs(time.width-date.width)>3) throw new Error('time/date widths differ by more than 3px');
});

await check('report date readable',async()=>{
  const style=await p.locator('#reportDate').evaluate(el=>{
    const s=getComputedStyle(el); return {color:s.color,opacity:s.opacity,fontSize:s.fontSize,background:s.backgroundColor};
  });
  if(Number(style.opacity)<0.95) throw new Error('date field opacity too low');
  if(parseFloat(style.fontSize)<15) throw new Error('date text too small');
  const value=await p.locator('#reportDate').inputValue();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('date value not visibly populated');
});

await check('OM-A edition visible',async()=>{
  const t=await p.locator('#ruleset-sub').textContent();
  if(!/2026_JCC_PART_NCC_OMA_I2R19/.test(t)) throw new Error('NCC edition not visible');
});

await check('reason reference collapsed',async()=>{
  const d=p.locator('#fdp-result details.result-details');
  if(await d.count()!==1) throw new Error('Reason/reference disclosure missing');
  if(await d.getAttribute('open')!==null) throw new Error('Reason/reference should default collapsed');
  const s=await d.locator('summary').textContent();
  if(!/Reason & JCC OM-A Reference/.test(s)) throw new Error('wrong disclosure label');
});

await check('rule toggle labels update',async()=>{
  await p.locator('#seg-ruleset button[data-val="CAT"]').click();
  if(!/CAT/.test(await p.locator('#ruleset-sub').textContent())) throw new Error('CAT source label stale');
  await p.locator('#seg-ruleset button[data-val="NCC"]').click();
  if(!/NCC/.test(await p.locator('#ruleset-sub').textContent())) throw new Error('NCC source label stale');
});

await check('Table B exact 30 review',async()=>{
  await p.locator('#seg-acclim button[data-val="notacclim"]').click();
  await p.locator('#precedingRest').fill('30');
  if(!/REVIEW REQUIRED/.test(await p.locator('#fdp-result').textContent())) throw new Error('missing review state');
});

await check('actual FDP illegal state',async()=>{
  const q=await newPage({width:390,height:844});
  const override=q.locator('#panel-fdp details.helper').first();
  if(await override.getAttribute('open')===null) await override.locator('summary').click();
  await q.locator('#actualReport').fill('09:00');
  // Cross midnight so actual FDP is 15:30, deliberately above the default 15:15 limit.
  await q.locator('#actualFinish').fill('00:30');
  const txt=await q.locator('#fdp-result').textContent();
  if(!/NOT LEGAL/.test(txt)) throw new Error('over-limit actual FDP not clearly illegal: '+txt.replace(/\s+/g,' ').trim().slice(0,220));
  if(!(await q.locator('#fdp-result').evaluate(el=>el.classList.contains('illegal')))) throw new Error('illegal visual state missing');
  await q.close();
});

await check('reset returns clean baseline',async()=>{
  await p.locator('#seg-ruleset button[data-val="CAT"]').click();
  await p.locator('#seg-acclim button[data-val="notacclim"]').click();
  await p.locator('#sectors').fill('7');
  await p.locator('#reportLocation').fill('LLBG');
  await p.waitForTimeout(30);
  await p.locator('#seg-longsector button[data-val="yes"]').click();
  await p.locator('#resetBtn').click();
  await p.waitForTimeout(20);

  const rule=await p.locator('#seg-ruleset button.active').getAttribute('data-val');
  const acclim=await p.locator('#seg-acclim button.active').getAttribute('data-val');
  const sectors=await p.locator('#sectors').inputValue();
  const airport=await p.locator('#reportLocation').inputValue();
  const longSel=await p.locator('#seg-longsector button.active').getAttribute('data-val');

  if(rule!=='NCC') throw new Error('ruleset did not reset to NCC');
  if(acclim!=='acclim') throw new Error('acclimatisation did not reset');
  if(sectors!=='2') throw new Error('sectors did not reset to 2');
  if(airport!=='') throw new Error('airport did not clear');
  if(longSel!=='no') throw new Error('long sector did not reset to No');
});

await check('bottom nav does not cover calculate button',async()=>{
  await p.locator('#calculateBtn').scrollIntoViewIfNeeded();
  const calc=await p.locator('#calculateBtn').boundingBox();
  const nav=await p.locator('#tabs').boundingBox();
  if(calc&&nav&&calc.y+calc.height>nav.y) throw new Error('bottom nav overlaps Calculate');
});

await p.close();
await browser.close();
console.log('BETA ACCEPTANCE: '+cases+' cases, '+(cases-failures.length)+' PASS, '+failures.length+' FAIL');
if(failures.length){failures.forEach(x=>console.error('FAIL '+x));process.exit(1);}
