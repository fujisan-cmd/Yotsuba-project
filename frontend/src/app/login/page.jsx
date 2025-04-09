"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";  // ✅ NextAuth 読み込み

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    // バリデーション
    if (!email.includes("@")) {
      alert("正しいメールアドレスを入力してください。");
      return;
    }

    if (password.length < 6) {
      alert("パスワードは6文字以上にしてください。");
      return;
    }

    // NextAuth を使ってログイン試行
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result.ok) {
      alert("ログイン成功！");
      // 例: 画面遷移したい場合
      // router.push("/mypage")
    } else {
      alert("ログインに失敗しました。IDかパスワードが違います。");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "400px", margin: "0 auto" }}>
      <h1>ログイン画面</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="email">ID(メールアドレス)：</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="password">パスワード：</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ログイン
        </button>
      </form>
    </div>
  );
}








