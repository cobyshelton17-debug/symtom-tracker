import { logoutAction } from "@/app/actions/auth";

export default function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition active:scale-[0.97]"
      >
        Sign out
      </button>
    </form>
  );
}
