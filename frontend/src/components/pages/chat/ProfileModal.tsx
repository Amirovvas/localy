"use client";
import { createPortal } from "react-dom";
import { LogOut, Mail, User } from "lucide-react";
import css from "./profileModal.module.css";
import Modal from "@/components/ui/Modal";
import { CommunityIcon } from "@/components/layout/CommunityIcon";
import { useProfile } from "@/hooks/auth/useProfile";
import { useLogout } from "@/hooks/auth/useLogout";
import { COMMUNITY_CATEGORY_LABELS } from "@/lib/mockData";

interface IProps {
  onClose: () => void;
}

const ProfileModal = ({ onClose }: IProps) => {
  const { data: profile, isLoading } = useProfile();
  const logout = useLogout();

  // портал в body — как у JoinCommunityModal, чтобы окно не зависело от
  // transform мобильного сайдбара
  return createPortal(
    <Modal title="Профиль" onClose={onClose} width={420}>
      {isLoading || !profile ? (
        <p className={css.hint}>Загрузка...</p>
      ) : (
        <>
          <div className={css.row}>
            <span className={css.rowIcon}>
              <User size={16} />
            </span>
            <div className={css.rowBody}>
              <span className={css.rowLabel}>Имя</span>
              <span className={css.rowValue}>{profile.name}</span>
            </div>
          </div>

          <div className={css.row}>
            <span className={css.rowIcon}>
              <Mail size={16} />
            </span>
            <div className={css.rowBody}>
              <span className={css.rowLabel}>Почта</span>
              <span className={css.rowValue}>{profile.email}</span>
            </div>
          </div>

          <span className={css.sectionLabel}>Мои сообщества</span>
          <div className={css.communityList}>
            {profile.communities.map((community) => (
              <div key={community.id} className={css.communityRow}>
                <span className={css.communityIcon}>
                  <CommunityIcon category={community.category} size={15} />
                </span>
                <div className={css.communityBody}>
                  <span className={css.communityName}>{community.name}</span>
                  <span className={css.communityMeta}>
                    {COMMUNITY_CATEGORY_LABELS[community.category]}
                  </span>
                </div>
              </div>
            ))}
            {profile.communities.length === 0 && (
              <span className={css.hint}>Вы пока не состоите ни в одном сообществе.</span>
            )}
          </div>

          <button
            type="button"
            className={css.logoutBtn}
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut size={14} />
            {logout.isPending ? "Выходим..." : "Выйти из аккаунта"}
          </button>
        </>
      )}
    </Modal>,
    document.body,
  );
};

export default ProfileModal;
