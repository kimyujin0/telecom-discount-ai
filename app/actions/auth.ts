"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth/nextPath";
import { PASSWORD_MIN_LENGTH, PASSWORD_SPECIAL_CHAR_REGEX } from "@/lib/auth/password";
import { CARRIERS } from "@/lib/carriers";
import { claimAnonymousSession } from "@/lib/diagnosis/claimSession";
import { isUuid, parseResumeSessionId } from "@/lib/diagnosis/resume";
import { createSupabaseAuthClient } from "@/lib/supabase/auth";

// 로그인/회원가입/로그아웃 서버 액션.
// 서버에서만 실행되므로 비밀번호가 클라이언트 번들이나 URL에 노출되지 않는다.

const carrierTuple = CARRIERS as unknown as [string, ...string[]];

const emailSchema = z.string().trim().min(1, "이메일을 입력해주세요.").pipe(z.email("이메일 형식이 올바르지 않아요."));

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상으로 입력해주세요.`)
  .regex(PASSWORD_SPECIAL_CHAR_REGEX, "특수문자를 최소 1개 포함해주세요.");

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nickname: z.string().trim().min(1, "닉네임을 입력해주세요.").max(20, "닉네임은 20자 이내로 입력해주세요."),
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(30, "이름은 30자 이내로 입력해주세요."),
  carrier: z.enum(carrierTuple, { error: "이용 중인 통신사를 선택해주세요." }),
});

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export interface AuthFormState {
  /** 필드별 검증 오류 (입력 칸 아래에 표시). */
  fieldErrors?: { email?: string; password?: string; nickname?: string; name?: string; carrier?: string };
  /** 폼 전체에 대한 오류 (Supabase 응답 등). */
  formError?: string;
  /** 이메일 인증이 필요해 아직 로그인되지 않은 상태. */
  emailConfirmationRequired?: boolean;
  /** 입력값 유지용 — 오류로 폼이 다시 그려질 때 사용자가 다시 타이핑하지 않도록 (비밀번호는 제외). */
  values?: { email?: string; nickname?: string; name?: string; carrier?: string };
}

/**
 * 로그인/회원가입에 성공한 직후, 그 전에 비로그인으로 진행한 진단을 방금 인증된 사용자의 것으로 연결한다.
 * 그래야 이 진단이 마이페이지 이력에 남는다. 연결할 세션은 두 경로 중 하나로 들어온다:
 *   - `claim` 폼 값: "결과 저장하고 알림받기" 버튼 — 목적지는 /mypage, 연결할 세션은 여기로 따로 넘어옴
 *   - `next`가 /diagnosis/chat?session=... : 별(저장) 버튼 — 로그인 후 그 결과 화면으로 돌아옴
 * 실패해도 로그인 자체는 성공으로 두므로 예외를 던지지 않는다(claimAnonymousSession은 false만 돌려준다).
 */
async function claimAnonymousDiagnosis(userId: string | undefined, formData: FormData, nextPath: string): Promise<void> {
  if (!userId) return;
  const claim = formData.get("claim");
  const sessionId = isUuid(claim) ? claim : parseResumeSessionId(nextPath);
  if (sessionId) await claimAnonymousSession(userId, sessionId);
}

/** Supabase가 돌려주는 영문 오류 메시지를 사용자에게 보여줄 한국어 문구로 옮긴다. */
function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않아요.";
  }
  if (normalized.includes("email not confirmed")) {
    return "아직 이메일 인증이 완료되지 않았어요. 받은 메일의 인증 링크를 먼저 눌러주세요.";
  }
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "이미 가입된 이메일이에요. 로그인해주세요.";
  }
  if (normalized.includes("password")) {
    return `비밀번호를 다시 확인해주세요. (${PASSWORD_MIN_LENGTH}자 이상 + 특수문자 포함)`;
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "요청이 너무 많아요. 잠시 후 다시 시도해주세요.";
  }
  return "처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.";
}

export async function signUpAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const rawEmail = String(formData.get("email") ?? "");
  const rawNickname = String(formData.get("nickname") ?? "");
  const rawName = String(formData.get("name") ?? "");
  const rawCarrier = String(formData.get("carrier") ?? "");
  const keptValues = { email: rawEmail, nickname: rawNickname, name: rawName, carrier: rawCarrier };

  const parsed = signUpSchema.safeParse({
    email: rawEmail,
    password: String(formData.get("password") ?? ""),
    nickname: rawNickname,
    name: rawName,
    carrier: rawCarrier,
  });

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      fieldErrors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        nickname: fieldErrors.nickname?.[0],
        name: fieldErrors.name?.[0],
        carrier: fieldErrors.carrier?.[0],
      },
      values: keptValues,
    };
  }

  const supabase = await createSupabaseAuthClient();
  // options.data로 넘긴 값들은 auth.users.raw_user_meta_data에 저장되고,
  // 0008_add_profiles_nickname_name.sql의 트리거가 이를 읽어 profiles 행을 만든다.
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { carrier: parsed.data.carrier, nickname: parsed.data.nickname, name: parsed.data.name } },
  });

  if (error) {
    console.error("[auth] signUp failed", error);
    return { formError: translateAuthError(error.message), values: keptValues };
  }

  // 프로젝트에서 이메일 인증을 켜두면 세션 없이 유저만 생성된다 — 이때는 로그인 상태가 아니다.
  if (!data.session) {
    return { emailConfirmationRequired: true, values: keptValues };
  }

  const nextPath = safeNextPath(formData.get("next"));
  await claimAnonymousDiagnosis(data.user?.id, formData, nextPath);

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function signInAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const rawEmail = String(formData.get("email") ?? "");

  const parsed = signInSchema.safeParse({
    email: rawEmail,
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      fieldErrors: { email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] },
      values: { email: rawEmail },
    };
  }

  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { formError: translateAuthError(error.message), values: { email: rawEmail } };
  }

  const nextPath = safeNextPath(formData.get("next"));
  await claimAnonymousDiagnosis(data.user?.id, formData, nextPath);

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseAuthClient();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("[auth] signOut failed", error);

  revalidatePath("/", "layout");
  redirect("/");
}
