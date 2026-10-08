"use client";
import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import styles from "../adminTable.module.css";
import { CommunityIcon } from "@/components/layout/CommunityIcon";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { COMMUNITY_CATEGORY_LABELS, type CommunityCategory } from "@/lib/mockData";
import { getApiErrorMessage } from "@/lib/apiError";
import { COMMUNITY_STATUS_LABELS, type AdminCommunity, type CommunityStatus } from "@/lib/admin";
import { useAdminCommunities } from "@/hooks/admin/useAdminCommunities";
import { useCreateCommunity } from "@/hooks/admin/useCreateCommunity";
import { useUpdateCommunity } from "@/hooks/admin/useUpdateCommunity";
import { useDeleteCommunity } from "@/hooks/admin/useDeleteCommunity";

const fmt = (value: number) => value.toLocaleString("ru-RU");

const CATEGORY_FILTERS: { id: CommunityCategory | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "university", label: "Университеты" },
  { id: "school", label: "Школы" },
  { id: "district", label: "Районы" },
  { id: "residential", label: "ЖК" },
  { id: "city", label: "Города" },
];

const CATEGORY_OPTIONS = Object.entries(COMMUNITY_CATEGORY_LABELS) as [
  CommunityCategory,
  string,
][];

const STATUS_OPTIONS = Object.entries(COMMUNITY_STATUS_LABELS) as [CommunityStatus, string][];

const statusBadgeClass = (status: CommunityStatus) => {
  if (status === "active") return styles.badgeSuccess;
  if (status === "pending") return styles.badgeWarning;
  return styles.badgeNeutral;
};

interface FormState {
  name: string;
  category: CommunityCategory;
  city: string;
  description: string;
  status: CommunityStatus;
  lat: string;
  lng: string;
}

const emptyForm: FormState = {
  name: "",
  category: "university",
  city: "",
  description: "",
  status: "pending",
  lat: "",
  lng: "",
};

