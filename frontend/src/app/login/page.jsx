"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import checkEmail from "./checkEmail";
import login from "./login";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.includes("@")) {
      alert("正しいメールアドレスを入力してください。");
      return;
    }

    if (password.length < 6) {
      alert("パスワードは6文字以上にしてください。");
      return;
    }

    try {
      const result = await checkEmail(email);
      if (result.exists) {
        console.log("ログイン操作に移ります");
        const res = await login(email, password);
        console.log("レスポンス:", res);

        if (res.token) {
          // ✅ セッションストレージに保存（toString安全チェック）
          sessionStorage.setItem("token", res.token);

          if (res.user_id !== undefined && res.user_id !== null) {
            sessionStorage.setItem("user_id", res.user_id.toString());
          } else {
            console.warn("user_id がレスポンスに含まれていません。");
          }

          router.push("/mypage");
        } else {
          alert("ログインに失敗しました。サーバーからの応答が不正です。");
        }
      } else {
        alert("このメールアドレスは登録されていません。新規登録してください。");
      }
    } catch (error) {
      console.error("ログインエラー:", error);
      alert("ログイン中にエラーが発生しました。");
    }
  };

  const handleGotoRegister = () => {
    router.push("/register");
  };

  return (
    <div
      className="w-full h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/top.jpg')" }}
    >
      <div className="bg-white/80 h-full overflow-hidden">
        <div className="w-full h-full">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* ヘッダー */}
            <div className="absolute top-0 left-0 w-full h-[58px] bg-[#c3e99f]" />

            {/* ログインフォーム */}
            <form onSubmit={handleLogin}>
              <div className="relative z-10 w-[600px] bg-[#c7d4e5b2] rounded-xl mt-[58px] p-6">
                <div className="text-center mb-4 font-normal text-xl">🍀Yotsuba</div>

                <div className="flex flex-col items-center gap-4">
                  <p className="block text-center mb-2 font-normal text-xl">
                    メールアドレスを入力してください
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    spellCheck="false"
                    className="w-full h-[37px] bg-white rounded-xl border border-gray-300 px-3"
                  />

                  <p className="block text-center mb-2 font-normal text-xl">
                    パスワードを入力してください
                  </p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    spellCheck="false"
                    className="w-full h-[37px] bg-white rounded-xl border border-gray-300 px-3"
                  />

                  {/* ボタンエリア */}
                  <div className="flex flex-row gap-4 justify-center mt-2">
                    <button
                      type="submit"
                      className="w-[102px] h-[52px] bg-white text-black hover:bg-gray-100 rounded-xl font-normal text-xl"
                    >
                      ログイン
                    </button>

                    <button
                      type="button"
                      onClick={handleGotoRegister}
                      className="w-[102px] h-[52px] bg-white text-black hover:bg-gray-100 rounded-xl font-normal text-xl"
                    >
                      新規登録
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
