// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 本来はDBやAPIと照合してチェック
        if (
          credentials.email === "test@example.com" &&
          credentials.password === "password123"
        ) {
          return { id: 1, name: "テストユーザー", email: "test@example.com" };
        }
        return null; // ログイン失敗
      },
    }),
  ],
  pages: {
    signIn: "/login", // カスタムログイン画面を指定
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});