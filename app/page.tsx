/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Clock, MonitorPlay, Smartphone, Play, ArrowRight, Wand2, ChevronDown, Zap, FolderOpen, Code, Image as ImageIcon, Plus, Repeat } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");
  const [inputType, setInputType] = useState<"prompt" | "code">("prompt");
  const [duration, setDuration] = useState("auto");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isFocused, setIsFocused] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSeamlessLoop, setIsSeamlessLoop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const router = useRouter();
  const { t, dir, language } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        setLoadingProjects(false);
        return;
      }
      try {
        const q = query(
          collection(db, "projects"), 
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedProjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort in memory by updatedAt desc
        fetchedProjects.sort((a: any, b: any) => {
          const dateA = a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date(0);
          const dateB = b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setProjects(fetchedProjects.slice(0, 6)); // Show max 6 on home page
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() || selectedImages.length > 0) {
      if (selectedImages.length > 0) {
        sessionStorage.setItem('initial_images', JSON.stringify(selectedImages));
      } else {
        sessionStorage.removeItem('initial_images');
      }
      
      const loopParam = isSeamlessLoop ? "&loop=true" : "";
      
      if (inputType === "prompt") {
        router.push(`/create?prompt=${encodeURIComponent(prompt || (language === "ar" ? "صورة مرفقة" : "Attached image"))}&duration=${duration}&ratio=${aspectRatio}${loopParam}`);
      } else {
        localStorage.setItem("custom_remotion_code", prompt);
        router.push(`/create?mode=code&duration=${duration}&ratio=${aspectRatio}${loopParam}`);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const promises = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    const base64Images = await Promise.all(promises);
    setSelectedImages(prev => [...prev, ...base64Images]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPrompt(content);
      }
    };
    reader.readAsText(file);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItems = Array.from(items).filter(item => item.type.indexOf('image') !== -1);
    if (imageItems.length === 0) return;

    const promises = imageItems.map(item => {
      const file = item.getAsFile();
      if (!file) return Promise.resolve(null);
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    const base64Images = (await Promise.all(promises)).filter(Boolean) as string[];
    if (base64Images.length > 0) {
      setSelectedImages(prev => [...prev, ...base64Images]);
    }
  };

  return (
    <div className="flex flex-col items-center w-full relative min-h-screen">
      {/* Animated 3D Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-background">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]">
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]"
            style={{ animation: 'grid-move 3s linear infinite' }}
          />
        </div>
        
        {/* Animated Orbs */}
        <div
          style={{ animation: 'orb-float-1 15s ease-in-out infinite' }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 dark:bg-primary/20 mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70"
        />
        <div
          style={{ animation: 'orb-float-2 18s ease-in-out infinite' }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/20 dark:bg-blue-500/20 mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70"
        />
        <div
          style={{ animation: 'orb-float-3 20s ease-in-out infinite' }}
          className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-purple-500/20 dark:bg-purple-500/20 mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70"
        />
      </div>

      {/* Hero Section */}
      <section className="w-full max-w-5xl px-4 pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center text-center relative z-10">
        <h1 
          className="relative text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both"
        >
          {/* Text Glow Effect */}
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-primary/40 via-purple-500/40 to-blue-500/40 -z-10 animate-pulse" />
          
          <span className="block text-white drop-shadow-sm mb-2">
            {t("hero.title1")}
          </span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            {t("hero.title2")}
          </span>
        </h1>
        
        <p 
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-16 drop-shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both"
        >
          {t("hero.subtitle")}
        </p>

        {/* Generator Form with Animated Halo */}
        <div 
          className="relative w-full max-w-5xl z-20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both"
        >
          {/* Outer Glowing Halo */}
          <div
            className={`absolute -inset-3 rounded-[2rem] blur-2xl z-0 overflow-hidden transition-all duration-400 ease-out ${isFocused ? 'opacity-80 scale-[1.02]' : 'opacity-30 scale-100'}`}
          >
            <div 
              className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-50 animate-[spin_8s_linear_infinite]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80 mix-blend-overlay" />
          </div>
          
          {/* Inner Border Glow */}
          <div
            className={`absolute -inset-[2px] rounded-3xl z-0 overflow-hidden transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-40'}`}
          >
            <div 
              className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#8b5cf6_360deg)] animate-[spin_4s_linear_infinite_reverse]"
            />
            <div className="absolute inset-[2px] rounded-[22px] bg-background/90 backdrop-blur-3xl" />
          </div>

          <form 
            onSubmit={handleGenerate}
            className="relative bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 sm:p-10 flex flex-col z-10 shadow-2xl w-full max-w-[1200px] mx-auto"
          >
            {/* Input Type Toggle */}
            <div className="flex space-x-2 rtl:space-x-reverse bg-slate-950/50 p-1.5 rounded-xl w-fit mb-4 border border-white/5">
              <button
                type="button"
                onClick={() => setInputType("prompt")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  inputType === "prompt"
                    ? "bg-purple-500/20 text-purple-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {t("create.prompt")}
              </button>
              <button
                type="button"
                onClick={() => setInputType("code")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  inputType === "code"
                    ? "bg-purple-500/20 text-purple-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {t("create.code")}
              </button>
            </div>

            <div 
              className="relative bg-slate-950/50 rounded-2xl border border-white/5 p-4 sm:p-6 mb-8"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = e.dataTransfer.files;
                if (!files) return;
                
                const promises = Array.from(files)
                  .filter(file => file.type.startsWith('image/'))
                  .map(file => {
                    return new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.readAsDataURL(file);
                    });
                  });
                
                const base64Images = await Promise.all(promises);
                if (base64Images.length > 0) {
                  setSelectedImages(prev => [...prev, ...base64Images]);
                }
              }}
              onPaste={handlePaste}
            >
              {selectedImages.length > 0 && (
                <div className="flex gap-3 overflow-x-auto py-2 mb-4 scrollbar-hide">
                  {selectedImages.map((img, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/10">
                      <img src={img} alt={`Selected ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                      >
                        <Plus className="h-4 w-4 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={inputType === "prompt" ? t("form.placeholder") : t("create.pasteCode")}
                className={`w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none placeholder:text-slate-500 text-slate-200 ${inputType === "code" ? "font-mono text-sm min-h-[200px] sm:min-h-[300px]" : "text-xl sm:text-2xl min-h-[150px] sm:min-h-[260px]"}`}
                required={selectedImages.length === 0 && inputType === "prompt"}
              />
              
              {/* Bottom Controls inside Textarea container */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {inputType === "code" && (
                  <div>
                    <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10 transition-colors w-fit">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      <span>{t("create.uploadFile")}</span>
                      <input
                        type="file"
                        accept=".tsx,.ts,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {inputType === "prompt" && (
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10 transition-colors w-fit"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>{language === "ar" ? "إرفاق صورة" : "Attach Image"}</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider self-start sm:self-auto">
                  {t("form.proModel")} <Zap className="w-4 h-4 fill-current" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-4 sm:gap-8 w-full sm:w-auto">
                {/* Custom Duration Selector */}
                <div className="space-y-2 relative">
                  {isDurationOpen && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDurationOpen(false)}
                    />
                  )}
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">{t("form.duration.label")}</label>
                  <button
                    type="button"
                    onClick={() => setIsDurationOpen(!isDurationOpen)}
                    className="relative z-50 flex items-center justify-between w-[140px] bg-slate-950/50 hover:bg-slate-900 transition-colors rounded-xl px-4 py-2.5 border border-white/5 text-sm font-medium text-slate-300 outline-none focus:ring-1 focus:ring-purple-500/50"
                  >
                    <span>{t(`form.duration.${duration}`)}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isDurationOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute bottom-full ${dir === 'rtl' ? 'right-0' : 'left-0'} mb-2 w-full bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 origin-bottom transition-all duration-200 ease-out ${isDurationOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}
                  >
                    <div className="p-1 flex flex-col max-h-[200px] overflow-y-auto">
                      {["auto", "5s", "10s", "15s", "30s", "45s", "60s"].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => { setDuration(d); setIsDurationOpen(false); }}
                          className={`text-start px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center justify-between ${
                            duration === d 
                              ? "bg-purple-500/20 text-purple-300 font-medium" 
                              : `hover:bg-slate-800 text-slate-400`
                          }`}
                        >
                          <span>{t(`form.duration.${d}`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Seamless Loop Toggle */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    {language === "ar" ? "تكرار مستمر" : "Seamless Loop"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSeamlessLoop(!isSeamlessLoop)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors text-sm font-medium ${
                      isSeamlessLoop 
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                        : 'bg-slate-950/50 border-white/5 text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                    <span>{isSeamlessLoop ? (language === "ar" ? "مفعل" : "Enabled") : (language === "ar" ? "معطل" : "Disabled")}</span>
                  </button>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">{t("form.ratio.label")}</label>
                  <div className="flex items-center bg-slate-950/50 rounded-xl p-1 border border-white/5">
                    <button
                      type="button"
                      onClick={() => setAspectRatio("16:9")}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${aspectRatio === "16:9" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      <MonitorPlay className="h-4 w-4" />
                      <span>16:9</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio("9:16")}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${aspectRatio === "9:16" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      <Smartphone className="h-4 w-4" />
                      <span>9:16</span>
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full sm:w-auto bg-[#b488ff] hover:bg-[#a370f5] text-slate-950 px-8 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all hover:scale-105 active:scale-95 mt-4 sm:mt-0"
              >
                <span>{t("form.generate")}</span>
                <Sparkles className="h-5 w-5 mx-2" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl px-4 py-16 md:py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {language === "ar" ? "مميزات التطبيق" : "App Features"}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {language === "ar" 
              ? "اكتشف القوة الكامنة في Deeb Motion Ai وكيف يمكنه تحويل أفكارك إلى واقع" 
              : "Discover the power of Deeb Motion Ai and how it can turn your ideas into reality"}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Wand2 className="w-8 h-8 text-purple-400" />,
              title: language === "ar" ? "توليد ذكي" : "Smart Generation",
              desc: language === "ar" ? "تحويل النصوص والصور إلى فيديوهات موشن جرافيك احترافية بضغطة زر" : "Transform text and images into professional motion graphics with one click"
            },
            {
              icon: <Repeat className="w-8 h-8 text-cyan-400" />,
              title: language === "ar" ? "تكرار لا نهائي" : "Seamless Loop",
              desc: language === "ar" ? "إنشاء فيديوهات متصلة ببعضها بدون أي انقطاع أو قفزات في الإطارات" : "Create continuous videos without any cuts or frame jumps"
            },
            {
              icon: <Code className="w-8 h-8 text-emerald-400" />,
              title: language === "ar" ? "تعديل الكود" : "Code Editing",
              desc: language === "ar" ? "تحكم كامل في كود الفيديو (React/Remotion) لتخصيص كل تفصيلة" : "Full control over the video code (React/Remotion) to customize every detail"
            },
            {
              icon: <Clock className="w-8 h-8 text-amber-400" />,
              title: language === "ar" ? "سرعة فائقة" : "Lightning Fast",
              desc: language === "ar" ? "توليد الفيديوهات في ثوانٍ معدودة بفضل خوادم الذكاء الاصطناعي المتقدمة" : "Generate videos in seconds thanks to advanced AI servers"
            },
            {
              icon: <MonitorPlay className="w-8 h-8 text-rose-400" />,
              title: language === "ar" ? "أبعاد متعددة" : "Multiple Ratios",
              desc: language === "ar" ? "دعم كامل لأبعاد الشاشات المختلفة (16:9 لليوتيوب، 9:16 للتيك توك)" : "Full support for different screen ratios (16:9 for YouTube, 9:16 for TikTok)"
            },
            {
              icon: <FolderOpen className="w-8 h-8 text-blue-400" />,
              title: language === "ar" ? "إدارة المشاريع" : "Project Management",
              desc: language === "ar" ? "حفظ مشاريعك في السحابة والعودة لتعديلها في أي وقت ومن أي مكان" : "Save your projects in the cloud and edit them anytime, anywhere"
            }
          ].map((feature, i) => (
            <div 
              key={i} 
              className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:bg-slate-800/50 transition-colors group animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
              style={{ animationDelay: `${i * 100}ms`, animationDuration: '500ms' }}
            >
              <div className="bg-slate-950 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-black/50">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="w-full max-w-7xl px-4 py-16 md:py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {language === "ar" ? "كيف يعمل؟" : "How it Works"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {language === "ar" 
              ? "ثلاث خطوات بسيطة لتحويل أفكارك إلى مقاطع فيديو احترافية باستخدام الذكاء الاصطناعي."
              : "Three simple steps to turn your ideas into professional videos using AI."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Wand2 className="h-8 w-8 text-purple-500" />,
              title: language === "ar" ? "1. اكتب فكرتك" : "1. Write your idea",
              desc: language === "ar" ? "صف الفيديو الذي تريده بالتفصيل، أو استخدم الكود البرمجي مباشرة." : "Describe the video you want in detail, or use code directly."
            },
            {
              icon: <Zap className="h-8 w-8 text-blue-500" />,
              title: language === "ar" ? "2. الذكاء الاصطناعي يولد" : "2. AI Generates",
              desc: language === "ar" ? "يقوم نظامنا بتحليل طلبك وتوليد كود الفيديو والمشاهد في ثوانٍ." : "Our system analyzes your prompt and generates video code and scenes in seconds."
            },
            {
              icon: <Play className="h-8 w-8 text-primary" />,
              title: language === "ar" ? "3. عاين وصدر" : "3. Preview & Export",
              desc: language === "ar" ? "عاين الفيديو الخاص بك في الوقت الفعلي، قم بتعديله، ثم صدره بجودة عالية." : "Preview your video in real-time, tweak it, and export in high quality."
            }
          ].map((step, i) => (
            <div 
              key={i}
              className="bg-muted/30 border border-border/50 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
              style={{ animationDelay: `${i * 200}ms`, animationDuration: '500ms' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150" />
              <div className="bg-background border border-border w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="w-full max-w-7xl px-4 py-16 md:py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {language === "ar" ? "مميزات قوية" : "Powerful Features"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {language === "ar" 
              ? "كل ما تحتاجه لإنشاء محتوى مرئي مذهل في مكان واحد."
              : "Everything you need to create stunning visual content in one place."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[240px]">
          {/* Feature 1 - Large */}
          <div 
            className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-border/50 rounded-3xl p-8 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          >
            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/code/800/600')] opacity-10 mix-blend-overlay group-hover:opacity-20 transition-opacity duration-500" />
            <div className="relative z-10 h-full flex flex-col justify-end">
              <div className="bg-background/80 backdrop-blur-sm w-fit p-3 rounded-xl mb-4 border border-border">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{language === "ar" ? "توليد كود React" : "React Code Generation"}</h3>
              <p className="text-muted-foreground">{language === "ar" ? "نحن لا نولد فيديو فقط، بل نولد كود Remotion قابل للتعديل بالكامل باستخدام React." : "We don't just generate video, we generate fully editable Remotion code using React."}</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div 
            className="md:col-span-2 bg-muted/30 border border-border/50 rounded-3xl p-8 relative overflow-hidden group hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both"
          >
            <div className="flex items-start justify-between h-full flex-col">
              <div className="bg-background border border-border w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MonitorPlay className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{language === "ar" ? "معاينة فورية" : "Instant Preview"}</h3>
                <p className="text-muted-foreground text-sm">{language === "ar" ? "شاهد التعديلات التي تجريها على الفيديو في الوقت الفعلي بدون انتظار وقت التصيير." : "See the changes you make to the video in real-time without waiting for render time."}</p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div 
            className="bg-muted/30 border border-border/50 rounded-3xl p-8 relative overflow-hidden group hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both"
          >
            <div className="flex items-start justify-between h-full flex-col">
              <div className="bg-background border border-border w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">{language === "ar" ? "أبعاد متعددة" : "Multiple Ratios"}</h3>
                <p className="text-muted-foreground text-sm">{language === "ar" ? "دعم كامل للمقاسات الطولية والعرضية." : "Full support for portrait and landscape sizes."}</p>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div 
            className="bg-muted/30 border border-border/50 rounded-3xl p-8 relative overflow-hidden group hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both"
          >
            <div className="flex items-start justify-between h-full flex-col">
              <div className="bg-background border border-border w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">{language === "ar" ? "جودة عالية" : "High Quality"}</h3>
                <p className="text-muted-foreground text-sm">{language === "ar" ? "تصدير الفيديوهات بدقة عالية 1080p." : "Export videos in high definition 1080p."}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* My Works Section */}
      <section className="w-full max-w-7xl px-4 py-16 md:py-24 relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">{language === "ar" ? "أعمالي" : "My Works"}</h2>
            <p className="text-muted-foreground">{language === "ar" ? "استعرض مشاريعك السابقة وواصل الإبداع" : "Browse your previous projects and keep creating"}</p>
          </div>
          {user && projects.length > 0 && (
            <Link href="/profile?tab=works" className="hidden sm:flex items-center text-primary font-medium hover:underline">
              {language === "ar" ? "عرض الكل" : "View All"} <ArrowRight className={`mx-1 h-4 w-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            </Link>
          )}
        </div>

        {!user ? (
          <div className="bg-muted/30 border border-border/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-primary/10 p-4 rounded-full mb-6">
              <FolderOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{language === "ar" ? "سجل دخولك لحفظ أعمالك" : "Log in to save your works"}</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              {language === "ar" 
                ? "لن يتم حفظ مقاطع الفيديو التي تنشئها إلا إذا قمت بتسجيل الدخول. انضم إلينا الآن للوصول إلى جميع أعمالك في أي وقت." 
                : "Videos you create won't be saved unless you log in. Join us now to access all your works anytime."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/auth"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                {language === "ar" ? "تسجيل الدخول" : "Log in"}
              </Link>
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => document.querySelector('textarea')?.focus(), 500);
                }}
                className="bg-background text-foreground border border-border px-8 py-3 rounded-xl font-medium hover:bg-muted transition-colors"
              >
                {language === "ar" ? "جرب مجاناً" : "Try for free"}
              </button>
            </div>
          </div>
        ) : loadingProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-muted/30 aspect-video animate-pulse border border-border/50"></div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-muted/30 border border-dashed border-border/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-primary/10 p-4 rounded-full mb-6">
              <Wand2 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{language === "ar" ? "لم تقم بإنشاء أي عمل بعد" : "You haven't created any work yet"}</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              {language === "ar" 
                ? "ابدأ رحلتك الإبداعية الآن وقم بتوليد أول فيديو لك باستخدام الذكاء الاصطناعي." 
                : "Start your creative journey now and generate your first AI video."}
            </p>
            <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => document.querySelector('textarea')?.focus(), 500);
              }}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{language === "ar" ? "إنشاء أول عمل" : "Create your first work"}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <div 
                key={project.id}
                className="group relative rounded-2xl overflow-hidden border border-border/50 bg-slate-900 aspect-video cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 transition-all duration-500"
                onClick={() => router.push(`/create?projectId=${project.id}`)}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden bg-slate-950/50">
                  <Play className="w-12 h-12 text-primary/50 group-hover:text-primary transition-colors mb-2" />
                  <span className="text-xs text-slate-400 font-medium px-3 py-1 bg-slate-900/80 rounded-full border border-white/5">
                    {project.ratio || "16:9"} • {project.duration || "5s"}
                  </span>
                </div>
                
                {/* Always visible gradient at bottom for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-white font-semibold text-lg truncate mb-1">
                    {project.title || (language === "ar" ? "مشروع بدون عنوان" : "Untitled Project")}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-md">
                      {project.ratio}
                    </span>
                    <span className="text-xs bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-md">
                      {project.duration}s
                    </span>
                  </div>
                </div>

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/20 backdrop-blur-md rounded-full p-4 text-white transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow-2xl">
                    <Play className="h-6 w-6 fill-current ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-5xl px-4 py-16 md:py-24 relative z-10">
        <div className="bg-gradient-to-br from-primary/20 via-purple-500/10 to-blue-500/20 border border-border/50 rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/abstract/800/600')] opacity-5 mix-blend-overlay" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              {language === "ar" ? "جاهز لتحويل أفكارك إلى واقع؟" : "Ready to turn your ideas into reality?"}
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              {language === "ar" 
                ? "انضم إلى آلاف المبدعين الذين يستخدمون منصتنا لإنشاء مقاطع فيديو مذهلة في ثوانٍ." 
                : "Join thousands of creators using our platform to generate stunning videos in seconds."}
            </p>
            <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => document.querySelector('textarea')?.focus(), 500);
              }}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
            >
              {language === "ar" ? "ابدأ الإبداع مجاناً" : "Start Creating for Free"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full relative z-10 overflow-hidden mt-10">
        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-32 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto pt-16 pb-8 px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-primary to-purple-600 p-2.5 rounded-xl shadow-lg shadow-primary/20">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Deeb Motion Ai</span>
              </div>
              <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                {language === "ar" 
                  ? "منصتك الأولى لتوليد مقاطع الفيديو الاحترافية باستخدام الذكاء الاصطناعي وكود React. نحول أفكارك إلى واقع مرئي في ثوانٍ." 
                  : "Your premier platform for generating professional videos using AI and React code. We turn your ideas into visual reality in seconds."}
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm hover:shadow-primary/25">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm hover:shadow-primary/25">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 relative inline-block">
                {language === "ar" ? "روابط سريعة" : "Quick Links"}
                <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-primary rounded-full"></span>
              </h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link href="/" className="hover:text-primary hover:translate-x-1 inline-block transition-all">{language === "ar" ? "الرئيسية" : "Home"}</Link></li>
                <li><Link href="/profile" className="hover:text-primary hover:translate-x-1 inline-block transition-all">{language === "ar" ? "حسابي" : "My Account"}</Link></li>
                <li><Link href="/profile?tab=works" className="hover:text-primary hover:translate-x-1 inline-block transition-all">{language === "ar" ? "أعمالي" : "My Works"}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 relative inline-block">
                {language === "ar" ? "قانوني" : "Legal"}
                <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-primary rounded-full"></span>
              </h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link href="#" className="hover:text-primary hover:translate-x-1 inline-block transition-all">{language === "ar" ? "شروط الاستخدام" : "Terms of Service"}</Link></li>
                <li><Link href="#" className="hover:text-primary hover:translate-x-1 inline-block transition-all">{language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</Link></li>
                <li><Link href="#" className="hover:text-primary hover:translate-x-1 inline-block transition-all">{language === "ar" ? "تواصل معنا" : "Contact Us"}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <p className="text-center md:text-left w-full">
              © {new Date().getFullYear()} Deeb Motion Ai. {language === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."} <span className="text-primary font-medium mx-1">| Master.Dev | Sharksite.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
