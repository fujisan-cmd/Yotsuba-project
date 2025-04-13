// fetchSearch.js

const BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000";

export default async function fetchSearchResults(params) {
  const query = new URLSearchParams();

  // 🔍 クエリパラメータをループで追加（配列にも対応）
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => {
        if (v && v.trim() !== '') {
          query.append(key, v);
        }
      });
    } else if (value && value.trim() !== '') {
      query.append(key, value);
    }
  });

  const fullUrl = `${BASE_URL}/api/search_my_page?${query.toString()}`;
  console.log('✅ 検索リクエスト送信:', fullUrl);

  try {
    const res = await fetch(fullUrl);

    if (!res.ok) {
      console.error('❌ API呼び出し失敗:', res.statusText);
      return [];
    }

    const data = await res.json();
    console.log('🎯 取得データ:', data);
    return data;
  } catch (error) {
    console.error('⚠️ fetch失敗:', error);
    return [];
  }
}
