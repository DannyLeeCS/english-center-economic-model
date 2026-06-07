(function(){
  const CY='#38bdf8', EM='#34d399', VI='#a78bfa', AM='#fbbf24', TRACK='rgba(255,255,255,.10)';
  const ACCENT = {
    fee:CY, vc:CY, ro:CY, cm:CY, fix:CY,
    courses:AM, uppct:AM, upcourses:AM,
    ftsal:CY, ptpct:CY, pthr:CY, pthrs:CY, ftper:CY, ftcov:CY,
    cap:VI, rooms:VI, opp:VI,
    mkt:EM, cpl:EM, conv:EM, lvl:EM, wait:EM, initact:EM
  };
  const sliderIds = Object.keys(ACCENT);

  const $ = id => document.getElementById(id);
  const num = id => +$('s-'+id).value;
  const fmtM = n => { const a=Math.abs(n); if (a>=1000) return (n/1000).toFixed(2)+'B'; return Math.round(n)+'M'; };
  const fmtM1 = n => { const a=Math.abs(n); if (a>=1000) return (n/1000).toFixed(2)+'B'; return n.toFixed(1)+'M'; };
  const fmtK = n => Math.round(n)+'k';
  const clamp = (x,lo,hi) => Math.max(lo, Math.min(hi, x));

  let mode = 'cohort';
  let intakeMonths = 1;
  let view = 'steady';   // default: funnel-responsive long-run view (every lever flows through)

  function paintTrack(id){
    const s = $('s-'+id);
    const pct = (s.value - s.min) / (s.max - s.min) * 100;
    s.style.background = 'linear-gradient(90deg, '+ACCENT[id]+' 0 '+pct+'%, '+TRACK+' '+pct+'% 100%)';
  }
  function setText(id, v, color){ const e=$(id); e.textContent=v; if(color!==undefined) e.style.color=color; }

  function buildChart(series, steady, yMax){
    const W=640, Hs=250, padL=46, padR=16, padT=14, padB=26;
    const xMax = series.length-1;
    const X = t => padL + (t/xMax)*(W-padL-padR);
    const Y = v => Hs-padB - (clamp(v,0,yMax)/yMax)*(Hs-padT-padB);
    const line = series.map((v,t)=> (t===0?'M':'L')+X(t).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
    const area = line+' L'+X(xMax).toFixed(1)+' '+Y(0).toFixed(1)+' L'+X(0).toFixed(1)+' '+Y(0).toFixed(1)+' Z';
    const yt=[0,.25,.5,.75,1].map(f=>f*yMax);
    const grid = yt.map(v=>{const y=Y(v).toFixed(1);return '<line class="grid" x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'"/><text class="ylab" x="'+(padL-7)+'" y="'+(+y+3).toFixed(1)+'">'+Math.round(v)+'</text>';}).join('');
    const xt=[0,6,12,18,24].filter(t=>t<=xMax);
    const xlab = xt.map(t=>'<text class="xlab" x="'+X(t).toFixed(1)+'" y="'+(Hs-8)+'">'+t+'</text>').join('');
    const sy = Y(steady).toFixed(1);
    const steadyLine = '<line class="steady" x1="'+padL+'" y1="'+sy+'" x2="'+(W-padR)+'" y2="'+sy+'"/><text class="slab" x="'+(W-padR)+'" y="'+(+sy-6).toFixed(1)+'">steady ≈ '+Math.round(steady)+'</text>';
    return '<svg viewBox="0 0 '+W+' '+Hs+'" class="chart-svg" preserveAspectRatio="xMidYMid meet">'
      + '<defs><linearGradient id="areaG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="'+EM+'" stop-opacity="0.32"/><stop offset="1" stop-color="'+EM+'" stop-opacity="0"/></linearGradient></defs>'
      + grid + steadyLine
      + '<path class="area" d="'+area+'" fill="url(#areaG)"/>'
      + '<path class="line" d="'+line+'"/>'
      + xlab
      + '<circle class="dot" cx="'+X(0).toFixed(1)+'" cy="'+Y(series[0]).toFixed(1)+'" r="3.5"/>'
      + '<circle class="dot end" cx="'+X(xMax).toFixed(1)+'" cy="'+Y(series[xMax]).toFixed(1)+'" r="3.5"/>'
      + '</svg>';
  }

  function compute(){
    sliderIds.forEach(paintTrack);

    const fee=num('fee'), vc=num('vc'), ro=num('ro'), cm=num('cm');
    const courses=num('courses'), upPct=num('uppct')/100, upCourses=num('upcourses');
    const ftsal=num('ftsal'), ptpct=num('ptpct')/100, pthr=num('pthr'), pthrs=num('pthrs');
    const ftper=num('ftper'), ftcov=num('ftcov');
    const cap=num('cap'), rooms=num('rooms'), opp=num('opp');
    const mkt=num('mkt'), cpl=num('cpl'), conv=num('conv'), lvl=num('lvl'), wait=num('wait');
    const initAct=num('initact'), fix=num('fix');
    const useElastic=$('elastic').checked, forceScarce=$('scarce').checked;

    // value labels
    setText('v-fee',fmtM(fee)); setText('v-vc',fmtM(vc)); setText('v-ro',fmtM(ro)); setText('v-cm',cm);
    setText('v-courses',courses); setText('v-uppct',Math.round(upPct*100)+'%'); setText('v-upcourses',upCourses);
    setText('v-ftsal',fmtM(ftsal)); setText('v-ptpct',Math.round(ptpct*100)+'%'); setText('v-pthr',fmtK(pthr));
    setText('v-pthrs',pthrs); setText('v-ftper',fmtM(ftper)); setText('v-ftcov',ftcov);
    setText('v-cap',cap); setText('v-rooms',rooms); setText('v-opp',fmtM(opp));
    setText('v-mkt',fmtM(mkt)); setText('v-cpl',fmtK(cpl)); setText('v-conv',conv+'%');
    setText('v-lvl',lvl); setText('v-wait',wait+(wait===1?' wk':' wks')); setText('v-initact',Math.round(initAct));
    setText('v-fix',fmtM(fix));

    // -------- per-unit economics (unscaled) --------
    const feePerMonth = fee/cm;
    const vcPerMonth = vc/cm;
    const contribPerStudent = feePerMonth - vcPerMonth;

    const avgCourses = courses + upPct*upCourses;
    const avgLifetime = Math.max(0.5, cm*avgCourses);
    const g = 1/avgLifetime;

    // -------- demand funnel (heads/month) --------
    const leads = (mkt*1000)/cpl;
    const feeElastic = useElastic ? Math.pow(13/fee, 0.45) : 1;
    const effConv = Math.min(0.6, (conv/100)*feeElastic);
    let abandon = 0;
    if (mode === 'cohort'){
      const avgWaitWeeks = (intakeMonths*4)/2;
      abandon = clamp((avgWaitWeeks - wait)/Math.max(wait,1)*0.5, 0, 0.6);
    }
    const inflowDemand = leads*effConv*(1-abandon);

    // -------- capacity ceiling & steady state (flows, view-independent) --------
    const maxStock = rooms*cap;
    const desiredStock = inflowDemand*avgLifetime;
    const steadyStock = Math.min(desiredStock, maxStock);    // what marketing + retention sustain
    const seatedInflow = steadyStock/avgLifetime;            // sustainable new students / mo
    const currentStock = initAct;                            // what you actually have right now

    // === which stock drives the headline economics? ===
    // "Now" = your current students (a fixed snapshot of this month).
    // "Steady" = the funnel's long-run level (responds to every lever).
    const viewStock = (view==='now') ? currentStock : steadyStock;
    const servedStock = Math.min(viewStock, maxStock);       // can't seat beyond room capacity
    const overflow = Math.max(0, viewStock - maxStock);

    // === SECTION A: total classes — derived from the viewed stock, capped by rooms ===
    const classesNeeded = lvl*Math.max(1, Math.ceil((viewStock/lvl)/cap));
    const classesRunning = Math.min(classesNeeded, rooms);
    const classSize = classesRunning>0 ? servedStock/classesRunning : 0;
    const utilization = rooms>0 ? classesNeeded/rooms : 0;
    const capacityConstrained = classesNeeded > rooms + 1e-9;
    const roomsScarce = forceScarce || capacityConstrained;

    // === SECTION B: PT/FT split keys off class count ===
    const ptClasses = classesRunning*ptpct;
    const ftClasses = classesRunning*(1-ptpct);

    // === SECTION C: part-time cost from hourly rate × hours ===
    const hoursPerClassMonth = pthrs*4.3;
    const ptCostPerClass = hoursPerClassMonth*pthr/1000;       // pthr in k VND → M
    const ptCostTotal = ptClasses*ptCostPerClass;

    // -------- per-class marginal cost & break-even (unscaled) --------
    const marginalClassCost = ptCostPerClass + ro + (roomsScarce ? opp : 0);
    const breakEven = contribPerStudent>0 ? marginalClassCost/contribPerStudent : 999;

    // -------- totals from the (served) stock — current + new combined --------
    const revenue = servedStock*feePerMonth;
    const varCostTotal = servedStock*vcPerMonth;
    const roomCostTotal = ro*classesRunning;
    const perClassBucket = ptCostTotal + roomCostTotal;
    const fixedTotal = fix + ftsal;
    const profit = revenue - varCostTotal - perClassBucket - fixedTotal - mkt;  // marketing is a real monthly cost

    // upsell scales with the whole active base (current + new), via its share of lifetime
    const upsellShare = avgLifetime>0 ? (upPct*upCourses*cm)/avgLifetime : 0;
    const upsellStock = servedStock*upsellShare;
    const upsellRev = upsellStock*feePerMonth;

    // -------- lifetime value (flows, view-independent) --------
    const cac = seatedInflow>0 ? mkt/seatedInflow : 0;
    const ltv = avgCourses*(fee - vc);
    const ratio = cac>0 ? ltv/cac : 0;

    const marginPerClass = classSize*contribPerStudent - marginalClassCost;

    // -------- deferred revenue (on the served stock) --------
    const courseStartsPerMonth = cm>0 ? servedStock/cm : 0;
    const cashIn = courseStartsPerMonth*fee;
    const recognized = revenue;
    const unearned = servedStock*feePerMonth*Math.max(0,(cm-1))/2;

    // === SECTION D: FT capacity sanity check (validate, never override) ===
    const ftTeachersPaid = ftper>0 ? ftsal/ftper : 0;        // FT teachers the salary funds
    const ftTeachersNeeded = ftcov>0 ? ftClasses/ftcov : 0;  // teachers to cover the FT classes
    const ftTol = Math.max(0.4, ftTeachersNeeded*0.2);

    // -------- stock projection --------
    const H = 24;
    const series = [initAct];
    for (let t=1; t<=H; t++) series.push(Math.min(maxStock, series[t-1]*(1-g) + inflowDemand));
    const yMax = Math.max(...series, steadyStock, 10)*1.12;
    $('chart').innerHTML = buildChart(series, steadyStock, yMax);
    const dir = steadyStock - initAct;
    setText('chart-note', Math.abs(dir) < Math.max(5, initAct*0.02)
        ? 'holding near '+Math.round(steadyStock)
        : (dir>0 ? 'rising toward '+Math.round(steadyStock) : 'declining toward '+Math.round(steadyStock)));

    // =================== render ===================
    setText('o-be', breakEven>99 ? 'n/a' : breakEven.toFixed(1));
    setText('o-cs', classSize.toFixed(1));
    setText('o-leads', Math.round(leads));
    setText('o-enroll', Math.round(seatedInflow));
    setText('o-active', Math.round(servedStock));
    setText('o-classes', classesRunning.toFixed(1));
    setText('o-ptclasses', ptClasses.toFixed(1));
    setText('o-profit', fmtM(profit), profit>=0 ? 'var(--color-text-success)' : 'var(--color-text-danger)');
    const viewLbl = view==='now' ? '(now)' : '(steady)';
    setText('lbl-active', viewLbl); setText('lbl-profit', viewLbl);

    const gEl=$('gap'); gEl.classList.remove('gap--good','gap--bad');
    const surplus = classSize - breakEven;
    if (breakEven>99){ gEl.textContent='Variable cost exceeds tuition per month — no class size is profitable.'; gEl.classList.add('gap--bad'); }
    else if (surplus>=0){ gEl.textContent='You fill '+classSize.toFixed(1)+' vs '+breakEven.toFixed(1)+' needed — '+surplus.toFixed(1)+' students of cushion above break-even.'; gEl.classList.add('gap--good'); }
    else { gEl.textContent='You fill '+classSize.toFixed(1)+' but need '+breakEven.toFixed(1)+' — short by '+Math.abs(surplus).toFixed(1)+'. Every class loses money.'; gEl.classList.add('gap--bad'); }

    const b=$('cap-badge'); b.classList.remove('badge--cap','badge--demand','badge--ok');
    if (capacityConstrained){ b.textContent='Capacity-constrained — '+Math.round(overflow)+' students can’t be seated; need '+classesNeeded.toFixed(0)+' classes but only '+rooms+' weekly slots ('+utilization.toFixed(1)+'×). Add slots or they go unserved.'; b.classList.add('badge--cap'); }
    else if (classSize < cap-0.05){ b.textContent='Demand-constrained — classes average '+classSize.toFixed(1)+' of '+cap+' cap; fill seats before adding slots. '+Math.round(utilization*100)+'% of slots in use.'; b.classList.add('badge--demand'); }
    else { b.textContent='Tight — classes near the cap and slots nearly full ('+Math.round(utilization*100)+'% of slots in use).'; b.classList.add('badge--ok'); }

    // FT sanity-check badge — spoken in teachers, with correct guidance
    const fb=$('ft-badge'); fb.classList.remove('badge--cap','badge--warn','badge--ok');
    if (ftClasses < 0.05){
      if (ftsal > 0){
        fb.textContent='All classes are part-time (PT% = 100), yet you’re still paying '+fmtM(ftsal)+' in full-time salary. Set FT salary to 0 to fully go part-time.';
        fb.classList.add('badge--warn');
      } else {
        fb.textContent='All classes part-time, no full-time salary — staffing is consistent.';
        fb.classList.add('badge--ok');
      }
    } else if (ftTeachersPaid - ftTeachersNeeded > ftTol){
      fb.textContent='Overstaffed on full-timers — '+fmtM(ftsal)+' funds ~'+ftTeachersPaid.toFixed(1)+' FT teachers, but only ~'+ftTeachersNeeded.toFixed(1)+' are needed for your '+ftClasses.toFixed(0)+' full-time classes. Cut FT salary, or give full-timers more classes (lower PT%).';
      fb.classList.add('badge--warn');
    } else if (ftTeachersNeeded - ftTeachersPaid > ftTol){
      fb.textContent='Understaffed on full-timers — your '+ftClasses.toFixed(0)+' full-time classes need ~'+ftTeachersNeeded.toFixed(1)+' teachers, but '+fmtM(ftsal)+' funds only ~'+ftTeachersPaid.toFixed(1)+'. Raise FT salary, or shift classes to part-time (raise PT%).';
      fb.classList.add('badge--cap');
    } else {
      fb.textContent='Full-time staffing looks right — ~'+ftTeachersPaid.toFixed(1)+' FT teachers fund your '+ftClasses.toFixed(0)+' full-time classes.';
      fb.classList.add('badge--ok');
    }

    setText('p-rev', fmtM(revenue));
    setText('p-rev-note', upsellRev>0 ? '(incl. '+fmtM(upsellRev)+' upsell)' : '');
    setText('p-var', '−'+fmtM(varCostTotal));
    setText('p-pt', '−'+fmtM(ptCostTotal));
    setText('p-room', '−'+fmtM(roomCostTotal));
    setText('p-ft', '−'+fmtM(ftsal));
    setText('p-mkt', '−'+fmtM(mkt));
    setText('p-oh', '−'+fmtM(fix));
    setText('p-profit', fmtM(profit), profit>=0 ? 'var(--color-text-success)' : 'var(--color-text-danger)');

    setText('ts-split', ptClasses.toFixed(1)+' / '+ftClasses.toFixed(1)+' of '+classesRunning.toFixed(1));
    setText('ts-hours', Math.round(hoursPerClassMonth)+' h');
    setText('ts-ptcostclass', fmtM1(ptCostPerClass));
    setText('ts-ptcost', fmtM(ptCostTotal));
    setText('ts-ftsal', fmtM(ftsal));

    setText('t-courses', avgCourses.toFixed(2));
    setText('t-dur', avgLifetime.toFixed(1)+' mo');
    setText('t-ltv', fmtM1(ltv));
    setText('t-cac', fmtM1(cac));
    setText('t-ratio', ratio.toFixed(1)+'×', ratio>=3 ? 'var(--color-text-success)' : (ratio>=1.5 ? 'var(--color-text-warning)' : 'var(--color-text-danger)'));

    setText('t-contrib', fmtM1(contribPerStudent)+' / mo');
    setText('t-mcc', fmtM1(marginalClassCost)+(roomsScarce?' (incl. opp.)':''));
    setText('t-mc', fmtM1(marginPerClass)+' / class', marginPerClass>=0 ? 'var(--color-text-success)' : 'var(--color-text-danger)');
    setText('t-ec', (effConv*100).toFixed(1)+'%');

    setText('t-uprev', fmtM(upsellRev));
    setText('t-util', Math.round(utilization*100)+'%', capacityConstrained ? 'var(--color-text-danger)' : 'var(--text)');

    setText('d-cash', fmtM(cashIn));
    setText('d-real', fmtM(recognized));
    setText('d-unearned', fmtM(unearned));

    saveState();
  }

  // ---------- persistence ----------
  // STABLE key — do NOT bump on model updates. loadState() merges saved values and
  // leaves any new/changed sliders at their HTML default, so updates never wipe a user's saved numbers.
  const STORAGE_KEY = 'ecm.state.v6';
  function saveState(){
    try{
      const s = { mode, intakeMonths, view, elastic:$('elastic').checked, scarce:$('scarce').checked, deferred:$('deferred').checked };
      sliderIds.forEach(id => s['s-'+id] = $('s-'+id).value);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }catch(e){}
  }
  function loadState(){
    let s; try{ s=JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){ s=null; }
    if (!s) return;
    sliderIds.forEach(id => { if (s['s-'+id]!==undefined) $('s-'+id).value = s['s-'+id]; });
    if (typeof s.elastic==='boolean') $('elastic').checked = s.elastic;
    if (typeof s.scarce==='boolean') $('scarce').checked = s.scarce;
    if (typeof s.deferred==='boolean'){ $('deferred').checked = s.deferred; $('deferred-panel').hidden = !s.deferred; }
    if (s.mode) applyMode(s.mode);
    if (s.intakeMonths) applyIntake(s.intakeMonths);
    if (s.view) applyView(s.view);
  }

  function applyView(v){
    view = v;
    [...$('seg-view').children].forEach(c => c.classList.toggle('on', c.dataset.view===v));
    $('view-hint').textContent = v==='now'
      ? 'Snapshot of the students enrolled this month — a fixed photo. Funnel levers (marketing, CPL, conversion, wait) reshape the Steady view and the chart, not students already in class.'
      : 'Long-run level your funnel & retention sustain — every lever flows through to this P&L. The current-students slider only sets where the chart starts.';
  }

  function applyMode(m){
    mode = m;
    [...$('seg-mode').children].forEach(c => c.classList.toggle('on', c.dataset.mode===m));
    const rolling = m==='rolling';
    $('intake-block').classList.toggle('disabled', rolling);
    $('mode-hint').textContent = rolling
      ? 'Students join an ongoing class as they arrive; no wait-based abandonment. Intake is continuous, so the interval no longer applies.'
      : 'Classes start, run, and end together. Students pool over the wait window, then a cohort launches.';
  }
  function applyIntake(n){
    intakeMonths = +n;
    [...$('seg-intake').children].forEach(c => c.classList.toggle('on', +c.dataset.intake===intakeMonths));
  }

  // ---------- wiring ----------
  sliderIds.forEach(id => $('s-'+id).addEventListener('input', compute));
  $('elastic').addEventListener('change', compute);
  $('scarce').addEventListener('change', compute);
  $('seg-view').addEventListener('click', e => { const btn=e.target.closest('button'); if(!btn) return; applyView(btn.dataset.view); compute(); });
  $('seg-mode').addEventListener('click', e => { const btn=e.target.closest('button'); if(!btn) return; applyMode(btn.dataset.mode); compute(); });
  $('seg-intake').addEventListener('click', e => { const btn=e.target.closest('button'); if(!btn) return; if($('intake-block').classList.contains('disabled')) return; applyIntake(btn.dataset.intake); compute(); });
  $('deferred').addEventListener('change', e => { $('deferred-panel').hidden = !e.target.checked; saveState(); });

  // ---------- save / reset buttons ----------
  function flash(btn, msg){
    if (btn.dataset.label===undefined) btn.dataset.label = btn.textContent;
    btn.textContent = msg; btn.classList.add('btn-flash');
    clearTimeout(btn._t);
    btn._t = setTimeout(()=>{ btn.textContent = btn.dataset.label; btn.classList.remove('btn-flash'); }, 1300);
  }
  $('btn-save').addEventListener('click', ()=>{ saveState(); flash($('btn-save'),'Saved ✓'); });
  $('btn-reset').addEventListener('click', ()=>{
    sliderIds.forEach(id => { const el=$('s-'+id); el.value = el.defaultValue; });
    $('elastic').checked  = $('elastic').defaultChecked;
    $('scarce').checked   = $('scarce').defaultChecked;
    $('deferred').checked = $('deferred').defaultChecked; $('deferred-panel').hidden = !$('deferred').checked;
    applyMode('cohort'); applyIntake(1); applyView('steady');
    compute();                       // recomputes and auto-saves the defaults
    flash($('btn-reset'),'Reset ✓');
  });

  loadState();
  compute();
})();
