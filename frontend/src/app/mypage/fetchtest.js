// fetchtest.js

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;

export async function fetchMyPage(userId) {
  if (!API_ENDPOINT) {
    console.warn("環境変数 NEXT_PUBLIC_API_ENDPOINT が設定されていません。ローカル環境で実行する場合は 'http://localhost:8000' を使用します。");
    const res = await fetch(`http://localhost:8000/api/my_page/${userId}`);
    if (!res.ok) {
      throw new Error("マイページの取得に失敗しました (ローカル)");
    }
    return await res.json();
  }

  const res = await fetch(`${API_ENDPOINT}/api/my_page/${userId}`);
  if (!res.ok) {
    const errorBody = await res.text(); 
    throw new Error(`マイページの取得に失敗しました (サーバー): ${res.status} - ${errorBody}`);
  }
  return await res.json();
}