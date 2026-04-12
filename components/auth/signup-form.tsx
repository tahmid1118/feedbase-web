"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
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
import { DEFAULT_LANGUAGE } from "@/lib/auth/constants";
import {
  signupSchema,
  type SignupFormValues,
} from "@/lib/auth/schemas";
import type {
  AuthRouteErrorResponse,
  AuthRouteSuccessResponse,
} from "@/lib/auth/types";

type SignupApiResponse = AuthRouteErrorResponse | AuthRouteSuccessResponse;

export function SignupForm() {
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
      contact: "",
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
          contact: values.contact,
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

      router.replace("/");
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
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#c74959] hover:text-[#b03f4d]">
          Sign in instead
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">
                  Full name
                </FormLabel>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">
                    Email
                  </FormLabel>
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
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">
                    Contact
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="tel"
                      placeholder="+8801712345678"
                      type="tel"
                      className="h-11 rounded-xl border-[#e399a3]/65 bg-[#fdf8f9] px-3.5 text-[#1c0a0c] placeholder:text-[#1c0a0c]/45 focus-visible:border-[#c74959] focus-visible:ring-[#da6a78]/30"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-[#b13d4c]" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      type={showPassword ? "text" : "password"}
                      className="h-11 rounded-xl border-[#e399a3]/65 bg-[#fdf8f9] px-3.5 pr-10 text-[#1c0a0c] placeholder:text-[#1c0a0c]/45 focus-visible:border-[#c74959] focus-visible:ring-[#da6a78]/30"
                    />
                    <button
                      aria-label={showPassword ? "Hide password" : "Show password"}
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
                  Use at least 8 characters with uppercase, lowercase, number, and symbol.
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
                <FormLabel className="text-sm font-medium text-[#1c0a0c]/85">
                  Confirm password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      type={showConfirmPassword ? "text" : "password"}
                      className="h-11 rounded-xl border-[#e399a3]/65 bg-[#fdf8f9] px-3.5 pr-10 text-[#1c0a0c] placeholder:text-[#1c0a0c]/45 focus-visible:border-[#c74959] focus-visible:ring-[#da6a78]/30"
                    />
                    <button
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create account
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
