"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { APP_BRAND_NAME, getDefaultResendFrom } from "./lib/brand";
import { buildLoginUrl, buildRegisterUrl } from "./lib/siteUrl";

/**
 * Sends invitation email via Resend (dev: onboarding@resend.dev → your Resend account email).
 * Set RESEND_API_KEY in Convex environment variables.
 */
export const sendInvitationEmail = internalAction({
  args: {
    to: v.string(),
    token: v.string(),
    role: v.string(),
    organizationName: v.optional(v.string()),
  },
  handler: async (_ctx, { to, token, role, organizationName }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "[emails] RESEND_API_KEY not set — invitation created but email not sent.",
        buildRegisterUrl(token)
      );
      return { sent: false, reason: "missing_api_key" };
    }

    const registerUrl = buildRegisterUrl(token);
    const from = process.env.RESEND_FROM?.trim() || getDefaultResendFrom();
    const orgLine = organizationName
      ? `<p>Organisation : <strong>${escapeHtml(organizationName)}</strong></p>`
      : "";

    const roleFr =
      role === "learner"
        ? "apprenant"
        : role === "lead"
          ? "responsable"
          : "administrateur";

    const html = `
      <div style="font-family:sans-serif;max-width:520px;line-height:1.5;color:#1a1a1a">
        <h2 style="color:#2E7D64">Invitation ${escapeHtml(APP_BRAND_NAME)}</h2>
        <p>Vous êtes invité à rejoindre la plateforme de formation en tant que <strong>${roleFr}</strong>.</p>
        ${orgLine}
        <p>Cliquez sur le bouton ci-dessous pour créer votre compte (lien valable 7 jours) :</p>
        <p style="margin:24px 0">
          <a href="${registerUrl}" style="background:#2E7D64;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Créer mon compte
          </a>
        </p>
        <p style="font-size:12px;color:#666">Si le bouton ne fonctionne pas, copiez ce lien :<br/>
        <a href="${registerUrl}">${registerUrl}</a></p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Invitation — plateforme de formation ${APP_BRAND_NAME}`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[emails] Resend error", res.status, body);
      return { sent: false, reason: body };
    }

    return { sent: true };
  },
});

/** Sent when an admin creates an account manually — login link only (no password in email). */
export const sendManualAccountEmail = internalAction({
  args: {
    to: v.string(),
    name: v.string(),
    role: v.string(),
    organizationName: v.optional(v.string()),
  },
  handler: async (_ctx, { to, name, role, organizationName }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const loginUrl = buildLoginUrl();

    if (!apiKey) {
      console.warn(
        "[emails] RESEND_API_KEY not set — manual account created but welcome email not sent.",
        loginUrl
      );
      return { sent: false, reason: "missing_api_key" };
    }

    const from = process.env.RESEND_FROM?.trim() || getDefaultResendFrom();
    const orgLine = organizationName
      ? `<p>Organisation : <strong>${escapeHtml(organizationName)}</strong></p>`
      : "";

    const roleFr =
      role === "learner"
        ? "apprenant"
        : role === "lead"
          ? "responsable"
          : role === "super_admin"
            ? "super administrateur"
            : "administrateur";

    const html = `
      <div style="font-family:sans-serif;max-width:520px;line-height:1.5;color:#1a1a1a">
        <h2 style="color:#2E7D64">Votre compte ${escapeHtml(APP_BRAND_NAME)}</h2>
        <p>Bonjour <strong>${escapeHtml(name)}</strong>,</p>
        <p>Un compte a été créé pour vous sur la plateforme de formation en tant que <strong>${roleFr}</strong>.</p>
        ${orgLine}
        <p>Connectez-vous avec votre adresse e-mail et le mot de passe temporaire que votre administrateur vous a communiqué.</p>
        <p style="margin:24px 0">
          <a href="${loginUrl}" style="background:#2E7D64;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Se connecter
          </a>
        </p>
        <p style="font-size:12px;color:#666">Si le bouton ne fonctionne pas, copiez ce lien :<br/>
        <a href="${loginUrl}">${loginUrl}</a></p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Votre compte ${APP_BRAND_NAME} est prêt`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[emails] Resend error", res.status, body);
      return { sent: false, reason: body };
    }

    return { sent: true };
  },
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
