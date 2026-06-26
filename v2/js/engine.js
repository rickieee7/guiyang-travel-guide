// js/engine.js — 核心推演引擎 v3
// 修复: Plan B全量重生成 · 早餐去死代码 · 7/2出发准备 · parentPinId标记

// ===== 工具 =====

function distanceKm(a, b) {
  var R = 6371, dLat = (b.lat-a.lat)*Math.PI/180, dLng = (b.lng-a.lng)*Math.PI/180;
  var x = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function getDateRange() {
  if (!trip.startDate || !trip.endDate) return [];
  var dates = [];
  var sp = trip.startDate.split("-").map(Number);
  var ep = trip.endDate.split("-").map(Number);
  var d = new Date(sp[0], sp[1]-1, sp[2]);
  var end = new Date(ep[0], ep[1]-1, ep[2]);
  while (d <= end) {
    var y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
    dates.push(y + "-" + m + "-" + day);
    d.setDate(d.getDate()+1);
  }
  return dates;
}

function anchorsForDay(dateStr) {
  return (trip.anchors||[]).filter(function(a) { return a.datetime.slice(0,10) === dateStr; });
}

function prefScore(type) {
  var p = (trip.preferences||[]).find(function(x) { return x.key === type; });
  if (!p) return 0;
  return Math.round(100 / p.weight);
}

function timeAdd(t, mins) {
  var parts = t.split(":"), total = parseInt(parts[0])*60 + parseInt(parts[1]) + mins;
  total = Math.max(0, Math.min(total, 1439));
  return String(Math.floor(total/60)).padStart(2,"0") + ":" + String(total%60).padStart(2,"0");
}

function timeBefore(t1, t2) { return t1 < t2; }
function timeToMin(t) { var p = t.split(":"); return parseInt(p[0])*60 + parseInt(p[1]); }


// ===== 时间线生成 =====

function generateTimeline() {
  var dates = getDateRange();
  if (dates.length === 0) return;

  (trip.pins||[]).forEach(function(p) { p.used = false; });
  var plans = {};
  dates.forEach(function(d) { plans[d] = { items: [], usedIds: [] }; });

  // ── 第1步：插入硬约束 ──
  (trip.anchors||[]).forEach(function(a) {
    var d = a.datetime.slice(0,10);
    if (!plans[d]) return;
    plans[d].items.push({
      time: a.datetime.slice(11,16), event: a.icon + " " + a.title,
      note: a.note || "", type: "anchor", anchorId: a.id, lat: a.lat, lng: a.lng, done: false
    });
  });

  // ── 第1.5步：第一天出发准备 ──
  if (dates.length > 0) {
    var day0 = dates[0];
    var prepAnchor = anchorsForDay(day0).find(function(a) { return a.type === "prep"; });
    var flightAnchor = anchorsForDay(day0).find(function(a) { return a.type === "flight"; });
    if (prepAnchor && flightAnchor) {
      var prepTime = prepAnchor.datetime.slice(11,16);
      var flightTime = flightAnchor.datetime.slice(11,16);
      var leaveTime = timeAdd(flightTime, -120); // 提前2h离开
      var transitTime = timeAdd(leaveTime, -60); // 交通耗时约1h

      plans[day0].items.push({ time: prepTime, event: "🍱 午饭 + 收拾行李",
        note: "从中北大学出发前最后检查证件、机票、相机", type: "system" });
      plans[day0].items.push({ time: timeAdd(prepTime, 90), event: "🧳 最后检查",
        note: "身份证·机票·相机·充电器·雨具·换洗衣物", type: "system" });
      plans[day0].items.push({ time: transitTime, event: "🚕/🚇 前往太原武宿机场T1",
        note: "中北大学→武宿机场约30-40km · 打车约50-70min · 地铁2号线约1h · 建议16:00前出发",
        type: "transit", lat: 37.7543, lng: 112.7136 });
      plans[day0].items.push({ time: leaveTime, event: "🛂 到达机场 · 值机安检",
        note: "T1航站楼 · 提前90min到达 · 18:55起飞", type: "system", lat: 37.7543, lng: 112.7136 });
    }

    // 到达后序列——取行李→交通→入住→夜宵
    if (flightAnchor) {
      var arrTime2 = flightAnchor.datetime.slice(11,16);
      var arriveLoc = flightAnchor.location || "";
      var isArrival = flightAnchor.title.indexOf("去程") >= 0;
      if (isArrival && timeBefore(arrTime2, "23:30")) {
        plans[day0].items.push({ time: arrTime2, event: "🛬 到达 " + arriveLoc,
          note: "取行李15-20min", type: "system", lat: flightAnchor.lat, lng: flightAnchor.lng });
        plans[day0].items.push({ time: timeAdd(arrTime2, 25), event: "🚕 打车前往喷水池",
          note: "约25min车程 · 约40元 · 或地铁2号线23min直达¥7",
          type: "transit", lat: 26.584, lng: 106.7105 });
        plans[day0].items.push({ time: timeAdd(arrTime2, 55), event: "🏨 办理入住",
          note: "喷水池/大十字区域 · 放行李", type: "system", lat: 26.584, lng: 106.7105 });
        plans[day0].items.push({ time: timeAdd(arrTime2, 70), event: "🍢 民生路+正新街夜宵",
          note: "步行5min即达 · 余孃洋芋粑/但家香酥鸭/骆玉冰浆等",
          type: "system", lat: 26.5825, lng: 106.7135 });
      }
    }
  } // end dates.length > 0

  // ── 第2步：计算每天可用时间窗口 ──
  var windows = {};
  dates.forEach(function(d, i) {
    var wStart = "06:30", wEnd = "23:00", label = "";
    var dayAnchors = anchorsForDay(d);

    if (i === 0) {
      var arr = dayAnchors.find(function(a) { return a.type === "flight" && a.title.indexOf("去程") >= 0; });
      if (arr) {
        wStart = timeAdd(arr.datetime.slice(11,16), 55);
        label = "晚间抵达";
      }
    }
    if (i === dates.length - 1) {
      var dep = dayAnchors.find(function(a) { return a.type === "flight" && a.title.indexOf("返程") >= 0; });
      if (dep) {
        wEnd = timeAdd(dep.datetime.slice(11,16), -150);
        if (label) label += " · ";
        label += "晚间返程";
      }
    }
    dayAnchors.forEach(function(a) {
      if (a.type === "prep") return;
      var h = parseInt(a.datetime.slice(11,13));
      if (h >= 14 && h < 23) {
        var limit = timeAdd(a.datetime.slice(11,16), -90);
        if (timeBefore(limit, wEnd)) wEnd = limit;
      }
      if (h >= 6 && h < 12) {
        var limit = timeAdd(a.datetime.slice(11,16), 30);
        if (timeBefore(wStart, limit)) wStart = limit;
      }
    });
    if (!timeBefore(wStart, wEnd)) wStart = wEnd;
    windows[d] = { start: wStart, end: wEnd, label: label };
  });

  // ── 第3步：分配远途景区 ──
  var usedScenicDays = {};
  var scenicPins = (trip.pins||[]).filter(function(p) {
    return (p.type === "nature" || p.type === "culture") && p.duration >= 120 && !p.used;
  });
  scenicPins.sort(function(a,b) { return b.duration - a.duration; });

  scenicPins.forEach(function(pin) {
    var bestDay = null, bestScore = -1;
    dates.forEach(function(d) {
      if (usedScenicDays[d]) return;
      var w = windows[d];
      var avail = timeToMin(w.end) - timeToMin(w.start);
      if (avail < pin.duration + 60) return;
      var score = avail;
      if (pin.city !== "贵阳" && avail > 600) score += 200;
      if (score > bestScore) { bestScore = score; bestDay = d; }
    });
    if (!bestDay) return;
    usedScenicDays[bestDay] = true;

    var items = plans[bestDay].items;
    var blockId = "block_" + pin.id;
    var isOutOfCity = (pin.city !== "贵阳" && pin.duration >= 240);

    if (isOutOfCity) {
      var wakeAt, trainDept, trainRide, scenicStart, leaveScenic, retTrainDept, retTrainArrive;

      if (pin.name.indexOf("荔波") >= 0) {
        wakeAt = "05:30"; trainDept = "06:10"; trainRide = "1h20min"; scenicStart = "08:00";
        leaveScenic = "15:30"; retTrainDept = "15:57"; retTrainArrive = "17:18";
      } else if (pin.name.indexOf("黄果树") >= 0) {
        wakeAt = "06:00"; trainDept = "07:40"; trainRide = "30min"; scenicStart = "09:15";
        leaveScenic = "13:30"; retTrainDept = "14:18"; retTrainArrive = "14:51";
      } else {
        wakeAt = "06:00"; trainDept = "07:00"; trainRide = "1h"; scenicStart = "09:00";
        leaveScenic = "16:00"; retTrainDept = "16:30"; retTrainArrive = "17:30";
      }

      items.push({ time: wakeAt, event: "🚿 起床洗漱", type: "system", blockId: blockId });
      items.push({ time: timeAdd(trainDept, -75), event: "🥡 快捷早餐",
        note: "可在美食清单中选择附近早餐店", type: "system", blockId: blockId });
      items.push({ time: timeAdd(trainDept, -45), event: "🚕 打车去贵阳北站",
        note: "约20min车程+15min进站安检取票 · 约30元", type: "transit", blockId: blockId });
      items.push({ time: trainDept, event: "🚄 高铁前往 " + pin.area,
        note: trainRide + " · 车次请以12306实时查询为准 · 提前购票！",
        type: "transit", blockId: blockId, lat: pin.lat, lng: pin.lng });

      var emoji = pin.type === "nature" ? "🌊" : pin.type === "culture" ? "🏛️" : "📸";
      items.push({ time: scenicStart, event: emoji + " " + pin.name,
        note: pin.note, type: "pin", pinId: pin.id, lat: pin.lat, lng: pin.lng,
        done: false, duration: pin.duration, blockId: blockId });
      plans[bestDay].usedIds.push(pin.id);
      pin.used = true;

      items.push({ time: timeAdd(scenicStart, 180), event: "🍱 景区内简餐",
        note: "自带干粮或景区附近小吃", type: "system", blockId: blockId });
      items.push({ time: leaveScenic, event: "🚕 离开景区 → 高铁站",
        note: pin.name.indexOf("黄果树")>=0 ? "🔴 13:30 硬性截止！" : "预留充足时间别误车",
        type: "transit", blockId: blockId });
      items.push({ time: retTrainDept, event: "🚄 高铁返回贵阳（" + trainRide + "）",
        note: "时刻请以12306实时查询为准", type: "transit", blockId: blockId });
      items.push({ time: timeAdd(retTrainArrive, 20), event: "🏨 回到喷水池",
        note: "打车约20min · 约30元", type: "system", blockId: blockId, lat: 26.584, lng: 106.7105 });

    } else {
      // 市区内景点
      var sTime = windows[bestDay].start;
      if (timeBefore("08:00", sTime)) sTime = "08:00";
      if (timeBefore(sTime, "06:00")) sTime = "06:00";

      items.push({ time: timeAdd(sTime, -30), event: "🚿 起床", type: "system", blockId: blockId });
      var emoji = pin.type === "nature" ? "🌊" : pin.type === "culture" ? "🏛️" : "📸";
      items.push({ time: sTime, event: emoji + " " + pin.name,
        note: pin.note, type: "pin", pinId: pin.id, lat: pin.lat, lng: pin.lng,
        done: false, duration: pin.duration, blockId: blockId });
      plans[bestDay].usedIds.push(pin.id);
      pin.used = true;
    }
  });

  // ── 第4步：分配美食 ──
  var foodPins = (trip.pins||[]).filter(function(p) { return p.type === "food" && !p.used; });
  foodPins.sort(function(a,b) { return prefScore(b.type) - prefScore(a.type); });

  foodPins.forEach(function(pin) {
    var targetHour = pin.timeHint === "morning" ? 8 : pin.timeHint === "afternoon" ? 14 : pin.timeHint === "evening" ? 18 : 12;
    var candidates = [];
    dates.forEach(function(d) {
      var w = windows[d];
      var actualTime = String(targetHour).padStart(2,"0") + ":00";
      if (timeBefore(actualTime, w.start)) actualTime = w.start;
      if (timeBefore(w.end, actualTime)) actualTime = timeAdd(w.end, -30);
      if (timeBefore(actualTime, w.start) || timeBefore(w.end, actualTime)) return;
      if (timeToMin(w.end) - timeToMin(w.start) < 15) return;

      var nearby = 0;
      (plans[d].usedIds||[]).forEach(function(id) {
        var p = (trip.pins||[]).find(function(x) { return x.id === id; });
        if (p && p.lat && distanceKm(pin, p) < 3) nearby++;
      });
      candidates.push({ day: d, actualTime: actualTime, nearby: nearby });
    });
    if (candidates.length === 0) return;
    candidates.sort(function(a,b) { return b.nearby - a.nearby; });
    var chosen = candidates[0];
    var sameItems = plans[chosen.day].items.filter(function(it) { return it.time === chosen.actualTime; });
    if (sameItems.length > 0) chosen.actualTime = timeAdd(chosen.actualTime, sameItems.length * 10);

    plans[chosen.day].items.push({
      time: chosen.actualTime, event: "🍜 " + pin.name,
      note: pin.note, type: "pin", pinId: pin.id, lat: pin.lat, lng: pin.lng,
      done: false, duration: pin.duration
    });
    plans[chosen.day].usedIds.push(pin.id);
    pin.used = true;
  });

  // ── 第5步：排序 + 清理 ──
  dates.forEach(function(d) {
    plans[d].items.sort(function(a, b) { return a.time.localeCompare(b.time); });
    for (var i = 1; i < plans[d].items.length; i++) {
      if (plans[d].items[i].time === plans[d].items[i-1].time) {
        plans[d].items[i].time = timeAdd(plans[d].items[i].time, 10);
      }
    }
    plans[d].items.sort(function(a, b) { return a.time.localeCompare(b.time); });
  });

  trip.dailyPlans = plans;
}


// ===== Plan B 智能推演（完全重写） =====

var _backupPlans = null;

function backupCurrentPlan() {
  _backupPlans = JSON.parse(JSON.stringify(trip.dailyPlans));
}

function restoreBackupPlan() {
  if (_backupPlans) { trip.dailyPlans = _backupPlans; _backupPlans = null; }
}

/**
 * 完全重生成版 Plan B
 * 不再只是"换一个pin"，而是找到受影响日→清理关联项→插入替代→重新分配美食
 */
function deducePlanB(problemPinId, reason) {
  var problemPin = (trip.pins||[]).find(function(p) { return p.id === problemPinId; });
  if (!problemPin) return null;

  // 1. 找到受影响日期
  var dates = getDateRange();
  var affectedDays = [];
  dates.forEach(function(d) {
    var plan = trip.dailyPlans[d];
    if (!plan) return;
    if (plan.items.some(function(it) { return it.pinId === problemPinId; })) affectedDays.push(d);
  });

  // 2. 收集替代品 —— 同类型且在贵阳市内（如果原pin是景区）
  var isOutOfCity = (problemPin.city !== "贵阳");
  var alternatives = (trip.pins||[]).filter(function(p) {
    if (p.id === problemPinId) return false;
    if (p.type === "food") return false; // 食物不用来替代景区
    // 优先同城市
    if (isOutOfCity && p.city === "贵阳") return true;
    if (!isOutOfCity) return (p.type === problemPin.type || p.type === "culture" || p.type === "photo");
    // out-of-city: 也考虑其他out-of-city同类型（极端情况）
    return (p.type === problemPin.type);
  });
  alternatives.sort(function(a,b) { return prefScore(b.type) - prefScore(a.type); });

  // 3. 为每个替代生成新的 simulated dailyPlans
  var results = alternatives.slice(0, 4).map(function(alt, idx) {
    var sim = JSON.parse(JSON.stringify(trip.dailyPlans));

    affectedDays.forEach(function(d) {
      if (!sim[d]) return;
      var problemBlockId = "block_" + problemPinId;

      // 清理：移除原pin + 同一block的所有关联项
      sim[d].items = sim[d].items.filter(function(it) {
        if (it.pinId === problemPinId) return false;
        if (it.blockId === problemBlockId) return false;
        return true;
      });
      // 从 usedIds 移除原pin
      if (sim[d].usedIds) {
        sim[d].usedIds = sim[d].usedIds.filter(function(id) { return id !== problemPinId; });
      }

      // 插入替代
      var altIsOutOfCity = (alt.city !== "贵阳" && alt.duration >= 240);
      var altBlockId = "block_" + alt.id;
      var wStart = "08:00";
      // 找到窗口
      var anchors = anchorsForDay(d);
      var arrAnchor = anchors.find(function(a) { return a.type === "flight" && a.title.indexOf("去程")>=0; });
      if (arrAnchor) wStart = timeAdd(arrAnchor.datetime.slice(11,16), 55);
      var depAnchor = anchors.find(function(a) { return a.type === "flight" && a.title.indexOf("返程")>=0; });
      var wEnd = depAnchor ? timeAdd(depAnchor.datetime.slice(11,16), -150) : "23:00";
      anchors.forEach(function(a) {
        if (a.type === "prep") return;
        var h = parseInt(a.datetime.slice(11,13));
        if (h >= 14 && h < 23) wEnd = timeAdd(a.datetime.slice(11,16), -90);
        if (h >= 6 && h < 12) wStart = timeAdd(a.datetime.slice(11,16), 30);
      });

      if (timeBefore("08:00", wStart)) wStart = "08:00";

      if (altIsOutOfCity) {
        // 远途替代——插入完整交通链
        var aWake, aTrain, aRide, aStart;
        if (alt.name.indexOf("荔波") >= 0) {
          aWake = "05:30"; aTrain = "06:10"; aRide = "1h20min"; aStart = "08:00";
        } else if (alt.name.indexOf("黄果树") >= 0) {
          aWake = "06:00"; aTrain = "07:40"; aRide = "30min"; aStart = "09:15";
        } else {
          aWake = "06:00"; aTrain = "07:00"; aRide = "1h"; aStart = "09:00";
        }
        sim[d].items.push({ time: aWake, event: "🚿 起床洗漱", type: "system", blockId: altBlockId });
        sim[d].items.push({ time: timeAdd(aTrain, -45), event: "🚕 打车去高铁站",
          note: "约20min车程+15min进站", type: "transit", blockId: altBlockId });
        sim[d].items.push({ time: aTrain, event: "🚄 高铁前往 " + alt.area,
          note: aRide, type: "transit", blockId: altBlockId });
        var altEmoji = alt.type === "nature" ? "🌊" : alt.type === "culture" ? "🏛️" : "📸";
        sim[d].items.push({ time: aStart, event: altEmoji + " " + alt.name,
          note: alt.note, type: "pin", pinId: alt.id, lat: alt.lat, lng: alt.lng,
          done: false, duration: alt.duration, blockId: altBlockId });
        if (sim[d].usedIds) sim[d].usedIds.push(alt.id);
        sim[d].items.push({ time: "12:00", event: "🍱 景区内简餐", type: "system", blockId: altBlockId });
        sim[d].items.push({ time: timeAdd(aStart, alt.duration - 30), event: "🚕 离开景区→高铁站",
          type: "transit", blockId: altBlockId });
        sim[d].items.push({ time: timeAdd(aStart, alt.duration), event: "🚄 高铁返回贵阳",
          note: "约" + aRide, type: "transit", blockId: altBlockId });
      } else {
        // 市区内替代——简单插入
        sim[d].items.push({ time: wStart, event: "🚿 起床", type: "system", blockId: altBlockId });
        var altEmoji = alt.type === "nature" ? "🌊" : alt.type === "culture" ? "🏛️" : "📸";
        sim[d].items.push({ time: timeAdd(wStart, 30), event: altEmoji + " " + alt.name,
          note: alt.note, type: "pin", pinId: alt.id, lat: alt.lat, lng: alt.lng,
          done: false, duration: alt.duration, blockId: altBlockId });
        if (sim[d].usedIds) sim[d].usedIds.push(alt.id);
      }

      // 重新排序
      sim[d].items.sort(function(a,b) { return a.time.localeCompare(b.time); });
    });

    var score = Math.round(prefScore(alt.type) * 0.7 + (95 - idx * 15));
    return { score: score, label: alt.name, plan: sim, altId: alt.id, altPin: alt, isInCity: (alt.city === "贵阳") };
  });

  results.sort(function(a,b) { return b.score - a.score; });

  // 标记每个方案是市区内还是远途
  return {
    problem: problemPin, reason: reason, affectedDays: affectedDays,
    affectedPins: affectedDays.reduce(function(acc, d) {
      return acc.concat((trip.dailyPlans[d]||{}).items||[]);
    }, []).filter(function(it) { return it.pinId && it.pinId !== problemPinId; }),
    alternatives: results
  };
}
