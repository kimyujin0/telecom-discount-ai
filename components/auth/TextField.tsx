"use client";

interface TextFieldProps {
  id: string;
  name: string;
  type: "email" | "password";
  label: string;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
}

/** /login, /signup 폼이 공유하는 입력 필드 (라벨 + 입력칸 + 오류 문구). */
export default function TextField({
  id,
  name,
  type,
  label,
  placeholder,
  autoComplete,
  defaultValue,
  error,
  hint,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-zinc-700 dark:text-zinc-200">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`mt-2 h-11 w-full rounded-2xl border bg-zinc-50 px-4 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 dark:bg-zinc-950 dark:text-zinc-100 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-900/60 dark:focus:ring-red-900/30"
            : "border-zinc-300 focus:border-primary-400 focus:ring-primary-100 dark:border-zinc-700 dark:focus:ring-primary-900/40"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
