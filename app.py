#!/usr/bin/env python3
"""
おきなわ制服マーケット - Flask Backend
"""

import json
import os
from datetime import datetime
from flask import Flask, jsonify, request, render_template, abort

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'listings.json')
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:5001')
# Google AdSense パブリッシャーID (例: ca-pub-1234567890123456)
ADSENSE_CLIENT = os.environ.get('ADSENSE_CLIENT', '')


def load_listings():
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_listings(listings):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(listings, f, ensure_ascii=False, indent=2)


def format_price(price, price_type):
    if price_type == 'free' or price == 0:
        return '無料'
    return f'¥{price:,}'


@app.context_processor
def inject_globals():
    """全テンプレートで共通変数を利用可能にする"""
    return dict(adsense_client=ADSENSE_CLIENT)


# ===== PAGES =====

@app.route('/')
def index():
    listings = load_listings()
    listings.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    schools = sorted(set(l['school'] for l in listings))
    stats = {
        'listings': len(listings),
        'schools': len(schools),
        'transactions': max(0, len(listings) - 2),
    }
    return render_template('index.html',
        listings=listings[:12],
        schools=schools,
        stats=stats)


@app.route('/search')
def search_page():
    q = request.args.get('q', '')
    school = request.args.get('school', '')
    type_ = request.args.get('type', '')
    size = request.args.get('size', '')
    price = request.args.get('price', '')
    condition = request.args.get('condition', '')
    sort = request.args.get('sort', 'newest')

    listings = load_listings()
    schools = sorted(set(l['school'] for l in listings))

    parts = []
    if q:
        parts.append(q)
    if school:
        parts.append(school)
    if type_:
        parts.append(type_)
    seo_title = '・'.join(parts) if parts else '出品一覧'

    return render_template('search.html',
        q=q, school=school, type_=type_, size=size,
        price=price, condition=condition, sort=sort,
        schools=schools, seo_title=seo_title,
        base_url=BASE_URL)


@app.route('/listing/<int:listing_id>')
def listing_detail(listing_id):
    listings = load_listings()
    item = next((l for l in listings if l['id'] == listing_id), None)
    if not item:
        abort(404)

    related = [l for l in listings if l['school'] == item['school'] and l['id'] != listing_id][:4]

    price_str = format_price(item['price'], item['price_type'])
    description_excerpt = item['description'][:120].replace('\n', ' ')
    condition_short = item['condition'].replace('（', '(').replace('）', ')').split('(')[0].strip()

    return render_template('listing.html',
        item=item,
        related=related,
        price_str=price_str,
        description_excerpt=description_excerpt,
        condition_short=condition_short,
        base_url=BASE_URL)


@app.route('/post')
def post_page():
    return render_template('post.html')


@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


# ===== API =====

@app.route('/api/listings', methods=['GET'])
def get_listings():
    listings = load_listings()
    listings.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return jsonify({'listings': listings, 'total': len(listings)})


@app.route('/api/listings/<int:listing_id>', methods=['GET'])
def get_listing_api(listing_id):
    listings = load_listings()
    item = next((l for l in listings if l['id'] == listing_id), None)
    if not item:
        return jsonify({'error': '出品が見つかりません'}), 404
    return jsonify(item)


@app.route('/api/listings', methods=['POST'])
def create_listing():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'データが不正です'}), 400

    required = ['school', 'type', 'gender', 'size', 'condition',
                'title', 'description', 'name', 'contact_method', 'contact_info']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field}は必須です'}), 400

    listings = load_listings()
    new_id = max((l['id'] for l in listings), default=0) + 1

    new_listing = {
        'id': new_id,
        'school': data['school'],
        'type': data['type'],
        'gender': data['gender'],
        'size': data['size'],
        'condition': data['condition'],
        'price_type': data.get('price_type', 'paid'),
        'price': int(data.get('price', 0)),
        'title': data['title'],
        'description': data['description'],
        'name': data['name'],
        'contact_method': data['contact_method'],
        'contact_info': data['contact_info'],
        'delivery': data.get('delivery', []),
        'location': data.get('location', ''),
        'images': data.get('images', []),
        'created_at': datetime.now().isoformat(),
    }

    listings.append(new_listing)
    save_listings(listings)

    return jsonify({'success': True, 'id': new_id, 'listing': new_listing}), 201


@app.route('/api/listings/<int:listing_id>', methods=['DELETE'])
def delete_listing(listing_id):
    listings = load_listings()
    original_len = len(listings)
    listings = [l for l in listings if l['id'] != listing_id]
    if len(listings) == original_len:
        return jsonify({'error': '出品が見つかりません'}), 404
    save_listings(listings)
    return jsonify({'success': True})


@app.route('/api/stats', methods=['GET'])
def get_stats():
    listings = load_listings()
    schools = len(set(l['school'] for l in listings))
    return jsonify({
        'listings': len(listings),
        'schools': schools,
        'transactions': max(0, len(listings) - 2),
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') != 'production'
    print("=" * 50)
    print("🌺 おきなわ制服マーケット")
    print("=" * 50)
    print(f"🚀 サーバー起動中: http://localhost:{port}")
    print("=" * 50)
    app.run(debug=debug, port=port, host='0.0.0.0')
