export function calculatePSG(raw, options = {}) {
  const records = name => raw[name].slice(1).map(row => Object.fromEntries(raw[name][0].map((key,i) => [key,row[i]])));
  const count = (rows, test) => rows.filter(test).length;
  const sum = (rows, field) => rows.reduce((total,row) => total + Number(row[field]),0);
  const ratio = (a,b) => b ? a/b : null;
  const median = values => { const x=values.slice().sort((a,b)=>a-b); return x.length ? (x[Math.floor((x.length-1)/2)]+x[Math.floor(x.length/2)])/2 : null; };
  const stamp = value => typeof value === 'string' ? Date.parse(value.endsWith('Z') ? value : value+'Z') : NaN;
  const round = value => Math.round(value*1e6)/1e6;
  const notes = Object.fromEntries(raw['Data Notes'].slice(1));
  // Parse the workbook's explicit English date without browser-specific parsing.
  // UTC is an arithmetic convention here, not a claim about the source timezone.
  const dateParts = String(notes['Snapshot time']).match(/^(\w+) (\d{1,2}), (\d{4}), (\d{2}):(\d{2})$/);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (!dateParts || !months.includes(dateParts[1])) throw new Error('Unrecognized assessment snapshot time');
  const baseline = Date.UTC(Number(dateParts[3]), months.indexOf(dateParts[1]), Number(dateParts[2]), Number(dateParts[4]), Number(dateParts[5]));
  const advanceHours = Math.min(24,Math.max(0,Number(options.advanceHours)||0));
  const restoreShare = Math.min(1,Math.max(0,Number(options.restoreShare)||0));
  const snapshot=baseline+advanceHours*3600000;
  const targets = Object.fromEntries(raw['SLA Targets'].slice(1).map(r=>[r[0],r[1]]));
  const mapping = Object.fromEntries(raw['Topic Mapping'].slice(1));
  const reviewable = ['Missing Troubleshooting','Wrong Topic','Knowledge Gap'];
  const cases=records('Open Cases').map((c,i)=>{
    const created=stamp(c['Created On']), action=stamp(c['Last Action']);
    const age=round((snapshot-created)/3600000), target=targets[c.Priority];
    const valid=Number.isFinite(age)&&age>=0&&Number.isFinite(target)&&target>0;
    const idle=Number.isFinite(action)?round((snapshot-action)/3600000):null;
    const anomaly=!Number.isFinite(created)||!Number.isFinite(action)||action<created||action>baseline||created>baseline;
    const remaining=valid?round(target-age):null;
    return {id:c['Case ID'],row:i+2,bundle:c.Bundle,topic:c.Topic,source:c['Escalation Source']||'Unknown',location:c['Source Location'],reason:c['Escalation Reason'],priority:c.Priority,owner:c['Current Owner'],handovers:c.Handovers,age,target,remaining,idle,valid,breach:valid?age>target:null,due12:valid&&remaining>=0&&remaining<=12,due4:valid&&remaining>=0&&remaining<=4,unassigned:!c['Current Owner']||c['Current Owner']==='Unassigned',reviewable:reviewable.includes(c['Escalation Reason']),anomaly,mappingMismatch:mapping[c.Topic]!==c.Bundle,ageMismatch:Math.abs(round((baseline-created)/3600000)-c['Age (hrs)'])>1e-6,targetMismatch:target!==c['SLA Target (hrs)'],flagMismatch:Number.isFinite(target)&&((baseline-created)/3600000>target)!==(c['SLA Breached']==='Yes')};
  });
  const traffic=records('Traffic & Capacity').map(r=>({...r,net:r.Incoming-r.Handled,gap:r['Scheduled PSS Hours']-r['Actual PSS Hours'],rate:ratio(r.Handled,r['Actual PSS Hours']),residual:r['Closing Backlog']-r['Opening Backlog']-r.Incoming+r.Handled}));
  const weekNames=[...new Set(traffic.map(r=>r.Week))];
  const weeks=weekNames.map(name=>{const rows=traffic.filter(r=>r.Week===name);return {name,incoming:sum(rows,'Incoming'),handled:sum(rows,'Handled'),opening:sum(rows,'Opening Backlog'),closing:sum(rows,'Closing Backlog'),net:sum(rows,'net'),scheduled:sum(rows,'Scheduled PSS Hours'),actual:sum(rows,'Actual PSS Hours'),gap:sum(rows,'gap')};});
  const latest=weeks.at(-1), first=weeks[0], totalGrowth=latest.closing-first.opening;
  const bundles=[...new Set(traffic.map(r=>r.Bundle))].map(bundle=>{
    const rows=traffic.filter(r=>r.Bundle===bundle), initial=rows.find(r=>r.Week===weekNames[0]),last=rows.find(r=>r.Week===weekNames.at(-1));
    const recoverable=Math.max(0,last.gap)*last.rate*restoreShare;
    return {bundle,opening:initial['Opening Backlog'],closing:last['Closing Backlog'],growth:last['Closing Backlog']-initial['Opening Backlog'],latestNet:last.net,incoming:last.Incoming,handled:last.Handled,missingHours:last.gap,recoverable,scenarioNet:last.net-recoverable};
  }).sort((a,b)=>b.growth-a.growth);
  const groups = key => [...new Set(cases.map(c=>c[key]))].map(name=>{
    const rows=cases.filter(c=>c[key]===name), valid=rows.filter(c=>c.valid),aged=valid.map(c=>c.age);
    return {name,n:rows.length,valid:valid.length,breached:count(valid,c=>c.breach),breachRate:ratio(count(valid,c=>c.breach),valid.length),due12:count(rows,c=>c.due12),reviewable:count(rows,c=>c.reviewable),unassigned:count(rows,c=>c.unassigned),meanAge:ratio(aged.reduce((a,b)=>a+b,0),aged.length),medianAge:median(aged),meanHandovers:ratio(sum(rows,'handovers'),rows.length),threePlus:count(rows,c=>c.handovers>=3)};
  }).sort((a,b)=>b.n-a.n);
  const priorities=groups('priority').sort((a,b)=>['P1','P2','Non-P'].indexOf(a.name)-['P1','P2','Non-P'].indexOf(b.name));
  const topics=groups('topic');
  const actionable=cases.filter(c=>c.valid&&(c.priority==='P1'||c.unassigned&&c.breach));
  // Deterministic triage order, no fitted or arbitrarily weighted score.
  const rank=c=>c.priority==='P1'?0:1;
  actionable.sort((a,b)=>rank(a)-rank(b)||a.remaining-b.remaining||Number(b.unassigned)-Number(a.unassigned)||a.id.localeCompare(b.id));
  const continuity=traffic.filter(r=>{
    const i=weekNames.indexOf(r.Week);if(!i)return false;
    const previous=traffic.find(p=>p.Bundle===r.Bundle&&p.Week===weekNames[i-1]);
    return !previous||previous['Closing Backlog']!==r['Opening Backlog'];
  });
  const duplicateCount=values=>values.length-new Set(values).size;
  const valid=cases.filter(c=>c.valid), high=cases.filter(c=>c.handovers>=3),low=cases.filter(c=>c.handovers<3);
  const extra=bundles.reduce((n,b)=>n+b.recoverable,0);
  const fullRecoveryHandled=traffic.filter(r=>r.Week===weekNames.at(-1)).reduce((total,r)=>total+Math.max(0,r.gap)*r.rate,0);
  return {advanceHours,restoreShare,baseline,snapshot,notes,caseCount:cases.length,assessable:valid.length,breached:count(valid,c=>c.breach),due12:count(cases,c=>c.due12),due4:count(cases,c=>c.due4),unassigned:count(cases,c=>c.unassigned),unassignedBreached:count(cases,c=>c.unassigned&&c.breach),stale24:count(cases,c=>!c.anomaly&&c.idle>=24),weeks,bundles,first,latest,totalGrowth,growthRate:ratio(totalGrowth,first.opening),incomingGrowth:latest.incoming/first.incoming-1,handledGrowth:latest.handled/first.handled-1,hoursGrowth:latest.actual/first.actual-1,extraHandled:extra,fullRecoveryHandled,scenarioNet:latest.net-extra,sources:groups('source'),reasons:groups('reason'),priorities,topics,cases,actionable,reviewable:count(cases,c=>c.reviewable),handovers:{highN:high.length,lowN:low.length,highRate:ratio(count(high,c=>c.breach),high.length),lowRate:ratio(count(low,c=>c.breach),low.length)},checks:{duplicateIds:duplicateCount(cases.map(c=>c.id)),duplicateTopics:duplicateCount(raw['Topic Mapping'].slice(1).map(r=>r[0])),duplicatePriorities:duplicateCount(raw['SLA Targets'].slice(1).map(r=>r[0])),invalidSLA:cases.length-valid.length,ageMismatches:count(cases,c=>c.ageMismatch),targetMismatches:count(cases,c=>c.targetMismatch),flagMismatches:count(cases,c=>c.flagMismatch),mappingMismatches:count(cases,c=>c.mappingMismatch),timestampAnomalies:cases.filter(c=>c.anomaly).map(c=>c.id),missingSource:count(cases,c=>c.source==='Unknown'),flowMismatches:count(traffic,r=>r.residual!==0),continuityMismatches:continuity.length,scopeGap:latest.closing-cases.length},tabCounts:Object.entries(raw).map(([name,rows])=>({name,rows:rows.length-1}))};
}
