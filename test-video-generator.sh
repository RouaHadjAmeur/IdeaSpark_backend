#!/bin/bash

# 🎬 Script de test du Générateur Vidéo

BASE_URL="http://localhost:3000"
TOKEN="your_jwt_token_here"

echo "🎬 =========================================="
echo "🎬 Test du Générateur Vidéo"
echo "🎬 =========================================="
echo ""

# Test 1: Générer une vidéo
echo "1️⃣ Test: Générer une vidéo"
echo "POST $BASE_URL/video-generator/generate"
echo ""

curl -X POST "$BASE_URL/video-generator/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "sunset beach waves",
    "category": "nature",
    "duration": "medium",
    "orientation": "landscape"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "---"
echo ""

# Test 2: Récupérer l'historique
echo "2️⃣ Test: Récupérer l'historique"
echo "GET $BASE_URL/video-generator/history"
echo ""

curl -X GET "$BASE_URL/video-generator/history?limit=10&skip=0" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "---"
echo ""

# Test 3: Récupérer une vidéo spécifique
echo "3️⃣ Test: Récupérer une vidéo spécifique"
echo "GET $BASE_URL/video-generator/{videoId}"
echo ""
echo "⚠️ Remplacez {videoId} par un ID réel de l'historique"
echo ""

# Test 4: Supprimer une vidéo
echo "4️⃣ Test: Supprimer une vidéo"
echo "DELETE $BASE_URL/video-generator/{videoId}"
echo ""
echo "⚠️ Remplacez {videoId} par un ID réel"
echo ""

echo "✅ Tests terminés"
