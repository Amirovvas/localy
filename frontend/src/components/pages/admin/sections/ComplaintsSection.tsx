"use client";
import { useMemo, useState } from "react";
import {
  Ban,
  Calendar,
  Check,
  Clock,
  Eye,
  MapPin,
  MessageSquareOff,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import styles from "../adminTable.module.css";
import css from "./complaintsSection.module.css";
import { Avatar } from "@/components/layout/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  type AdminReport,
  type ReportStatus,
} from "@/lib/admin";
import { useAdminReports } from "@/hooks/admin/useAdminReports";
import { useReportContext } from "@/hooks/admin/useReportContext";
import { useReportEvents } from "@/hooks/admin/useReportEvents";
import {
  useBlockReportAuthor,
  useDeleteReport,
  useDeleteReportedMessage,
  useUnblockReportAuthor,
  useUpdateReportStatus,
} from "@/hooks/admin/useReportActions";

type DateFilter = "all" | "today" | "7d" | "30d";

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: "all", label: "За всё время" },
  { id: "today", label: "Сегодня" },
  { id: "7d", label: "Последние 7 дней" },
  { id: "30d", label: "Последние 30 дней" },
];

const TABS: { id: ReportStatus | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "pending", label: "Новые" },
  { id: "reviewing", label: "На рассмотрении" },
  { id: "resolved", label: "Принятые" },
  { id: "dismissed", label: "Отклонённые" },
];

const REASON_FILTERS = Object.entries(REPORT_REASON_LABELS);

