// js/data.js — 贵阳 Demo 数据 + 数据模型

// ===== 偏好配置 =====
var DEFAULT_PREFERENCES = [
  { key: "nature",  label: "自然风光", weight: 1, emoji: "🏞️" },
  { key: "food",    label: "美食探索", weight: 2, emoji: "🍜" },
  { key: "culture", label: "人文历史", weight: 3, emoji: "🏛️" },
  { key: "photo",   label: "网红打卡", weight: 4, emoji: "📸" }
];

// ===== 硬约束 =====
var DEFAULT_ANCHORS = [
  { id:"a0", type:"prep", icon:"🏠", title:"下班 · 出发准备",
    datetime:"2026-07-02T13:00", location:"中北大学（尖草坪区）",
    lat:38.0146, lng:112.4416, note:"收拾行李+午饭 · 出发去武宿机场T1", relatedDay:0 },
  { id:"a1", type:"flight", icon:"✈️", title:"去程 · 太原→贵阳",
    datetime:"2026-07-02T18:55", location:"太原武宿机场T1",
    lat:37.7543, lng:112.7136, note:"18:55起飞 · 21:30到达贵阳龙洞堡T2 · 提前90min到机场 · 取行李15-20min", relatedDay:0 },
  { id:"a2", type:"event", icon:"🎤", title:"演唱会",
    datetime:"2026-07-04T19:30", location:"贵阳奥体中心",
    lat:26.6200, lng:106.6280, note:"18:00前必须到达奥体", relatedDay:2 },
  { id:"a3", type:"flight", icon:"✈️", title:"返程 · 贵阳→太原",
    datetime:"2026-07-05T21:05", location:"贵阳龙洞堡机场T3",
    lat:26.5385, lng:106.8010, note:"21:05起飞 · 到达太原武宿T2 · 19:00前到达机场 · 17:30出发", relatedDay:3 }
];

