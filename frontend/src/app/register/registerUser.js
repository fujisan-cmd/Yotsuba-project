// src/app/register/registerUser.js

export default async function registerUser(formData) {
    const email = formData.get("email");
    const password = formData.get("pw");
  
    // 入力チェック（念のため）
    if (!email || !password) {
      console.error("メールアドレスとパスワードが必要です");
      return false;
    }
  
    // localStorage に保存（Next.js 13+ではクライアント側でしか使えない点に注意）
    try {
      localStorage.setItem("reg_email", email);
      localStorage.setItem("reg_password", password);
      return true;
    } catch (err) {
      console.error("localStorage 保存に失敗:", err);
      return false;
    }
  }
  