(function () {
  'use strict';
  var DATA = JSON.parse(document.getElementById('assess-data').textContent);
  var SPOKES = DATA.spokes;
  var QUESTIONS = DATA.questions;
  var ORG = DATA.kind === 'org';
  var params = new URLSearchParams(window.location.search);
  var team = (params.get('t') || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 24);
  var prev = params.get('p') || '';
  if (!/^[0-5]{7}$/.test(prev)) prev = '';
  var state = { answers: new Array(QUESTIONS.length).fill(null), notes: new Array(QUESTIONS.length).fill(''), i: 0 };
  var el = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

  function spokeByKey(key) {
    for (var k = 0; k < SPOKES.length; k += 1) if (SPOKES[k].key === key) return SPOKES[k];
    return null;
  }
  function questionFor(key) {
    for (var k = 0; k < QUESTIONS.length; k += 1) if (QUESTIONS[k].spoke === key) return QUESTIONS[k];
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
    var noun = ORG ? 'conditions' : 'ways';
    el('spokes-cap').textContent = mapped === 0 ? 'Seven ' + noun + ', nothing mapped yet.' : mapped === 7 ? 'Seven ' + noun + ', all mapped.' : 'Seven ' + noun + ', ' + mapped + ' mapped.';
  }

  function renderQuestion() {
    var q = QUESTIONS[state.i];
    el('qcount').textContent = 'Question ' + q.n + ' of ' + QUESTIONS.length;
    el('qback').disabled = state.i === 0;
    var spoke = q.spoke ? spokeByKey(q.spoke) : null;
    el('qspoke').textContent = spoke ? (ORG ? 'Condition: ' : 'Way of working: ') + spoke.label : 'Connective question';
    el('qstatement').textContent = ORG ? q.statement : '“' + q.statement + '”';
    var scale = q.answers.slice();
    if (q.notSureFirst) scale.sort(function (a, b) { return a[0] === 0 ? -1 : b[0] === 0 ? 1 : 0; });
    var html = '';
    for (var k = 0; k < scale.length; k += 1) {
      var value = scale[k][0];
      var chosen = state.answers[state.i] === value ? ' chosen' : '';
      var key = spoke && value !== 0 ? value + ' ·' : '';
      html += '<li' + (value === 0 ? ' class="dk"' : '') + '><button type="button" class="ans' + chosen + '" data-value="' + value + '"><span class="k">' + key + '</span>' + esc(scale[k][1]) + '</button></li>';
    }
    el('answers').innerHTML = html;
    var rule = el('tie-rule');
    if (ORG && q.answerKind === 'document') {
      rule.textContent = 'Pick the lowest rung that is true.';
      rule.className = 'qfoot';
    } else if (ORG && q.answerKind === 'staged') {
      rule.textContent = 'Pick the highest rung that is true.';
      rule.className = 'qfoot';
    } else rule.className = 'qfoot hidden';
    var note = el('question-note');
    if (q.note) {
      note.textContent = q.note;
      note.className = 'qfoot';
    } else note.className = 'qfoot hidden';
    el('context-label').textContent = q.freeText ? 'Optional context · ' + q.freeText : 'Optional context';
    el('context-input').value = state.notes[state.i];
    el('context-input').placeholder = q.freeText ? 'Name it if useful' : 'Add a note if useful';
    renderTiles();
  }

  function advance() {
    if (state.i < QUESTIONS.length - 1) {
      state.i += 1;
      renderQuestion();
    } else showResult();
  }
  function answer(value) {
    state.answers[state.i] = value;
    advance();
  }
  el('qcard').addEventListener('click', function (event) {
    var button = event.target.closest('button.ans');
    if (button) {
      answer(parseInt(button.getAttribute('data-value'), 10));
      return;
    }
  });
  el('context-input').addEventListener('input', function () {
    state.notes[state.i] = el('context-input').value.slice(0, 240);
  });
  el('qback').addEventListener('click', function () {
    if (state.i === 0) return;
    state.i -= 1;
    renderQuestion();
  });

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

  function baseAnalysis() {
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
    return { known: known, unmet: unmet, strongest: strongest, edge: edge };
  }

  function picksFor(a, unmetTag) {
    var picks = [];
    var seen = {};
    function pick(spoke, tag) {
      if (!spoke || seen[spoke.key]) return;
      seen[spoke.key] = true;
      picks.push({ spoke: spoke, tag: tag });
    }
    if (a.edge) pick(a.edge.spoke, 'Fill the gap');
    if (a.unmet.length) pick(a.unmet[0], unmetTag);
    var byScore = a.known.slice().sort(function (x, y) { return x.score - y.score; });
    for (var b = 0; b < byScore.length && picks.length < 2; b += 1) pick(byScore[b].spoke, 'Thin, worth a look');
    if (a.strongest) pick(a.strongest.spoke, 'Deepen the strength');
    for (var u = 0; u < a.unmet.length && picks.length < 3; u += 1) pick(a.unmet[u], unmetTag);
    for (var b2 = 0; b2 < byScore.length && picks.length < 3; b2 += 1) pick(byScore[b2].spoke, 'Thin, worth a look');
    return picks.slice(0, 3);
  }

  function analyseIndividual() {
    var a = baseAnalysis();
    var heavyKeys = ['context', 'tools', 'delegation', 'automation'];
    var heavySum = 0;
    for (var h = 0; h < heavyKeys.length; h += 1) heavySum += scoreFor(heavyKeys[h]) || 0;
    var chat = scoreFor('chat') || 0;
    var othersQuiet = true;
    for (var o = 0; o < SPOKES.length; o += 1) if (SPOKES[o].key !== 'chat' && (scoreFor(SPOKES[o].key) || 0) > 2) othersQuiet = false;
    if (heavySum / heavyKeys.length >= 3.5) a.place = 5;
    else if (chat >= 3 && othersQuiet) a.place = 1;
    else if ((tagScore('blocked') || 0) >= 4) a.place = 4;
    else if (a.unmet.length >= 3) a.place = 3;
    else a.place = 2;
    a.picks = picksFor(a, 'Not yet met');
    return a;
  }

  function analyseOrg() {
    var a = baseAnalysis();
    var spread = scoreFor('spread');
    var sight = tagScore('sight');
    a.sightGap = spread > 1 && (sight === 0 || sight === 1 || spread - sight > 1);
    if (a.unmet.length >= 3 || a.sightGap) a.place = 3;
    else if (scoreFor('production') === 5 && scoreFor('ownership') === 5 && scoreFor('rules') >= 3) a.place = 5;
    else if (scoreFor('access') >= 4 && scoreFor('rules') >= 3 && [1, 2].includes(scoreFor('reach')) && [1, 2].includes(scoreFor('production')) && scoreFor('spread') <= 2) a.place = 1;
    else if (tagScore('blocked') === 5 && (scoreFor('access') >= 3 || scoreFor('rules') >= 3)) a.place = 4;
    else a.place = 2;
    if (a.place === 2) {
      var rules = scoreFor('rules');
      if (rules === 1 || rules === 2) a.placeGap = { spoke: spokeByKey('rules'), score: rules };
      else {
        var order = ['access', 'context', 'ownership', 'spread', 'reach', 'production', 'rules'];
        for (var i = 0; i < order.length; i += 1) {
          var score = scoreFor(order[i]);
          if (score === 0) continue;
          if (!a.placeGap || score < a.placeGap.score) a.placeGap = { spoke: spokeByKey(order[i]), score: score };
        }
      }
    }
    a.picks = picksFor(a, 'Not known');
    return a;
  }

  function polygonPoints(scores, cx, cy, r) {
    var points = [];
    for (var k = 0; k < SPOKES.length; k += 1) {
      var angle = -Math.PI / 2 + (k * 2 * Math.PI) / SPOKES.length;
      var value = (scores[k] || 0) / 5;
      points.push((cx + Math.cos(angle) * r * value).toFixed(1) + ',' + (cy + Math.sin(angle) * r * value).toFixed(1));
    }
    return points.join(' ');
  }

  function drawChart(a) {
    var cx = 260;
    var cy = 236;
    var radius = 150;
    var out = '';
    for (var ring = 1; ring <= 5; ring += 1) {
      var points = [];
      for (var k = 0; k < SPOKES.length; k += 1) {
        var angle = -Math.PI / 2 + (k * 2 * Math.PI) / SPOKES.length;
        points.push((cx + Math.cos(angle) * radius * ring / 5).toFixed(1) + ',' + (cy + Math.sin(angle) * radius * ring / 5).toFixed(1));
      }
      out += '<polygon class="ring" points="' + points.join(' ') + '"/>';
    }
    var scores = [];
    for (var s = 0; s < SPOKES.length; s += 1) {
      var score = scoreFor(SPOKES[s].key);
      scores.push(score);
      var axisAngle = -Math.PI / 2 + (s * 2 * Math.PI) / SPOKES.length;
      out += '<line class="axis' + (score === 0 ? ' hollow' : '') + '" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(axisAngle) * radius).toFixed(1) + '" y2="' + (cy + Math.sin(axisAngle) * radius).toFixed(1) + '"/>';
    }
    if (prev) {
      var previous = [];
      for (var p = 0; p < prev.length; p += 1) previous.push(parseInt(prev.charAt(p), 10));
      out += '<polygon class="prev" points="' + polygonPoints(previous, cx, cy, radius) + '"/>';
    }
    out += '<polygon class="shape" points="' + polygonPoints(scores, cx, cy, radius) + '"/>';
    for (var d = 0; d < SPOKES.length; d += 1) {
      var dotAngle = -Math.PI / 2 + (d * 2 * Math.PI) / SPOKES.length;
      var value = (scores[d] || 0) / 5;
      var dotX = cx + Math.cos(dotAngle) * radius * value;
      var dotY = cy + Math.sin(dotAngle) * radius * value;
      if (scores[d] === 0) out += '<circle class="hollow-dot" cx="' + (cx + Math.cos(dotAngle) * radius).toFixed(1) + '" cy="' + (cy + Math.sin(dotAngle) * radius).toFixed(1) + '" r="7"/>';
      else out += '<circle class="dot" cx="' + dotX.toFixed(1) + '" cy="' + dotY.toFixed(1) + '" r="5"/>';
      var labelX = cx + Math.cos(dotAngle) * (radius + 30);
      var labelY = cy + Math.sin(dotAngle) * (radius + 30);
      var anchor = Math.abs(Math.cos(dotAngle)) < 0.2 ? 'middle' : Math.cos(dotAngle) > 0 ? 'start' : 'end';
      var cls = 'lbl';
      if (a.strongest && a.strongest.spoke.key === SPOKES[d].key) cls += ' strong';
      else if (a.edge && a.edge.spoke.key === SPOKES[d].key) cls += ' edge';
      var label = SPOKES[d].label + (ORG && SPOKES[d].key === 'spread' && (tagScore('sight') || 0) < 4 ? ' · your estimate' : '');
      out += '<text class="' + cls + '" x="' + labelX.toFixed(1) + '" y="' + (labelY + 4).toFixed(1) + '" text-anchor="' + anchor + '">' + esc(label) + '</text>';
    }
    el('chart').innerHTML = '<title>' + (ORG ? 'Seven organisation conditions' : 'Your seven ways') + ', drawn as a chart</title>' + out;
    el('chart-key').textContent = ORG
      ? (a.unmet.length ? 'Not known: a hollow spoke means nobody could say. That is the first thing to find out. ' : '') + (prev ? 'The dotted outline is the earlier result.' : 'Rings are 1 to 5, centre to edge.')
      : (a.unmet.length ? 'Dashed spokes with a hollow dot are ways you have not met yet. ' : '') + (prev ? 'The dotted outline is your earlier result.' : 'Rings are 1 to 5, centre to edge.');
  }

  function resultCopy(item) {
    if (!item) return '';
    if (item.score === 0) return item.spoke.unmet;
    var kind = questionFor(item.spoke.key).answerKind;
    var strong = kind === 'percentage' || kind === 'usageMix' ? item.score >= 4 : item.score === 5;
    if (strong) return item.spoke.strong;
    if (item.score === 1) return item.spoke.edge;
    if (item.spoke.middle && typeof item.spoke.middle === 'object') return item.spoke.middle[String(item.score)] || item.spoke.edge;
    return item.spoke.middle || item.spoke.edge;
  }
  function placeByNumber(number) {
    for (var k = 0; k < DATA.places.length; k += 1) if (DATA.places[k].n === number) return DATA.places[k];
    return DATA.places[number - 1];
  }
  function guideList(a) {
    var entries = ORG ? SPOKES.map(function (spoke) { return { spoke: spoke, tag: 'Route' }; }) : a.picks;
    var html = '<div class="res-block"><span class="label">' + (ORG ? 'One route for each condition' : 'Three things to read') + '</span><ul class="res-guides">';
    for (var g = 0; g < entries.length; g += 1) {
      var route = entries[g].spoke.route;
      var why = ORG ? resultCopy({ spoke: entries[g].spoke, score: scoreFor(entries[g].spoke.key) }) : route.why;
      html += '<li><span class="tag">' + esc(entries[g].tag) + ' · ' + esc(entries[g].spoke.label) + '</span><a href="' + esc(route.href) + '"' + (route.local ? '' : ' rel="noopener"') + '>' + esc(route.title) + (route.local ? ' →' : ' ↗') + '</a>' + (why ? '<span class="why">' + esc(why) + '</span>' : '') + '</li>';
    }
    return html + '</ul></div>';
  }

  function connectiveList() {
    if (!ORG || !DATA.connectives) return '';
    var tags = ['reuse', 'blocked', 'sight'];
    var html = '<div class="res-block"><span class="label">The other three answers</span><ul class="res-guides">';
    for (var k = 0; k < tags.length; k += 1) {
      var tag = tags[k];
      var item = DATA.connectives[tag];
      var score = tagScore(tag);
      if (tag === 'reuse' && score === 0) continue;
      var why = item.copy && item.copy[String(score)] ? item.copy[String(score)] : '';
      html += '<li><span class="tag">' + esc(tag) + '</span><a href="' + esc(item.route.href) + '"' + (item.route.local ? '' : ' rel="noopener"') + '>' + esc(item.route.title) + (item.route.local ? ' →' : ' ↗') + '</a>' + (why ? '<span class="why">' + esc(why) + '</span>' : '') + '</li>';
    }
    return html + '</ul></div>';
  }

  function resultActions(code, shareUrl) {
    var emailUrl = DATA.formUrl + (DATA.formUrl.indexOf('?') === -1 ? '?' : '&') + 'scores=' + code.s + code.c + '&team=' + encodeURIComponent(team) + '&share=' + encodeURIComponent(shareUrl) + (ORG ? '&kind=org' : '');
    var html = '<div class="res-block"><span class="label">Keep this result</span><div class="share-row"><input type="text" id="share" readonly value="' + esc(shareUrl) + '" aria-label="Link to this result"><button type="button" id="copy">Copy link</button></div><p class="qfoot">The link holds your answers. Nothing is stored anywhere else.</p></div>';
    if (ORG) {
      html += '<div class="res-block"><span class="label">See the practice side</span><p>You rated what the organisation provides. To see what people do, give them this link.</p><div class="team-code"><input type="text" id="team-code" maxlength="24" pattern="[A-Za-z0-9-]+" value="' + esc(team) + '" placeholder="Team code" aria-label="Team code"><button type="button" id="team-copy">Copy team link</button></div><div class="share-row"><input type="text" id="team-link" readonly value="https://eaaiuplift.com/assess/' + (team ? '?t=' + encodeURIComponent(team) : '') + '" aria-label="Team assessment link"></div><p class="qfoot">Results are counted, not attributed, and each person decides whether to send theirs.</p></div>';
      html += '<div class="res-block res-email"><span class="label">Send it to yourself</span><p><a class="cta" id="email-result" href="' + esc(emailUrl) + '" rel="noopener">Email me this result &rarr;</a></p></div>';
    } else {
      html += '<div class="res-block res-email"><span class="label">Send it to yourself</span><p>One email now with this chart and the three guides, one more in two weeks asking whether the growth edge moved. Sent by Alexander Large, who maintains this page. Nothing else, ever.</p><p><a class="cta" href="' + esc(emailUrl) + '" rel="noopener">Email me this result &rarr;</a></p>' + (team ? '<p class="team-line">Team code ' + esc(team) + ': your result is counted for your team when you send it.</p>' : '') + '</div>';
    }
    return html;
  }

  function localNotes() {
    var html = '';
    for (var k = 0; k < state.notes.length; k += 1) {
      var note = state.notes[k].trim();
      if (note) html += '<li><b>Question ' + (k + 1) + ':</b> ' + esc(note) + '</li>';
    }
    if (!html) return '';
    return '<div class="res-block" id="local-notes"><span class="label">Your notes</span><ul class="res-notes">' + html + '</ul><p class="qfoot">These notes stay in this browser tab. They are not in the share link or email form.</p></div>';
  }

  function showResult() {
    var a = ORG ? analyseOrg() : analyseIndividual();
    var code = encode();
    var shareUrl = window.location.origin + window.location.pathname + '?s=' + code.s + '&c=' + code.c + (team ? '&t=' + team : '');
    var retakeUrl = window.location.pathname + '?p=' + code.s + (team ? '&t=' + team : '');
    var place = placeByNumber(a.place);
    var html = '<p class="legend">Your result</p>';
    if (ORG && a.sightGap) html += '<p class="assess-lede">You have rated what the organisation provides. You cannot yet see what most people do. Team mode shows you.</p>';
    html += '<div class="res-two">';
    html += '<div><span class="label">Strongest ' + (ORG ? 'condition' : 'way') + '</span>' + (a.strongest ? '<h2 class="strong">' + esc(a.strongest.spoke.label) + '</h2><p>' + esc(ORG ? resultCopy(a.strongest) : a.strongest.spoke.strong) + '</p>' : '<h2 class="strong">None yet</h2><p>' + (ORG ? 'Every condition is not known.' : 'Every way is new to you. That is a clear starting point, not a bad result.') + '</p>') + '</div>';
    html += '<div><span class="label">' + (ORG ? 'Weakest condition' : 'Growth edge') + '</span>' + (a.edge ? '<h2 class="edge">' + esc(a.edge.spoke.label) + (ORG && a.edge.spoke.key === 'spread' && (tagScore('sight') || 0) < 4 ? ' · your estimate' : '') + '</h2><p>' + esc(ORG ? resultCopy(a.edge) : a.edge.spoke.edge) + '</p>' : ORG ? '<h2 class="edge">None known</h2><p>Find out the seven conditions first.</p>' : '<h2 class="edge">' + esc(SPOKES[0].label) + '</h2><p>' + esc(SPOKES[0].edge) + '</p>') + '</div></div>';
    if (a.unmet.length || ORG) {
      html += '<div class="res-block"><span class="label">' + (ORG ? 'Not known' : 'Not met yet') + '</span><ul class="unmet" id="not-known-list">';
      for (var u = 0; u < a.unmet.length; u += 1) html += '<li><b>' + esc(a.unmet[u].label) + '</b>' + (ORG ? ': ' + esc(a.unmet[u].unmet) : '') + '</li>';
      html += '</ul>' + (!ORG && a.unmet.length ? '<p class="qfoot">' + esc(a.unmet[0].unmet) + '</p>' : '') + '</div>';
    }
    html += '<div class="res-block"><span class="label">' + (ORG ? 'Where the organisation would start' : 'Your likely starting point on the route') + '</span><div class="res-place"><span class="disc-sm" aria-hidden="true">' + place.n + '</span><div><h3 id="placement-title">' + esc(place.title) + '</h3><p>' + esc(place.because) + '</p>';
    if (ORG && a.placeGap) html += '<p><b>' + esc(a.placeGap.spoke.label) + ':</b> ' + esc(resultCopy(a.placeGap)) + '</p>';
    html += '<p class="tiny">A guess from ten answers, not a diagnosis. <a href="' + (ORG ? '../../' : '../') + '#map">See the five starting points</a>.</p></div></div></div>';
    html += guideList(a);
    html += connectiveList();
    if (!ORG) {
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
    }
    html += localNotes();
    html += resultActions(code, shareUrl);
    if (!ORG) html += '<p class="retake"><a href="' + esc(retakeUrl) + '">Retake in two weeks and compare &rarr;</a></p>';
    el('result').innerHTML = html;
    el('result').setAttribute('data-place', String(a.place));
    el('result').setAttribute('data-gap', ORG && a.sightGap ? 'true' : 'false');
    el('result').setAttribute('data-focus', ORG && a.placeGap ? a.placeGap.spoke.key : a.edge ? a.edge.spoke.key : '');
    el('qcard').className = 'qcard hidden';
    document.body.classList.remove('assessment-active');
    el('result').className = 'result';
    el('spokes').className = 'spokes hidden';
    el('chart-wrap').className = 'chart-wrap';
    el('res-people').className = 'res-people';
    if (!ORG && el('org-entry')) el('org-entry').className = '';
    drawChart(a);
    var copy = el('copy');
    copy.addEventListener('click', function () {
      var input = el('share');
      input.select();
      var done = function () { copy.textContent = 'Copied'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(input.value).then(done, done);
      else { try { document.execCommand('copy'); } catch (error) {} done(); }
    });
    if (ORG) {
      var teamCode = el('team-code');
      var teamShare = el('team-link');
      var teamCopy = el('team-copy');
      var updateTeam = function () {
        var codeValue = teamCode.value.replace(/[^A-Za-z0-9-]/g, '').slice(0, 24);
        if (teamCode.value !== codeValue) teamCode.value = codeValue;
        team = codeValue;
        teamShare.value = 'https://eaaiuplift.com/assess/' + (codeValue ? '?t=' + encodeURIComponent(codeValue) : '');
        var updatedShare = window.location.origin + window.location.pathname + '?s=' + code.s + '&c=' + code.c + (codeValue ? '&t=' + encodeURIComponent(codeValue) : '');
        el('share').value = updatedShare;
        el('email-result').href = DATA.formUrl + (DATA.formUrl.indexOf('?') === -1 ? '?' : '&') + 'scores=' + code.s + code.c + '&team=' + encodeURIComponent(codeValue) + '&share=' + encodeURIComponent(updatedShare) + '&kind=org';
        if (window.history && window.history.replaceState) window.history.replaceState(null, '', updatedShare);
      };
      teamCode.addEventListener('input', updateTeam);
      teamCopy.addEventListener('click', function () {
        updateTeam();
        teamShare.select();
        var done = function () { teamCopy.textContent = 'Copied'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(teamShare.value).then(done, done);
        else { try { document.execCommand('copy'); } catch (error) {} done(); }
      });
    }
    if (window.history && window.history.replaceState) window.history.replaceState(null, '', shareUrl);
    window.scrollTo(0, 0);
  }

  var s = params.get('s') || '';
  var c = params.get('c') || '';
  if (/^[0-5]{7}$/.test(s) && /^[0-5]{3}$/.test(c)) {
    decode(s, c);
    showResult();
  } else {
    document.body.classList.add('assessment-active');
    renderQuestion();
  }
})();
