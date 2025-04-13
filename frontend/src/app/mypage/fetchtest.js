const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000";

export async function fetchMyPage(token){
  const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT+'/api/me', 
    {
      headers: {Authorization: `Bearer ${token}`,},
    });
    return res.json();
}

// export async function fetchMyPage(userId) {
//   if (!userId) {
//     throw new Error("userId が未指定です");
//   }

//   try {
//     const res = await fetch(`${API_ENDPOINT}/api/my_page/${userId}`);

//     if (!res.ok) {
//       const errorBody = await res.text();
//       throw new Error(`マイページの取得に失敗しました: ${res.status} - ${errorBody}`);
//     }

//     return await res.json();
//   } catch (error) {
//     console.error("fetchMyPage エラー:", error);
//     throw error;
//   }
// }