const CommunitiesSection = () => {
  const { data: communities, isLoading } = useAdminCommunities();
  const createCommunity = useCreateCommunity();
  const updateCommunity = useUpdateCommunity();
  const deleteCommunity = useDeleteCommunity();

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CommunityCategory | "all">("all");

  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<AdminCommunity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCommunity | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (communities ?? []).filter((community) => {
      const matchesQuery =
        !q ||
        community.name.toLowerCase().includes(q) ||
        community.city.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "all" || community.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [communities, query, categoryFilter]);

  const openCreate = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setFormError(null);
    setFormMode("create");
  };

  const openEdit = (community: AdminCommunity) => {
    setFormData({
      name: community.name,
      category: community.category,
      city: community.city,
      description: community.description,
      status: community.status,
      lat: community.lat === null ? "" : String(community.lat),
      lng: community.lng === null ? "" : String(community.lng),
    });
    setEditingId(community.id);
    setFormError(null);
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.city.trim()) return;

    const lat = formData.lat.trim() === "" ? null : Number(formData.lat.replace(",", "."));
    const lng = formData.lng.trim() === "" ? null : Number(formData.lng.replace(",", "."));
    if (
      (lat !== null && (Number.isNaN(lat) || lat < -90 || lat > 90)) ||
      (lng !== null && (Number.isNaN(lng) || lng < -180 || lng > 180))
    ) {
      setFormError("Координаты должны быть числами: широта от -90 до 90, долгота от -180 до 180");
      return;
    }
    const body = { ...formData, lat, lng };

    setFormError(null);
    const onError = (error: unknown) => {
      setFormError(getApiErrorMessage(error) ?? "Не удалось сохранить сообщество");
    };

    if (formMode === "edit" && editingId) {
      updateCommunity.mutate(
        { id: editingId, ...body },
        { onSuccess: closeForm, onError },
      );
    } else {
      createCommunity.mutate(body, { onSuccess: closeForm, onError });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCommunity.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const isSaving = createCommunity.isPending || updateCommunity.isPending;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Сообщества</h1>
          <p className={styles.pageSubtitle}>Всего сообществ: {(communities ?? []).length}</p>
        </div>

        <button type="button" className={styles.primaryBtn} onClick={openCreate}>
          <Plus size={16} />
          Создать сообщество
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Поиск по названию или городу..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className={styles.filters}>
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={styles.filterPill}
              data-active={categoryFilter === filter.id}
              onClick={() => setCategoryFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Сообщество</th>
                <th>Категория</th>
                <th>Город</th>
                <th>Участников</th>
                <th>Статус</th>
                <th style={{ textAlign: "right" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((community) => (
                <tr key={community.id}>
                  <td>
                    <div className={styles.cellWithIcon}>
                      <span className={styles.rowIcon}>
                        <CommunityIcon category={community.category} size={16} />
                      </span>
                      <span className={styles.cellPrimary}>{community.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeAccent}`}>
                      {COMMUNITY_CATEGORY_LABELS[community.category]}
                    </span>
                  </td>
                  <td>{community.city}</td>
                  <td>{fmt(community.members)}</td>
                  <td>
                    <span className={`${styles.badge} ${statusBadgeClass(community.status)}`}>
                      <span className={styles.dot} />
                      {COMMUNITY_STATUS_LABELS[community.status]}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="Просмотреть"
                        onClick={() => setViewTarget(community)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        title="Редактировать"
                        onClick={() => openEdit(community)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Удалить"
                        onClick={() => setDeleteTarget(community)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && filtered.length === 0 && (
            <div className={styles.emptyState}>Сообщества не найдены.</div>
          )}
        </div>
      </div>

      {formMode && (
        <Modal
          title={formMode === "create" ? "Создать сообщество" : "Редактировать сообщество"}
          onClose={closeForm}
        >
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="community-name">Название</label>
              <input
                id="community-name"
                type="text"
                placeholder="Например, AUCA"
                value={formData.name}
                onChange={(event) => setFormData((f) => ({ ...f, name: event.target.value }))}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="community-category">Категория</label>
                <select
                  id="community-category"
                  value={formData.category}
                  onChange={(event) =>
                    setFormData((f) => ({
                      ...f,
                      category: event.target.value as CommunityCategory,
                    }))
                  }
                >
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="community-city">Город</label>
                <input
                  id="community-city"
                  type="text"
                  placeholder="Бишкек"
                  value={formData.city}
                  onChange={(event) => setFormData((f) => ({ ...f, city: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="community-description">Описание</label>
              <textarea
                id="community-description"
                placeholder="Короткое описание сообщества"
                value={formData.description}
                onChange={(event) =>
                  setFormData((f) => ({ ...f, description: event.target.value }))
                }
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="community-lat">Широта (необязательно)</label>
                <input
                  id="community-lat"
                  type="text"
                  inputMode="decimal"
                  placeholder="42.8746"
                  value={formData.lat}
                  onChange={(event) => setFormData((f) => ({ ...f, lat: event.target.value }))}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="community-lng">Долгота (необязательно)</label>
                <input
                  id="community-lng"
                  type="text"
                  inputMode="decimal"
                  placeholder="74.5698"
                  value={formData.lng}
                  onChange={(event) => setFormData((f) => ({ ...f, lng: event.target.value }))}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="community-status">Статус</label>
              <select
                id="community-status"
                value={formData.status}
                onChange={(event) =>
                  setFormData((f) => ({ ...f, status: event.target.value as CommunityStatus }))
                }
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {formError && (
              <p style={{ margin: 0, color: "var(--loc-danger)", fontSize: 13 }}>{formError}</p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button type="button" className={styles.secondaryBtn} onClick={closeForm}>
                Отмена
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={isSaving}>
                {isSaving ? "Сохраняем..." : formMode === "create" ? "Создать" : "Сохранить"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {viewTarget && (
        <Modal
          title={viewTarget.name}
          subtitle={COMMUNITY_CATEGORY_LABELS[viewTarget.category]}
          onClose={() => setViewTarget(null)}
        >
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Город</span>
              <span className={styles.detailValue}>{viewTarget.city}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Статус</span>
              <span className={styles.detailValue}>
                {COMMUNITY_STATUS_LABELS[viewTarget.status]}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Участников</span>
              <span className={styles.detailValue}>{fmt(viewTarget.members)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Создано</span>
              <span className={styles.detailValue}>
                {new Date(viewTarget.created_at).toLocaleDateString("ru-RU")}
              </span>
            </div>
          </div>

          <p style={{ margin: "0 0 4px", color: "var(--loc-text-secondary)", fontSize: 13.5, lineHeight: 1.55 }}>
            {viewTarget.description}
          </p>

          <div className={styles.detailSection}>
            <p className={styles.detailSectionTitle}>Комнаты</p>
            <div className={styles.chipRow}>
              {viewTarget.rooms.length === 0 && <span className={styles.chip}>Нет комнат</span>}
              {viewTarget.rooms.map((room) => (
                <span key={room.id} className={styles.chip}>
                  # {room.name}
                </span>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Удалить сообщество?"
          message={`Сообщество «${deleteTarget.name}» и все связанные данные будут удалены без возможности восстановления.`}
          confirmLabel={deleteCommunity.isPending ? "Удаляем..." : "Удалить"}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default CommunitiesSection;
