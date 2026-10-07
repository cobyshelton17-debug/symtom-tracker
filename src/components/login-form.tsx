"use client";

import { useActionState, useState } from "react";
import { googleLoginAction, loginAction, registerAction } from "@/app/actions/auth";
import type { AuthFormState } from "@/app/actions/auth";

type Mode = "login" | "register";

const inputClass =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>("login");
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, {});

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`h-9 rounded-lg transition ${
            mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`h-9 rounded-lg transition ${
            mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Create account
        </button>
      </div>

      <form action={formAction} className="space-y-3">
        {mode === "register" && (
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input id="name" name="name" type="text" autoComplete="name" className={inputClass} />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            className={inputClass}
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-xl bg-teal-600 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {pending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account and sign in"}
        </button>
      </form>

      <div className="mt-5">
        <div className="relative mb-5 text-center">
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-200" />
          <span className="relative bg-white px-3 text-xs uppercase tracking-wide text-slate-400">
            or
          </span>
        </div>

        <form
          action={async () => {
            await googleLoginAction();
          }}
        >
          <button
            type="submit"
            disabled={!googleEnabled}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white text-base font-medium text-slate-700 transition active:scale-[0.98] disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
              />
            </svg>
            Continue with Google
          </button>
        </form>
        {!googleEnabled && (
          <p className="mt-2 text-center text-xs text-slate-400">
            Google sign-in activates once keys are added to .env
          </p>
        )}
      </div>
    </div>
  );
}
