"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun, Wand2, Globe, User, LogOut, FolderOpen, Plus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "./language-provider";
import { useAuth } from "./auth-provider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { ConfirmModal } from "./confirm-modal";

export function Navbar() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { language, setLanguage, t, dir } = useLanguage();
  const { user, userData, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
    setDropdownOpen(false);
  };

  const executeLogout = async () => {
    await signOut(auth);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/50 supports-[backdrop-filter]:bg-slate-950/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className={`flex items-center space-x-2 rtl:space-x-reverse group`}>
            <div className="bg-purple-500/10 p-2 rounded-xl group-hover:bg-purple-500/20 transition-colors">
              <Wand2 className="h-5 w-5 text-purple-400" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">{t("nav.title")}</span>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Link 
              href="/create" 
              className="hidden sm:flex items-center gap-2 bg-purple-500 text-white hover:bg-purple-400 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-purple-500/25 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'ar' ? 'إنشاء عمل' : 'Create Project'}</span>
            </Link>
            <Link 
              href="/create" 
              className="sm:hidden flex items-center justify-center w-9 h-9 bg-purple-500 text-white hover:bg-purple-400 rounded-full transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
            </Link>

            <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>

            <button 
              onClick={toggleLanguage}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={language === "en" ? "العربية" : "English"}
            >
              <Globe className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-4 ms-1">
              {!loading && (
                user ? (
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors overflow-hidden ring-2 ring-transparent hover:ring-purple-500/30 focus:outline-none relative"
                    >
                      {userData?.photoURL ? (
                        <Image src={userData.photoURL} alt="Profile" fill className="object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </button>
                    
                    {dropdownOpen && (
                      <div className={`absolute top-full mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden ${dir === 'rtl' ? 'left-0' : 'right-0'} animate-in fade-in slide-in-from-top-2 duration-200`}>
                        <div className="p-4 border-b border-slate-800/50 bg-slate-800/30">
                          <p className="text-sm font-semibold text-white truncate">{userData?.displayName || userData?.username || user.email}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link 
                            href="/profile" 
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                          >
                            <User className="h-4 w-4" />
                            <span>{t("nav.profile")}</span>
                          </Link>
                          <Link 
                            href="/profile?tab=works" 
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                          >
                            <FolderOpen className="h-4 w-4" />
                            <span>{t("nav.works")}</span>
                          </Link>
                          <div className="h-px bg-slate-800/50 my-1 mx-2"></div>
                          <button 
                            onClick={handleLogoutClick}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-start"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>{t("nav.logout")}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      href="/auth"
                      className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      href="/auth"
                      className="rounded-full bg-purple-400/90 hover:bg-purple-400 px-6 py-2 text-sm font-medium text-slate-950 transition-colors"
                    >
                      {t("nav.signup")}
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      <ConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={executeLogout}
        title={language === "ar" ? "تسجيل الخروج" : "Logout"}
        message={language === "ar" ? "هل أنت متأكد أنك تريد تسجيل الخروج؟" : "Are you sure you want to logout?"}
        confirmText={language === "ar" ? "تسجيل الخروج" : "Logout"}
        cancelText={language === "ar" ? "إلغاء" : "Cancel"}
        isDanger={true}
      />
    </>
  );
}
