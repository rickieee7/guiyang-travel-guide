// js/app.js — 启动 + 持久化

function loadTrip() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (raw) {
      trip = JSON.parse(raw);
      return;
    }
  } catch(e) {}
  // 无数据 → 加载 Demo
  trip = {
    title: "贵阳四日旅行 · Demo",
    startDate: "2026-07-02",
    endDate: "2026-07-05",
    preferences: JSON.parse(JSON.stringify(DEFAULT_PREFERENCES)),
    anchors: JSON.parse(JSON.stringify(DEFAULT_ANCHORS)),
    pins: JSON.parse(JSON.stringify(DEFAULT_PINS)),
    dailyPlans: {}
  };
  generateTimeline();
  saveTrip();
}

// ===== 辅助：从设置页调用的操作 =====

/** 保存设置并重新生成时间线 */
function saveAndRegenerate() {
  // 重新生成时间线（锚点/偏好/pins可能已变更）
  // 重置 pins 的 used 标记
  (trip.pins||[]).forEach(function(p) { p.used = false; });
  generateTimeline();
  saveTrip();
  switchPage('page-timeline');
}

/** 删除硬约束 */
function removeAnchor(anchorId) {
  trip.anchors = (trip.anchors||[]).filter(function(a) { return a.id !== anchorId; });
  saveTrip();
  renderSettingsPage();
}

/** 添加硬约束（简化版：弹窗输入） */
function addAnchor() {
  var title = prompt('约束名称（如：高铁出发、会议）：');
  if (!title) return;
  var dt = prompt('日期时间（如：2026-07-03T14:00）：');
  if (!dt) return;
  var loc = prompt('地点：') || '';
  var note = prompt('备注：') || '';
  var type = dt.slice(11,13) >= '06' && dt.slice(11,13) < '18' ? 'event' : 'event';
  var id = 'a' + Date.now();
  trip.anchors.push({
    id: id, type: type, icon: '📌', title: title,
    datetime: dt, location: loc, lat: 26.58, lng: 106.71,
    note: note, relatedDay: 0
  });
  saveTrip();
  renderSettingsPage();
}

// ===== 初始化 =====
(function init() {
  // 强制清除旧Service Worker缓存
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(r) { r.unregister(); });
    });
    // 清除缓存
    if (window.caches) {
      caches.keys().then(function(keys) {
        keys.forEach(function(k) { caches.delete(k); });
      });
    }
  }

  try {
    loadTrip();
  } catch(e) {
    document.getElementById('timeline').innerHTML = '<div class="card"><p style="color:red;">加载出错: ' + e.message + '</p></div>';
    console.error(e);
  }
  switchPage('page-timeline');

  // 偏好拖拽排序（简化版）
  document.getElementById('prefSort').addEventListener('dragstart', function(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.idx);
  });
  document.getElementById('prefSort').addEventListener('dragover', function(e) { e.preventDefault(); });
  document.getElementById('prefSort').addEventListener('drop', function(e) {
    e.preventDefault();
    var from = parseInt(e.dataTransfer.getData('text/plain'));
    var toEl = e.target.closest('.sort-item');
    if (!toEl) return;
    var to = parseInt(toEl.dataset.idx);
    if (isNaN(from) || isNaN(to) || from === to) return;
    var moved = trip.preferences.splice(from, 1)[0];
    trip.preferences.splice(to, 0, moved);
    // 更新权重
    trip.preferences.forEach(function(p, i) { p.weight = i + 1; });
    saveTrip();
    renderSettingsPage();
  });
})();
