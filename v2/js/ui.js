// js/ui.js — 视图渲染

// ===== 页面切换 =====
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById(pageId).classList.add('active');
  // 切换底部栏
  ['bar-timeline','bar-planb','bar-settings','bar-food'].forEach(function(id) {
    document.getElementById(id).style.display = 'none';
  });
  if (pageId === 'page-timeline') document.getElementById('bar-timeline').style.display = 'flex';
  if (pageId === 'page-planb') document.getElementById('bar-planb').style.display = 'flex';
  if (pageId === 'page-settings') document.getElementById('bar-settings').style.display = 'flex';
  if (pageId === 'page-food') document.getElementById('bar-food').style.display = 'flex';
  // 渲染对应页
  if (pageId === 'page-timeline') renderTimelinePage();
  if (pageId === 'page-planb') renderPlanBPage();
  if (pageId === 'page-settings') renderSettingsPage();
  if (pageId === 'page-food') renderFoodPage();
}

// ===== 时间线页 =====
var currentDayIdx = 0;

function renderTimelinePage() {
  var dates = getDateRange();
  if (dates.length === 0) return;

  // 日期 Tab
  var tabHtml = dates.map(function(d, i) {
    var parts = d.split("-").map(Number);
    var label = parts[1] + "/" + parts[2];
    var active = i === currentDayIdx ? ' active' : '';
    return '<button class="' + active + '" onclick="selectDay(' + i + ')">' + label + '</button>';
  }).join('');
  document.getElementById('dateTabs').innerHTML = tabHtml;

  // 预警条
  renderAlertBar(dates[currentDayIdx]);

  // 时间线
  renderDayTimeline(dates[currentDayIdx]);
}

function selectDay(idx) {
  currentDayIdx = idx;
  renderTimelinePage();
}

