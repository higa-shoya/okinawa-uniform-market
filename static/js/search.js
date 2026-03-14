// ===== SEARCH.JS =====
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

function getEmoji(type) {
  if (!type) return '👘';
  if (type.includes('夏服')) return '👔';
  if (type.includes('冬服') || type.includes('ブレザー')) return '🧥';
  if (type.includes('体操')) return '🩱';
  return '👘';
}

function formatPrice(price, priceType) {
  if (priceType === 'free' || price === 0) return '無料';
  return '¥' + Number(price).toLocaleString();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const diff = Math.floor((new Date() - d) / 86400000);
  if (diff === 0) return '今日';
  if (diff === 1) return '昨日';
  if (diff < 7) return diff + '日前';
  return d.toLocaleDateString('ja-JP');
}

function conditionShort(c) {
  return c.split('（')[0].trim();
}

function conditionClass(c) {
  const short = conditionShort(c);
  return CONDITION_CLASSES[short] || '';
}

function createCard(item) {
  const isFree = item.price_type === 'free' || item.price === 0;
  const priceStr = formatPrice(item.price, item.price_type);
  const emoji = getEmoji(item.type);
  const cond = conditionShort(item.condition);

  return `
    <a href="/listing/${item.id}" class="listing-card listing-card-link">
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
    </a>`;
}

// Get initial params from data attributes set by Flask
function getInitialParams() {
  const main = document.querySelector('main[data-q]');
  return {
    q: main?.dataset.q || '',
    school: main?.dataset.school || '',
    type_: main?.dataset.type || '',
    size: main?.dataset.size || '',
    price: main?.dataset.price || '',
    condition: main?.dataset.condition || '',
    sort: main?.dataset.sort || 'newest',
  };
}

function buildURLParams() {
  const p = new URLSearchParams();
  const q = document.getElementById('searchInput')?.value.trim() || '';
  const school = document.getElementById('filterSchool').value;
  const type_ = document.getElementById('filterType').value;
  const size = document.getElementById('filterSize').value;
  const price = document.getElementById('filterPrice').value;
  const condition = document.getElementById('filterCondition').value;
  const sort = document.getElementById('sortBy').value;

  if (q) p.set('q', q);
  if (school) p.set('school', school);
  if (type_) p.set('type', type_);
  if (size) p.set('size', size);
  if (price) p.set('price', price);
  if (condition) p.set('condition', condition);
  if (sort && sort !== 'newest') p.set('sort', sort);
  return p;
}

function updateURL() {
  const params = buildURLParams();
  const newURL = '/search' + (params.toString() ? '?' + params.toString() : '');
  window.history.replaceState({}, '', newURL);
}

function applyFilters() {
  const q = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
  const school = document.getElementById('filterSchool').value;
  const type_ = document.getElementById('filterType').value;
  const size = document.getElementById('filterSize').value;
  const price = document.getElementById('filterPrice').value;
  const condition = document.getElementById('filterCondition').value;
  const sort = document.getElementById('sortBy').value;

  filteredListings = allListings.filter(item => {
    if (q && !item.title.toLowerCase().includes(q) &&
        !item.school.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q)) return false;
    if (school && item.school !== school) return false;
    if (type_ && !item.type.includes(type_)) return false;
    if (size && item.size !== size) return false;
    if (condition && !item.condition.includes(condition)) return false;
    if (price === 'free' && !(item.price_type === 'free' || item.price === 0)) return false;
    if (price === 'under1000' && item.price > 1000) return false;
    if (price === 'under3000' && item.price > 3000) return false;
    if (price === 'under5000' && item.price > 5000) return false;
    return true;
  });

  if (sort === 'price_asc') filteredListings.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') filteredListings.sort((a, b) => b.price - a.price);
  else filteredListings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  displayCount = PAGE_SIZE;
  updateURL();
  updateActiveFilters();
  renderListings();
}

function updateActiveFilters() {
  const container = document.getElementById('activeFilters');
  const chips = [];
  const q = document.getElementById('searchInput')?.value.trim() || '';
  const school = document.getElementById('filterSchool').value;
  const type_ = document.getElementById('filterType').value;
  const size = document.getElementById('filterSize').value;
  const price = document.getElementById('filterPrice').value;
  const condition = document.getElementById('filterCondition').value;

  if (q) chips.push({ label: `"${q}"`, clear: () => { document.getElementById('searchInput').value = ''; applyFilters(); } });
  if (school) chips.push({ label: school, clear: () => { document.getElementById('filterSchool').value = ''; applyFilters(); } });
  if (type_) chips.push({ label: type_, clear: () => { document.getElementById('filterType').value = ''; applyFilters(); } });
  if (size) chips.push({ label: 'サイズ: ' + size, clear: () => { document.getElementById('filterSize').value = ''; applyFilters(); } });
  if (price) chips.push({ label: { free: '無料のみ', under1000: '〜1,000円', under3000: '〜3,000円', under5000: '〜5,000円' }[price], clear: () => { document.getElementById('filterPrice').value = ''; applyFilters(); } });
  if (condition) chips.push({ label: condition, clear: () => { document.getElementById('filterCondition').value = ''; applyFilters(); } });

  if (chips.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = chips.map((c, i) =>
    `<span class="active-filter-chip">${c.label} <button onclick="window.__clearFilter(${i})">✕</button></span>`
  ).join('');

  window.__clearFilter = (i) => chips[i].clear();
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
  grid.innerHTML = filteredListings.slice(0, displayCount).map(createCard).join('');
  countEl.textContent = filteredListings.length + '件';
  loadMore.style.display = filteredListings.length > displayCount ? 'block' : 'none';
}

function doSearch() {
  applyFilters();
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterSchool').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterSize').value = '';
  document.getElementById('filterPrice').value = '';
  document.getElementById('filterCondition').value = '';
  document.getElementById('sortBy').value = 'newest';
  applyFilters();
}

function loadMore() {
  displayCount += PAGE_SIZE;
  renderListings();
}

// Search on Enter key
document.getElementById('searchInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') applyFilters();
});

async function init() {
  try {
    const res = await fetch('/api/listings');
    const data = await res.json();
    allListings = data.listings || [];
    applyFilters(); // Apply initial params from URL (already set in dropdowns by Flask)
  } catch (e) {
    document.getElementById('listingsGrid').innerHTML =
      '<div class="loading-state"><p>データの読み込みに失敗しました</p></div>';
  }
}

init();
