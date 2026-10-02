"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import {
  AlertCircle,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import css from "./register.module.css";
import { LogoMark } from "@/components/layout/Logo";
import SearchSelect from "@/components/ui/SearchSelect";
import { cityOptions, type SelectOption } from "@/lib/registerOptions";
import NearMeButton from "@/components/ui/NearMeButton";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDistance, sortByDistance } from "@/lib/geo";
import {
  useGetCommunities,
  type CommunityCategory,
} from "@/hooks/communities/useGetCommunities";
import { useRegister } from "@/hooks/auth/useRegister";

interface FormValues {
  name: string;
  email: string;
  password: string;
  city: string[];
  universities: string[];
  schools: string[];
  districts: string[];
  complexes: string[];
  // виртуальное поле — не привязано к инпуту, нужно только чтобы показать
  // общую ошибку "выберите хотя бы одно сообщество" под всеми 4 категориями
  communities?: string;
}

const emptyGroups: Record<CommunityCategory, SelectOption[]> = {
  university: [],
  school: [],
  district: [],
  residential: [],
};

const Register = () => {
  const { push } = useRouter();
  const registerMutation = useRegister();
  const {
    data: communities,
    isLoading: communitiesLoading,
    isError: communitiesError,
  } = useGetCommunities();

  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      city: [],
      universities: [],
      schools: [],
      districts: [],
      complexes: [],
    },
  });

  // после разрешения геолокации места сортируются по расстоянию от пользователя
  const { coords, status: locationStatus, requestLocation } = useUserLocation();

  const sortedCommunities = useMemo(
    () => (communities ? sortByDistance(communities, coords) : []),
    [communities, coords],
  );

  // три ближайших места (любой категории) — короткая рекомендация над списками
  const nearest = sortedCommunities
    .filter((community) => community.distance !== null)
    .slice(0, 3);

  const grouped = useMemo(() => {
    if (!communities) return emptyGroups;
    const groups: Record<CommunityCategory, SelectOption[]> = {
      university: [],
      school: [],
      district: [],
      residential: [],
    };
    for (const community of sortedCommunities) {
      groups[community.category].push({
        id: String(community.id),
        label:
          community.distance !== null
            ? `${community.name} · ${formatDistance(community.distance)}`
            : community.name,
      });
    }
    return groups;
  }, [communities, sortedCommunities]);

  const onSubmit = (data: FormValues) => {
    const communityIds = [
      ...data.universities,
      ...data.schools,
      ...data.districts,
      ...data.complexes,
    ].map(Number);

    if (communityIds.length === 0) {
      setError("communities", {
        type: "manual",
        message: "Выберите хотя бы одно сообщество",
      });
      return;
    }
    clearErrors("communities");

    const cityLabel =
      cityOptions.find((option) => option.id === data.city[0])?.label ?? "";

    registerMutation.mutate(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        city: cityLabel,
        communityIds,
      },
      {
        onSuccess: () => push("/login"),
      },
    );
  };

  const serverError = getApiErrorMessage(registerMutation.error);

  return (
    <div className={css.container}>
      <div className={css.mainContainer}>
        <div className={css.brand}>
          <LogoMark size={18} />
          <span>Localy</span>
        </div>

        <div className={css.formSection}>
          <h1>Создать аккаунт</h1>
          <p>Присоединяйтесь к сообществу, общайтесь анонимно.</p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className={css.form}
            noValidate
          >
            <div className={css.formRow}>
              <div className={css.inputGroup}>
                <label htmlFor="name">Отображаемое имя</label>
                <div className={css.inputWrap}>
                  <User size={16} className={css.inputIcon} />
                  <input
                    id="name"
                    type="text"
                    placeholder="Только для настройки аккаунта"
                    {...register("name", { required: "Введите имя" })}
                  />
                </div>
                {errors.name && (
                  <span className={css.errorText}>{errors.name.message}</span>
                )}
              </div>

              <div className={css.inputGroup}>
                <label htmlFor="email">Электронная почта</label>
                <div className={css.inputWrap}>
                  <Mail size={16} className={css.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@community.kg"
                    {...register("email", {
                      required: "Введите почту",
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: "Некорректный email",
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <span className={css.errorText}>{errors.email.message}</span>
                )}
              </div>
            </div>

            <div className={css.inputGroup}>
              <label htmlFor="password">Пароль</label>
              <div className={css.inputWrap}>
                <Lock size={16} className={css.inputIcon} />
                <input
                  id="password"
                  type="password"
                  placeholder="Не менее 6 символов"
                  {...register("password", {
                    required: "Введите пароль",
                    minLength: { value: 6, message: "Не менее 6 символов" },
                  })}
                />
              </div>
              {errors.password && (
                <span className={css.errorText}>{errors.password.message}</span>
              )}
            </div>

            <div className={css.divider}>
              <MapPin size={14} />
              Местоположение
            </div>

            <div className={css.inputGroup}>
              <label>Город</label>
              <Controller
                control={control}
                name="city"
                rules={{
                  validate: (value) =>
                    (value?.length ?? 0) > 0 || "Выберите город",
                }}
                render={({ field }) => (
                  <SearchSelect
                    options={cityOptions}
                    value={field.value}
                    onChange={field.onChange}
                    multiple={false}
                    placeholder="Выберите город"
                  />
                )}
              />
              {errors.city && (
                <span className={css.errorText}>{errors.city.message}</span>
              )}
            </div>

            <div className={css.divider}>
              <MapPin size={14} />
              Ваши места
            </div>
            <p className={css.dividerHint}>
              Выберите по одному варианту в категориях «Университеты», «Районы»
              и «ЖК» (школ можно несколько) — это поможет находить сообщества
              рядом с вами.
            </p>

            <NearMeButton status={locationStatus} onClick={requestLocation} />

            {nearest.length > 0 && (
              <p className={css.dividerHint}>
                Ближайшие к вам:{" "}
                {nearest
                  .map((place) => `${place.name} (${formatDistance(place.distance ?? 0)})`)
                  .join(", ")}
              </p>
            )}

            {communitiesError && (
              <p className={css.errorText}>
                Не удалось загрузить список сообществ. Обновите страницу.
              </p>
            )}

            <div className={css.formRow}>
              <div className={css.inputGroup}>
                <label>Университеты, институты, колледжи</label>
                <Controller
                  control={control}
                  name="universities"
                  render={({ field }) => (
                    <SearchSelect
                      options={grouped.university}
                      multiple={false}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        communitiesLoading
                          ? "Загрузка..."
                          : "Найдите учебное заведение..."
                      }
                    />
                  )}
                />
              </div>

              <div className={css.inputGroup}>
                <label>Школы</label>
                <Controller
                  control={control}
                  name="schools"
                  render={({ field }) => (
                    <SearchSelect
                      options={grouped.school}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        communitiesLoading ? "Загрузка..." : "Найдите школу..."
                      }
                    />
                  )}
                />
              </div>
            </div>

            <div className={css.formRow}>
              <div className={css.inputGroup}>
                <label>Районы</label>
                <Controller
                  control={control}
                  name="districts"
                  render={({ field }) => (
                    <SearchSelect
                      options={grouped.district}
                      multiple={false}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        communitiesLoading ? "Загрузка..." : "Найдите район..."
                      }
                    />
                  )}
                />
              </div>

              <div className={css.inputGroup}>
                <label>Жилой комплекс (ЖК)</label>
                <Controller
                  control={control}
                  name="complexes"
                  render={({ field }) => (
                    <SearchSelect
                      options={grouped.residential}
                      multiple={false}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        communitiesLoading
                          ? "Загрузка..."
                          : "Найдите жилой комплекс..."
                      }
                    />
                  )}
                />
              </div>
            </div>

            {errors.communities && (
              <p className={css.errorBanner}>
                <AlertCircle size={14} />
                {errors.communities.message}
              </p>
            )}

            {serverError && (
              <p className={css.errorBanner}>
                <AlertCircle size={14} />
                {serverError}
              </p>
            )}

            <button
              type="submit"
              className={css.button}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? "Создаём аккаунт..."
                : "Создать аккаунт"}
            </button>
          </form>

          <div className={css.hint}>
            <ShieldCheck size={16} className={css.hintIcon} />
            <p>
              Мы проверяем вашу почту, но каждое сообщение отображается как{" "}
              <strong>Аноним #XXXX</strong> — никто не видит ваше настоящее имя.
            </p>
          </div>

          <p className={css.loginText}>
            Уже есть аккаунт? <Link href="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