function renderAlertBar(dateStr) {
  var plan = trip.dailyPlans[dateStr];
  var items = plan ? plan.items : [];
  var hasRainRisk = items.some(function(it) { return it.pinId === 'p02'; }); // 荔波有暴雨风险
  var el = document.getElementById('alertBar');
  if (hasRainRisk) {
    el.innerHTML = '<div class="alert-bar alert-warn" onclick="switchPage(\'page-planb\')">'
      + '<span>🌧️</span><div><strong>暴雨预警</strong> · 荔波可能关闭 · <span style="color:var(--red);">查看Plan B →</span></div></div>';
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

function renderDayTimeline(dateStr) {
  var plan = trip.dailyPlans[dateStr];
  var items = plan ? plan.items : [];
  var showCheck = document.getElementById('toggleCheck').classList.contains('on');

  var html = '';
  if (items.length === 0) {
    html = '<div class="card"><p style="text-align:center;color:var(--subtext);padding:20px;">这天还没有安排</p></div>';
  } else {
    html = '<div class="card">';
    html += '<h3>📅 ' + formatDateLabel(dateStr) + '</h3>';
    items.forEach(function(it, i) {
      html += '<div class="tl-item' + (it.done ? ' done' : '') + '">';
      html += '<div class="tl-time">' + it.time + '</div>';
      html += '<div class="tl-body">' + it.event;
      if (it.note) html += '<div class="tl-note">' + it.note + '</div>';
      html += '</div>';
      if (it.lat) html += '<a class="nav-pill" style="align-self:center;margin-left:4px;" href="' + buildNavUrl(it.lat, it.lng, it.event) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">📍</a>';
      if (showCheck) {
        html += '<div class="tl-check' + (it.done ? ' done' : '') + '" onclick="toggleCheck(' + i + ')"></div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }
  document.getElementById('timeline').innerHTML = html;
}

function toggleCheck(idx) {
  var dates = getDateRange();
  var plan = trip.dailyPlans[dates[currentDayIdx]];
  if (!plan || !plan.items[idx]) return;
  plan.items[idx].done = !plan.items[idx].done;
  saveTrip();
  renderDayTimeline(dates[currentDayIdx]);
}

function formatDateLabel(dateStr) {
  var parts = dateStr.split("-").map(Number);
  var d = new Date(parts[0], parts[1]-1, parts[2]);
  var weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
  return (d.getMonth()+1) + '月' + d.getDate() + '日 · ' + weekdays[d.getDay()];
}

// ===== Plan B 页 =====
var currentPlanB = null;

function renderPlanBPage() {
  var el = document.getElementById('planbContent');
  if (!currentPlanB) {
    // 没有触发 Plan B → 显示入口
    el.innerHTML = '<p style="text-align:center;color:var(--subtext);padding:20px;">'
      + '这里会在出问题时帮你推演替代方案<br><br>'
      + '你可以手动触发：</p>'
      + '<div style="text-align:center;margin-top:12px;">'
      + '<button class="btn-primary" onclick="manualTriggerPlanB()">🔄 模拟触发（荔波暴雨）</button>'
      + '</div>';
    return;
  }

  var pb = currentPlanB;
  var html = '';

  // 触发原因
  html += '<div style="background:#FEE2E2;border-radius:10px;padding:12px;margin-bottom:12px;">'
    + '<strong>🌧️ 触发：' + pb.reason + '</strong></div>';

  // 影响范围
  html += '<p style="font-weight:600;font-size:13px;margin-bottom:6px;">📋 影响分析</p>';
  html += '<div class="impact-row"><span class="impact-badge impact-bad">❌ 无法执行</span>' + pb.problem.name + '</div>';
  pb.affectedPins.slice(0,3).forEach(function(pin) {
    html += '<div class="impact-row"><span class="impact-badge impact-warn">⚠ 需调整</span>' + (pin.event||'') + '</div>';
  });
  html += '<div style="margin:12px 0;"></div>';

  // 方案列表
  (pb.alternatives||[]).slice(0,3).forEach(function(alt, i) {
    var isRec = i === 0;
    html += '<div class="pb-option' + (isRec ? ' recommended' : '') + '" onclick="selectPlanB(' + i + ')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
    html += '<strong>' + (i===0?'🥇':'🥈') + ' 方案' + (['A','B','C'][i]||'') + '：' + alt.label + '</strong>';
    html += '<span style="font-size:12px;color:var(--subtext);">匹配度 ' + alt.score + '%</span></div>';

    // 每日新旧对比
    var dates = getDateRange();
    html += '<div class="compare-grid">';
    dates.forEach(function(d) {
      var oldItems = (trip.dailyPlans[d]||{}).items||[];
      var newItems = (alt.plan[d]||{}).items||[];
      var changed = JSON.stringify(oldItems) !== JSON.stringify(newItems);
      if (!changed) return; // 无变化的天不展示
      html += '<div class="compare-old"><div class="compare-label">' + formatDateLabel(d) + ' 原计划</div>';
      oldItems.forEach(function(it) { html += '<div style="font-size:11px;padding:1px 0;">' + it.time + ' ' + it.event + '</div>'; });
      html += '</div>';
      html += '<div class="compare-new"><div class="compare-label">方案' + (['A','B','C'][i]||'') + '</div>';
      newItems.forEach(function(it) { html += '<div style="font-size:11px;padding:1px 0;">' + it.time + ' ' + it.event + '</div>'; });
      html += '</div>';
    });
    html += '</div>';

    html += '<div style="text-align:right;">';
    html += '<button class="btn-primary" style="font-size:13px;padding:8px 20px;">接受此方案</button> ';
    html += '</div>';
    html += '</div>';
  });

  // 重新生成入口
  html += '<div style="text-align:center;margin-top:16px;">';
  html += '<button class="btn-outline" onclick="regeneratePlanB()">🔄 根据新要求重新推演</button> ';
  html += '<button class="btn-ghost" onclick="cancelPlanB()">← 切回原计划</button>';
  html += '</div>';

  el.innerHTML = html;
}

function manualTriggerPlanB() {
  backupCurrentPlan();
  currentPlanB = deducePlanB('p02', '荔波暴雨 · 景区关闭');
  renderPlanBPage();
}

function selectPlanB(idx) {
  if (!currentPlanB || !currentPlanB.alternatives[idx]) return;
  trip.dailyPlans = currentPlanB.alternatives[idx].plan;
  currentPlanB = null;
  saveTrip();
  switchPage('page-timeline');
}

function cancelPlanB() {
  restoreBackupPlan();
  currentPlanB = null;
  saveTrip();
  switchPage('page-timeline');
}

function regeneratePlanB() {
  // 允许用户输入新要求
  var req = prompt('你想调整什么？（比如：不去夜郎谷 / 更慢节奏 / 侧重拍照）');
  if (!req) return;
  // 简单处理：重新推演
  if (currentPlanB) {
    currentPlanB = deducePlanB(currentPlanB.problem.id, req);
    renderPlanBPage();
  }
}

// ===== 设置页 =====
function renderSettingsPage() {
  // 偏好排序
  var prefHtml = (trip.preferences||[]).map(function(p, i) {
    return '<div class="sort-item" draggable="true" data-idx="' + i + '">'
      + '<span>' + p.emoji + ' ' + p.label + '</span>'
      + '<span class="sort-handle">═══</span></div>';
  }).join('');
  document.getElementById('prefSort').innerHTML = prefHtml;

  // 硬约束
  var anchorHtml = (trip.anchors||[]).map(function(a) {
    var cls = a.type === 'flight' ? 'anchor-flight' : a.type === 'event' ? 'anchor-event' : 'anchor-train';
    return '<div class="anchor-card ' + cls + '">'
      + '<span style="font-size:24px;">' + a.icon + '</span>'
      + '<div style="flex:1;"><strong>' + a.title + '</strong>'
      + '<div style="font-size:12px;color:var(--subtext);">' + a.datetime.slice(0,16).replace('T',' ') + ' · ' + a.location + '</div></div>'
      + '<span style="font-size:12px;color:var(--subtext);cursor:pointer;" onclick="removeAnchor(\'' + a.id + '\')">✕</span>'
      + '</div>';
  }).join('');
  anchorHtml += '<div style="text-align:center;margin-top:8px;"><button class="btn-outline" style="font-size:13px;padding:8px 20px;" onclick="addAnchor()">+ 添加硬约束</button></div>';
  document.getElementById('anchorList').innerHTML = anchorHtml;

  // 收藏夹
  var pinHtml = (trip.pins||[]).slice(0, 15).map(function(p) {
    return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">'
      + '<span>' + (p.type==='nature'?'🌊':p.type==='food'?'🍜':p.type==='culture'?'🏛️':'📸') + ' ' + p.name + '</span>'
      + '<span style="font-size:11px;color:var(--subtext);">' + p.area + '</span></div>';
  }).join('');
  document.getElementById('pinList').innerHTML = pinHtml || '<p style="color:var(--subtext);text-align:center;">暂无收藏</p>';

  // 搜索框
  document.getElementById('searchAdd').innerHTML = '<div class="search-box">'
    + '<span>🔍</span><input placeholder="搜索地名/店名添加到收藏夹..." id="searchInput" onkeydown="if(event.key===\'Enter\')searchAddPin()">'
    + '</div><div id="searchResults"></div>';
}

// 简化版搜索（从默认 pins 中匹配）
function searchAddPin() {
  var q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  if (!q) return;
  var results = DEFAULT_PINS.filter(function(p) {
    return p.name.toLowerCase().indexOf(q) >= 0 || p.area.toLowerCase().indexOf(q) >= 0;
  }).slice(0, 6);
  document.getElementById('searchResults').innerHTML = results.map(function(p) {
    return '<div style="padding:8px;border-bottom:1px solid var(--border);cursor:pointer;font-size:13px;"'
      + ' onclick="addPin(\'' + p.id + '\')">'
      + (p.type==='nature'?'🌊':p.type==='food'?'🍜':p.type==='culture'?'🏛️':'📸')
      + ' <strong>' + p.name + '</strong>'
      + '<span style="font-size:11px;color:var(--subtext);"> · ' + p.area + '</span>'
      + ' <span style="color:var(--red);float:right;">+ 收藏</span></div>';
  }).join('');
}

function addPin(pinId) {
  var existing = (trip.pins||[]).find(function(p) { return p.id === pinId; });
  if (existing) { alert('已收藏过了'); return; }
  var pin = DEFAULT_PINS.find(function(p) { return p.id === pinId; });
  if (pin) { trip.pins.push(Object.assign({}, pin)); saveTrip(); renderSettingsPage(); }
}

// ===== 地图导航 =====
function buildNavUrl(lat, lng, label) {
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (isIOS) return 'https://maps.apple.com/?ll=' + lat + ',' + lng + '&q=' + encodeURIComponent(label);
  return 'https://uri.amap.com/marker?position=' + lng + ',' + lat + '&name=' + encodeURIComponent(label) + '&callnative=1';
}

// ===== 美食按片区分页 =====
var FOOD_AREAS = [
  { key:"minsheng", name:"民生路 + 正新街", emoji:"🍢",
    filter: function(f) { return f.area.indexOf("民生路")>=0 || f.area.indexOf("正新街")>=0; } },
  { key:"caijia", name:"蔡家街", emoji:"🍜",
    filter: function(f) { return f.area.indexOf("蔡家街")>=0; } },
  { key:"huguo", name:"护国路", emoji:"🔥",
    filter: function(f) { return f.area.indexOf("护国路")>=0; } },
  { key:"penshuichi", name:"喷水池 + 太平路 + 国贸", emoji:"🏙️",
    filter: function(f) { return f.area.indexOf("喷水池")>=0 || f.area.indexOf("太平路")>=0 || f.area.indexOf("国贸")>=0; } },
  { key:"dananmen", name:"大南门", emoji:"🥢",
    filter: function(f) { return f.area.indexOf("大南门")>=0; } },
  { key:"shengfu", name:"省府路", emoji:"🍲",
    filter: function(f) { return f.area.indexOf("省府路")>=0; } },
  { key:"youyi", name:"友谊路 + 虎门巷 + 陕西路", emoji:"🍖",
    filter: function(f) { return f.area.indexOf("友谊路")>=0 || f.area.indexOf("虎门巷")>=0 || f.area.indexOf("陕西路")>=0; } },
  { key:"other", name:"其他美食", emoji:"🍳",
    filter: function(f) { return f.area.indexOf("八鸽岩路")>=0 || f.area.indexOf("飞山街")>=0 || f.area.indexOf("黔灵东路")>=0 || f.area.indexOf("文昌路")>=0; } }
];

function getFoodPriority(f) {
  var pri = (f.note||"").indexOf("🥇必吃") >= 0 ? 1 : (f.note||"").indexOf("🥈精选") >= 0 ? 2 : 3;
  return pri;
}

function renderFoodPage() {
  var foods = (trip.pins||[]).filter(function(p) { return p.type === "food"; });
  if (foods.length === 0) { document.getElementById("foodByArea").innerHTML = '<div class="card"><p style="text-align:center;color:var(--subtext);padding:20px;">暂无美食收藏</p></div>'; return; }

  var html = '';
  FOOD_AREAS.forEach(function(area) {
    var areaFoods = foods.filter(area.filter);
    if (areaFoods.length === 0) return;

    // 排序：必吃 > 精选 > 备选
    areaFoods.sort(function(a,b) { return getFoodPriority(a) - getFoodPriority(b); });

    html += '<div class="food-area-card area-anchor" id="area-' + area.key + '">';
    html += '<h3>' + area.emoji + ' ' + area.name + ' <span style="font-size:11px;color:var(--subtext);font-weight:400;">' + areaFoods.length + '家</span></h3>';

    areaFoods.forEach(function(f) {
      var url = buildNavUrl(f.lat, f.lng, f.name);
      var priorityLabel = getFoodPriority(f) === 1 ? '🥇必吃' : getFoodPriority(f) === 2 ? '🥈精选' : '🥉备选';
      html += '<div class="food-row-item">';
      html += '<div style="flex:1;min-width:0;">';
      html += '<div class="food-row-name">' + priorityLabel + ' ' + f.name + '</div>';
      var detail = (f.note||'').replace(/🥇必吃[ ·]*|🥈精选[ ·]*|🥉备选[ ·]*/g,'');
      if (f.price) detail += (detail?' · ':'') + f.price;
      html += '<div class="food-row-detail">' + (detail || f.timeHint || '') + '</div>';
      html += '</div>';
      html += '<a class="nav-pill" href="' + url + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">📍 导航 ↗</a>';
      html += '</div>';
    });
    html += '</div>';
  });
  document.getElementById("foodByArea").innerHTML = html;
}

function scrollToArea(key) {
  var el = document.getElementById("area-" + key);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}
