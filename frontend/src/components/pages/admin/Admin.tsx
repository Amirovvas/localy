"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, ShieldAlert } from "lucide-react";
import css from "./admin.module.css";
import AdminSidebar, { type AdminSection } from "./AdminSidebar";
import CommunityOverview from "./sections/CommunityOverview";
import UsersSection from "./sections/UsersSection";
import CommunitiesSection from "./sections/CommunitiesSection";
import ComplaintsSection from "./sections/ComplaintsSection";
import { useProfile } from "@/hooks/auth/useProfile";

const Admin = () => {
  const [section, setSection] = useState<AdminSection>("overview");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { data: profile, isLoading } = useProfile();

  const handleSelect = (next: AdminSection) => {
    setSection(next);
    setSidebarOpen(false);
  };

  if (isLoading) {
    return <div className={css.shell} />;
  }

  if (!profile?.is_admin) {
    return (
      <div className={css.shell}>
        <div className={css.denied}>
          <ShieldAlert size={32} className={css.deniedIcon} />
          <h1>Доступ запрещён</h1>
          <p>Эта страница доступна только администраторам Localy.</p>
          <Link href="/" className={css.deniedLink}>
            Вернуться в чат
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={css.shell}>
      {isSidebarOpen && <div className={css.scrim} onClick={() => setSidebarOpen(false)} />}

      <AdminSidebar
        section={section}
        onSelect={handleSelect}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={css.content}>
        <header className={css.mobileTopbar}>
          <button
            type="button"
            className={css.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu size={18} />
          </button>
          <span className={css.mobileBrand}>Localy Admin</span>
        </header>

        <div className={css.pageBody}>
          {section === "overview" && <CommunityOverview />}
          {section === "users" && <UsersSection />}
          {section === "communities" && <CommunitiesSection />}
          {section === "complaints" && <ComplaintsSection />}
        </div>
      </main>
    </div>
  );
};

export default Admin;
