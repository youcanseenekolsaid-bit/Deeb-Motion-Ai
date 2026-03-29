"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Language = "en" | "ar";

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    "nav.title": "Deeb Motion Ai",
    "nav.login": "Login",
    "nav.signup": "Sign Up",
    "hero.badge": "AI-Powered Motion Graphics",
    "hero.title1": "Create Motion.",
    "hero.title2": "Animate Vision.",
    "hero.subtitle": "Transform your text prompts into studio-quality cinematic motion graphics in seconds. Powered by Aether-Core AI.",
    "form.placeholder": "Describe your motion graphic (e.g., 'Ethereal purple waves flowing through a crystal glass sphere')",
    "form.duration.label": "DURATION",
    "form.duration.auto": "Auto",
    "form.duration.5s": "5 Seconds",
    "form.duration.10s": "10 Seconds",
    "form.duration.15s": "15 Seconds",
    "form.duration.30s": "30 Seconds",
    "form.duration.45s": "45 Seconds",
    "form.duration.60s": "60 Seconds",
    "form.ratio.label": "RATIO",
    "form.generate": "Generate Video",
    "form.proModel": "PRO MODEL ACTIVE",
    "gallery.title": "Recent Creations",
    "gallery.subtitle": "Explore what others are building with Deeb Motion Ai",
    "gallery.viewAll": "View Gallery",
    "gallery.item1": "A futuristic neon city with flying cars and dynamic lighting",
    "gallery.item2": "Abstract colorful liquid simulation flowing smoothly in 4k",
    "auth.title": "Welcome Back",
    "auth.subtitle": "Sign in to your account to continue",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.submit": "Sign In",
    "auth.noAccount": "Don't have an account?",
    "auth.signup": "Sign Up",
    "create.title": "Create Motion Graphic",
    "create.subtitle": "Enter your prompt and configure settings",
    "create.prompt": "Prompt",
    "create.code": "TypeScript Code",
    "create.uploadFile": "Upload .tsx file",
    "create.pasteCode": "Paste your Remotion TSX code here...",
    "create.applyCode": "Apply Code",
    "create.appliedCode": "Applied custom TypeScript code.",
    "create.appliedCodeSuccess": "Custom TypeScript code applied successfully! You can preview it now.",
    "create.appliedManualCode": "I have manually updated the video code.",
    "create.uploadedCodeFile": "I have uploaded a custom TypeScript file for the video.",
    "create.error": "Sorry, I encountered an error while generating the video script. Please try again or check your prompt.",
    "create.duration": "Duration",
    "create.aspectRatio": "Aspect Ratio",
    "create.generate": "Generate Video",
    "create.generating": "Generating...",
    "create.editor": "AI Editor",
    "create.newVideo": "New Video",
    "create.export": "Export",
    "create.applying": "Applying motion graphics and effects",
    "create.placeholder": "Make it darker, add more neon...",
    "create.initialUserMsg": "A neon cyberpunk city with flying cars, dynamic camera movement",
    "create.initialAiMsg": "Hi! What kind of video would you like to create today?",
    "create.previewAlt": "Generated Video Preview",
    "create.videoReady": "Your video is ready! You can play it on the right. If you want to make changes, just tell me what to adjust.",
    "create.updating": "Understood. I'm updating the video with your new instructions...",
    "nav.toggleTheme": "Toggle theme",
    "nav.backToHome": "Back to Home",
    "create.generatingVideo": "Generating Video...",
    "create.videoReadyTitle": "Your Video is Ready",
    "create.generationFailed": "Generation Failed",
    "create.promptLabel": "Enter a prompt to generate a video",
    "create.creatingMasterpiece": "Aether-Core AI is writing the script and composing the motion graphic.",
    "create.downloadVideo": "Download Video",
    "create.createAnother": "Create Another",
    "create.somethingWentWrong": "Something went wrong",
    "create.tryAgain": "Try Again",
    "nav.profile": "Profile",
    "nav.works": "My Works",
    "nav.logout": "Logout",
  },
  ar: {
    "nav.title": "Deeb Motion Ai",
    "nav.login": "تسجيل الدخول",
    "nav.signup": "إنشاء حساب",
    "hero.badge": "موشن جرافيك مدعوم بالذكاء الاصطناعي",
    "hero.title1": "اصنع الحركة.",
    "hero.title2": "حرك رؤيتك.",
    "hero.subtitle": "حول نصوصك إلى رسومات متحركة سينمائية بجودة الاستوديو في ثوانٍ. مدعوم بذكاء Aether-Core.",
    "form.placeholder": "صف الموشن جرافيك الخاص بك (مثال: 'أمواج أرجوانية أثيرية تتدفق عبر كرة زجاجية كريستالية')",
    "form.duration.label": "المدة",
    "form.duration.auto": "تلقائي",
    "form.duration.5s": "5 ثوانٍ",
    "form.duration.10s": "10 ثوانٍ",
    "form.duration.15s": "15 ثانية",
    "form.duration.30s": "30 ثانية",
    "form.duration.45s": "45 ثانية",
    "form.duration.60s": "60 ثانية",
    "form.ratio.label": "النسبة",
    "form.generate": "إنشاء فيديو",
    "form.proModel": "النموذج الاحترافي نشط",
    "gallery.title": "أحدث الإبداعات",
    "gallery.subtitle": "استكشف ما يبنيه الآخرون باستخدام موشن الذكاء الاصطناعي",
    "gallery.viewAll": "عرض المعرض",
    "gallery.item1": "مدينة نيون مستقبلية مع سيارات طائرة وإضاءة ديناميكية",
    "gallery.item2": "محاكاة سائل ملون مجرد يتدفق بسلاسة بدقة 4K",
    "auth.title": "مرحباً بعودتك",
    "auth.subtitle": "قم بتسجيل الدخول إلى حسابك للمتابعة",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.submit": "تسجيل الدخول",
    "auth.noAccount": "ليس لديك حساب؟",
    "auth.signup": "إنشاء حساب",
    "create.title": "إنشاء موشن جرافيك",
    "create.subtitle": "أدخل الوصف الخاص بك وقم بضبط الإعدادات",
    "create.prompt": "الوصف",
    "create.code": "كود تايبسكربت",
    "create.uploadFile": "رفع ملف .tsx",
    "create.pasteCode": "الصق كود Remotion TSX هنا...",
    "create.applyCode": "تطبيق الكود",
    "create.appliedCode": "تم تطبيق كود تايبسكربت المخصص.",
    "create.appliedCodeSuccess": "تم تطبيق كود تايبسكربت المخصص بنجاح! يمكنك معاينته الآن.",
    "create.appliedManualCode": "لقد قمت بتحديث كود الفيديو يدوياً.",
    "create.uploadedCodeFile": "لقد قمت برفع ملف تايبسكربت مخصص للفيديو.",
    "create.error": "عذراً، واجهت خطأ أثناء إنشاء كود الفيديو. يرجى المحاولة مرة أخرى أو التأكد من صحة الوصف أو الكود.",
    "create.duration": "المدة",
    "create.aspectRatio": "نسبة العرض إلى الارتفاع",
    "create.generate": "توليد الفيديو",
    "create.generating": "جاري التوليد...",
    "create.editor": "محرر الذكاء الاصطناعي",
    "create.newVideo": "فيديو جديد",
    "create.export": "تصدير",
    "create.applying": "جاري تطبيق الموشن جرافيك والمؤثرات",
    "create.placeholder": "اجعله أغمق، أضف المزيد من النيون...",
    "create.initialUserMsg": "مدينة سايبربانك نيون مع سيارات طائرة، وحركة كاميرا ديناميكية",
    "create.initialAiMsg": "مرحباً! ما نوع الفيديو الذي تود إنشاءه اليوم؟",
    "create.previewAlt": "معاينة الفيديو المولد",
    "create.videoReady": "الفيديو الخاص بك جاهز! يمكنك تشغيله على اليمين. إذا كنت ترغب في إجراء تغييرات، فقط أخبرني بما يجب تعديله.",
    "create.updating": "مفهوم. أقوم بتحديث الفيديو بتعليماتك الجديدة...",
    "nav.toggleTheme": "تبديل المظهر",
    "nav.backToHome": "العودة للرئيسية",
    "create.generatingVideo": "جاري إنشاء الفيديو...",
    "create.videoReadyTitle": "الفيديو الخاص بك جاهز",
    "create.generationFailed": "فشل الإنشاء",
    "create.promptLabel": "أدخل وصفاً لإنشاء فيديو",
    "create.creatingMasterpiece": "يقوم ذكاء Aether-Core بكتابة النص البرمجي وتأليف الموشن جرافيك.",
    "create.downloadVideo": "تحميل الفيديو",
    "create.createAnother": "إنشاء فيديو آخر",
    "create.somethingWentWrong": "حدث خطأ ما",
    "create.tryAgain": "حاول مرة أخرى",
    "nav.profile": "الملف الشخصي",
    "nav.works": "أعمالي",
    "nav.logout": "تسجيل الخروج",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "ar")) {
      setLanguageState(savedLang);
    } else {
      const browserLang = navigator.language.startsWith("ar") ? "ar" : "en";
      setLanguageState(browserLang);
    }
  }, []);

  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = dir;
      document.documentElement.lang = language;
    }
  }, [language, dir, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = useCallback((key: string) => {
    return translations[language]?.[key] || key;
  }, [language]);

  // Prevent hydration mismatch by not rendering children until mounted if we depend on language
  // But to avoid flicker, we can just render children. The dir/lang is updated in useEffect.
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
