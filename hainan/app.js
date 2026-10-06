/* ===== 海南自驾攻略 · 交互逻辑 ===== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* 腾讯地图 URI（免 key、公网可用、合规）—— 无坐标时的兜底导航 */
function mapUri(name, city) {
  return `https://apis.map.qq.com/uri/v1/search?keyword=${encodeURIComponent(name)}&region=${encodeURIComponent(city || '海南')}&referer=hainan-trip`;
}

/* 高德 URI 导航：有官方 POI 坐标时走高德（精确落点 + 可直接唤起 App） */
function coordOf(id) {
  return (typeof COORDS !== 'undefined' && COORDS[id]) || null;
}
function navUri(name, city, id) {
  const c = coordOf(id);
  if (c) return `https://uri.amap.com/marker?position=${c.lng},${c.lat}&name=${encodeURIComponent(name)}&src=hainan-trip&coordinate=gaode&callnative=1`;
  return mapUri(name, city);
}
function driveUri(name, city, id) {
  const c = coordOf(id);
  if (c) return `https://uri.amap.com/navigation?to=${c.lng},${c.lat},${encodeURIComponent(name)}&mode=car&policy=1&src=hainan-trip&coordinate=gaode&callnative=1`;
  return mapUri(name, city);
}
/* 卡片底部的双按钮：定位 + 驾车导航 */
function navButtons(name, city, id) {
  return `<div class="navbtns">
    <a class="mapbtn" href="${navUri(name, city, id)}" target="_blank" rel="noopener">📍 地图定位</a>
    <a class="mapbtn alt" href="${driveUri(name, city, id)}" target="_blank" rel="noopener">🚗 驾车导航</a>
  </div>`;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- 概览 ---------- */
function renderMeta() {
  const m = TRIP.meta;
  $('#metaGrid').innerHTML = `
    <div class="kv"><span>出行人数</span><b>${m.people} 人（${m.adults} 成人 + ${m.baby} 婴儿）</b></div>
    <div class="kv"><span>宝宝</span><b>${m.babyName}（${m.babyBirth}）</b></div>
    <div class="kv"><span>出发地</span><b>${m.start}</b></div>
    <div class="kv"><span>车型</span><b>${m.cars.join(' / ')}</b></div>
    <div class="kv"><span>主次安排</span><b>${m.priority}</b></div>
    <div class="kv"><span>费用分摊</span><b>路费 + 过路费 AA</b></div>`;
  $('#babyNote').textContent = m.babyNote;
  $('#pageSub').textContent = m.subtitle;
  document.title = m.title;
}

/* ---------- 天气 ---------- */
function renderWeather() {
  const w = TRIP.weather;
  $('#wxBest').innerHTML = `<b>最佳季节：</b>${w.best}<br><span class="warn">避开：${w.avoid}</span>`;

  const maxR = Math.max(...w.months.map(x => x.r));
  const W = 680, H = 200, pad = 28;
  const bw = (W - pad * 2) / 12;
  let bars = '', line = '', labels = '';
  const pts = w.months.map((x, i) => {
    const cx = pad + i * bw + bw / 2;
    const cy = H - 40 - (x.r / maxR) * 80;
    return `${cx},${cy}`;
  });
  w.months.forEach((x, i) => {
    const h = ((x.t - 15) / 18) * 110;
    const cx = pad + i * bw + bw / 2;
    const best = x.m >= 11 || x.m <= 4;
    bars += `<rect x="${cx - bw * 0.32}" y="${H - 40 - h}" width="${bw * 0.64}" height="${h}" rx="3"
      fill="${best ? '#2f9e6e' : '#8fb8d8'}" opacity="0.9"><title>${x.m}月 均温 ${x.t}℃ 降雨 ${x.r}mm</title></rect>`;
    bars += `<text x="${cx}" y="${H - 44 - h}" font-size="10" text-anchor="middle" fill="#334">${x.t}°</text>`;
    labels += `<text x="${cx}" y="${H - 20}" font-size="11" text-anchor="middle" fill="#555">${x.m}月</text>`;
  });
  $('#wxChart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="海南各月气温与降雨">
      <line x1="${pad}" y1="${H - 40}" x2="${W - pad}" y2="${H - 40}" stroke="#ccc"/>
      ${bars}
      <polyline points="${pts.join(' ')}" fill="none" stroke="#e08a3c" stroke-width="2" stroke-dasharray="4 3"/>
      ${pts.map(p => { const [a, b] = p.split(','); return `<circle cx="${a}" cy="${b}" r="2.5" fill="#e08a3c"/>`; }).join('')}
      ${labels}
    </svg>
    <div class="legend"><span><i style="background:#2f9e6e"></i>旱季（11-4月，推荐）</span>
    <span><i style="background:#8fb8d8"></i>雨季</span><span><i style="background:#e08a3c"></i>降雨量</span></div>`;

  $('#wxCity').innerHTML = w.cityDiff.map(c =>
    `<div class="citychip"><b>${c.c}</b><span>${c.t}</span><em>${c.note}</em></div>`).join('');
}

/* ---------- 轮渡 ---------- */
function renderFerry() {
  const f = TRIP.ferry;
  $('#ferryPolicy').innerHTML = `
    <div class="alert"><b>政策：</b>${f.policy}</div>
    <div class="kv"><span>进岛</span><b>${f.portIn}</b></div>
    <div class="kv"><span>出岛</span><b>${f.portOut}</b></div>
    <div class="kv"><span>航行时长</span><b>${f.duration}</b></div>
    <div class="kv"><span>到港要求</span><b>${f.arrive}</b></div>
    <div class="kv"><span>预约</span><b>${f.booking}</b></div>`;
  $('#ferrySched').innerHTML = f.schedule.map(t => `<span class="sched">${t}</span>`).join('') +
    `<p class="note">${f.scheduleNote}</p>`;
  $('#ferryPrice').innerHTML = f.price.map(p =>
    `<div class="kv"><span>${p.item}</span><b>${p.price}</b></div>`).join('') +
    `<div class="kv total"><span>4 人单程（车 374 + 3 成人×41.5，婴儿免）</span><b>¥${f.cost4.single}</b></div>
     <div class="kv total"><span>往返合计</span><b>¥${f.cost4.round}</b></div>`;
  $('#ferrySteps').innerHTML = f.steps.map((s, i) =>
    `<li><span class="num">${i + 1}</span>${s}</li>`).join('');
  $('#ferryWarn').innerHTML = f.warn.map(w => `<li>${w}</li>`).join('');
  $('#ferryPhone').textContent = f.phone;
}

/* ---------- 驾驶方案（3 人轮换 · 直达海口 / 万宁） ---------- */
function renderDrive() {
  const d = TRIP.drive;
  $('#driveRoute').innerHTML = `
    <div class="kv"><span>推荐路线</span><b>${esc(d.route)}</b></div>
    <div class="kv"><span>备选路线</span><b>${esc(d.routeAlt)}</b></div>
    <div class="kv"><span>总里程</span><b>${esc(d.distance)}</b></div>
    <div class="kv"><span>驾驶时长</span><b>${esc(d.pureDrive)}</b></div>`;
  $('#drivePlanNote').innerHTML = `<b>提醒：</b>${esc(d.planNote)}`;

  $('#drivePlans').innerHTML = d.plans.map(p => `
    <details class="plan ${p.id === 'A' ? 'rec' : ''} ${p.id === 'C' ? 'warnplan' : ''}" ${p.id === 'A' ? 'open' : ''}>
      <summary>
        <span class="ptag ${p.id}">${esc(p.tag)}</span>
        <span class="ptitle">${esc(p.title)}</span>
        <span class="chev">▾</span>
      </summary>
      <p class="pdesc">${esc(p.desc)}</p>
      <div class="pbody">
        <h4 style="margin:10px 0 2px;font-size:13px;color:var(--brand)">时间轴</h4>
        <ul class="tl">${p.timeline.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <div class="proscons">
          <div class="pclist good"><b>✅ 优点</b><ul>${p.pro.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
          <div class="pclist bad"><b>⚠️ 代价 / 风险</b><ul>${p.con.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        </div>
        <div class="fit"><b>适合谁：</b>${esc(p.fit)}</div>
      </div>
    </details>`).join('');

  $('#driveShifts').innerHTML = d.shifts.map(s => `
    <div class="srow">
      <span class="sname">${esc(s.seg)} · ${esc(s.who)}</span>
      <span class="sroad">${esc(s.km)}｜${esc(s.time)}</span>
      <span class="snote">${esc(s.rest)}</span>
    </div>`).join('');
  $('#shiftRules').innerHTML = d.shiftRule.map(r => `<li>${esc(r)}</li>`).join('');

  $('#driveStops').innerHTML = d.stops.map(s => `
    <div class="srow">
      <span class="sname">${esc(s.name)}</span>
      <span class="sroad">${esc(s.road)}｜${esc(s.km)}</span>
      <span class="snote">${esc(s.note)}</span>
    </div>`).join('');

  const c = d.charging;
  $('#chargeVerdict').innerHTML = `
    <div class="verdict"><b>结论：${esc(c.verdict)}</b><br>${esc(c.verdictDetail)}</div>
    ${TRIP.budget.carCompare.map(x => `
      <div class="carCmp">
        <b>${esc(x.car)}</b>
        <div class="cmp"><span>能源 ¥${esc(x.energy)}</span><span>过路 ¥${esc(x.toll)}</span></div>
        <div style="color:#1c7a52;font-size:12.5px">✅ ${esc(x.pros)}</div>
        <div style="color:#a35c14;font-size:12.5px;margin-top:3px">⚠️ ${esc(x.cons)}</div>
      </div>`).join('')}`;
  $('#superchargers').innerHTML = c.superchargers.map(s => `
    <div class="srow">
      <span class="sname">${esc(s.city)}</span>
      <span class="sroad"><span class="chip2">${esc(s.name)}</span></span>
      <span class="snote">${esc(s.spec)}</span>
    </div>`).join('');
  $('#xuwenCharge').innerHTML = c.xuwen.map(s => `
    <div class="srow">
      <span class="sname" style="min-width:60px">${esc(s.name)}</span>
      <span class="snote">${esc(s.spec)}</span>
    </div>`).join('');
  $('#chargeRisks').innerHTML = c.risks.map(r => `<li>${esc(r)}</li>`).join('');
}

/* ---------- 行程 ---------- */
function renderItin() {
  $('#itinList').innerHTML = TRIP.itinerary.map(d => `
    <details class="day" ${d.day === 1 ? 'open' : ''}>
      <summary>
        <span class="daynum">D${d.day}</span>
        <span class="daytitle"><b>${d.title}</b><em>${d.sub}</em></span>
      </summary>
      <div class="daybody">
        <div class="kv"><span>驾驶</span><b>${d.drive}</b></div>
        ${d.ferry ? `<div class="kv"><span>轮渡</span><b>${d.ferry}</b></div>` : ''}
        <div class="kv"><span>住宿</span><b>${d.stay}</b></div>
        <div class="kv"><span>当日花费</span><b>${d.cost}</b></div>
        <div class="kv"><span>安排</span><b>${d.spots.map(s => `<span class="pill">${s}</span>`).join('')}</b></div>
        <div class="tips"><b>提示</b><ul>${d.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>
      </div>
    </details>`).join('');
}

/* ---------- 城市 + 景点（核心交互） ---------- */
let currentCity = null;

function renderCityTabs() {
  $('#cityTabs').innerHTML = TRIP.cities.map((c, i) =>
    `<button class="tab ${i === 0 ? 'on' : ''}" data-city="${c.id}">
       <b>${c.name}</b><span class="pri">${c.badge}</span>
     </button>`).join('');
  $$('#cityTabs .tab').forEach(b => b.addEventListener('click', () => selectCity(b.dataset.city)));
}

function selectCity(id) {
  currentCity = id;
  $$('#cityTabs .tab').forEach(b => b.classList.toggle('on', b.dataset.city === id));
  const c = TRIP.cities.find(x => x.id === id);
  $('#cityIntro').innerHTML = `<p>${c.intro}</p><p class="stay">🏨 ${c.stay}</p>`;
  $('#spotCount').textContent = `${c.spots.length} 个景点 · 按推荐顺序`;
  $('#spotList').innerHTML = c.spots.map((s, i) => spotCard(s, c, i)).join('');
  $$('#spotList .spot-head').forEach(h => h.addEventListener('click', () => {
    const card = h.closest('.spot');
    card.classList.toggle('open');
  }));
  $('#spotSearch').value = '';
}

function spotCard(s, c, i) {
  return `
  <div class="spot" id="spot-${s.id}">
    <div class="spot-head">
      <span class="rank">${i + 1}</span>
      <div class="spot-main">
        <div class="spot-title">
          <b>${esc(s.name)}</b>
          <span class="rating">★ ${s.rating}</span>
          <span class="price">${esc(s.priceText)}</span>
        </div>
        <div class="spot-meta">
          <span>🕒 ${esc(s.openTime)}</span>
          <span>⏱ ${esc(s.duration)}</span>
        </div>
        <p class="spot-intro">${esc(s.intro)}</p>
        <div class="spot-tags">${s.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>
      <span class="chev">▾</span>
    </div>
    <div class="spot-detail">
      ${detailBlock('🎟 门票明细', s.tickets.map(t =>
        `<div class="kv"><span>${esc(t.type)}</span><b>${esc(t.price)}</b></div>`).join(''))}
      ${detailBlock('💰 内部收费 / 园内项目', s.internal.map(t =>
        `<div class="kv"><span>${esc(t.item)}</span><b>${esc(t.price)}</b></div>`).join(''))}
      ${detailBlock('📸 拍照地点', s.photos.map(p =>
        `<div class="photo"><b>${esc(p.s)}</b><em>${esc(p.d)}</em></div>`).join(''))}
      ${detailBlock('ℹ️ 关键信息', `
        <div class="kv"><span>是否需要预约</span><b>${esc(s.booking)}</b></div>
        <div class="kv"><span>建议游玩时长</span><b>${esc(s.duration)}</b></div>
        <div class="kv"><span>开放时间</span><b>${esc(s.openTime)}</b></div>
        <div class="kv"><span>亲子友好度</span><b>${esc(s.baby)}</b></div>
        <div class="kv"><span>地址</span><b>${esc(s.address)}</b></div>`)}
      ${s.tips && s.tips.length ? detailBlock('✅ 实用提示', `<ul class="tiplist">${s.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`) : ''}
      ${navButtons(s.name, c.name, 'spot:' + s.id)}
    </div>
  </div>`;
}

function detailBlock(title, inner) {
  return `<div class="dblock"><h4>${title}</h4><div class="dbody">${inner}</div></div>`;
}

/* 景点搜索 */
function initSearch() {
  $('#spotSearch').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    const c = TRIP.cities.find(x => x.id === currentCity);
    if (!c) return;
    $$('#spotList .spot').forEach(el => {
      const s = c.spots.find(x => `spot-${x.id}` === el.id);
      if (!s) return;
      const hay = (s.name + s.intro + s.tags.join('') + s.photos.map(p => p.s + p.d).join('')).toLowerCase();
      el.style.display = !q || hay.includes(q) ? '' : 'none';
    });
  });
}

/* ---------- 预算 + AA ---------- */
function renderBudget() {
  const b = TRIP.budget;
  $('#budgetTable').innerHTML = b.items.map(i =>
    `<div class="brow"><span class="bcat">${i.cat}</span><span class="bdet">${i.detail}</span>
      <b class="bnum">¥${i.low.toLocaleString()} ~ ${i.high.toLocaleString()}</b></div>`).join('') +
    `<div class="brow total"><span class="bcat">合计</span><span class="bdet">${b.note}</span>
      <b class="bnum">¥${b.totalLow.toLocaleString()} ~ ${b.totalHigh.toLocaleString()}</b></div>`;
  $('#aaNote').textContent = b.aaNote;
  calcAA();
}

function calcAA() {
  const toll = Number($('#aaToll').value) || 0;
  const fuel = Number($('#aaFuel').value) || 0;
  const n = Number($('#aaPeople').value) || 1;
  const total = toll + fuel;
  const b = TRIP.budget;
  $('#aaResult').innerHTML = `
    <div class="kv"><span>过路费（往返）</span><b>¥${toll.toLocaleString()}</b></div>
    <div class="kv"><span>路费（电/油）</span><b>¥${fuel.toLocaleString()}</b></div>
    <div class="kv total"><span>AA 合计</span><b>¥${total.toLocaleString()}</b></div>
    <div class="kv aa"><span>人均（${n} 人分摊）</span><b>¥${Math.round(total / n).toLocaleString()}</b></div>
    <p class="note" style="margin-top:8px">参考：若全程所有花费（含住宿/门票/餐饮）也按 ${n} 人平摊，
      人均约 <b>¥${Math.round(b.totalLow / n).toLocaleString()} ~ ¥${Math.round(b.totalHigh / n).toLocaleString()}</b>
      。${esc(b.perPerson.note)}</p>`;
}

function initAA() {
  $('#aaToll').value = TRIP.budget.aaBase.toll;
  $('#aaFuel').value = TRIP.budget.aaBase.fuel;
  $('#aaPeople').value = 4;
  ['#aaToll', '#aaFuel', '#aaPeople'].forEach(s => $(s).addEventListener('input', calcAA));
  $$('#aaBtns button').forEach(b => b.addEventListener('click', () => {
    $('#aaPeople').value = b.dataset.n;
    $$('#aaBtns button').forEach(x => x.classList.toggle('on', x === b));
    calcAA();
  }));
}

/* ---------- 亲子 ---------- */
function renderBaby() {
  $('#babyList').innerHTML = TRIP.babyTips.map(t =>
    `<div class="btip"><b>${t.t}</b><span>${t.d}</span></div>`).join('');
}

/* ---------- 美食（城市 → 早/正/夜 → 店铺详情） ---------- */
const MEALS = ['全部', '早餐', '正餐', '夜宵', '小吃'];
let foodCity = 'wanning', foodMeal = '全部';

function renderFoodTabs() {
  $('#foodTabs').innerHTML = FOOD.cityOrder.map(id => {
    const c = FOOD.cities[id];
    return `<button class="tab ${id === foodCity ? 'on' : ''}" data-fcity="${id}">
      <b>${c.name}</b><span class="pri">${c.badge}</span></button>`;
  }).join('');
  $$('#foodTabs .tab').forEach(b => b.addEventListener('click', () => {
    foodCity = b.dataset.fcity; foodMeal = '全部'; selectFoodCity();
  }));

  $('#mealChips').innerHTML = MEALS.map(m =>
    `<button class="mchip ${m === foodMeal ? 'on' : ''}" data-meal="${m}">${m}</button>`).join('');
  $$('#mealChips .mchip').forEach(b => b.addEventListener('click', () => {
    foodMeal = b.dataset.meal;
    $$('#mealChips .mchip').forEach(x => x.classList.toggle('on', x === b));
    selectFoodCity();
  }));
}

function selectFoodCity() {
  $$('#foodTabs .tab').forEach(b => b.classList.toggle('on', b.dataset.fcity === foodCity));
  const c = FOOD.cities[foodCity];
  $('#foodIntro').innerHTML = `<p>${c.intro}</p>`;
  const list = c.items.filter(i => foodMeal === '全部' || i.meal === foodMeal);
  $('#foodCount').textContent = `${list.length} 家${foodMeal === '全部' ? '' : ' · ' + foodMeal} · 按推荐顺序`;
  $('#foodList').innerHTML = list.length
    ? list.map((it, i) => foodCard(it, c.name, i)).join('')
    : '<p class="note">这一类暂无收录，切回「全部」看看。</p>';
  $$('#foodList .spot-head').forEach(h => h.addEventListener('click', () => {
    h.closest('.spot').classList.toggle('open');
  }));
}

function vbadge(v) {
  const cls = v.indexOf('单源') >= 0 ? 'v1' : (v.indexOf('3源') >= 0 || v.indexOf('4源') >= 0 ? 'v3' : 'v2');
  return `<span class="vbadge ${cls}">${esc(v)}</span>`;
}

/* 高德官方 POI 快照作为「权威源」补充展示（与自媒体数据互为交叉验证） */
function amapPoiNote(id) {
  const c = coordOf('food:' + id) || coordOf('spot:' + id);
  if (!c) return '';
  const nz = v => (Array.isArray(v) ? (v[0] || '') : (v == null ? '' : String(v)));
  const bits = [nz(c.poiName), nz(c.addr)];
  const tel = nz(c.tel), open = nz(c.open), rating = nz(c.rating), cost = nz(c.cost);
  if (tel) bits.push('☎ ' + tel);
  if (open) bits.push('🕒 ' + open);
  if (rating) bits.push('★ ' + rating);
  if (cost) bits.push('人均 ¥' + cost);
  return `<div class="vnote poi"><b>高德官方 POI（权威源）：</b>${esc(bits.join('｜'))}</div>`;
}

/* ---------- 实时地图（高德 JS API，无 key 自动降级） ---------- */
let mapObj = null, mapCity = 'wanning', mapKind = 'all';

function mapPoints() {
  const pts = [];
  const c = TRIP.cities.find(x => x.id === mapCity);
  if (c && mapKind !== 'food') c.spots.forEach(s => {
    const k = coordOf('spot:' + s.id);
    if (k) pts.push({ ...k, id: 'spot:' + s.id, name: s.name, kind: 'spot', extra: `${s.priceText} · ${s.duration}` });
  });
  const f = FOOD.cities[mapCity];
  if (f && mapKind !== 'spot') f.items.forEach(i => {
    const k = coordOf('food:' + i.id);
    if (k) pts.push({ ...k, id: 'food:' + i.id, name: i.name, kind: 'food', extra: `${i.meal} · 人均 ¥${i.per}` });
  });
  return pts;
}

function renderMapTabs() {
  $('#mapCityTabs').innerHTML = TRIP.cities.map(c =>
    `<button class="mchip ${c.id === mapCity ? 'on' : ''}" data-mcity="${c.id}">${c.name}</button>`).join('');
  $$('#mapCityTabs .mchip').forEach(b => b.addEventListener('click', () => {
    mapCity = b.dataset.mcity; renderMapTabs(); drawMap();
  }));
  $('#mapKindTabs').innerHTML = [['all', '全部'], ['spot', '只看景点'], ['food', '只看美食']].map(([k, t]) =>
    `<button class="mchip ${k === mapKind ? 'on' : ''}" data-mkind="${k}">${t}</button>`).join('');
  $$('#mapKindTabs .mchip').forEach(b => b.addEventListener('click', () => {
    mapKind = b.dataset.mkind; renderMapTabs(); drawMap();
  }));
}

function drawMap() {
  const pts = mapPoints();
  $('#mapCount').textContent = `${pts.length} 个点位`;
  if (!window.AMap) return;
  if (!mapObj) mapObj = new AMap.Map('amapBox', { zoom: 11, viewMode: '2D', resizeEnable: true });
  else mapObj.clearMap();
  const info = new AMap.InfoWindow({ offset: new AMap.Pixel(0, -28) });
  pts.forEach(p => {
    const color = p.kind === 'spot' ? '#0f7b8a' : '#e08a3c';
    const m = new AMap.Marker({
      position: [p.lng, p.lat], title: p.name,
      content: `<div style="background:${color};color:#fff;border-radius:8px;padding:3px 8px;
        font-size:12px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25)">${p.kind === 'spot' ? '🏝' : '🍽'} ${p.name}</div>`,
      offset: new AMap.Pixel(-30, -14)
    });
    m.on('click', () => {
      info.setContent(`<div style="font-size:13px;line-height:1.6;min-width:150px">
        <b>${esc(p.name)}</b><br><span style="color:#666">${esc(p.extra)}</span><br>
        <a href="${driveUri(p.name, '', p.id)}" target="_blank" rel="noopener">🚗 导航去这里</a></div>`);
      info.open(mapObj, [p.lng, p.lat]);
    });
    mapObj.add(m);
  });
  if (pts.length) mapObj.setFitView();
}

function initAmap() {
  renderMapTabs();
  const key = (typeof AMAP !== 'undefined' && AMAP.webKey) || '';
  if (!key) {
    $('#amapBox').innerHTML = `<div class="alert">未检测到高德 Web 端 Key（config.js 缺失或为空）→
      已自动降级：每张卡片里的「📍地图定位 / 🚗驾车导航」按钮走腾讯地图 URI（免 key、公网可用）。
      把 config.example.js 复制为 config.js 并填入 Key 后刷新，即可看到下面的实时地图。</div>`;
    $('#mapCount').textContent = `${mapPoints().length} 个点位（未渲染）`;
    return;
  }
  if (typeof AMAP !== 'undefined' && AMAP.securityCode) window._AMapSecurityConfig = { securityJsCode: AMAP.securityCode };
  const s = document.createElement('script');
  s.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`;
  s.onload = drawMap;
  s.onerror = () => {
    $('#amapBox').innerHTML = `<div class="alert">高德地图脚本加载失败（多为域名白名单未配置或网络问题）。
      已降级：卡片内导航按钮仍可正常使用。</div>`;
  };
  document.head.appendChild(s);
}

function foodCard(it, city, i) {
  const mealClass = { '早餐': 'm1', '正餐': 'm2', '夜宵': 'm3', '小吃': 'm4' }[it.meal] || 'm4';
  return `
  <div class="spot">
    <div class="spot-head">
      <span class="rank">${i + 1}</span>
      <div class="spot-main">
        <div class="spot-title">
          <b>${esc(it.name)}</b>
          <span class="meal ${mealClass}">${esc(it.meal)}</span>
          <span class="price">人均 ¥${esc(it.per)}</span>
        </div>
        <div class="spot-meta">
          <span>🕒 ${esc(it.hours)}</span>
        </div>
        <p class="spot-intro">${it.dishes.slice(0, 3).map(d => esc(d.n)).join(' · ')}</p>
        <div class="spot-tags">
          <span class="tag">🍽 人均 ¥${esc(it.per)}</span>
          <span class="tag">🚗 ${esc(it.park)}</span>
          ${vbadge(it.verify)}
        </div>
      </div>
      <span class="chev">▾</span>
    </div>
    <div class="spot-detail">
      ${detailBlock('🍽 推荐菜品与价格', it.dishes.map(d =>
        `<div class="kv"><span>${esc(d.n)}</span><b>${esc(d.p)}</b></div>`).join(''))}
      ${detailBlock('ℹ️ 店铺信息', `
        <div class="kv"><span>营业时间</span><b>${esc(it.hours)}</b></div>
        <div class="kv"><span>人均消费</span><b>¥${esc(it.per)}</b></div>
        <div class="kv"><span>地址</span><b>${esc(it.addr)}</b></div>
        <div class="kv"><span>停车</span><b>${esc(it.park)}</b></div>
        <div class="kv"><span>排队 / 预约</span><b>${esc(it.queue)}</b></div>
        <div class="kv"><span>带娃友好度</span><b>${esc(it.baby)}</b></div>`)}
      ${detailBlock('✅ 点单与避坑提示', `<ul class="tiplist">${it.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`)}
      <div class="vnote"><b>交叉验证：</b>${vbadge(it.verify)} ${esc(it.vnote)}</div>
      ${amapPoiNote(it.id)}
      ${navButtons(it.name, city, 'food:' + it.id)}
    </div>
  </div>`;
}

function renderFoodExtra() {
  $('#foodMethod').innerHTML = `<b>方法：</b>${FOOD.method}　·　<b>表决规则：</b>${FOOD.rule}`;
  $('#seafoodRules').innerHTML = FOOD.seafoodRules.map(r =>
    `<div class="rule"><b>${esc(r.t)}</b><span>${esc(r.d)}</span>${vbadge(r.v)}</div>`).join('');
  $('#babyFoodList').innerHTML = FOOD.babyFood.map(f =>
    `<div class="btip"><b>${esc(f.t)}</b><span>${esc(f.d)}</span></div>`).join('');
}

/* ---------- 导航高亮 ---------- */
function initNav() {
  const links = $$('#nav a');
  const secs = links.map(a => $(a.getAttribute('href')));
  window.addEventListener('scroll', () => {
    const y = window.scrollY + 120;
    let idx = 0;
    secs.forEach((s, i) => { if (s && s.offsetTop <= y) idx = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === idx));
  }, { passive: true });
}

/* ---------- 启动 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderMeta();
  renderWeather();
  renderFerry();
  renderDrive();
  renderItin();
  renderCityTabs();
  selectCity(TRIP.cities[0].id);
  initSearch();
  renderBudget();
  initAA();
  renderBaby();
  renderFoodTabs();
  selectFoodCity();
  renderFoodExtra();
  initAmap();
  initNav();
  $('#updated').textContent = TRIP.meta.update;
});
