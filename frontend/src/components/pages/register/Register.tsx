"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Mail,
  MapPin,
  Pencil,
  ShieldCheck,
  User,
} from "lucide-react";
import css from "./register.module.css";
import { LogoMark } from "@/components/layout/Logo";
import SearchSelect from "@/components/ui/SearchSelect";
import NearMeButton from "@/components/ui/NearMeButton";
import { cityOptions, type SelectOption } from "@/lib/registerOptions";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getApiErrorMessage } from "@/lib/apiError";
import { distanceKm, formatDistance, sortByDistance } from "@/lib/geo";
import { COMMUNITY_CATEGORY_LABELS } from "@/lib/mockData";
import {
  useGetCommunities,
  type CommunityCategory,
} from "@/hooks/communities/useGetCommunities";
import { useRegister } from "@/hooks/auth/useRegister";

type PlaceField = "universities" | "schools" | "districts" | "complexes";

interface FormValues {
  name: string;
  email: string;
  password: string;
  city: string[];
  universities: string[];
  schools: string[];
  districts: string[];
  complexes: string[];
  communities?: string;
}

const CATEGORY_FIELD: Record<CommunityCategory, PlaceField> = {
  university: "universities",
  school: "schools",
  district: "districts",
  residential: "complexes",
};

const emptyGroups: Record<CommunityCategory, SelectOption[]> = {
  university: [],
  school: [],
  district: [],
  residential: [],
};

const STEPS = [
  {
    label: "Город",
    title: "Где вы находитесь?",
    text: "Выберите город или разрешите определить местоположение — так мы подскажем ближайшие места.",
  },
  {
    label: "Места",
    title: "Выберите свои места",
    text: "Найдите свой вуз, школу, район или ЖК в списках ниже. Можно выбрать несколько мест.",
  },
  {
    label: "Аккаунт",
    title: "Почти готово",
    text: "Создайте аккаунт. В чатах вас будут видеть только как Аноним #N.",
  },
];

