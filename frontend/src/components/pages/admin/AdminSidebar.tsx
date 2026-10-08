"use client";
import { Building2, Flag, LayoutDashboard, LogOut, Users, X } from "lucide-react";
import css from "./adminSidebar.module.css";
import { LogoMark } from "@/components/layout/Logo";
import { Avatar } from "@/components/layout/Avatar";
import { useProfile } from "@/hooks/auth/useProfile";
import { useLogout } from "@/hooks/auth/useLogout";

export type AdminSection = "overview" | "users" | "communities" | "complaints";

interface IProps {
  section: AdminSection;
  onSelect: (section: AdminSection) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MANAGEMENT_ITEMS: { id: AdminSection; label: string; icon: typeof Users }[] = [
  { id: "users", label: "Пользователи", icon: Users },
  { id: "communities", label: "Сообщества", icon: Building2 },
  { id: "complaints", label: "Жалобы", icon: Flag },
];

const AdminSidebar = ({ section, onSelect, isOpen, onClose }: IProps) => {
  const { data: profile } = useProfile();
  const logout = useLogout();

  return (
    <aside className={css.sidebar} data-open={isOpen}>
      <div className={css.header}>
        <LogoMark size={16} />
        <div className={css.brandBlock}>
          <span className={css.brand}>Localy</span>
          <span className={css.brandTag}>Admin</span>
        </div>
        <button type="button" className={css.closeBtn} onClick={onClose} aria-label="Закрыть меню">
          <X size={18} />
        </button>
      </div>

      <nav className={css.nav}>
        <button
          type="button"
          className={css.navBtn}
          data-active={section === "overview"}
          onClick={() => onSelect("overview")}
        >
          <LayoutDashboard size={17} className={css.navIcon} />
          Сообщество
        </button>

        <span className={css.groupLabel}>Управление</span>

        {MANAGEMENT_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={css.navBtn}
            data-active={section === id}
            onClick={() => onSelect(id)}
          >
            <Icon size={17} className={css.navIcon} />
            {label}
          </button>
        ))}
      </nav>

      <div className={css.footer}>
        <button
          type="button"
          className={css.backLink}
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut size={15} />
          {logout.isPending ? "Выходим..." : "Выйти из аккаунта"}
        </button>

        <div className={css.adminCard}>
          <Avatar size={32} />
          <div className={css.adminInfo}>
            <span className={css.adminName}>{profile?.name ?? "Администратор"}</span>
            <span className={css.adminRole}>{profile?.email ?? "Полный доступ"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