const statusBadgeClass = (status: ReportStatus) => {
  if (status === "pending") return styles.badgeAccent;
  if (status === "reviewing") return styles.badgeWarning;
  if (status === "resolved") return styles.badgeSuccess;
  return styles.badgeNeutral;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const matchesDateFilter = (iso: string, filter: DateFilter) => {
  if (filter === "all") return true;
  const diffDays = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (filter === "today") return diffDays >= 0 && diffDays < 1;
  if (filter === "7d") return diffDays >= 0 && diffDays <= 7;
  return diffDays >= 0 && diffDays <= 30;
};

type ConfirmType = "block" | "deleteMessage" | "deleteComplaint";

const ComplaintsSection = () => {
  const { data: reports, isLoading } = useAdminReports();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [activeTab, setActiveTab] = useState<ReportStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: ConfirmType; id: number } | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const updateStatus = useUpdateReportStatus();
  const deleteMessage = useDeleteReportedMessage();
  const deleteReport = useDeleteReport();
  const blockAuthor = useBlockReportAuthor();
  const unblockAuthor = useUnblockReportAuthor();

  const { data: context } = useReportContext(selectedId);
  const { data: events } = useReportEvents(selectedId);

  const list = useMemo(() => reports ?? [], [reports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((report) => {
      const matchesTab = activeTab === "all" || report.status === activeTab;
      const matchesType = typeFilter === "all" || report.reason === typeFilter;
      const matchesDate = matchesDateFilter(report.created_at, dateFilter);
      const matchesQuery =
        !q ||
        (report.community_name ?? "").toLowerCase().includes(q) ||
        (REPORT_REASON_LABELS[report.reason] ?? report.reason).toLowerCase().includes(q) ||
        report.message_text.toLowerCase().includes(q) ||
        String(report.reporter_anon_id).includes(q) ||
        String(report.author_anon_id).includes(q);
      return matchesTab && matchesType && matchesDate && matchesQuery;
    });
  }, [list, query, typeFilter, dateFilter, activeTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: list.length };
    for (const tab of TABS) {
      if (tab.id === "all") continue;
      counts[tab.id] = list.filter((r) => r.status === tab.id).length;
    }
    return counts;
  }, [list]);

  const selected = list.find((r) => r.id === selectedId) ?? null;

  const runAction = (mutate: () => void) => {
    setActionError(null);
    mutate();
  };

  const onActionError = (error: unknown) => {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message;
    setActionError(message ?? "Не удалось выполнить действие");
  };

  const setStatus = (id: number, status: ReportStatus) => {
    runAction(() => updateStatus.mutate({ id, status }, { onError: onActionError }));
  };

  const confirmBlock = () => {
    if (!confirmAction) return;
    runAction(() =>
      blockAuthor.mutate(confirmAction.id, {
        onSuccess: () => setConfirmAction(null),
        onError: onActionError,
      }),
    );
  };

  const handleUnblock = (report: AdminReport) => {
    runAction(() => unblockAuthor.mutate(report.id, { onError: onActionError }));
  };

  const confirmDeleteMessage = () => {
    if (!confirmAction) return;
    runAction(() =>
      deleteMessage.mutate(confirmAction.id, {
        onSuccess: () => setConfirmAction(null),
        onError: onActionError,
      }),
    );
  };

  const confirmDeleteComplaint = () => {
    if (!confirmAction) return;
    runAction(() =>
      deleteReport.mutate(confirmAction.id, {
        onSuccess: () => {
          if (selectedId === confirmAction.id) setSelectedId(null);
          setConfirmAction(null);
        },
        onError: onActionError,
      }),
    );
  };

  const closeConfirm = () => setConfirmAction(null);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Жалобы</h1>
          <p className={styles.pageSubtitle}>Модерация сообщений и участников платформы.</p>
        </div>
      </div>

      <div className={css.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={css.tab}
            data-active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span className={css.tabCount}>{tabCounts[tab.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Поиск по пользователю, сообществу или тексту..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <select
          className={css.filterSelect}
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">Все типы жалоб</option>
          {REASON_FILTERS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          className={css.filterSelect}
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value as DateFilter)}
        >
          {DATE_FILTERS.map((filter) => (
            <option key={filter.id} value={filter.id}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Причина</th>
                <th>Сообщество / комната</th>
                <th>Сообщение</th>
                <th>Автор</th>
                <th>Дата</th>
                <th>Статус</th>
                <th style={{ textAlign: "right" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((report) => (
                <tr key={report.id}>
                  <td className={styles.cellSecondary}>#{report.id}</td>
                  <td className={styles.cellPrimary}>
                    {REPORT_REASON_LABELS[report.reason] ?? report.reason}
                  </td>
                  <td>
                    <div className={styles.cellStack}>
                      <span>{report.community_name ?? "—"}</span>
                      <span className={styles.cellSecondary}># {report.room_name ?? "—"}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <span className={styles.cellSecondary}>
                      {report.message_deleted
                        ? "Сообщение удалено"
                        : report.message_text || "📷 Фото"}
                    </span>
                  </td>
                  <td>
                    <div className={css.authorCell}>
                      Аноним #{report.author_anon_id ?? "—"}
                      {report.author_blocked && (
                        <span className={`${styles.badge} ${styles.badgeDanger}`}>
                          Заблокирован
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{formatDate(report.created_at)}</td>
                  <td>
                    <span className={`${styles.badge} ${statusBadgeClass(report.status)}`}>
                      <span className={styles.dot} />
                      {REPORT_STATUS_LABELS[report.status]}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      {report.status === "pending" && (
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                          title="Взять на рассмотрение"
                          onClick={() => setStatus(report.id, "reviewing")}
                        >
                          <Clock size={16} />
                        </button>
                      )}
                      {(report.status === "pending" || report.status === "reviewing") && (
                        <>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                            title="Отметить как рассмотренную"
                            onClick={() => setStatus(report.id, "resolved")}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Отклонить жалобу"
                            onClick={() => setStatus(report.id, "dismissed")}
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="Просмотреть"
                        onClick={() => setSelectedId(report.id)}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && filtered.length === 0 && (
            <div className={styles.emptyState}>Жалобы не найдены.</div>
          )}
        </div>
      </div>

      {selected && (
        <>
          <div className={css.scrim} onClick={() => setSelectedId(null)} />
          <aside className={css.panel}>
            <div className={css.panelHeader}>
              <div>
                <span className={css.panelId}>Жалоба #{selected.id}</span>
                <span className={`${styles.badge} ${statusBadgeClass(selected.status)}`}>
                  <span className={styles.dot} />
                  {REPORT_STATUS_LABELS[selected.status]}
                </span>
              </div>
              <button
                type="button"
                className={css.closeBtn}
                onClick={() => setSelectedId(null)}
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            <div className={css.panelBody}>
              <div className={css.metaRow}>
                <span className={`${styles.badge} ${styles.badgeAccent}`}>
                  {REPORT_REASON_LABELS[selected.reason] ?? selected.reason}
                </span>
                <span className={css.metaItem}>
                  <MapPin size={12} />
                  {selected.community_name ?? "—"} · # {selected.room_name ?? "—"}
                </span>
                <span className={css.metaItem}>
                  <Calendar size={12} />
                  {formatDate(selected.created_at)}
                </span>
              </div>

              {selected.comment && (
                <div className={css.section}>
                  <p className={css.sectionTitle}>Комментарий жалующегося</p>
                  <p className={css.contextText}>{selected.comment}</p>
                </div>
              )}

              <div className={css.section}>
                <p className={css.sectionTitle}>Контекст переписки</p>
                <div className={css.messageList}>
                  {context?.before && (
                    <div className={css.contextMessage}>
                      <Avatar size={26} />
                      <div className={css.contextBody}>
                        <span className={css.contextAuthor}>
                          Аноним #{context.before.anon_id}
                        </span>
                        <p className={css.contextText}>
                          {context.before.text || "📷 Фото"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className={`${css.contextMessage} ${css.reportedMessage}`}>
                    <Avatar size={26} />
                    <div className={css.contextBody}>
                      <span className={css.contextAuthor}>
                        Аноним #{selected.author_anon_id ?? "—"}
                      </span>
                      <p className={css.contextText}>
                        {selected.message_deleted ? (
                          <span className={css.deletedText}>
                            <MessageSquareOff size={13} />
                            Сообщение удалено администратором
                          </span>
                        ) : (
                          selected.message_text || "📷 Фото"
                        )}
                      </p>
                      <span className={css.reportedTag}>На это сообщение подана жалоба</span>
                    </div>
                  </div>

                  {context?.after && (
                    <div className={css.contextMessage}>
                      <Avatar size={26} />
                      <div className={css.contextBody}>
                        <span className={css.contextAuthor}>Аноним #{context.after.anon_id}</span>
                        <p className={css.contextText}>{context.after.text || "📷 Фото"}</p>
                      </div>
                    </div>
                  )}

                  {!context?.before && !context?.after && (
                    <p className={css.contextText} style={{ padding: "0 4px" }}>
                      Других сообщений рядом в этой комнате нет.
                    </p>
                  )}
                </div>
              </div>

              <div className={css.section}>
                <p className={css.sectionTitle}>Участники</p>
                <div className={css.userGrid}>
                  <div className={css.userCard}>
                    <Avatar size={30} />
                    <div className={css.userInfo}>
                      <span className={css.userLabel}>Отправил жалобу</span>
                      <span className={css.userName}>
                        Аноним #{selected.reporter_anon_id ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className={css.userCard}>
                    <Avatar size={30} />
                    <div className={css.userInfo}>
                      <span className={css.userLabel}>Автор сообщения</span>
                      <span className={css.userName}>
                        Аноним #{selected.author_anon_id ?? "—"}
                      </span>
                    </div>
                    {selected.author_blocked && (
                      <span className={`${styles.badge} ${styles.badgeDanger}`}>
                        Заблокирован
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={css.section}>
                <p className={css.sectionTitle}>Действия администратора</p>

                {actionError && (
                  <p style={{ margin: "0 0 10px", color: "var(--loc-danger)", fontSize: 12.5 }}>
                    {actionError}
                  </p>
                )}

                <div className={css.actionsGrid}>
                  {selected.status !== "resolved" && selected.status !== "dismissed" && (
                    <>
                      <button
                        type="button"
                        className={css.actionBtn}
                        onClick={() => setStatus(selected.id, "resolved")}
                      >
                        <Check size={15} />
                        Отметить как рассмотренную
                      </button>
                      <button
                        type="button"
                        className={css.actionBtn}
                        onClick={() => setStatus(selected.id, "dismissed")}
                      >
                        <X size={15} />
                        Отклонить жалобу
                      </button>
                    </>
                  )}

                  {!selected.message_deleted && (
                    <button
                      type="button"
                      className={css.actionBtn}
                      onClick={() => setConfirmAction({ type: "deleteMessage", id: selected.id })}
                    >
                      <MessageSquareOff size={15} />
                      Удалить сообщение
                    </button>
                  )}

                  {selected.author_blocked ? (
                    <button
                      type="button"
                      className={css.actionBtn}
                      onClick={() => handleUnblock(selected)}
                    >
                      <ShieldCheck size={15} />
                      Разблокировать пользователя
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={css.actionBtn}
                      onClick={() => setConfirmAction({ type: "block", id: selected.id })}
                    >
                      <Ban size={15} />
                      Заблокировать пользователя
                    </button>
                  )}

                  <button
                    type="button"
                    className={`${css.actionBtn} ${css.actionBtnDanger}`}
                    onClick={() => setConfirmAction({ type: "deleteComplaint", id: selected.id })}
                  >
                    <Trash2 size={15} />
                    Удалить жалобу
                  </button>
                </div>
              </div>

              <div className={css.section}>
                <p className={css.sectionTitle}>История действий</p>
                <div className={css.historyList}>
                  {(events ?? []).map((entry) => (
                    <div key={entry.id} className={css.historyRow}>
                      <User size={13} className={css.historyIcon} />
                      <span className={css.historyText}>{entry.text}</span>
                      <span className={css.historyDate}>{formatDate(entry.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {confirmAction?.type === "block" && (
        <ConfirmDialog
          title="Заблокировать пользователя?"
          message="После блокировки пользователь не сможет отправлять сообщения, комментировать, создавать события и присоединяться к сообществам."
          confirmLabel="Заблокировать"
          onConfirm={confirmBlock}
          onCancel={closeConfirm}
        />
      )}

      {confirmAction?.type === "deleteMessage" && (
        <ConfirmDialog
          title="Удалить сообщение?"
          message="Сообщение будет удалено из комнаты без возможности восстановления."
          confirmLabel="Удалить"
          onConfirm={confirmDeleteMessage}
          onCancel={closeConfirm}
        />
      )}

      {confirmAction?.type === "deleteComplaint" && (
        <ConfirmDialog
          title="Удалить жалобу?"
          message="Жалоба будет удалена без возможности восстановления."
          confirmLabel="Удалить"
          onConfirm={confirmDeleteComplaint}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
};

export default ComplaintsSection;
