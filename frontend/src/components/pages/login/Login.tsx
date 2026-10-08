"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowRight, Bell, Eye, EyeOff, Lock, Mail } from "lucide-react";
import css from "./login.module.css";
import { LogoMark } from "@/components/layout/Logo";
import { useLogin } from "@/hooks/auth/useLogin";
import { useCommunityStats } from "@/hooks/communities/useCommunityStats";
import { HOME_AFTER_LOGIN } from "@/lib/routes";
import { getApiErrorMessage } from "@/lib/apiError";
import { pluralCommunities } from "@/lib/format";

interface FormValues {
  email: string;
  password: string;
}

const Login = () => {
  const { push } = useRouter();
  const loginMutation = useLogin();
  const { data: stats } = useCommunityStats();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { email: "", password: "" } });

  const onSubmit = (data: FormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => push(HOME_AFTER_LOGIN),
    });
  };

  const serverError = getApiErrorMessage(loginMutation.error);

  const statusLine = stats
    ? stats.online > 0
      ? `Сейчас онлайн: ${stats.online}`
      : `${stats.communities} ${pluralCommunities(stats.communities)} в Бишкеке`
    : null;

  return (
    <div className={css.page}>
      <div className={css.formSide}>
        <div className={css.formWrap}>
          <Link href="/welcome" className={css.brand}>
            <LogoMark size={16} />
            <span>Localy</span>
          </Link>

          <h1 className={css.title}>Ваши соседи уже заждались</h1>
          <p className={css.status}>
            {statusLine && <span className={css.statusDot} />}
            {statusLine ?? "Войдите, чтобы продолжить общение с вашим сообществом"}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className={css.form} noValidate>
            <div className={css.inputGroup}>
              <label htmlFor="email">Электронная почта</label>
              <div className={css.inputWrap}>
                <Mail size={16} className={css.inputIcon} />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Введите пароль"
                  {...register("password", { required: "Введите пароль" })}
                />
                <button
                  type="button"
                  className={css.eyeBtn}
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <span className={css.errorText}>{errors.password.message}</span>}
            </div>

            {serverError && (
              <p className={css.errorBanner}>
                <AlertCircle size={14} />
                {serverError}
              </p>
            )}

            <button type="submit" className={css.button} disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                "Входим..."
              ) : (
                <>
                  Войти
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className={css.registerText}>
            Нет аккаунта? <Link href="/register">Создать</Link>
          </p>

          <p className={css.note}>
            <Lock size={13} />В чатах вы Аноним #N, имя и почта скрыты
          </p>
        </div>
      </div>

      <aside className={css.showcase} aria-hidden="true">
        <svg
          className={css.map}
          viewBox="0 0 520 720"
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
        >
          <defs>
            <pattern id="login-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#1d2129" />
            </pattern>
          </defs>
          <rect width="520" height="720" fill="url(#login-dots)" />
          <g stroke="#2a2a55" strokeWidth="1" fill="none">
            <path d="M90 110 L220 200 L380 140" />
            <path d="M220 200 L290 340" />
            <path d="M290 340 L130 470 M290 340 L430 440" />
          </g>
          <g fill="#818cf8">
            <circle cx="90" cy="110" r="3" />
            <circle cx="220" cy="200" r="3.5" />
            <circle cx="380" cy="140" r="3" />
            <circle cx="290" cy="340" r="3.5" />
            <circle cx="130" cy="470" r="3" />
            <circle cx="430" cy="440" r="3" />
          </g>
          <g fill="none" stroke="#818cf8" strokeWidth="1" opacity="0.35">
            <circle cx="220" cy="200" r="12" />
            <circle cx="290" cy="340" r="12" />
          </g>
        </svg>

        <div className={css.preview}>
          <div className={css.notice}>
            <Bell size={14} />
            Новые сообщения ждут вас в сообществах
          </div>

          <div className={css.chatCard}>
            <div className={css.chatHead}>
              <span className={css.chatTitle}>
                # общее <span className={css.chatSub}>· AUCA</span>
              </span>
              <span className={css.chatOnline}>14 онлайн</span>
            </div>
            <div className={css.chatBody}>
              <div className={css.msg}>
                <span className={css.msgAuthor}>Аноним #214</span>
                <span className={css.msgText}>Кто идёт на ярмарку вакансий?</span>
              </div>
              <div className={css.msg}>
                <span className={css.msgAuthor}>Аноним #5871</span>
                <span className={css.msgText}>Я. Встретимся у входа</span>
              </div>
              <div className={css.typing}>
                <span className={css.typingDots}>
                  <span />
                  <span />
                  <span />
                </span>
                Аноним #771 печатает
              </div>
            </div>
          </div>

          <div className={css.request}>
            <span className={css.requestIcon}>
              <Mail size={15} />
            </span>
            <span className={css.requestBody}>
              <span className={css.requestName}>Аноним #1873</span>
              <span className={css.requestText}>хочет написать вам лично</span>
            </span>
            <span className={css.requestTag}>Запрос</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Login;
