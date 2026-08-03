"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { legalHref } from "@/lib/legal";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/client";
import { DEFAULT_LANGUAGE } from "@/lib/auth/constants";
import { planIntentQuery } from "@/lib/plan-intent";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import {
  signupSchema,
  type SignupFormValues,
} from "@/lib/auth/schemas";
import type {
  AuthRouteErrorResponse,
  AuthRouteSuccessResponse,
} from "@/lib/auth/types";

type SignupApiResponse = AuthRouteErrorResponse | AuthRouteSuccessResponse;

export function SignupForm({
  /** Verified, re-signed plan-intent token from the page (null if none). */
  planToken = null,
}: {
  planToken?: string | null;
}) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      lg: DEFAULT_LANGUAGE,
    },
  });

  const applyServerFieldErrors = (payload: AuthRouteErrorResponse): void => {
    if (!payload.fieldErrors) {
      return;
    }

    for (const [fieldName, fieldErrors] of Object.entries(payload.fieldErrors)) {
      const message = fieldErrors?.[0];

      if (!message) {
        continue;
      }

      if (fieldName in form.getValues()) {
        form.setError(fieldName as keyof SignupFormValues, {
          type: "server",
          message,
        });
      }
    }
  };

  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          lg: values.lg ?? DEFAULT_LANGUAGE,
        }),
      });

      const payload = (await response.json()) as SignupApiResponse;

      if (!response.ok || payload.status !== "success") {
        if (payload.status === "error") {
          applyServerFieldErrors(payload);
        }

        setFormError(
          payload.message || "Unable to create account right now. Please try again."
        );
        return;
      }

      const loginResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        lg: values.lg ?? DEFAULT_LANGUAGE,
        redirect: false,
      });

      if (loginResult?.error) {
        router.replace("/login");
        router.refresh();
        return;
      }

      // New accounts have no workspace yet — onboard to create their first.
      // A plan chosen on the pricing page rides along: checkout requires an
      // OWNER, and creating a workspace is what makes them one.
      router.replace(`/onboarding${planIntentQuery(planToken)}`);
      router.refresh();
    } catch {
      setFormError("Unable to create account right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || form.formState.isSubmitting;

  return (
    <div className="auth-reveal space-y-5">
      <div className="rounded-xl border border-[#e399a3]/45 bg-[#fdf8f9] p-3 text-xs leading-relaxed text-[#1c0a0c]/78">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-semibold text-[#c74959] hover:text-[#b03f4d]">{t("auth.signInInstead")}</Link>
      </div>

      {/* Google signs up and signs in through the same button — the backend
          provisions the account on first use. It lands on /onboarding for the
          same reason an email signup does: a new account has no workspace.
          The plan token has to ride on the callback URL: an OAuth round trip
          leaves the page entirely, so anything not in that URL is lost, and a
          visitor who picked Pro would silently arrive on the Free dashboard. */}
      <GoogleButton
        label={t("auth.continueWithGoogle")}
        callbackUrl={`/onboarding${planIntentQuery(planToken)}`}
      />
      <AuthDivider label={t("auth.orUseEmail")} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">{t("auth.fullName")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="name"
                    placeholder="Jane Product"
                    className="h-11 rounded-xl border-[#e399a3]/65 bg-[#fdf8f9] px-3.5 text-[#1c0a0c] placeholder:text-[#1c0a0c]/45 focus-visible:border-[#c74959] focus-visible:ring-[#da6a78]/30"
                  />
                </FormControl>
                <FormMessage className="text-xs text-[#b13d4c]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">{t("auth.email")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="email"
                    placeholder="jane@acme.test"
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
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">{t("auth.password")}</FormLabel>
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
                      onClick={() => setShowPassword((previous) => !previous)}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormDescription className="text-xs text-[#1c0a0c]/55">
                  {t("auth.passwordHint")}
                </FormDescription>
                <FormMessage className="text-xs text-[#b13d4c]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">{t("auth.confirmPassword")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      autoComplete="new-password"
                      placeholder={t("auth.reenterPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      className="h-11 rounded-xl border-[#e399a3]/65 bg-[#fdf8f9] px-3.5 pr-10 text-[#1c0a0c] placeholder:text-[#1c0a0c]/45 focus-visible:border-[#c74959] focus-visible:ring-[#da6a78]/30"
                    />
                    <button
                      aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                      className="absolute inset-y-0 right-3 inline-flex items-center text-[#1c0a0c]/55 hover:text-[#1c0a0c]"
                      onClick={() => setShowConfirmPassword((previous) => !previous)}
                      type="button"
                    >
                      {showConfirmPassword ? (
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
            <div className="rounded-xl border border-[#c74959]/35 bg-[#c74959]/10 px-3 py-2 text-sm text-[#8f2f3b]">
              {formError}
            </div>
          ) : null}

          <Button
            className="h-11 w-full rounded-xl bg-[#c74959] text-sm font-semibold text-[#fdf8f9] hover:bg-[#b53f4d]"
            disabled={isDisabled}
            type="submit"
          >
            {isDisabled ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />{t("auth.creatingAccount")}</>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />{t("auth.createAccountCta")}</>
            )}
          </Button>

          {/* Terms acceptance. A tick-box would be friction with no legal
              benefit here — a clear notice at the point of signup is the
              accepted pattern, and clause 1 of the Terms is written to match
              ("by creating an account … you agree"). Not localized: English is
              the authoritative version of the documents. */}
          <p className="text-center text-xs leading-relaxed text-[#1c0a0c]/55">
            By creating an account you agree to our{" "}
            <Link
              href={legalHref("terms")}
              className="font-medium text-[#c74959] hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href={legalHref("privacy")}
              className="font-medium text-[#c74959] hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </Form>
    </div>
  );
}
