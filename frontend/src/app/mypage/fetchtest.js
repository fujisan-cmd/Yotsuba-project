// fetchtest.js

export async function fetchMyPage(userId) {
    const res = await fetch(`http://localhost:8000/api/my_page/${userId}`);
    if (!res.ok) {
      throw new Error("マイページの取得に失敗しました");
    }
    return await res.json();
  }
  