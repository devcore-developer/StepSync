"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export async function register(formData: FormData) {
  const validatedFields = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return { error: "بيانات غير صالحة. تحقق من المدخلات." };
  }

  const { firstName, lastName, email, password } = validatedFields.data;

  try {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "هذا البريد مسجل بالفعل." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        profile: {
          create: {
            firstName,
            lastName,
            university: "Alexandria University",
          },
        },
      },
    });

    return { success: "تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول." };
  } catch (err) {
    // 🔍 مؤقت — شوف الخطأ الحقيقي في terminal
    console.error("Register error:", err);
    return { error: "حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى." };
  }
}

export async function forgotPassword(formData: FormData) {
  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return { error: "بريد إلكتروني صالح." };
  }

  const { email } = validatedFields.data;

  try {
    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600 * 1000);

      await db.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });
    }

    return {
      success:
        "إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور.",
    };
  } catch (err) {
    console.error("Forgot password error:", err);
    return { error: "حدث خطأ. حاول مرة أخرى." };
  }
}

export async function resetPassword(formData: FormData) {
  const validatedFields = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return { error: "بيانات غير صالحة." };
  }

  const { token, password } = validatedFields.data;

  try {
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return { error: "الرابط منتهي أو غير صالح." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { email: verificationToken.identifier },
      data: { passwordHash: hashedPassword },
    });

    await db.verificationToken.delete({ where: { token } });

    return { success: "تم تغيير كلمة المرور بنجاح. سجل دخولك." };
  } catch (err) {
    console.error("Reset password error:", err);
    return { error: "حدث خطأ. حاول مرة أخرى." };
  }
}