"use client";

import { useRouter } from "next/navigation";

export default function MyPageSuccess() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <h1 className="text-3xl font-bold text-green-600 mb-6">🎉 マイページ作成完了！</h1>
      <p className="text-lg mb-8">
        ご登録ありがとうございました。<br />
        あなたのマイページを見てみましょう！
      </p>
      <button
        onClick={() => router.push("/mypage")} 
        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        マイページへ進む
      </button>
    </div>
  );
}
