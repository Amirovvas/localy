"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LogOut, Mail, MapPin, Pencil, Plus, X } from "lucide-react";
import css from "./profile.module.css";
import { Avatar } from "@/components/layout/Avatar";
import { CommunityIcon } from "@/components/layout/CommunityIcon";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import JoinCommunityModal from "@/components/pages/chat/JoinCommunityModal";
import { useProfile, type IProfileCommunity } from "@/hooks/auth/useProfile";
import { useUpdateProfile } from "@/hooks/auth/useUpdateProfile";
import { useLogout } from "@/hooks/auth/useLogout";
import { useLeaveCommunity } from "@/hooks/communities/useLeaveCommunity";
import { getApiErrorMessage } from "@/lib/apiError";
import { COMMUNITY_CATEGORY_LABELS } from "@/lib/mockData";

const Profile = () => {
  const { push } = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const leaveCommunity = useLeaveCommunity();

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<IProfileCommunity | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);

  const startEdit = () => {
    setNameDraft(profile?.name ?? "");
    setNameError(null);
    setEditing(true);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const name = nameDraft.trim();
    if (!name) {
      setNameError("Введите имя");
      return;
    }
    if (name === profile?.name) {
      setEditing(false);
      return;
    }

    setNameError(null);
    updateProfile.mutate({ name }, {
      onSuccess: () => setEditing(false),
      onError: (error) =>
        setNameError(getApiErrorMessage(error) ?? "Не удалось сохранить имя. Попробуйте ещё раз."),
    });
  };

  const handleLeave = () => {
    if (!leaveTarget) return;
    setLeaveError(null);
    leaveCommunity.mutate(leaveTarget.id, {
      onSuccess: () => setLeaveTarget(null),
      onError: (error) => {
        setLeaveTarget(null);
        setLeaveError(getApiErrorMessage(error) ?? "Не удалось покинуть сообщество.");
      },
    });
  };

  return (
    <div className={css.page}>
      <header className={css.topbar}>
        <button type="button" className={css.backBtn} onClick={() => push("/")}>
          <ArrowLeft size={18} />
          <span>К чату</span>
        </button>
        <h1 className={css.title}>Профиль</h1>
      </header>

      <main className={css.content}>
        {isLoading || !profile ? (
          <p className={css.hint}>Загрузка...</p>
        ) : (
          <>
            <section className={css.card}>
              <div className={css.accountHead}>
                <Avatar size={56} />
                <div className={css.accountInfo}>
                  {editing ? (
                    <form className={css.editForm} onSubmit={handleSave}>
                      <input
                        className={css.nameInput}
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.target.value)}
                        maxLength={100}
                        placeholder="Ваше имя"
                        aria-label="Имя"
                        autoFocus
                      />
                      <div className={css.editActions}>
                        <button
                          type="button"
                          className={css.secondaryBtn}
                          onClick={() => setEditing(false)}
                        >
                          <X size={14} />
                          Отмена
                        </button>
                        <button
                          type="submit"
                          className={css.primaryBtn}
                          disabled={updateProfile.isPending}
                        >
                          <Check size={14} />
                          {updateProfile.isPending ? "Сохраняем..." : "Сохранить"}
                        </button>
                      </div>
                      {nameError && <p className={css.error}>{nameError}</p>}
                    </form>
                  ) : (
                    <>
                      <span className={css.name}>{profile.name}</span>
                      <span className={css.anon}>В чатах вы — Аноним #{profile.anon_id}</span>
                    </>
                  )}
                </div>

                {!editing && (
                  <button type="button" className={css.editBtn} onClick={startEdit}>
                    <Pencil size={14} />
                    <span>Редактировать</span>
                  </button>
                )}
              </div>

              <div className={css.facts}>
                <div className={css.fact}>
                  <Mail size={15} />
                  <span>{profile.email}</span>
                </div>
                <div className={css.fact}>
                  <MapPin size={15} />
                  <span>{profile.city}</span>
                </div>
              </div>
            </section>

            <section className={css.card}>
              <div className={css.switchRow}>
                <span className={css.switchText}>
                  <span className={css.switchTitle}>Принимать личные сообщения</span>
                  <span className={css.switchHint}>
                    Другие участники смогут отправить вам запрос на анонимную переписку.
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={profile.allow_dm}
                  aria-label="Принимать личные сообщения"
                  className={css.switch}
                  data-on={profile.allow_dm}
                  disabled={updateProfile.isPending}
                  onClick={() => updateProfile.mutate({ allowDm: !profile.allow_dm })}
                >
                  <span className={css.switchKnob} />
                </button>
              </div>
            </section>

            <section className={css.card}>
              <div className={css.sectionHead}>
                <h2 className={css.sectionTitle}>Мои сообщества · {profile.communities.length}</h2>
                <button type="button" className={css.secondaryBtn} onClick={() => setJoinOpen(true)}>
                  <Plus size={14} />
                  Найти
                </button>
              </div>

              {leaveError && <p className={css.error}>{leaveError}</p>}

              <div className={css.list}>
                {profile.communities.map((community) => (
                  <div key={community.id} className={css.communityRow}>
                    <span className={css.communityIcon}>
                      <CommunityIcon category={community.category} size={16} />
                    </span>
                    <div className={css.communityBody}>
                      <span className={css.communityName}>{community.name}</span>
                      <span className={css.communityMeta}>
                        {COMMUNITY_CATEGORY_LABELS[community.category]} · {community.city}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={css.leaveBtn}
                      onClick={() => setLeaveTarget(community)}
                    >
                      Выйти
                    </button>
                  </div>
                ))}

                {profile.communities.length === 0 && (
                  <p className={css.hint}>
                    Вы пока не состоите ни в одном сообществе. Нажмите «Найти», чтобы вступить.
                  </p>
                )}
              </div>
            </section>

            <button
              type="button"
              className={css.logoutBtn}
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOut size={16} />
              {logout.isPending ? "Выходим..." : "Выйти из аккаунта"}
            </button>
          </>
        )}
      </main>

      {leaveTarget && (
        <ConfirmDialog
          title="Покинуть сообщество?"
          message={`Вы выйдете из «${leaveTarget.name}» и перестанете видеть его чат. Вернуться можно через поиск сообществ.`}
          confirmLabel={leaveCommunity.isPending ? "Выходим..." : "Покинуть"}
          onConfirm={handleLeave}
          onCancel={() => setLeaveTarget(null)}
        />
      )}

      {joinOpen && (
        <JoinCommunityModal onClose={() => setJoinOpen(false)} onJoined={() => setJoinOpen(false)} />
      )}
    </div>
  );
};

export default Profile;
