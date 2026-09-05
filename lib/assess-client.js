(function () {
  'use strict';
  var DATA = JSON.parse(document.getElementById('assess-data').textContent);
  var SPOKES = DATA.spokes;
  var QUESTIONS = DATA.questions;
  var params = new URLSearchParams(window.location.search);
  var team = (params.get('t') || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 24);
  var prev = params.get('p') || '';
  if (!/^[0-5]{7}$/.test(prev)) prev = '';
  var state = { answers: new Array(QUESTIONS.length).fill(null), i: 0 };

  var el = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

  function spokeByKey(key) {
    for (var k = 0; k < SPOKES.length; k += 1) if (SPOKES[k].key === key) return SPOKES[k];
    return null;
  }
  function scoreFor(key) {
    for (var k = 0; k < QUESTIONS.length; k += 1) if (QUESTIONS[k].spoke === key) return state.answers[k];
    return null;
  }
  function tagScore(tag) {
    for (var k = 0; k < QUESTIONS.length; k += 1) if (QUESTIONS[k].tag === tag) return state.answers[k];
    return null;
  }

  // ---------------------------------------------------------------- questions
  function renderTiles() {
    var tiles = el('tiles').children;
    var q = QUESTIONS[state.i];
    var mapped = 0;
    for (var k = 0; k < tiles.length; k += 1) {
      var key = tiles[k].getAttribute('data-key');
      var score = scoreFor(key);
      tiles[k].className = '';
      tiles[k].firstChild.style.height = '0%';
      if (score === 0) { tiles[k].className = 'hollow'; mapped += 1; }
      else if (score !== null) { tiles[k].className = 'on'; tiles[k].firstChild.style.height = (score * 20) + '%'; mapped += 1; }
      if (q && q.spoke === key) tiles[k].className += ' now';
    }
    var conn = 0;
    for (var j = 0; j < QUESTIONS.length; j += 1) if (QUESTIONS[j].spoke === null && state.answers[j] !== null) conn += 1;
    var dots = el('conn').getElementsByTagName('b');
    for (var d = 0; d < dots.length; d += 1) dots[d].className = d < conn ? 'on' : '';
    el('conn').getElementsByTagName('span')[0].textContent = conn + ' of 3 connective questions';
    el('spokes-cap').textContent = mapped === 0 ? 'Seven ways, nothing mapped yet.' : mapped === 7 ? 'Seven ways, all mapped.' : 'Seven ways, ' + mapped + ' mapped.';
  }

  function renderQuestion() {
    var q = QUESTIONS[state.i];
    el('qcount').textContent = 'Question ' + q.n + ' of ' + QUESTIONS.length;
    el('qback').disabled = state.i === 0;
    var spoke = q.spoke ? spokeByKey(q.spoke) : null;
    el('qspoke').textContent = spoke ? 'Way of working: ' + spoke.label : 'Connective question';
    el('qstatement').textContent = '“' + q.statement + '”';
    var html = '';
    for (var k = 0; k < DATA.scale.length; k += 1) {
      var value = DATA.scale[k][0];
      var label = DATA.scale[k][1];
      var chosen = state.answers[state.i] === value ? ' chosen' : '';
      html += '<li' + (value === 0 ? ' class="dk"' : '') + '><button type="button" class="ans' + chosen + '" data-value="' + value + '"><span class="k">' + (value === 0 ? '' : value + ' ·') + '</span>' + esc(label) + '</button></li>';
    }
    el('answers').innerHTML = html;
    renderTiles();
  }

  function answer(value) {
    state.answers[state.i] = value;
    if (state.i < QUESTIONS.length - 1) {
      state.i += 1;
      renderQuestion();
      return;
    }
    showResult();
  }

  el('answers').addEventListener('click', function (event) {
    var button = event.target.closest('button.ans');
    if (!button) return;
    answer(parseInt(button.getAttribute('data-value'), 10));
  });
  el('qback').addEventListener('click', function () {
    if (state.i === 0) return;
    state.i -= 1;
    renderQuestion();
  });

  // ---------------------------------------------------------------- scoring
  function encode() {
    var s = '';
    var c = '';
    for (var k = 0; k < QUESTIONS.length; k += 1) {
      if (QUESTIONS[k].spoke !== null) s += state.answers[k];
      else c += state.answers[k];
    }
    return { s: s, c: c };
  }

  function decode(s, c) {
    var si = 0;
    var ci = 0;
    for (var k = 0; k < QUESTIONS.length; k += 1) {
      if (QUESTIONS[k].spoke !== null) state.answers[k] = parseInt(s.charAt(si++), 10);
      else state.answers[k] = parseInt(c.charAt(ci++), 10);
    }
  }

  function analyse() {
    var known = [];
    var unmet = [];
    for (var k = 0; k < SPOKES.length; k += 1) {
      var score = scoreFor(SPOKES[k].key);
      if (score === 0) unmet.push(SPOKES[k]);
      else known.push({ spoke: SPOKES[k], score: score });
    }
    var strongest = null;
    var edge = null;
    for (var j = 0; j < known.length; j += 1) {
      if (!strongest || known[j].score > strongest.score) strongest = known[j];
      if (!edge || known[j].score < edge.score) edge = known[j];
    }
    var heavyKeys = ['context', 'tools', 'delegation', 'automation'];
    var heavySum = 0;
    for (var h = 0; h < heavyKeys.length; h += 1) heavySum += scoreFor(heavyKeys[h]) || 0;
    var chat = scoreFor('chat') || 0;
    var othersQuiet = true;
    for (var o = 0; o < SPOKES.length; o += 1) {
      if (SPOKES[o].key === 'chat') continue;
      if ((scoreFor(SPOKES[o].key) || 0) > 2) othersQuiet = false;
    }
    var blocked = tagScore('blocked') || 0;
    var place;
    if (heavySum / heavyKeys.length >= 3.5) place = 5;
    else if (chat >= 3 && othersQuiet) place = 1;
    else if (blocked >= 4) place = 4;
    else if (unmet.length >= 3) place = 3;
    else place = 2;

    // three guides: the growth edge, the first unmet way (or the second-thinnest), the strength
    var picks = [];
    var seen = {};
    function pick(spoke, tag) {
      if (!spoke || seen[spoke.key]) return;
      seen[spoke.key] = true;
      picks.push({ spoke: spoke, tag: tag });
    }
    if (edge) pick(edge.spoke, 'Fill the gap');
    if (unmet.length) pick(unmet[0], 'Not yet met');
    var byScore = known.slice().sort(function (a, b) { return a.score - b.score; });
    for (var b = 0; b < byScore.length && picks.length < 2; b += 1) pick(byScore[b].spoke, 'Thin, worth a look');
    if (strongest) pick(strongest.spoke, 'Deepen the strength');
    for (var u = 0; u < unmet.length && picks.length < 3; u += 1) pick(unmet[u], 'Not yet met');
    for (var b2 = 0; b2 < byScore.length && picks.length < 3; b2 += 1) pick(byScore[b2].spoke, 'Thin, worth a look');
    picks = picks.slice(0, 3);

    return { known: known, unmet: unmet, strongest: strongest, edge: edge, place: place, picks: picks };
  }

  // ---------------------------------------------------------------- chart
  function polygonPoints(scores, cx, cy, r) {
    var pts = [];
    for (var k = 0; k < SPOKES.length; k += 1) {
      var a = -Math.PI / 2 + (k * 2 * Math.PI) / SPOKES.length;
      var v = (scores[k] || 0) / 5;
      pts.push((cx + Math.cos(a) * r * v).toFixed(1) + ',' + (cy + Math.sin(a) * r * v).toFixed(1));
    }
    return pts.join(' ');
  }

  function drawChart(a) {
    var svg = el('chart');
    var cx = 260;
    var cy = 236;
    var r = 150;
    var out = '';
    for (var ring = 1; ring <= 5; ring += 1) {
      var rp = [];
      for (var k = 0; k < SPOKES.length; k += 1) {
        var ang = -Math.PI / 2 + (k * 2 * Math.PI) / SPOKES.length;
        rp.push((cx + Math.cos(ang) * r * ring / 5).toFixed(1) + ',' + (cy + Math.sin(ang) * r * ring / 5).toFixed(1));
      }
      out += '<polygon class="ring" points="' + rp.join(' ') + '"/>';
    }
    var scores = [];
    for (var s = 0; s < SPOKES.length; s += 1) {
      var sc = scoreFor(SPOKES[s].key);
      scores.push(sc);
      var an = -Math.PI / 2 + (s * 2 * Math.PI) / SPOKES.length;
      var x2 = cx + Math.cos(an) * r;
      var y2 = cy + Math.sin(an) * r;
      out += '<line class="axis' + (sc === 0 ? ' hollow' : '') + '" x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
    }
    if (prev) {
      var prevScores = [];
      for (var p = 0; p < prev.length; p += 1) prevScores.push(parseInt(prev.charAt(p), 10));
      out += '<polygon class="prev" points="' + polygonPoints(prevScores, cx, cy, r) + '"/>';
    }
    out += '<polygon class="shape" points="' + polygonPoints(scores, cx, cy, r) + '"/>';
    for (var d = 0; d < SPOKES.length; d += 1) {
      var ad = -Math.PI / 2 + (d * 2 * Math.PI) / SPOKES.length;
      var v = (scores[d] || 0) / 5;
      var dx = cx + Math.cos(ad) * r * v;
      var dy = cy + Math.sin(ad) * r * v;
      if (scores[d] === 0) out += '<circle class="hollow-dot" cx="' + (cx + Math.cos(ad) * r).toFixed(1) + '" cy="' + (cy + Math.sin(ad) * r).toFixed(1) + '" r="7"/>';
      else out += '<circle class="dot" cx="' + dx.toFixed(1) + '" cy="' + dy.toFixed(1) + '" r="5"/>';
      var lx = cx + Math.cos(ad) * (r + 30);
      var ly = cy + Math.sin(ad) * (r + 30);
      var anchor = Math.abs(Math.cos(ad)) < 0.2 ? 'middle' : Math.cos(ad) > 0 ? 'start' : 'end';
      var cls = 'lbl';
      if (a.strongest && a.strongest.spoke.key === SPOKES[d].key) cls += ' strong';
      else if (a.edge && a.edge.spoke.key === SPOKES[d].key) cls += ' edge';
      out += '<text class="' + cls + '" x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="' + anchor + '">' + esc(SPOKES[d].label) + '</text>';
    }
    svg.innerHTML = '<title>Your seven ways, drawn as a chart</title>' + out;
    el('chart-key').textContent = (a.unmet.length ? 'Dashed spokes with a hollow dot are ways you have not met yet. ' : '') + (prev ? 'The dotted outline is your earlier result.' : 'Rings are 1 to 5, centre to edge.');
  }

  // ---------------------------------------------------------------- result
  function showResult() {
    var a = analyse();
    var code = encode();
    var shareUrl = window.location.origin + window.location.pathname + '?s=' + code.s + '&c=' + code.c + (team ? '&t=' + team : '');
    var retakeUrl = window.location.pathname + '?p=' + code.s + (team ? '&t=' + team : '');
    var emailUrl = DATA.formUrl + (DATA.formUrl.indexOf('?') === -1 ? '?' : '&') + 'scores=' + code.s + code.c + '&team=' + encodeURIComponent(team) + '&share=' + encodeURIComponent(shareUrl);
    var place = DATA.places[a.place - 1];
    var html = '';
    html += '<p class="legend">Your result</p>';
    html += '<div class="res-two">';
    html += '<div><span class="label">Strongest way</span>' + (a.strongest ? '<h2 class="strong">' + esc(a.strongest.spoke.label) + '</h2><p>' + esc(a.strongest.spoke.strong) + '</p>' : '<h2 class="strong">None yet</h2><p>Every way is new to you. That is a clear starting point, not a bad result.</p>') + '</div>';
    html += '<div><span class="label">Growth edge</span>' + (a.edge ? '<h2 class="edge">' + esc(a.edge.spoke.label) + '</h2><p>' + esc(a.edge.spoke.edge) + '</p>' : '<h2 class="edge">' + esc(SPOKES[0].label) + '</h2><p>' + esc(SPOKES[0].edge) + '</p>') + '</div>';
    html += '</div>';
    if (a.unmet.length) {
      html += '<div class="res-block"><span class="label">Not met yet</span><ul class="unmet">';
      for (var u = 0; u < a.unmet.length; u += 1) html += '<li>' + esc(a.unmet[u].label) + '</li>';
      html += '</ul><p class="qfoot">' + esc(a.unmet[0].unmet) + '</p></div>';
    }
    html += '<div class="res-block"><span class="label">Your likely starting point on the route</span><div class="res-place"><span class="disc-sm" aria-hidden="true">' + place.n + '</span><div><h3>' + esc(place.title) + '</h3><p>' + esc(place.because) + '</p><p class="tiny">A guess from ten answers, not a diagnosis. <a href="../#map">See the five starting points</a>.</p></div></div></div>';
    html += '<div class="res-block"><span class="label">Three things to read</span><ul class="res-guides">';
    for (var g = 0; g < a.picks.length; g += 1) {
      var guide = a.picks[g].spoke.guide;
      html += '<li><span class="tag">' + esc(a.picks[g].tag) + ' · ' + esc(a.picks[g].spoke.label) + '</span><a href="' + esc(guide.href) + '"' + (guide.local ? '' : ' rel="noopener"') + '>' + esc(guide.title) + (guide.local ? ' →' : ' ↗') + '</a><span class="why">' + esc(guide.why) + '</span></li>';
    }
    html += '</ul></div>';
    var notes = [];
    var support = tagScore('support');
    var shared = tagScore('shared');
    if (support !== null && support !== 0) notes.push(support <= 2 ? DATA.notes.support.low : support >= 4 ? DATA.notes.support.high : '');
    if (shared !== null && shared !== 0) notes.push(shared <= 2 ? DATA.notes.shared.low : shared >= 4 ? DATA.notes.shared.high : '');
    notes = notes.filter(Boolean);
    if (notes.length) {
      html += '<div class="res-block"><span class="label">Two notes</span><ul class="res-notes">';
      for (var n = 0; n < notes.length; n += 1) html += '<li>' + esc(notes[n]) + '</li>';
      html += '</ul></div>';
    }
    html += '<div class="res-block"><span class="label">Keep this result</span><div class="share-row"><input type="text" id="share" readonly value="' + esc(shareUrl) + '" aria-label="Link to this result"><button type="button" id="copy">Copy link</button></div><p class="qfoot">The link holds your answers. Nothing is stored anywhere else.</p></div>';
    html += '<div class="res-block res-email"><span class="label">Send it to yourself</span><p>One email now with this chart and the three guides, one more in two weeks asking whether the growth edge moved. Sent by Alexander Large, who maintains this page. Nothing else, ever.</p><p><a class="cta" href="' + esc(emailUrl) + '" rel="noopener">Email me this result &rarr;</a></p>' + (team ? '<p class="team-line">Team code ' + esc(team) + ': your result is counted for your team when you send it.</p>' : '') + '</div>';
    html += '<p class="retake"><a href="' + esc(retakeUrl) + '">Retake in two weeks and compare &rarr;</a></p>';
    el('result').innerHTML = html;
    el('qcard').className = 'qcard hidden';
    el('result').className = 'result';
    el('spokes').className = 'spokes hidden';
    el('chart-wrap').className = 'chart-wrap';
    el('res-people').className = 'res-people';
    drawChart(a);
    var copy = el('copy');
    copy.addEventListener('click', function () {
      var input = el('share');
      input.select();
      var done = function () { copy.textContent = 'Copied'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(input.value).then(done, done);
      else { try { document.execCommand('copy'); } catch (e) { /* the text stays selected */ } done(); }
    });
    if (window.history && window.history.replaceState) window.history.replaceState(null, '', shareUrl);
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------- start
  var s = params.get('s') || '';
  var c = params.get('c') || '';
  if (/^[0-5]{7}$/.test(s) && /^[0-5]{3}$/.test(c)) {
    decode(s, c);
    showResult();
  } else {
    renderQuestion();
  }
})();
