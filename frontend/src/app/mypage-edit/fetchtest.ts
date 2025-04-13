const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * 部署・スキル・経験などの選択肢を取得
 */
export async function fetchFormData() {
  const res = await fetch(`${BASE_URL}/api/form-data`);
  if (!res.ok) {
    throw new Error('フォームデータの取得に失敗しました');
  }
  return await res.json();
}

/**
 * ユーザーのマイページ情報を取得
 */
export async function fetchMyPage(userId: number) {
  const res = await fetch(`${BASE_URL}/api/my_page/${userId}`);
  if (!res.ok) {
    throw new Error('マイページ取得に失敗しました');
  }
  return await res.json();
}

/**
 * ユーザーのマイページ情報を更新
 */
export async function updateMyPage(userId: number, data: any) {
  const res = await fetch(`${BASE_URL}/api/update_my_page`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      ...data
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('更新失敗:', errorText);
    throw new Error('マイページの更新に失敗しました');
  }

  return await res.json();
}
