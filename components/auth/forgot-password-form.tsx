"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck, Send } from "lucide-react";
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
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/auth/schemas";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const lg = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The success state is intentionally opaque — it never confirms the email
  // exists. It just tells the user "if it exists, a link is coming".
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "", lg },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, lg }),
      });
      // Always land on the neutral confirmation, regardless of the response.
      setSentTo(values.email);
    } catch {
      // Even a network error resolves to the same neutral confirmation — no
      // signal about whether the account exists.
      setSentTo(values.email);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <div className="auth-reveal space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#e399a3]/45 bg-[#fdf8f9] px-5 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c74959]/10 text-[#c74959]">
            <MailCheck className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-[#1c0a0c]">{t("forgotPage.sentTitle")}</h2>
          <p className="max-w-sm text-sm leading-relaxed text-[#1c0a0c]/70">
            {t("forgotPage.sentBody")}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-[#c74959] hover:text-[#b03f4d]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("forgotPage.backToLogin")}
          </Link>
          <button
            type="button"
            onClick={() => {
              form.reset({ email: "", lg });
              setSentTo(null);
            }}
            className="font-medium text-[#1c0a0c]/60 hover:text-[#1c0a0c]"
          >
            {t("forgotPage.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-reveal space-y-5">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

          <Button
            className="h-11 w-full rounded-xl bg-[#c74959] text-sm font-semibold text-[#fdf8f9] hover:bg-[#b53f4d]"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("forgotPage.sending")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("forgotPage.submit")}
              </>
            )}
          </Button>
        </form>
      </Form>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#c74959] hover:text-[#b03f4d]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("forgotPage.backToLogin")}
      </Link>
    </div>
  );
}
