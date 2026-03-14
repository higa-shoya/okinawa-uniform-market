// ===== APP.JS =====
let allListings = [];
let filteredListings = [];
let displayCount = 12;
const PAGE_SIZE = 12;

const CONDITION_CLASSES = {
  '新品同様': 'condition-new',
  '良好': 'condition-good',
  '普通': 'condition-fair',
  '使用感あり': 'condition-used',
};

const UNIFORM_EMOJIS = {
  '夏服': '👔', '冬服': '🧥', '体操服': '🩱', 'ブレザー': '🧣',
  'セット': '👕', 'default': '👘',
};

function getEmoji(type) {
  for (const [k, v] of Object.entries(UNIFORM_EMOJIS)) {
    if (type && type.includes(k)) return v;
  }
  return UNIFORM_EMOJIS.default;
}

function formatPrice(price, isFree) {
  if (isFree || price === 0) return '無料';
  return '¥' + Number(price).toLocaleString();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'たった今';
  if (diff < 3600) return Math.floor(diff / 60) + '分前';
  if (diff < 86400) return Math.floor(diff / 3600) + '時間前';
  if (diff < 604800) return Math.floor(diff / 86400) + '日前';
  return d.toLocaleDateString('ja-JP');
}

function conditionClass(c) {
  return CONDITION_CLASSES[c.replace(/（.*?）/, '').trim()] || '';
}

function createCard(item) {
  const isFree = item.price_type === 'free' || item.price === 0;
  const priceStr = formatPrice(item.price, isFree);
  const emoji = getEmoji(item.type);
  const cond = item.condition.replace(/（.*?）/, '').trim();

  return `
    <div class="listing-card" onclick="openModal(${item.id})">
      <div class="card-image-wrap">
        ${item.images && item.images[0]
          ? `<img src="${item.images[0]}" alt="${item.title}" loading="lazy">`
          : `<span>${emoji}</span>`}
        <span class="card-badge ${isFree ? 'free' : ''}">${priceStr}</span>
      </div>
      <div class="card-body">
        <div class="card-school">${item.school}</div>
        <div class="card-title">${item.title}</div>
        <div class="card-meta">
          <span class="tag">${item.size}</span>
          <span class="tag">${item.gender}</span>
          <span class="tag ${conditionClass(item.condition)}">${cond}</span>
        </div>
        <div class="card-footer">
          <span class="card-price ${isFree ? 'free' : ''}">${priceStr}</span>
          <span class="card-date">${formatDate(item.created_at)}</span>
        </div>
      </div>
    </div>`;
}

function renderListings() {
  const grid = document.getElementById('listingsGrid');
  const empty = document.getElementById('emptyState');
  const loadMore = document.getElementById('loadMoreWrap');
  const countEl = document.getElementById('resultsCount');

  if (filteredListings.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    loadMore.style.display = 'none';
    countEl.textContent = '';
    return;
  }

  empty.style.display = 'none';
  const toShow = filteredListings.slice(0, displayCount);
  grid.innerHTML = toShow.map(createCard).join('');
  countEl.textContent = filteredListings.length + '件';
  loadMore.style.display = filteredListings.length > displayCount ? 'block' : 'none';
}