const BISHKEK = { lat: 42.8746, lng: 74.5698 };
const BISHKEK_RADIUS_KM = 60;
const NEARBY_COUNT = 6;

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
    setValue,
    getValues,
    trigger,
    watch,
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

  const [step, setStep] = useState(0);
  const [cityAutoSet, setCityAutoSet] = useState(false);
  const { coords, status: locationStatus, requestLocation } = useUserLocation();

  const universities = watch("universities");
  const schools = watch("schools");
  const districts = watch("districts");
  const complexes = watch("complexes");
  const selectedIds = useMemo(
    () => [...universities, ...schools, ...districts, ...complexes],
    [universities, schools, districts, complexes],
  );

  useEffect(() => {
    if (!coords) return;
    if (distanceKm(coords, BISHKEK) <= BISHKEK_RADIUS_KM) {
      setValue("city", ["bishkek"], { shouldValidate: true });
      setCityAutoSet(true);
    }
  }, [coords, setValue]);

  useEffect(() => {
    if (selectedIds.length > 0) clearErrors("communities");
  }, [selectedIds.length, clearErrors]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const sortedCommunities = useMemo(
    () => (communities ? sortByDistance(communities, coords) : []),
    [communities, coords],
  );

  const nearby = useMemo(
    () => sortedCommunities.filter((community) => community.distance !== null).slice(0, NEARBY_COUNT),
    [sortedCommunities],
  );

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

  const selectedNames = useMemo(
    () =>
      selectedIds
        .map((id) => communities?.find((community) => String(community.id) === id)?.name)
        .filter((name): name is string => Boolean(name)),
    [selectedIds, communities],
  );

  const toggleNearby = (community: { id: number; category: CommunityCategory }) => {
    const field = CATEGORY_FIELD[community.category];
    const current = getValues(field);
    const id = String(community.id);

    if (field === "schools") {
      setValue(field, current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    } else {
      setValue(field, current[0] === id ? [] : [id]);
    }
  };

  const goNext = async () => {
    if (step === 0) {
      if (await trigger("city")) setStep(1);
      return;
    }

    if (step === 1) {
      if (selectedIds.length === 0) {
        setError("communities", {
          type: "manual",
          message: "Выберите хотя бы одно сообщество",
        });
        return;
      }
      clearErrors("communities");
      setStep(2);
    }
  };

  const onSubmit = (data: FormValues) => {
    const communityIds = selectedIds.map(Number);
    const cityLabel = cityOptions.find((option) => option.id === data.city[0])?.label ?? "";

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

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (step < STEPS.length - 1) {
      event.preventDefault();
      goNext();
      return;
    }
    handleSubmit(onSubmit)(event);
  };

  const serverError = getApiErrorMessage(registerMutation.error);
  const current = STEPS[step] ?? STEPS[0]!;

  return (
    <div className={css.container}>
      <div className={css.mainContainer}>
        <div className={css.brand}>
          <LogoMark size={18} />
          <span>Localy</span>
        </div>

        <div className={css.formSection}>
          <div className={css.progress} aria-label={`Шаг ${step + 1} из ${STEPS.length}`}>
            <div className={css.progressBars}>
              {STEPS.map((item, index) => (
                <span key={item.label} className={css.progressBar} data-done={index <= step} />
              ))}
            </div>
            <span className={css.progressLabel}>
              Шаг {step + 1} из {STEPS.length} · {current.label}
            </span>
          </div>

          <h1>{current.title}</h1>
          <p>{current.text}</p>

          <form onSubmit={handleFormSubmit} className={css.form} noValidate>
            <div className={css.stepPanel} data-active={step === 0}>
              <NearMeButton status={locationStatus} onClick={requestLocation} />

              {cityAutoSet && (
                <p className={css.autoCity}>
                  <Check size={14} />
                  Город выбран автоматически: Бишкек
                </p>
              )}

              <div className={css.inputGroup}>
                <label>Город</label>
                <Controller
                  control={control}
                  name="city"
                  rules={{
                    validate: (value) => (value?.length ?? 0) > 0 || "Выберите город",
                  }}
                  render={({ field }) => (
                    <SearchSelect
                      options={cityOptions}
                      value={field.value}
                      onChange={(ids) => {
                        setCityAutoSet(false);
                        field.onChange(ids);
                      }}
                      multiple={false}
                      placeholder="Выберите город"
                    />
                  )}
                />
                {errors.city && <span className={css.errorText}>{errors.city.message}</span>}
              </div>
            </div>

            <div className={css.stepPanel} data-active={step === 1}>
              {communitiesError && (
                <p className={css.errorText}>
                  Не удалось загрузить список сообществ. Обновите страницу.
                </p>
              )}

              {nearby.length > 0 ? (
                <div className={css.nearby}>
                  <span className={css.nearbyTitle}>Рядом с вами</span>
                  <div className={css.nearbyList}>
                    {nearby.map((place) => {
                      const selected = selectedIds.includes(String(place.id));
                      return (
                        <button
                          key={place.id}
                          type="button"
                          className={css.nearbyChip}
                          data-selected={selected}
                          onClick={() => toggleNearby(place)}
                        >
                          <span className={css.nearbyName}>
                            {selected && <Check size={13} />}
                            {place.name}
                          </span>
                          <span className={css.nearbyMeta}>
                            {COMMUNITY_CATEGORY_LABELS[place.category]} ·{" "}
                            {formatDistance(place.distance ?? 0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <NearMeButton status={locationStatus} onClick={requestLocation} />
              )}

              <p className={css.dividerHint}>
                Из категорий «Университеты», «Районы» и «ЖК» можно выбрать только один вариант,
                школ можно несколько.
              </p>

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
                          communitiesLoading ? "Загрузка..." : "Найдите учебное заведение..."
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
                        placeholder={communitiesLoading ? "Загрузка..." : "Найдите школу..."}
                      />
                    )}
                  />
                </div>
              </div>

              <div className={css.formRow}>
                <div className={css.inputGroup}>
                  <label>Районы и микрорайоны</label>
                  <Controller
                    control={control}
                    name="districts"
                    render={({ field }) => (
                      <SearchSelect
                        options={grouped.district}
                        multiple={false}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={communitiesLoading ? "Загрузка..." : "Найдите район..."}
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
                          communitiesLoading ? "Загрузка..." : "Найдите жилой комплекс..."
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
            </div>

            <div className={css.stepPanel} data-active={step === 2}>
              <div className={css.summary}>
                <div className={css.summaryHead}>
                  <span className={css.summaryTitle}>
                    <MapPin size={14} />
                    Ваши места
                  </span>
                  <button type="button" className={css.linkBtn} onClick={() => setStep(1)}>
                    <Pencil size={12} />
                    Изменить
                  </button>
                </div>
                <div className={css.summaryTags}>
                  {selectedNames.map((name) => (
                    <span key={name} className={css.summaryTag}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>

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
                {errors.name && <span className={css.errorText}>{errors.name.message}</span>}
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
                {errors.email && <span className={css.errorText}>{errors.email.message}</span>}
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

              {serverError && (
                <p className={css.errorBanner}>
                  <AlertCircle size={14} />
                  {serverError}
                </p>
              )}
            </div>

            <div className={css.navRow}>
              {step > 0 && (
                <button
                  type="button"
                  className={css.backButton}
                  onClick={() => setStep(step - 1)}
                  disabled={registerMutation.isPending}
                >
                  <ArrowLeft size={16} />
                  Назад
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button type="submit" className={css.button}>
                  Далее
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" className={css.button} disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Создаём аккаунт..." : "Создать аккаунт"}
                </button>
              )}
            </div>
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
