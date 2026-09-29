"use client";
import { useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import css from "./admin.module.css";
import AdminSidebar, { type AdminSection } from "./AdminSidebar";
import CommunityOverview from "./sections/CommunityOverview";
import UsersSection from "./sections/UsersSection";
import CommunitiesSection from "./sections/CommunitiesSection";
import ComplaintsSection from "./sections/ComplaintsSection";
import { useProfile } from "@/hooks/auth/useProfile";

const Admin = () => {
  const [section, setSection] = useState<AdminSection>("overview");
  const { data: profile, isLoading } = useProfile();

  // все данные в разделах и так защищены на бэкенде (403 без роли админа) —
  // это просто не даёт обычному пользователю листать пустые/ошибочные экраны
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
      <AdminSidebar section={section} onSelect={setSection} />

      <main className={css.content}>
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
