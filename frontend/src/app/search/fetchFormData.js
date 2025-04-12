const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000";

export default async function fetchFormData() {
  console.log("📡 API_ENDPOINT:", API_ENDPOINT);
  try {
    const res = await fetch(`${API_ENDPOINT}/api/form-data`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("フォームデータの取得に失敗:", error);
    throw error;
  }
}