// ===== 收藏夹（景点+美食） =====
var DEFAULT_PINS = [
  // 自然风光
  { id:"p01", type:"nature", name:"黄果树瀑布", lat:25.993, lng:105.669,
    area:"安顺市", city:"安顺", duration:240, timeHint:"morning",
    note:"大瀑布40min→天星桥1.5h→陡坡塘40min · 🚄G2969 07:40-08:09(贵阳北→安顺西 29min)+大巴40min · 🔴13:30硬性离开 · 返程D8583 14:18-14:51",
    emergency:"黔灵山公园+甲秀楼+夜郎谷+白宫（人文一日游）" },
  { id:"p02", type:"nature", name:"荔波小七孔", lat:25.298, lng:107.709,
    area:"荔波县", city:"荔波", duration:360, timeHint:"morning",
    note:"东进西出：古桥→拉雅瀑布→水上森林→卧龙潭 · 🚄D6171 06:10-07:30(贵阳北→荔波 1h20m) · 返程G5434 15:57-17:18",
    emergency:"黔灵山公园+甲秀楼+花溪夜郎谷+花果园白宫" },

  // 人文景点（雨天备选）
  { id:"p03", type:"culture", name:"黔灵山公园", lat:26.597, lng:106.694,
    area:"云岩区", city:"贵阳", duration:120, timeHint:"morning",
    note:"门票5元 · 看猴子+俯瞰贵阳全景 · ⚠️不要手提塑料袋" },
  { id:"p04", type:"culture", name:"甲秀楼", lat:26.574, lng:106.7155,
    area:"南明区", city:"贵阳", duration:40, timeHint:"afternoon",
    note:"贵阳地标 · 免费 · 南明河畔拍照" },
  { id:"p05", type:"photo", name:"花果园白宫", lat:26.566, lng:106.696,
    area:"花果园", city:"贵阳", duration:30, timeHint:"evening",
    note:"网红打卡点 · 夜景更出片 · 免费" },
  { id:"p06", type:"culture", name:"花溪夜郎谷", lat:26.424, lng:106.680,
    area:"花溪区", city:"贵阳", duration:120, timeHint:"afternoon",
    note:"石头城堡艺术区 · 拍照极佳 · 门票20元 · 距市区40min车程" },
  { id:"p07", type:"culture", name:"贵州省博物馆", lat:26.620, lng:106.663,
    area:"观山湖区", city:"贵阳", duration:120, timeHint:"morning",
    note:"免费需预约 · 了解贵州少数民族文化" },
  { id:"p08", type:"photo", name:"文昌阁+电台街", lat:26.579, lng:106.718,
    area:"文昌路", city:"贵阳", duration:60, timeHint:"afternoon",
    note:"老城漫步 · 免费" },

  // 美食（10家必吃 + 14家精选 + 6家备选 = 30家）
  { id:"f01", type:"food", name:"徐家优选脆哨", lat:26.5828, lng:106.7132,
    area:"民生路", city:"贵阳", duration:15, timeHint:"morning",
    note:"🥇必吃 · 可带走当零食/伴手礼", price:"¥25" },
  { id:"f02", type:"food", name:"丁家脆哨", lat:26.5826, lng:106.7134,
    area:"民生路", city:"贵阳", duration:15, timeHint:"morning",
    note:"🥇必吃 · 贵阳脆哨老字号", price:"¥25" },
  { id:"f03", type:"food", name:"余孃洋芋粑", lat:26.5823, lng:106.7138,
    area:"民生路×正新街", city:"贵阳", duration:20, timeHint:"afternoon",
    note:"🥇必吃 · 现做现吃最佳", price:"¥8" },
  { id:"f04", type:"food", name:"金牌罗记肠旺面", lat:26.5816, lng:106.7149,
    area:"蔡家街", city:"贵阳", duration:30, timeHint:"morning",
    note:"🥇必吃 · 贵阳早餐之王 · 蔡家街与中山东路交叉口", price:"¥15" },
  { id:"f05", type:"food", name:"忆苗乡老酸汤", lat:26.5820, lng:106.7146,
    area:"蔡家街", city:"贵阳", duration:30, timeHint:"morning",
    note:"🥇必吃 · 酸汤砂锅粉", price:"¥15" },
  { id:"f06", type:"food", name:"毛辣果虾酸牛肉", lat:26.5748, lng:106.7168,
    area:"护国路180号二层", city:"贵阳", duration:60, timeHint:"evening",
    note:"🥇必吃 · 独山特色 · 贵阳少见", price:"¥70",
    alternatives:["f09","f11"] },
  { id:"f07", type:"food", name:"织金土烙锅", lat:26.5746, lng:106.7170,
    area:"护国路", city:"贵阳", duration:45, timeHint:"evening",
    note:"🥇必吃 · 毛辣果旁边", price:"¥50" },
  { id:"f08", type:"food", name:"王旭甜品", lat:26.5752, lng:106.7166,
    area:"护国路", city:"贵阳", duration:20, timeHint:"evening",
    note:"🥇必吃 · 水果豆花必点！！！", price:"¥12" },
  { id:"f09", type:"food", name:"胡子哥酸汤牛肉", lat:26.5754, lng:106.7164,
    area:"护国路", city:"贵阳", duration:60, timeHint:"evening",
    note:"🥈精选 · 酸汤牛肉备选", price:"¥65" },
  { id:"f10", type:"food", name:"新大新豆米火锅", lat:26.5835, lng:106.7115,
    area:"喷水池", city:"贵阳", duration:60, timeHint:"any",
    note:"🥇必吃 · 中华中路130号南国花锦7楼", price:"¥80" },
  { id:"f11", type:"food", name:"黔渔翁豆花渎鱼", lat:26.5745, lng:106.7172,
    area:"护国路", city:"贵阳", duration:60, timeHint:"evening",
    note:"🥈精选 · 备选", price:"¥60",
    alternatives:["f07"] },
  { id:"f12", type:"food", name:"烧包烧烤店", lat:26.5853, lng:106.7131,
    area:"虎门巷", city:"贵阳", duration:60, timeHint:"evening",
    note:"🥇必吃 · 7/4演唱会后的深夜烧烤！", price:"¥50" },
  { id:"f13", type:"food", name:"小平香辣素粉", lat:26.5812, lng:106.7148,
    area:"省府路", city:"贵阳", duration:20, timeHint:"morning",
    note:"🥈精选", price:"¥12" },
  { id:"f14", type:"food", name:"老凯里酸汤鱼", lat:26.5808, lng:106.7152,
    area:"省府路", city:"贵阳", duration:60, timeHint:"afternoon",
    note:"🥈精选 · 大菜", price:"¥90" },
  { id:"f15", type:"food", name:"黔诚酸汤牛肉", lat:26.5732, lng:106.7152,
    area:"大南门", city:"贵阳", duration:60, timeHint:"evening",
    note:"🥈精选 · 7/4演唱会前", price:"¥65" },
  { id:"f16", type:"food", name:"林城雷家豆腐圆子", lat:26.5738, lng:106.7148,
    area:"大南门", city:"贵阳", duration:20, timeHint:"afternoon",
    note:"🥈精选 · 小吃", price:"¥10" },
  { id:"f17", type:"food", name:"巴倒烫烤鱼", lat:26.5862, lng:106.7108,
    area:"陕西路", city:"贵阳", duration:60, timeHint:"evening",
    note:"🥈精选 · 7/4深夜", price:"¥60" },
  { id:"f18", type:"food", name:"葫芦烤鸡", lat:26.5872, lng:106.7118,
    area:"友谊路", city:"贵阳", duration:45, timeHint:"evening",
    note:"🥈精选 · 7/4深夜烤鸡", price:"¥40" },
  { id:"f19", type:"food", name:"丝恋丝娃娃", lat:26.5828, lng:106.7117,
    area:"喷水池国贸", city:"贵阳", duration:45, timeHint:"any",
    note:"🥈精选 · 贵阳名片", price:"¥40" },
  { id:"f20", type:"food", name:"六广门毛阿姨糯米饭", lat:26.5918, lng:106.7052,
    area:"八鸽岩路", city:"贵阳", duration:15, timeHint:"morning",
    note:"🥈精选 · 7/5赶高铁干粮", price:"¥8" },
  { id:"f21", type:"food", name:"但家香酥鸭", lat:26.5830, lng:106.7128,
    area:"民生路", city:"贵阳", duration:15, timeHint:"afternoon",
    note:"🥈精选 · 打包带走", price:"¥30" },
  { id:"f22", type:"food", name:"董家红油米皮", lat:26.5827, lng:106.7130,
    area:"民生路", city:"贵阳", duration:20, timeHint:"morning",
    note:"🥈精选", price:"¥10" },
  { id:"f23", type:"food", name:"骆玉冰浆", lat:26.5822, lng:106.7137,
    area:"民生路", city:"贵阳", duration:15, timeHint:"afternoon",
    note:"🥈精选 · 解暑", price:"¥10" },
  { id:"f24", type:"food", name:"俞记安顺破酥包", lat:26.5824, lng:106.7136,
    area:"民生路", city:"贵阳", duration:15, timeHint:"morning",
    note:"🥈精选", price:"¥6" },
  { id:"f25", type:"food", name:"社会牛肉粉", lat:26.5842, lng:106.7103,
    area:"喷水池", city:"贵阳", duration:30, timeHint:"any",
    note:"🥈精选", price:"¥15" },
  { id:"f26", type:"food", name:"巧八角冰浆", lat:26.5751, lng:106.7169,
    area:"护国路", city:"贵阳", duration:15, timeHint:"afternoon",
    note:"🥉备选", price:"¥12" },
  { id:"f27", type:"food", name:"小满牛肉粉", lat:26.5753, lng:106.7165,
    area:"护国路", city:"贵阳", duration:30, timeHint:"any",
    note:"🥉备选", price:"¥15" },
  { id:"f28", type:"food", name:"安顺牛肉粉馆", lat:26.5833, lng:106.7096,
    area:"太平路32号", city:"贵阳", duration:30, timeHint:"morning",
    note:"🥉备选 · 太平路32号", price:"¥15" },
  { id:"f29", type:"food", name:"永笠板筋饭", lat:26.5836, lng:106.7093,
    area:"太平路", city:"贵阳", duration:30, timeHint:"afternoon",
    note:"🥉备选", price:"¥20" },
  { id:"f30", type:"food", name:"飞山街一绝板筋王", lat:26.5822, lng:106.7063,
    area:"飞山街", city:"贵阳", duration:45, timeHint:"evening",
    note:"🥉备选", price:"¥35" }
];

// ===== 城市中心参考坐标 =====
var CITY_CENTERS = {
  "贵阳": { lat: 26.58, lng: 106.71 },
  "安顺": { lat: 26.25, lng: 105.93 },
  "荔波": { lat: 25.41, lng: 107.88 }
};

// ===== 持久化（供所有后续脚本使用） =====
var LS_KEY = 'suixing_trip_v2';

function saveTrip() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(trip)); } catch(e) {}
}
