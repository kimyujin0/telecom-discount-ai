"use server";

import { z } from "zod";
import { PASSWORD_MIN_LENGTH, PASSWORD_SPECIAL_CHAR_REGEX } from "@/lib/auth/password";
import { createSupabaseAuthClient } from "@/lib/supabase/auth";

// 마이페이지에서 로그인 정보(닉네임/비밀번호)를 수정하는 서버 액션.
// 둘 다 createSupabaseAuthClient()(anon 키 + 요청 쿠키)를 쓴다 — service role이 아니라 RLS가 적용되는
// "본인 세션" 클라이언트라야 profiles_update_own 정책(0006_create_profiles.sql)과
// supabase.auth.updateUser()가 "현재 로그인한 사용자 본인"만 수정하도록 보장한다.

const nicknameSchema = z.string().trim().min(1, "닉네임을 입력해주세요.").max(20, "닉네임은 20자 이내로 입력해주세요.");

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상으로 입력해주세요.`)
  .regex(PASSWORD_SPECIAL_CHAR_REGEX, "특수문자를 최소 1개 포함해주세요.");

export interface NicknameFormState {
  fieldError?: string;
  formError?: string;
  success?: boolean;
}

export async function updateNicknameAction(
  _prevState: NicknameFormState,
  formData: FormData,
): Promise<NicknameFormState> {
  const parsed = nicknameSchema.safeParse(String(formData.get("nickname") ?? ""));
  if (!parsed.success) {
    return { fieldError: parsed.error.issues[0]?.message };
  }

  const supabase = await createSupabaseAuthClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { formError: "로그인이 필요해요." };

  const { error } = await supabase.from("profiles").update({ nickname: parsed.data }).eq("id", user.id);
  if (error) {
    console.error("[account] failed to update nickname", error);
    return { formError: "닉네임을 저장하지 못했어요. 잠시 후 다시 시도해주세요." };
  }

  return { success: true };
}

export interface PasswordFormState {
  fieldError?: string;
  formError?: string;
  success?: boolean;
}

/** Supabase가 돌려주는 영문 오류 메시지를 사용자에게 보여줄 한국어 문구로 옮긴다. */
function translatePasswordError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("should be different from the old password")) {
    return "현재 비밀번호와 다른 비밀번호로 설정해주세요.";
  }
  if (normalized.includes("password")) {
    return `비밀번호를 다시 확인해주세요. (${PASSWORD_MIN_LENGTH}자 이상 + 특수문자 포함)`;
  }
  return "처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.";
}

export async function updatePasswordAction(
  _prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const rawPassword = String(formData.get("password") ?? "");
  const rawConfirmPassword = String(formData.get("confirmPassword") ?? "");

  const parsed = passwordSchema.safeParse(rawPassword);
  if (!parsed.success) {
    return { fieldError: parsed.error.issues[0]?.message };
  }
  if (rawPassword !== rawConfirmPassword) {
    return { fieldError: "비밀번호가 서로 일치하지 않아요." };
  }

  const supabase = await createSupabaseAuthClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    console.error("[account] failed to update password", error);
    return { formError: translatePasswordError(error.message) };
  }

  return { success: true };
}
