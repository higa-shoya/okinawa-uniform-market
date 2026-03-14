#!/bin/bash
cd "$(dirname "$0")"
echo "🌺 おきなわ制服マーケット を起動します..."
echo "📦 依存関係をインストール中..."
/usr/bin/python3 -m pip install flask --quiet
echo "🚀 サーバー起動中: http://localhost:5001"
/usr/bin/python3 app.py