function applyFilters() {
  const school = document.getElementById('filterSchool').value;
  const type = document.getElementById('filterType').value;
  const size = document.getElementById('filterSize').value;
  const price = document.getElementById('filterPrice').value;
  const condition = document.getElementById('filterCondition').value;
  const sort = document.getElementById('sortBy').value;
  const search = document.getElementById('heroSearch')?.value.toLowerCase() || '';

  filteredListings = allListings.filter(item => {
    if (school && item.school !== school) return false;
    if (type && !item.type.includes(type)) return false;
    if (size && item.size !== size) return false;
    if (condition && !item.condition.includes(condition)) return false;
    if (search && !item.title.toLowerCase().includes(search) &&
        !item.school.toLowerCase().includes(search) &&
        !item.description.toLowerCase().includes(search)) return false;
    if (price === 'free' && !(item.price_type === 'free' || item.price === 0)) return false;
    if (price === 'under1000' && item.price > 1000) return false;
    if (price === 'under3000' && item.price > 3000) return false;
    if (price === 'under5000' && item.price > 5000) return false;
    return true;
  });

  // Sort
  if (sort === 'price_asc') {
    filteredListings.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    filteredListings.sort((a, b) => b.price - a.price);
  } else {
    filteredListings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  displayCount = PAGE_SIZE;
  renderListings();
}

function doSearch() {
  applyFilters();
  document.querySelector('.main').scrollIntoView({ behavior: 'smooth' });
}

function filterBySchool(school) {
  document.getElementById('filterSchool').value = school;
  applyFilters();
  document.querySelector('.main').scrollIntoView({ behavior: 'smooth' });
}

function clearFilters() {
  document.getElementById('filterSchool').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterSize').value = '';
  document.getElementById('filterPrice').value = '';
  document.getElementById('filterCondition').value = '';
  document.getElementById('sortBy').value = 'newest';
  if (document.getElementById('heroSearch')) document.getElementById('heroSearch').value = '';
  applyFilters();
}

function loadMore() {
  displayCount += PAGE_SIZE;
  renderListings();
}

// ===== MODAL =====
function openModal(id) {
  const item = allListings.find(l => l.id === id);
  if (!item) return;

  const isFree = item.price_type === 'free' || item.price === 0;
  const priceStr = formatPrice(item.price, isFree);
  const emoji = getEmoji(item.type);
  const cond = item.condition.replace(/（.*?）/, '').trim();
  const deliveryStr = Array.isArray(item.delivery) ? item.delivery.join('・') : item.delivery;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-image-carousel">
      <div class="modal-image-main">
        ${item.images && item.images[0]
          ? `<img src="${item.images[0]}" alt="${item.title}">`
          : `<span>${emoji}</span>`}
      </div>
    </div>
    <div class="modal-detail-school">${item.school}</div>
    <div class="modal-detail-title">${item.title}</div>
    <div class="modal-detail-price ${isFree ? 'free' : ''}">${priceStr}</div>
    <div class="modal-detail-tags">
      <span class="tag">${item.type}</span>
      <span class="tag">${item.size}</span>
      <span class="tag">${item.gender}</span>
      <span class="tag ${conditionClass(item.condition)}">${cond}</span>
    </div>
    <div class="modal-detail-desc">${item.description.replace(/\n/g, '<br>')}</div>
    <div class="modal-detail-info">
      <div class="info-row">
        <span class="info-label">投稿者</span>
        <span class="info-value">${item.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">引き渡し方法</span>
        <span class="info-value">${deliveryStr || '要相談'}</span>
      </div>
      ${item.location ? `<div class="info-row">
        <span class="info-label">引き渡し場所</span>
        <span class="info-value">${item.location}</span>
      </div>` : ''}
      <div class="info-row">
        <span class="info-label">投稿日</span>
        <span class="info-value">${formatDate(item.created_at)}</span>
      </div>
    </div>
    <div class="contact-box">
      <h3>📱 連絡先</h3>
      <div class="contact-method">${item.contact_method}</div>
      <div class="contact-info">${item.contact_info}</div>
    </div>
  `;
  document.getElementById('modalOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ===== SCHOOLS DROPDOWN =====
function populateSchoolFilter(schools) {
  const sel = document.getElementById('filterSchool');
  if (!sel) return;
  schools.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sel.appendChild(opt);
  });
}

// ===== INIT =====
async function init() {
  try {
    const res = await fetch('/api/listings');
    const data = await res.json();
    allListings = data.listings || [];

    // Stats
    const statsRes = await fetch('/api/stats');
    const stats = await statsRes.json();
    document.getElementById('statListings').textContent = stats.listings;
    document.getElementById('statSchools').textContent = stats.schools;
    document.getElementById('statTransactions').textContent = stats.transactions;

    // Schools for filter
    const schools = [...new Set(allListings.map(l => l.school))].sort();
    populateSchoolFilter(schools);

    filteredListings = [...allListings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderListings();
  } catch (e) {
    console.error(e);
    document.getElementById('listingsGrid').innerHTML =
      '<div class="loading-state"><p>データの読み込みに失敗しました</p></div>';
  }
}

init();
