"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { User, FolderOpen, LogOut, Trash2, Edit2, Loader2, Play, MonitorPlay } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signOut, updatePassword, deleteUser } from "firebase/auth";
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { ConfirmModal } from "@/components/confirm-modal";
import { Thumbnail } from "@remotion/player";
import { DynamicVideo } from "@/components/remotion/DynamicVideo";

function ProfileContent() {
  const { user, userData, loading } = useAuth();
  const { t, dir, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'logout' | 'deleteAccount' | 'deleteProject' | null;
    projectId?: string;
  }>({ isOpen: false, type: null });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (userData) {
      setNewName(userData.displayName || "");
    }
  }, [userData]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      setLoadingProjects(true);
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
        
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    if (user && activeTab === "works") {
      fetchProjects();
    }
  }, [user, activeTab]);

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: newName
      });
      setIsEditingName(false);
      alert(language === "ar" ? "تم تحديث الاسم بنجاح" : "Name updated successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error updating name:", error);
      alert(language === "ar" ? "حدث خطأ أثناء تحديث الاسم" : "Error updating name");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user || !newPassword.trim()) return;
    setActionLoading(true);
    try {
      await updatePassword(user, newPassword);
      setIsEditingPassword(false);
      setNewPassword("");
      alert(language === "ar" ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully");
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert(language === "ar" ? "يرجى تسجيل الدخول مرة أخرى لتحديث كلمة المرور" : "Please login again to update password");
      } else {
        alert(language === "ar" ? "حدث خطأ أثناء تحديث كلمة المرور" : "Error updating password");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setModalConfig({ isOpen: true, type: 'deleteAccount' });
  };

  const executeDeleteAccount = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      // Delete user document
      await deleteDoc(doc(db, "users", user.uid));
      // Delete username mapping (we would need to query it, but for simplicity we might leave it or delete if we know it)
      if (userData?.username) {
        await deleteDoc(doc(db, "usernames", userData.username));
      }
      // Delete all projects
      const q = query(collection(db, "projects"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      
      // Delete auth user
      await deleteUser(user);
      router.push("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert(language === "ar" ? "يرجى تسجيل الدخول مرة أخرى لحذف الحساب" : "Please login again to delete account");
      } else {
        alert(language === "ar" ? "حدث خطأ أثناء حذف الحساب" : "Error deleting account");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    setModalConfig({ isOpen: true, type: 'logout' });
  };

  const executeLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleDeleteProject = (projectId: string) => {
    setModalConfig({ isOpen: true, type: 'deleteProject', projectId });
  };

  const executeDeleteProject = async () => {
    const projectId = modalConfig.projectId;
    if (!projectId) return;
    try {
      await deleteDoc(doc(db, "projects", projectId));
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(language === "ar" ? "حدث خطأ أثناء حذف المشروع" : "Error deleting project");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-muted/30 border border-border rounded-2xl p-4 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                activeTab === "profile" 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-4 w-4" />
              <span>{t("nav.profile")}</span>
            </button>
            <button
              onClick={() => setActiveTab("works")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                activeTab === "works" 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>{t("nav.works")}</span>
            </button>
            
            <div className="h-px bg-border my-2"></div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-red-400 hover:bg-red-400/10"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("nav.logout")}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <div className="bg-muted/10 border border-border rounded-3xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">{t("nav.profile")}</h2>
              
              <div className="space-y-6 max-w-md">
                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{language === "ar" ? "البريد الإلكتروني" : "Email"}</label>
                  <div className="px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm">
                    {user.email}
                  </div>
                </div>

                {/* Username (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{language === "ar" ? "اسم المستخدم" : "Username"}</label>
                  <div className="px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm">
                    {userData?.username || "-"}
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{language === "ar" ? "الاسم" : "Name"}</label>
                  {isEditingName ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <button 
                        onClick={handleUpdateName}
                        disabled={actionLoading}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                      >
                        {language === "ar" ? "حفظ" : "Save"}
                      </button>
                      <button 
                        onClick={() => { setIsEditingName(false); setNewName(userData?.displayName || ""); }}
                        className="bg-muted text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted/80"
                      >
                        {language === "ar" ? "إلغاء" : "Cancel"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm">
                      <span>{userData?.displayName || "-"}</span>
                      <button onClick={() => setIsEditingName(true)} className="text-primary hover:text-primary/80">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{language === "ar" ? "كلمة المرور" : "Password"}</label>
                  {isEditingPassword ? (
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <button 
                        onClick={handleUpdatePassword}
                        disabled={actionLoading}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                      >
                        {language === "ar" ? "حفظ" : "Save"}
                      </button>
                      <button 
                        onClick={() => { setIsEditingPassword(false); setNewPassword(""); }}
                        className="bg-muted text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted/80"
                      >
                        {language === "ar" ? "إلغاء" : "Cancel"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm">
                      <span>••••••••</span>
                      <button onClick={() => setIsEditingPassword(true)} className="text-primary hover:text-primary/80">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-border mt-8">
                  <h3 className="text-red-400 font-medium mb-2">{language === "ar" ? "منطقة الخطر" : "Danger Zone"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === "ar" ? "بمجرد حذف حسابك، لا يمكن التراجع عن ذلك. يرجى التأكد." : "Once you delete your account, there is no going back. Please be certain."}
                  </p>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={actionLoading}
                    className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {language === "ar" ? "حذف الحساب" : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "works" && (
            <div className="bg-muted/10 border border-border rounded-3xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">{t("nav.works")}</h2>
              
              {loadingProjects ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {language === "ar" ? "لم تقم بإنشاء أي مشاريع بعد." : "You haven't created any projects yet."}
                  </p>
                  <Link 
                    href="/create"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    <span>{language === "ar" ? "إنشاء مشروع جديد" : "Create New Project"}</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-background border border-border rounded-2xl overflow-hidden flex flex-col group hover:border-primary/50 transition-colors shadow-sm">
                      <div className="relative aspect-video bg-black cursor-pointer" onClick={() => router.push(`/create?projectId=${project.id}`)}>
                        <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                          {project.code ? (
                            <Thumbnail
                              component={DynamicVideo}
                              compositionWidth={project.ratio === "9:16" ? 1080 : 1920}
                              compositionHeight={project.ratio === "9:16" ? 1920 : 1080}
                              frameToDisplay={30}
                              durationInFrames={150}
                              fps={30}
                              inputProps={{ code: project.code }}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <MonitorPlay className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                          <p className="text-white text-xs font-medium">
                            {new Date(project.updatedAt?.toDate() || project.createdAt?.toDate() || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                              {project.ratio}
                            </span>
                            <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                              {project.duration}s
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-muted-foreground hover:text-red-400 p-1.5 rounded-md hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="mt-auto pt-2">
                          <Link 
                            href={`/create?projectId=${project.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span>{language === "ar" ? "تعديل الفيديو" : "Edit Video"}</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={modalConfig.isOpen && modalConfig.type === 'logout'}
        onClose={() => setModalConfig({ isOpen: false, type: null })}
        onConfirm={executeLogout}
        title={language === "ar" ? "تسجيل الخروج" : "Logout"}
        message={language === "ar" ? "هل أنت متأكد أنك تريد تسجيل الخروج؟" : "Are you sure you want to logout?"}
        confirmText={language === "ar" ? "تسجيل الخروج" : "Logout"}
        cancelText={language === "ar" ? "إلغاء" : "Cancel"}
        isDanger={true}
      />

      <ConfirmModal
        isOpen={modalConfig.isOpen && modalConfig.type === 'deleteAccount'}
        onClose={() => setModalConfig({ isOpen: false, type: null })}
        onConfirm={executeDeleteAccount}
        title={language === "ar" ? "حذف الحساب" : "Delete Account"}
        message={language === "ar" ? "هل أنت متأكد تماماً أنك تريد حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه وسيحذف جميع بياناتك ومشاريعك." : "Are you absolutely sure you want to delete your account? This action cannot be undone and will delete all your data and projects."}
        confirmText={language === "ar" ? "حذف الحساب نهائياً" : "Delete Account Permanently"}
        cancelText={language === "ar" ? "إلغاء" : "Cancel"}
        isDanger={true}
      />

      <ConfirmModal
        isOpen={modalConfig.isOpen && modalConfig.type === 'deleteProject'}
        onClose={() => setModalConfig({ isOpen: false, type: null })}
        onConfirm={executeDeleteProject}
        title={language === "ar" ? "حذف المشروع" : "Delete Project"}
        message={language === "ar" ? "هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this project? This action cannot be undone."}
        confirmText={language === "ar" ? "حذف" : "Delete"}
        cancelText={language === "ar" ? "إلغاء" : "Cancel"}
        isDanger={true}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
