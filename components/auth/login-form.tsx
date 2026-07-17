"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/client";
import { DEFAULT_LANGUAGE } from "@/lib/auth/constants";
import { loginSchema, type LoginFormValues } from "@/lib/auth/schemas";
import { SIGNIN_ERROR_CODE, signInErrorMessage } from "@/lib/auth/signin-errors";

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

export function LoginForm() {
  const { t } = useTranslation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Set when the backend refuses the login because a session is live elsewhere
  // (one-device plans). The password was correct, so we offer a takeover.
  const [activeSession, setActiveSession] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // e.g. an invite link sends the user here and expects them back afterwards.
  const nextPath = searchParams.get("next");
  // Set when the API client signs the user out because their device session was
  // revoked (signed out elsewhere, or taken over by a newer login).
  const wasSignedOut = searchParams.get("reason") === "session_ended";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      lg: DEFAULT_LANGUAGE,
    },
  });

  const onSubmit = async (values: LoginFormValues, force = false) => {
    setIsSubmitting(true);
    setFormError(null);
    if (!force) setActiveSession(false);

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        lg: values.lg ?? DEFAULT_LANGUAGE,
        ...(force ? { force: "true" } : {}),
        redirect: false,
      });

      if (!result || result.error) {
        // `code` distinguishes a real reason (e.g. already signed in on another
        // device) from a plain bad-credentials failure. On the active-session
        // case, offer a takeover — the password was correct.
        const isActive = result?.code === SIGNIN_ERROR_CODE.activeSession;
        setActiveSession(isActive);
        setFormError(
          result?.code
            ? signInErrorMessage(result.code)
            : GENERIC_LOGIN_ERROR
        );
        return;
      }

      // Only allow internal paths — never redirect to an external URL.
      const safeNext =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/";
      router.replace(safeNext);
      router.refresh();
    } catch {
      setFormError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || form.formState.isSubmitting;

  return (
    <div className="auth-reveal space-y-5">
      <div className="rounded-xl border border-[#e399a3]/45 bg-[#fdf8f9] p-3 text-xs leading-relaxed text-[#1c0a0c]/78">
        {t("auth.newToFeedbase")}{" "}
        <Link href="/signup" className="font-semibold text-[#c74959] hover:text-[#b03f4d]">
          {t("auth.createAccount")}
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => onSubmit(values))} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">
                  {t("auth.email")}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="email"
                    placeholder="you@example.com"
                    type="email"
                    className="h-11 rounded-xl border-[#e399a3]/65 bg-[#fdf8f9] px-3.5 text-[#1c0a0c] placeholder:text-[#1c0a0c]/45 focus-visible:border-[#c74959] focus-visible:ring-[#da6a78]/30"
                  />
                </FormControl>
                <FormMessage className="text-xs text-[#b13d4c]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">
                  {t("auth.password")}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      autoComplete="current-password"
                      placeholder={t("auth.enterPassword")}
                      type={isPasswordVisible ? "text" : "password"}
                      className="h-11 rounded-xl border-[#e399a3]/65 bg-[#fdf8f9] px-3.5 pr-10 text-[#1c0a0c] placeholder:text-[#1c0a0c]/45 focus-visible:border-[#c74959] focus-visible:ring-[#da6a78]/30"
                    />
                    <button
                      aria-label={isPasswordVisible ? t("auth.hidePassword") : t("auth.showPassword")}
                      className="absolute inset-y-0 right-3 inline-flex items-center text-[#1c0a0c]/55 hover:text-[#1c0a0c]"
                      onClick={() => setIsPasswordVisible((previous) => !previous)}
                      type="button"
                    >
                      {isPasswordVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-[#b13d4c]" />
              </FormItem>
            )}
          />

          {formError ? (
            <div className="space-y-2 rounded-xl border border-[#c74959]/35 bg-[#c74959]/10 px-3 py-2 text-sm text-[#8f2f3b]">
              <p>{formError}</p>
              {activeSession && (
                <button
                  type="button"
                  onClick={() => onSubmit(form.getValues(), true)}
                  disabled={isDisabled}
                  className="font-semibold text-[#c74959] underline underline-offset-2 hover:text-[#b53f4d] disabled:opacity-60"
                >
                  This is me — sign out other devices and sign in here
                </button>
              )}
            </div>
          ) : wasSignedOut ? (
            <div className="rounded-xl border border-[#e399a3]/60 bg-[#fdf8f9] px-3 py-2 text-sm text-[#1c0a0c]/75">
              You were signed out because this account was signed in somewhere
              else. Sign in again to continue.
            </div>
          ) : null}

          <Button
            className="h-11 w-full rounded-xl bg-[#c74959] text-sm font-semibold text-[#fdf8f9] hover:bg-[#b53f4d]"
            disabled={isDisabled}
            type="submit"
          >
            {isDisabled ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("auth.signingIn")}
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                {t("auth.signInCta")}
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
