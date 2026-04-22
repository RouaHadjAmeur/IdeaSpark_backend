# n8n Workflow Setup - Manual Code Entry

Follow these exact steps to make the workflow work:

## 1. Import Workflow
- Download `TRENDS_WORKFLOW_WORKING.json`
- n8n UI → Workflows → Import → Select file
- Let it import

## 2. Replace NewsAPI Keys (FIRST - do this immediately)

**Node: "Fetch Tunisia"**
- URL field: Replace `REPLACE_WITH_YOUR_NEWSAPI_KEY` with your actual key from https://newsapi.org

**Node: "Fetch Global"**
- URL field: Replace `REPLACE_WITH_YOUR_NEWSAPI_KEY` with your actual key

---

## 3. Add Code to Each Code Node (Copy-paste EXACTLY)

### Node: "Extract TN Articles"
Open the node → Click Code tab → Replace ALL code with:

```javascript
const articles = $json.articles || [];
return articles.map(art => ({
  json: {
    title: art.title,
    description: art.description || '',
    url: art.url,
    urlToImage: art.urlToImage,
    source: art.source.name,
    publishedAt: art.publishedAt,
    geo: 'TN',
    language: 'fr'
  }
}));
```

### Node: "Extract Global Articles"
Open the node → Click Code tab → Replace ALL code with:

```javascript
const articles = $json.articles || [];
return articles.map(art => ({
  json: {
    title: art.title,
    description: art.description || '',
    url: art.url,
    urlToImage: art.urlToImage,
    source: art.source.name,
    publishedAt: art.publishedAt,
    geo: 'GLOBAL',
    language: 'en'
  }
}));
```

### Node: "Categorize"
Open the node → Click Code tab → Replace ALL code with:

```javascript
const text = ($json.title + ' ' + $json.description).toLowerCase();
const niches = {
  tech: ['ai', 'software', 'tech', 'startup', 'app', 'digital', 'cloud'],
  business: ['business', 'company', 'market', 'economy', 'trade'],
  sports: ['sport', 'football', 'soccer', 'game', 'match'],
  politics: ['political', 'government', 'election', 'vote'],
  entertainment: ['movie', 'music', 'actor', 'show'],
  health: ['health', 'medical', 'doctor', 'vaccine'],
  science: ['science', 'research', 'discover', 'study'],
  finance: ['stock', 'crypto', 'investment', 'bank'],
  general: ['news', 'update', 'report']
};
let niche = 'general';
for (const [cat, words] of Object.entries(niches)) {
  if (words.some(w => text.includes(w))) {
    niche = cat;
    break;
  }
}
return {
  json: {
    ...$json,
    niche: niche,
    summary: ($json.description || $json.title).substring(0, 100),
    volume: 'N/A'
  }
};
```

### Node: "Map Schema"
Open the node → Click Code tab → Replace ALL code with:

```javascript
return {
  json: {
    topic: $json.title,
    summary: $json.summary || $json.description || $json.title,
    volume: 'N/A',
    source: 'newsapi',
    language: $json.language,
    geo: $json.geo,
    niche: $json.niche,
    trendDate: new Date($json.publishedAt).toISOString()
  }
};
```

### Node: "Batch Trends"
Open the node → Click Code tab → Replace ALL code with:

```javascript
const items = $input.all();
const trends = items.map(i => i.json).filter(t => t.topic);
return {
  json: {
    trends: trends,
    count: trends.length,
    timestamp: new Date().toISOString()
  }
};
```

---

## 4. Test
- Save workflow
- Click **Execute Workflow**
- All nodes should be green ✅

## 5. Enable Auto-Schedule
- Click **Save & Activate**
- Runs every 2 hours

---

**If error persists:**
1. Check Mode dropdown in each Code node:
   - Extract nodes: `Run Once for All Items`
   - Categorize + Map Schema: `Run Once for Each Item`
   - Batch: `Run Once for All Items`

Done! ✅

