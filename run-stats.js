(() => {
  'use strict';
  const live = /^\/r\/[a-f0-9]{48}\/$/.test(location.pathname) && location.hostname === '127.0.0.1';
  let openedAt = performance.timeOrigin, finishedElapsed = null, latestSeq = 0, disconnected = false, retired = false;
  let usage = null, verified = 0, status = 'waiting', eventSource;
  const questions = [], longTasks = [];
  const cells = name => document.querySelectorAll(`[data-stat="${name}"]`);
  const write = (name, text) => cells(name).forEach(cell => { if (cell.textContent !== text) cell.textContent = text; });
  const elapsed = () => finishedElapsed ?? Math.max(0, Date.now() - openedAt);
  const formatTime = ms => `${(ms / 1000).toFixed(1)} s`;
  function draw() {
    write('elapsed', formatTime(elapsed()));
    write('tokens', usage ? `${usage.missingUsage ? '≥ ' : ''}${usage.totalTokens.toLocaleString('en-US')}` : '—');
    write('token-detail', usage ? `${usage.inputTokens.toLocaleString('en-US')} in · ${usage.outputTokens.toLocaleString('en-US')} out` : 'Jev input + output');
    write('cost', usage && usage.costComplete ? `$${usage.costUsd.toFixed(6)}` : '—');
    const note = document.getElementById('usage-status');
    if (note) note.textContent = retired ? 'New manual pass — Jev usage is not connected.' : !live ? 'Open through Violoop to connect Jev usage.' : disconnected ? 'Usage connection interrupted — figures may be incomplete.' : usage?.missingUsage || (usage && !usage.costComplete) ? 'Usage or pricing incomplete — cost is unavailable.' : status === 'completed' ? `${verified}/30 answers verified · ${usage?.responses || 0} Jev responses accounted for.` : status === 'failed' ? 'Run stopped before verification completed.' : finishedElapsed !== null ? 'Finalizing verified usage…' : 'Receiving Jev usage after each request.';
  }
  const send = body => {
    if (!live || retired) return;
    fetch('./measurement', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:true}).catch(() => {});
  };
  function apply(snapshot) {
    if (retired || !snapshot || snapshot.seq < latestSeq) return;
    latestSeq = snapshot.seq;
    if (Number.isFinite(snapshot.openedAt)) openedAt = snapshot.openedAt;
    if (snapshot.usage) usage = snapshot.usage;
    status = snapshot.status; verified = snapshot.verified || 0;
    if (Number.isFinite(snapshot.measurement?.elapsedMs)) finishedElapsed = snapshot.measurement.elapsedMs;
    draw();
  }
  window.addEventListener('profile:question', event => {
    const number = event.detail?.number;
    if (Number.isInteger(number) && questions.length < 100) questions.push({number,elapsedMs:Math.round(elapsed())});
  });
  window.addEventListener('profile:complete', event => {
    finishedElapsed = elapsed();
    document.querySelector('.shell').classList.add('is-complete');
    send({phase:'complete',elapsedMs:finishedElapsed,receipt:event.detail?.receipt,questions,longTasks});
    draw();
  });
  window.addEventListener('profile:restart', () => {
    retired = true; eventSource?.close(); usage = null; status = 'waiting'; openedAt = Date.now(); finishedElapsed = null; questions.length = 0; longTasks.length = 0;
    document.querySelector('.shell').classList.remove('is-complete');
    draw();
  });
  try { new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (finishedElapsed === null && longTasks.length < 100) longTasks.push({startMs:Math.round(entry.startTime),durationMs:Math.round(entry.duration)});
  }).observe({type:'longtask',buffered:true}); } catch {}
  if (live) {
    eventSource = new EventSource('./events');
    eventSource.addEventListener('snapshot', event => { try { disconnected = false; apply(JSON.parse(event.data)); } catch {} });
    eventSource.onerror = () => { disconnected = true; draw(); };
    eventSource.onopen = () => { disconnected = false; draw(); };
    send({phase:'ready',navigationStartedAt:performance.timeOrigin});
  }
  draw();
  const ticker = setInterval(() => { if (finishedElapsed === null) write('elapsed', formatTime(elapsed())); }, 100);
  window.addEventListener('pagehide', () => { clearInterval(ticker); eventSource?.close(); }, {once:true});
})();
