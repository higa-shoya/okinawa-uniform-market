// ===== POST.JS =====
let uploadedImages = [];

function updateSchoolOther() {
  const sel = document.getElementById('schoolSelect');
  const group = document.getElementById('schoolOtherGroup');
  group.style.display = sel.value === 'other' ? 'block' : 'none';
}

function togglePrice() {
  const isFree = document.querySelector('[name="price_type"]:checked').value === 'free';
  document.getElementById('priceInputWrap').style.display = isFree ? 'none' : 'flex';
  if (isFree) document.getElementById('priceInput').value = '0';
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files);
  const remaining = 4 - uploadedImages.length;
  const toAdd = files.slice(0, remaining);

  toAdd.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImages.push(e.target.result);
      renderPreviews();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('uploadPlaceholder').style.display = 'none';
}

function removeImage(index) {
  uploadedImages.splice(index, 1);
  renderPreviews();
}

function renderPreviews() {
  const container = document.getElementById('imagePreviews');
  const placeholder = document.getElementById('uploadPlaceholder');

  if (uploadedImages.length === 0) {
    placeholder.style.display = 'block';
    container.innerHTML = '';
    return;
  }

  placeholder.style.display = 'none';
  container.innerHTML = uploadedImages.map((src, i) => `
    <div class="preview-thumb">
      <img src="${src}" alt="preview">
      <button class="preview-remove" onclick="removeImage(${i}); event.stopPropagation();">✕</button>
    </div>
  `).join('');

  if (uploadedImages.length < 4) {
    container.innerHTML += `
      <div class="preview-thumb" style="display:flex;align-items:center;justify-content:center;cursor:pointer;background:#f5f5f5;"
           onclick="document.getElementById('imageInput').click(); event.stopPropagation();">
        <span style="font-size:24px;color:#999;">+</span>
      </div>`;
  }
}

function updateCount(el, countId) {
  document.getElementById(countId).textContent = el.value.length;
}

// Title count
document.querySelector('[name="title"]')?.addEventListener('input', function() {
  document.getElementById('titleCount').textContent = this.value.length;
});

async function submitPost(event) {
  event.preventDefault();
  const form = document.getElementById('postForm');
  const formData = new FormData(form);

  // Build payload
  const schoolSel = document.getElementById('schoolSelect').value;
  const school = schoolSel === 'other'
    ? formData.get('school_other')
    : schoolSel;

  const deliveries = formData.getAll('delivery');
  const isFree = formData.get('price_type') === 'free';

  const payload = {
    school: school || formData.get('school'),
    type: formData.get('type'),
    gender: formData.get('gender'),
    size: formData.get('size'),
    condition: formData.get('condition'),
    price_type: formData.get('price_type'),
    price: isFree ? 0 : parseInt(formData.get('price') || 0),
    title: formData.get('title'),
    description: formData.get('description'),
    name: formData.get('name'),
    contact_method: formData.get('contact_method'),
    contact_info: formData.get('contact_info'),
    delivery: deliveries,
    location: formData.get('location') || '',
    images: uploadedImages,
  };

  // Validate
  if (!payload.school || !payload.type || !payload.gender || !payload.size ||
      !payload.condition || !payload.title || !payload.description ||
      !payload.name || !payload.contact_method || !payload.contact_info) {
    alert('必須項目をすべて入力してください');
    return;
  }

  try {
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = '出品中...';

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      document.getElementById('successModal').style.display = 'flex';
    } else {
      const err = await res.json();
      alert('エラーが発生しました: ' + (err.error || '不明なエラー'));
      btn.disabled = false;
      btn.textContent = '出品する';
    }
  } catch (e) {
    alert('通信エラーが発生しました。再度お試しください。');
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = false;
    btn.textContent = '出品する';
  }
}
