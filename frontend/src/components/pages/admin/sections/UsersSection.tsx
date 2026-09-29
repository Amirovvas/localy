"use client";
import { useMemo, useState } from "react";
import { Eye, Search, Trash2 } from "lucide-react";
import styles from "../adminTable.module.css";
import { Avatar } from "@/components/layout/Avatar";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { useDeleteUser } from "@/hooks/admin/useDeleteUser";
import type { AdminUser } from "@/lib/admin";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU");

const UsersSection = () => {
  const [query, setQuery] = useState("");
  const { data: users, isLoading } = useAdminUsers(query);
  const deleteUser = useDeleteUser();

  const [viewTarget, setViewTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const list = useMemo(() => users ?? [], [users]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Пользователи</h1>
          <p className={styles.pageSubtitle}>Всего пользователей: {list.length}</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Поиск по имени или почте..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Город</th>
                <th>Сообщества</th>
                <th>Регистрация</th>
                <th>Статус</th>
                <th style={{ textAlign: "right" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.cellWithIcon}>
                      <Avatar size={32} />
                      <div className={styles.cellStack}>
                        <span className={styles.cellPrimary}>{user.name}</span>
                        <span className={styles.cellSecondary}>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.city}</td>
                  <td>
                    {user.communities.length > 1
                      ? `${user.communities[0]} +${user.communities.length - 1}`
                      : (user.communities[0] ?? "—")}
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        user.is_blocked ? styles.badgeDanger : styles.badgeSuccess
                      }`}
                    >
                      <span className={styles.dot} />
                      {user.is_blocked ? "Заблокирован" : "Активен"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="Просмотреть"
                        onClick={() => setViewTarget(user)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Удалить"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && list.length === 0 && (
            <div className={styles.emptyState}>Пользователи не найдены.</div>
          )}
        </div>
      </div>

      {viewTarget && (
        <Modal
          title={viewTarget.name}
          subtitle={`Аноним #${viewTarget.anon_id}`}
          onClose={() => setViewTarget(null)}
        >
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Почта</span>
              <span className={styles.detailValue}>{viewTarget.email}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Город</span>
              <span className={styles.detailValue}>{viewTarget.city}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Дата регистрации</span>
              <span className={styles.detailValue}>{formatDate(viewTarget.created_at)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Статус</span>
              <span className={styles.detailValue}>
                {viewTarget.is_blocked ? "Заблокирован" : "Активен"}
              </span>
            </div>
          </div>

          <div className={styles.detailSection}>
            <p className={styles.detailSectionTitle}>Сообщества</p>
            <div className={styles.chipRow}>
              {viewTarget.communities.length === 0 && (
                <span className={styles.chip}>Не состоит ни в одном</span>
              )}
              {viewTarget.communities.map((name) => (
                <span key={name} className={styles.chip}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Удалить пользователя?"
          message={`Пользователь «${deleteTarget.name}» будет удалён без возможности восстановления.`}
          confirmLabel={deleteUser.isPending ? "Удаляем..." : "Удалить"}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default UsersSection;
