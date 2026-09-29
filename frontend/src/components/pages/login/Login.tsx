"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AlertCircle, Lock, Mail } from "lucide-react";
import css from "./login.module.css";
import { LogoMark } from "@/components/layout/Logo";
import { useLogin } from "@/hooks/auth/useLogin";
import { HOME_AFTER_LOGIN } from "@/lib/routes";

interface FormValues {
  email: string;
  password: string;
}

const Login = () => {
  const { push } = useRouter();
  const loginMutation = useLogin();

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

  const serverError = (loginMutation.error as any)?.response?.data?.message as
    | string
    | undefined;

  return (
    <div className={css.container}>
      <div className={css.mainContainer}>
        <div className={css.brand}>
          <LogoMark size={18} />
          <span>Localy</span>
        </div>

        <div className={css.formSection}>
          <h1>С возвращением</h1>
          <p>Войдите, чтобы продолжить общение с вашим сообществом.</p>

          <form onSubmit={handleSubmit(onSubmit)} className={css.form} noValidate>
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
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Некорректный email" },
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
                  placeholder="Введите пароль"
                  {...register("password", { required: "Введите пароль" })}
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

            <button type="submit" className={css.button} disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Входим..." : "Войти"}
            </button>
          </form>

          <p className={css.hint}>
            В каждой комнате вы будете участвовать анонимно — имя и почта никогда
            не показываются другим.
          </p>

          <p className={css.loginText}>
            <button type="button" className={css.linkBtn}>
              Забыли пароль?
            </button>
          </p>

          <p className={css.loginText}>
            Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
