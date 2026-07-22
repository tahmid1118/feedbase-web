"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
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
import { useLanguage } from "@/components/providers/i18n-provider";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/auth/schemas";

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useTranslation();
  const lg = useLanguage();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "", lg },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password, lg }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.status !== "success") {
        // The backend message is already localized (invalid/expired token, weak
        // password); fall back to a generic line otherwise.
        setFormError(data?.message || t("resetPage.invalidTitle"));
        return;
      }

      // Land on login with a success banner. A hard navigation is fine here —
      // there's no session to preserve.
      router.replace("/login?reset=success");
    } catch {
      setFormError(t("resetPage.invalidTitle"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-reveal space-y-5">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">
                  {t("resetPage.newPassword")}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      autoComplete="new-password"
                      placeholder={t("auth.createStrongPassword")}
                      type={showPassword ? "text" : "password"}
                      className="h-11 rounded-xl border-[#e399a3]/65 bg-[#fdf8f9] px-3.5 pr-10 text-[#1c0a0c] placeholder:text-[#1c0a0c]/45 focus-visible:border-[#c74959] focus-visible:ring-[#da6a78]/30"
                    />
                    <button
                      aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                      className="absolute inset-y-0 right-3 inline-flex items-center text-[#1c0a0c]/55 hover:text-[#1c0a0c]"
                      onClick={() => setShowPassword((p) => !p)}
                      type="button"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <p className="text-xs text-[#1c0a0c]/55">{t("auth.passwordHint")}</p>
                <FormMessage className="text-xs text-[#b13d4c]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">
                  {t("auth.confirmPassword")}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="new-password"
                    placeholder={t("auth.reenterPassword")}
                    type={showPassword ? "text" : "password"}
                    className="h-11 rounded-xl border-[#e399a3]/65 bg-[#fdf8f9] px-3.5 text-[#1c0a0c] placeholder:text-[#1c0a0c]/45 focus-visible:border-[#c74959] focus-visible:ring-[#da6a78]/30"
                  />
                </FormControl>
                <FormMessage className="text-xs text-[#b13d4c]" />
              </FormItem>
            )}
          />

          {formError && (
            <div className="rounded-xl border border-[#c74959]/35 bg-[#c74959]/10 px-3 py-2 text-sm text-[#8f2f3b]">
              {formError}
            </div>
          )}

          <Button
            className="h-11 w-full rounded-xl bg-[#c74959] text-sm font-semibold text-[#fdf8f9] hover:bg-[#b53f4d]"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("resetPage.resetting")}
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                {t("resetPage.submit")}
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
