"use client";

import { Suspense, useState } from "react";
import { motion } from "motion/react";
import { Video, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { t, dir, language } = useLanguage();

  const [formData, setFormData] = useState({
    emailOrUsername: "",
    email: "",
    username: "",
    password: "",
    displayName: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResetPassword = async () => {
    setError("");
    setMessage("");
    if (!formData.emailOrUsername) {
      setError(language === "ar" ? "الرجاء إدخال البريد الإلكتروني أو اسم المستخدم" : "Please enter your email or username");
      return;
    }

    setLoading(true);
    try {
      let resetEmail = formData.emailOrUsername;
      
      // If it's not an email, assume it's a username and look up the email
      if (!resetEmail.includes("@")) {
        const usernameDoc = await getDoc(doc(db, "usernames", resetEmail));
        if (usernameDoc.exists()) {
          resetEmail = usernameDoc.data().email;
        } else {
          throw new Error(language === "ar" ? "اسم المستخدم غير موجود" : "Username not found");
        }
      }

      await sendPasswordResetEmail(auth, resetEmail);
      setMessage(language === "ar" ? "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" : "Password reset link sent to your email");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: any) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Create user profile if it's a new user
        const username = user.email?.split("@")[0] || user.uid;
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          username: username,
          displayName: user.displayName || username,
          photoURL: user.photoURL || null,
          createdAt: new Date()
        });
        
        // Save username mapping
        await setDoc(doc(db, "usernames", username), {
          email: user.email,
          uid: user.uid
        });
      } else {
        // Update photoURL if it exists and wasn't there before
        if (user.photoURL && !userDoc.data().photoURL) {
          await setDoc(doc(db, "users", user.uid), {
            photoURL: user.photoURL
          }, { merge: true });
        }
      }

      router.push(redirect);
    } catch (err: any) {
      console.error("Social login error:", err);
      setError(err.message || "Social login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isLogin) {
        let loginEmail = formData.emailOrUsername;
        
        // If it's not an email, assume it's a username and look up the email
        if (!loginEmail.includes("@")) {
          const usernameDoc = await getDoc(doc(db, "usernames", loginEmail));
          if (usernameDoc.exists()) {
            loginEmail = usernameDoc.data().email;
          } else {
            throw new Error(language === "ar" ? "اسم المستخدم غير موجود" : "Username not found");
          }
        }

        await signInWithEmailAndPassword(auth, loginEmail, formData.password);
        router.push(redirect);
      } else {
        // Signup
        const { email, password, username, displayName } = formData;
        
        // Check if username is taken
        const usernameDoc = await getDoc(doc(db, "usernames", username));
        if (usernameDoc.exists()) {
          throw new Error(language === "ar" ? "اسم المستخدم محجوز مسبقاً" : "Username is already taken");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName });

        // Save user profile
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email,
          username,
          displayName,
          createdAt: new Date()
        });

        // Save username mapping
        await setDoc(doc(db, "usernames", username), {
          email,
          uid: user.uid
        });

        router.push(redirect);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="bg-background border border-border rounded-3xl shadow-2xl shadow-primary/10 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Video className="h-8 w-8" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">
            {isLogin ? t("auth.title") : t("auth.signup")}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-8">
            {isLogin ? t("auth.subtitle") : t("auth.subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl text-center">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm p-3 rounded-xl text-center">
                {message}
              </div>
            )}
            
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === "ar" ? "الاسم الكامل" : "Full Name"}</label>
                  <input 
                    type="text" 
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === "ar" ? "اسم المستخدم" : "Username"}</label>
                  <input 
                    type="text" 
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe123"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("auth.email")}</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    required
                  />
                </div>
              </>
            )}

            {isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "ar" ? "البريد الإلكتروني أو اسم المستخدم" : "Email or Username"}</label>
                <input 
                  type="text" 
                  name="emailOrUsername"
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  placeholder={language === "ar" ? "أدخل بريدك الإلكتروني أو اسم المستخدم" : "Enter email or username"}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t("auth.password")}</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={handleResetPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    {language === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
                  </button>
                )}
              </div>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 space-x-reverse hover:bg-primary/90 transition-all mt-6 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? t("auth.submit") : t("auth.signup")}</span>
                  <ArrowRight className={`h-4 w-4 mx-2 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-3 text-xs text-muted-foreground uppercase">Or continue with</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          <div className="mt-6">
            <button 
              onClick={() => handleSocialLogin(new GoogleAuthProvider())}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 border border-border bg-background hover:bg-muted py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>
          </div>
        </div>
        
        <div className="bg-muted/50 p-4 text-center border-t border-border">
          <p className="text-sm text-muted-foreground">
            {isLogin ? t("auth.noAccount") + " " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline mx-1"
            >
              {isLogin ? t("auth.signup") : t("auth.submit")}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
