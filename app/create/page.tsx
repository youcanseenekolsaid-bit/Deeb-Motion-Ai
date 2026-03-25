"use client";

import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Send, Download, Plus, Play, Pause, Settings2, Sparkles, Bot, User, Loader2, Image as ImageIcon, Code, Upload } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { generateVideoScript } from "@/utils/generate";
import { Player, PlayerRef } from "@remotion/player";
import { DynamicVideo } from "@/components/remotion/DynamicVideo";
import { useAuth } from "@/components/auth-provider";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ColorInput = ({ originalColor, onApply }: { originalColor: string, onApply: (c: string) => void }) => {
  const [val, setVal] = useState(originalColor);
  const isHex = val.startsWith('#') && (val.length === 7 || val.length === 4);
  
  useEffect(() => {
    setVal(originalColor);
  }, [originalColor]);

  const handleBlur = () => {
    if (val !== originalColor) {
      onApply(val);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 rounded-md border border-border shadow-sm flex-shrink-0 overflow-hidden" style={{ backgroundColor: val }}>
        {isHex && (
          <input 
            type="color" 
            value={val.length === 4 ? `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}` : val}
            onChange={(e) => {
              setVal(e.target.value);
              onApply(e.target.value);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        )}
      </div>
      <input 
        type="text" 
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        className="flex-1 bg-muted border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
        dir="ltr"
      />
    </div>
  );
};

const TextInput = ({ originalText, onApply }: { originalText: string, onApply: (t: string) => void }) => {
  const [val, setVal] = useState(originalText);
  
  useEffect(() => {
    setVal(originalText);
  }, [originalText]);

  const handleBlur = () => {
    if (val !== originalText) {
      onApply(val);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <textarea 
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        rows={2}
        dir="auto"
      />
    </div>
  );
};

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

function CreateContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";
  const initialMode = (searchParams.get("mode") as "prompt" | "code") || "prompt";
  const initialDurationStr = searchParams.get("duration") || "5s";
  const initialRatio = searchParams.get("ratio") || "16:9";
  const projectIdParam = searchParams.get("projectId");
  
  const { t, dir, language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "ai", content: t("create.initialAiMsg") }
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isRendering, setIsRendering] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(projectIdParam);
  const [projectTitle, setProjectTitle] = useState<string>("Untitled Project");
  const [ratio, setRatio] = useState<string>(initialRatio);
  const [durationInSeconds, setDurationInSeconds] = useState<number>(parseInt(initialDurationStr.replace("s", ""), 10) || 5);
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");
  const [editedCode, setEditedCode] = useState<string>("");
  const [showProperties, setShowProperties] = useState(false);
  const playerRef = useRef<PlayerRef>(null);

  const fps = 30;
  const totalFrames = durationInSeconds * fps;

  const generateId = () => Math.random().toString(36).substring(2, 9);

  useEffect(() => {
    setEditedCode(generatedCode);
  }, [generatedCode]);

  const extractedColors = useMemo(() => {
    if (!generatedCode) return [];
    const colorRegex = /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\))/g;
    const matches = generatedCode.match(colorRegex);
    return matches ? Array.from(new Set(matches)) : [];
  }, [generatedCode]);

  const extractedTexts = useMemo(() => {
    if (!generatedCode) return [];
    const textRegex = />\s*([^<{}]+?)\s*</g;
    const matches = new Set<string>();
    let match;
    while ((match = textRegex.exec(generatedCode)) !== null) {
      const text = match[1].trim();
      if (text.length > 0 && text !== " ") {
        matches.add(text);
      }
    }
    return Array.from(matches);
  }, [generatedCode]);

  const handleReplaceColor = (oldColor: string, newColor: string) => {
    if (oldColor === newColor) return;
    const newCode = generatedCode.split(oldColor).join(newColor);
    setGeneratedCode(newCode);
    setEditedCode(newCode);
  };

  const handleReplaceText = (oldText: string, newText: string) => {
    if (oldText === newText) return;
    const regex = new RegExp(`(>\\s*)${escapeRegExp(oldText)}(\\s*<)`, 'g');
    const newCode = generatedCode.replace(regex, `$1${newText}$2`);
    setGeneratedCode(newCode);
    setEditedCode(newCode);
  };

  const handleApplyCode = () => {
    setGeneratedCode(editedCode);
    setActiveView("preview");
    setMessages(prev => [...prev, { id: generateId(), role: "user", content: t("create.appliedManualCode") || "I have manually updated the video code." }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setEditedCode(content);
      setGeneratedCode(content);
      setMessages(prev => [...prev, { id: generateId(), role: "user", content: t("create.uploadedCodeFile") || "I have uploaded a custom TypeScript file for the video." }]);
      setActiveView("preview");
    };
    reader.readAsText(file);
  };

  // Load project if projectId is provided
  useEffect(() => {
    const loadProject = async () => {
      if (projectIdParam && user) {
        try {
          const projectDoc = await getDoc(doc(db, "projects", projectIdParam));
          if (projectDoc.exists()) {
            const data = projectDoc.data();
            if (data.userId === user.uid) {
              setMessages(data.messages || []);
              setGeneratedCode(data.code || "");
              setProjectTitle(data.title || "Untitled Project");
              if (data.ratio) setRatio(data.ratio);
              if (data.duration) setDurationInSeconds(data.duration);
            }
          }
        } catch (error) {
          console.error("Error loading project:", error);
        }
      }
    };
    loadProject();
  }, [projectIdParam, user]);

  // Save project automatically when code or messages change
  useEffect(() => {
    const saveProject = async () => {
      if (user && generatedCode && messages.length > 1) {
        try {
          const id = projectId || generateId();
          if (!projectId) setProjectId(id);
          
          const projectData: any = {
            id,
            userId: user.uid,
            title: projectTitle,
            code: generatedCode,
            messages,
            ratio,
            duration: durationInSeconds,
            updatedAt: new Date(),
          };
          
          if (!projectId) {
            projectData.createdAt = new Date();
          }
          
          await setDoc(doc(db, "projects", id), projectData, { merge: true });
        } catch (error) {
          console.error("Error saving project:", error);
        }
      }
    };
    
    const timeoutId = setTimeout(saveProject, 2000); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [generatedCode, messages, user, projectId, projectTitle, ratio, durationInSeconds]);

  const handleGenerateVideo = async (userPrompt: string, currentCode?: string) => {
    setIsGenerating(true);
    
    try {
      const result = await generateVideoScript(userPrompt, durationInSeconds, fps, currentCode);
      
      if (result.success && result.code) {
        setGeneratedCode(result.code);
        setMessages(prev => [...prev, { 
          id: generateId(), 
          role: "ai", 
          content: result.message || "Done."
        }]);
        // Set title based on first prompt if it's "Untitled Project"
        if (projectTitle === "Untitled Project" && userPrompt) {
          setProjectTitle(userPrompt.substring(0, 30) + "...");
        }
      } else {
        throw new Error(result.error || "Failed to generate");
      }
    } catch (error: any) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { 
        id: generateId(), 
        role: "ai", 
        content: t("create.error")
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!generatedCode) return;
    
    // 1. Trigger GitHub Actions export in the background
    fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: generatedCode, ratio, durationInSeconds })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log("GitHub Render started successfully.");
      } else {
        console.error("GitHub Render failed:", data.error);
      }
    })
    .catch(error => {
      console.error("Error starting GitHub render:", error);
    });

    // 2. Start browser recording
    try {
      alert("تم إرسال طلب الرندرة إلى GitHub في الخلفية.\n\nوسنقوم أيضاً بتسجيل الفيديو من المتصفح الآن.\nالرجاء اختيار 'هذه العلامة' (This Tab) من النافذة التي ستظهر لك، والتأكد من تفعيل 'مشاركة الصوت' (Share audio) إذا لزم الأمر.");
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: true,
        preferCurrentTab: true,
      } as any);

      setIsRendering(true);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "motion-video.webm";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setIsRendering(false);
      };

      // Start recording
      mediaRecorder.start();

      // Play the video from the beginning
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }

      // Stop recording after the video duration
      setTimeout(() => {
        mediaRecorder.stop();
        if (playerRef.current) {
          playerRef.current.pause();
        }
      }, durationInSeconds * 1000 + 500); // Add 500ms buffer

    } catch (error) {
      console.error("Recording error:", error);
      alert("تم إلغاء التسجيل من المتصفح أو حدث خطأ (قد يكون بسبب قيود المتصفح الحالية).\n\nلا تقلق، سيستمر التصدير عبر GitHub في الخلفية ويمكنك تحميله من هناك لاحقاً.");
      setIsRendering(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Handle initial prompt mode
    if (initialMode === "prompt" && initialPrompt && messages.length === 1) {
      setTimeout(() => {
        if (!isMounted) return;
        setMessages(prev => {
          if (prev.some(m => m.id === "init")) return prev;
          return [...prev, { id: "init", role: "user", content: initialPrompt }];
        });
        handleGenerateVideo(initialPrompt);
      }, 0);
    } 
    // Handle initial code mode
    else if (initialMode === "code" && messages.length === 1) {
      const savedCode = localStorage.getItem("custom_remotion_code");
      if (savedCode) {
        setTimeout(() => {
          if (!isMounted) return;
          setMessages(prev => {
            if (prev.some(m => m.id === "init")) return prev;
            return [...prev, { id: "init", role: "user", content: t("create.appliedCode") }];
          });
          setGeneratedCode(savedCode);
          setMessages(prev => [...prev, { 
            id: generateId(), 
            role: "ai", 
            content: t("create.appliedCodeSuccess")
          }]);
          localStorage.removeItem("custom_remotion_code");
        }, 0);
      }
    }
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, initialMode]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    
    const userMsg = input.trim();
    
    setMessages(prev => [...prev, { id: generateId(), role: "user", content: userMsg }]);
    setInput("");
    handleGenerateVideo(userMsg, generatedCode);
  };

  const width = ratio === "16:9" ? 1920 : 1080;
  const height = ratio === "16:9" ? 1080 : 1920;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-background">
      
      {/* Left Panel: Chat & Edit */}
      <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col border-r border-border bg-muted/10">
        <div className="p-4 border-b border-border flex items-center justify-between bg-background">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">
              {showProperties 
                ? (language === "ar" ? "خصائص الفيديو" : "Video Properties") 
                : t("create.editor")}
            </h2>
          </div>
          <button 
            onClick={() => setShowProperties(!showProperties)}
            className={`p-2 rounded-md transition-colors ${showProperties ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            title={language === "ar" ? "تعديل الخصائص" : "Edit Properties"}
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>

        {showProperties ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Colors Section */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center justify-between">
                <span>{language === "ar" ? "الألوان" : "Colors"}</span>
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{extractedColors.length}</span>
              </h3>
              <div className="space-y-3">
                {extractedColors.map((color, i) => (
                  <ColorInput key={i} originalColor={color} onApply={(newColor) => handleReplaceColor(color, newColor)} />
                ))}
                {extractedColors.length === 0 && (
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "لم يتم العثور على ألوان قابلة للتعديل" : "No editable colors found"}</p>
                )}
              </div>
            </div>

            {/* Texts Section */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center justify-between">
                <span>{language === "ar" ? "النصوص" : "Texts"}</span>
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{extractedTexts.length}</span>
              </h3>
              <div className="space-y-3">
                {extractedTexts.map((text, i) => (
                  <TextInput key={i} originalText={text} onApply={(newText) => handleReplaceText(text, newText)} />
                ))}
                {extractedTexts.length === 0 && (
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "لم يتم العثور على نصوص قابلة للتعديل" : "No editable texts found"}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[85%] ${msg.role === "user" ? (dir === 'rtl' ? "flex-row" : "flex-row-reverse") : "flex-row"}`}>
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-primary text-primary-foreground mx-3" : "bg-muted border border-border mx-3"}`}>
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                      msg.role === "user" 
                        ? `bg-primary text-primary-foreground ${dir === 'rtl' ? 'rounded-tl-sm' : 'rounded-tr-sm'}`
                        : `bg-muted border border-border ${dir === 'rtl' ? 'rounded-tr-sm' : 'rounded-tl-sm'} text-foreground`
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="flex max-w-[85%] flex-row">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted border border-border mx-3 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className={`p-4 rounded-2xl bg-muted border border-border ${dir === 'rtl' ? 'rounded-tr-sm' : 'rounded-tl-sm'} flex items-center space-x-2 rtl:space-x-reverse`}>
                      <div className="flex space-x-1 rtl:space-x-reverse">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-background border-t border-border flex flex-col gap-3">
              <form onSubmit={handleSendMessage} className="relative flex flex-col gap-2">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t("create.placeholder")}
                    className={`w-full bg-muted border border-border rounded-full ${dir === 'rtl' ? 'pr-4 pl-12' : 'pl-4 pr-12'} py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none`}
                    disabled={isGenerating}
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isGenerating}
                    className={`absolute ${dir === 'rtl' ? 'left-1.5' : 'right-1.5'} p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors`}
                  >
                    <Send className={`h-4 w-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Right Panel: Video Preview */}
      <div className="hidden md:flex flex-1 flex-col bg-black/5 dark:bg-black/20 relative">
        <div className={`absolute top-4 ${dir === 'rtl' ? 'right-4' : 'left-4'} flex items-center bg-background/80 backdrop-blur-md border border-border rounded-lg p-1 z-10`}>
          <button 
            onClick={() => setActiveView("preview")} 
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeView === "preview" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
          >
            <Play className="h-4 w-4" />
            <span>{language === "ar" ? "معاينة" : "Preview"}</span>
          </button>
          <button 
            onClick={() => { setActiveView("code"); setEditedCode(generatedCode); }} 
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeView === "code" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
          >
            <Code className="h-4 w-4" />
            <span>{language === "ar" ? "الكود" : "Code"}</span>
          </button>
        </div>

        <div className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} flex items-center space-x-3 rtl:space-x-reverse z-10`}>
          <Link 
            href="/"
            className="flex items-center space-x-2 rtl:space-x-reverse bg-background/80 backdrop-blur-md border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-background transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t("create.newVideo")}</span>
          </Link>
          <button 
            onClick={handleExport}
            disabled={isGenerating || !generatedCode || isRendering || activeView === "code"}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
          >
            {isRendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{isRendering ? "Rendering..." : t("create.export")}</span>
          </button>
        </div>

        {activeView === "preview" ? (
          <div className="flex-1 flex items-center justify-center p-8 pt-20">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-border/50 flex items-center justify-center" dir="ltr">
              
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-20">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">{t("create.generatingVideo")}</h3>
                  <p className="text-muted-foreground max-w-md text-center">
                    {t("create.creatingMasterpiece")}
                  </p>
                </div>
              ) : generatedCode ? (
                <Player
                  ref={playerRef}
                  component={DynamicVideo}
                  inputProps={{ code: generatedCode }}
                  durationInFrames={totalFrames}
                  compositionWidth={width}
                  compositionHeight={height}
                  fps={fps}
                  style={{
                    width: "100%",
                    aspectRatio: ratio === "16:9" ? "16/9" : "9/16",
                    maxHeight: "100%",
                  }}
                  controls
                  autoPlay
                  loop
                  acknowledgeRemotionLicense
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center">
                  <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                  <p>{t("create.promptLabel")}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-8 pt-20">
            {!generatedCode && messages.length <= 1 ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-background/50 p-8">
                <Code className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">{language === "ar" ? "رفع أو لصق الكود" : "Upload or Paste Code"}</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  {language === "ar" ? "ابدأ مشروعك برفع ملف React/TypeScript أو لصق الكود مباشرة." : "Start your project by uploading a React/TypeScript file or pasting your code directly."}
                </p>
                
                <div className="flex gap-4">
                  <label className="cursor-pointer bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>{language === "ar" ? "رفع ملف .tsx" : "Upload .tsx File"}</span>
                    <input type="file" accept=".tsx,.ts,.txt" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <button onClick={() => setGeneratedCode(" ")} className="bg-muted text-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-muted/80 transition-colors">
                    {language === "ar" ? "لصق الكود" : "Paste Code"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-background border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-muted/50 border-b border-border px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">video.tsx</span>
                    {(!generatedCode || generatedCode.trim() === "") && (
                      <label className="cursor-pointer flex items-center gap-1.5 text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md hover:bg-secondary/80 transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{language === "ar" ? "رفع ملف" : "Upload File"}</span>
                        <input type="file" accept=".tsx,.ts,.txt" className="hidden" onChange={handleFileUpload} />
                      </label>
                    )}
                  </div>
                  <button 
                    onClick={handleApplyCode}
                    disabled={!editedCode.trim() || editedCode === generatedCode}
                    className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {language === "ar" ? "تطبيق التغييرات" : "Apply Changes"}
                  </button>
                </div>
                <textarea 
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  placeholder={language === "ar" ? "قم بلصق كود React/TypeScript هنا..." : "Paste your React/TypeScript code here..."}
                  className="flex-1 w-full p-4 bg-transparent font-mono text-sm resize-none focus:outline-none"
                  spellCheck={false}
                  dir="ltr"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <CreateContent />
    </Suspense>
  );
}
