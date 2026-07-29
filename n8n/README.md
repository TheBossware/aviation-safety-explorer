# n8n Workflow — Aviation Safety Dashboard (JSON API)

Bu klasördeki `Aviation Safety Dashboard (JSON API).json` dosyası, orijinal
workflow'un **HTML üreten** sürümünün, Safety Explorer sitesinin beklediği
**JSON'u** döndürecek şekilde güncellenmiş halidir.

## Ne değişti?
Orijinal workflow sonunda tek bir HTML sayfası döndürüyordu. Yeni sürümde son iki
node değiştirildi:

| Eski node | Yeni node | Ne yapar |
|-----------|-----------|----------|
| `Build Page` (HTML üretir) | `Build JSON` | Mongo kayıtlarını sitenin `ApiResponse` şemasına eşler |
| `Respond HTML` | `Respond JSON` | `Content-Type: application/json` ile JSON döndürür (CORS açık) |

Webhook yolu (`/webhook/aviation-dashboard`), MongoDB ve Aggregate node'ları
**aynen korundu** — yani `NEXT_PUBLIC_N8N_API_URL` değişmeden çalışır.

## Döndürülen JSON şeması
```json
{
  "ok": true,
  "generatedAt": "2026-07-29T17:00:00.000Z",
  "lastItemDate": "2026-07-28T10:00:00Z",
  "stats": { "total": 98, "sources": 12, "adCount": 21, "categories": 9 },
  "topSources": [{ "name": "FAA", "count": 40 }],
  "categoryBreakdown": [{ "name": "Airworthiness Directive", "count": 21 }],
  "items": [{
    "id": "content_hash",
    "title": "...", "summary": "...", "content": "...",
    "url": "...", "publishedAt": "...", "fetchedAt": "...",
    "category": "...", "tags": ["..."],
    "sourceName": "FAA", "sourceId": "faa"
  }]
}
```

## Kurulum
1. n8n → **Workflows → Import from File** → bu JSON'u seç.
2. MongoDB kimlik bilgisini (credential) kendi hesabınla yeniden bağla.
3. Sağ üstten workflow'u **Active** yap (production URL ancak aktifken çalışır).
4. Site zaten bu webhook'a bağlı — birkaç saniye içinde Dashboard/Browse
   otomatik olarak canlı veriye geçer (yeşil "Connected to live data" rozeti).

## Site tarafı davranışı
- **Browse**: tüm item'lar buraya dolar; arama/filtre canlı veri üstünde çalışır.
- **Dashboard**: sayımlar (toplam, AD, kaynak, kategori) canlı item'lardan hesaplanır.
- **Top Sources / Category Coverage**: kaynaklar ve kategoriler dinamik listelenir.
- Webhook erişilemezse ya da JSON boşsa site otomatik olarak örnek (mock) veriye
  düşer ve gri "Demo mode" rozeti gösterir.
