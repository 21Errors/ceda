import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { emailOTP, phoneNumber } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import * as schema from "@/db/schema";
import { db } from "@/db";
import { sendAuthCode } from "@/lib/server/mailer";
import { writeAuditEvent } from "@/lib/server/audit";
import { isBotswanaMobile, sendSms } from "@/lib/server/sms-provider";

const secret = process.env.BETTER_AUTH_SECRET;
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const configuredBaseURL = process.env.BETTER_AUTH_URL?.trim();
if (process.env.NODE_ENV === "production" && !isProductionBuild && !configuredBaseURL) {
  throw new Error("BETTER_AUTH_URL must be set to the deployed portal origin in production.");
}
const baseURL = configuredBaseURL || "http://localhost:3000";
if (process.env.NODE_ENV === "production" && !isProductionBuild && (!secret || secret.length < 32)) {
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters in production.");
}

export const auth = betterAuth({
  appName: "CEDA Innovation Portal",
  baseURL,
  secret: secret ?? (isProductionBuild ? "build-only-placeholder-secret-not-used-at-runtime" : "ceda-local-development-secret-change-before-deploy"),
  trustedOrigins: [baseURL],
  database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  databaseHooks: {
    session: {
      create: {
        async after(session) {
          await writeAuditEvent({
            actorId: session.userId,
            action: "auth.session.created",
            entityType: "session",
            entityId: session.id,
            metadata: { expiresAt: session.expiresAt.toISOString() },
          });
        },
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      storeOTP: "hashed",
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        await sendAuthCode(email, otp, type);
      },
    }),
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      requireVerification: true,
      phoneNumberValidator: isBotswanaMobile,
      async sendOTP({ phoneNumber, code }) {
        await sendSms(phoneNumber, `Your CEDA Innovation Portal verification code is ${code}. It expires in five minutes.`);
      },
    }),
    passkey({
      rpID: process.env.PASSKEY_RP_ID ?? "localhost",
      rpName: "CEDA Innovation Portal",
      origin: process.env.PASSKEY_ORIGIN ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    }),
  ],
});
