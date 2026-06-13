# Supabase Auth Email Templates — CivilAxis

These are branded HTML templates for Supabase's transactional auth emails.

**Where to paste:** Supabase Dashboard → **Authentication → Email Templates** →
select the template (Confirm signup / Magic Link / Reset Password / Change Email
Address) → replace the **Message body** with the HTML below → **Save**.

**Do not change the `{{ ... }}` variables** — Supabase substitutes them at send time:
- `{{ .ConfirmationURL }}` — the action link (confirm / login / reset / change)
- `{{ .NewEmail }}` — the new address, in the Change Email template only

> Note: the Change Email template only exposes `{{ .NewEmail }}` reliably (matching
> Supabase's default). Don't use `{{ .Email }}` there — it may render blank.

Brand: navy gradient `#0f172a → #1e293b`, blue accent `#3b82f6` (matches AuthModal).

**Logo:** the header uses `https://civilaxis.com/logo.png` (served from `public/logo.png`).
Email clients require a public `https://` image URL — `localhost` URLs won't render in
a recipient's inbox, so the logo only appears once `civilaxis.com` is deployed and
serving `/logo.png`. The `CIVILAXIS` wordmark text stays below the image as a fallback
if a client blocks images.

---

## 1. Confirm signup

Subject suggestion: `Confirm your CivilAxis account`

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f0f2f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(15,23,42,0.12);">
        <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b); padding:32px 32px; text-align:center;">
          <img src="https://civilaxis.com/logo.png" alt="CivilAxis" width="56" height="56" style="display:inline-block; width:56px; height:56px; border-radius:12px; margin-bottom:10px;">
          <div style="font-size:11px; font-weight:700; color:#64748b; letter-spacing:0.18em; margin-bottom:6px;">CIVILAXIS</div>
          <div style="font-size:24px; font-weight:800; color:#ffffff;">Welcome aboard! 🎉</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#0f172a;">
            Thanks for joining <strong>CivilAxis</strong> — the home for civil engineering tools, standards, and a community of engineers.
          </p>
          <p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:#475569;">
            Just one quick step: confirm your email address to activate your account.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block; background:#3b82f6; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding:14px 40px; border-radius:10px;">Confirm my email</a>
          </td></tr></table>
          <p style="margin:28px 0 0; font-size:13px; line-height:1.6; color:#94a3b8;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{ .ConfirmationURL }}" style="color:#3b82f6; word-break:break-all;">{{ .ConfirmationURL }}</a>
          </p>
          <hr style="border:none; border-top:1px solid #e4e6eb; margin:28px 0;">
          <p style="margin:0; font-size:13px; line-height:1.6; color:#94a3b8;">
            If you didn't create a CivilAxis account, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc; padding:20px 32px; text-align:center; border-top:1px solid #e4e6eb;">
          <p style="margin:0; font-size:12px; color:#94a3b8;">© CivilAxis · Built for civil engineers</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## 2. Magic Link

Subject suggestion: `Your CivilAxis sign-in link`

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f0f2f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(15,23,42,0.12);">
        <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b); padding:32px 32px; text-align:center;">
          <img src="https://civilaxis.com/logo.png" alt="CivilAxis" width="56" height="56" style="display:inline-block; width:56px; height:56px; border-radius:12px; margin-bottom:10px;">
          <div style="font-size:11px; font-weight:700; color:#64748b; letter-spacing:0.18em; margin-bottom:6px;">CIVILAXIS</div>
          <div style="font-size:24px; font-weight:800; color:#ffffff;">Sign in to CivilAxis 🔑</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 28px; font-size:16px; line-height:1.6; color:#0f172a;">
            Click the button below to securely sign in to your <strong>CivilAxis</strong> account. This link expires shortly and can be used once.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block; background:#3b82f6; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding:14px 40px; border-radius:10px;">Sign in</a>
          </td></tr></table>
          <p style="margin:28px 0 0; font-size:13px; line-height:1.6; color:#94a3b8;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{ .ConfirmationURL }}" style="color:#3b82f6; word-break:break-all;">{{ .ConfirmationURL }}</a>
          </p>
          <hr style="border:none; border-top:1px solid #e4e6eb; margin:28px 0;">
          <p style="margin:0; font-size:13px; line-height:1.6; color:#94a3b8;">
            If you didn't request this sign-in link, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc; padding:20px 32px; text-align:center; border-top:1px solid #e4e6eb;">
          <p style="margin:0; font-size:12px; color:#94a3b8;">© CivilAxis · Built for civil engineers</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## 3. Reset Password

Subject suggestion: `Reset your CivilAxis password`

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f0f2f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(15,23,42,0.12);">
        <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b); padding:32px 32px; text-align:center;">
          <img src="https://civilaxis.com/logo.png" alt="CivilAxis" width="56" height="56" style="display:inline-block; width:56px; height:56px; border-radius:12px; margin-bottom:10px;">
          <div style="font-size:11px; font-weight:700; color:#64748b; letter-spacing:0.18em; margin-bottom:6px;">CIVILAXIS</div>
          <div style="font-size:24px; font-weight:800; color:#ffffff;">Reset your password 🔒</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 28px; font-size:16px; line-height:1.6; color:#0f172a;">
            We received a request to reset the password for your <strong>CivilAxis</strong> account. Click below to choose a new password. This link expires shortly.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block; background:#3b82f6; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding:14px 40px; border-radius:10px;">Reset password</a>
          </td></tr></table>
          <p style="margin:28px 0 0; font-size:13px; line-height:1.6; color:#94a3b8;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{ .ConfirmationURL }}" style="color:#3b82f6; word-break:break-all;">{{ .ConfirmationURL }}</a>
          </p>
          <hr style="border:none; border-top:1px solid #e4e6eb; margin:28px 0;">
          <p style="margin:0; font-size:13px; line-height:1.6; color:#94a3b8;">
            If you didn't request a password reset, you can safely ignore this email — your password won't change.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc; padding:20px 32px; text-align:center; border-top:1px solid #e4e6eb;">
          <p style="margin:0; font-size:12px; color:#94a3b8;">© CivilAxis · Built for civil engineers</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## 4. Change Email Address

Subject suggestion: `Confirm your new CivilAxis email`

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f0f2f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(15,23,42,0.12);">
        <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b); padding:32px 32px; text-align:center;">
          <img src="https://civilaxis.com/logo.png" alt="CivilAxis" width="56" height="56" style="display:inline-block; width:56px; height:56px; border-radius:12px; margin-bottom:10px;">
          <div style="font-size:11px; font-weight:700; color:#64748b; letter-spacing:0.18em; margin-bottom:6px;">CIVILAXIS</div>
          <div style="font-size:24px; font-weight:800; color:#ffffff;">Confirm your new email ✉️</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#0f172a;">
            Confirm <strong>{{ .NewEmail }}</strong> as the new email address for your
            <strong>CivilAxis</strong> account.
          </p>
          <p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:#475569;">
            Click the button below to complete the change.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block; background:#3b82f6; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; padding:14px 40px; border-radius:10px;">Confirm new email</a>
          </td></tr></table>
          <p style="margin:28px 0 0; font-size:13px; line-height:1.6; color:#94a3b8;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{ .ConfirmationURL }}" style="color:#3b82f6; word-break:break-all;">{{ .ConfirmationURL }}</a>
          </p>
          <hr style="border:none; border-top:1px solid #e4e6eb; margin:28px 0;">
          <p style="margin:0; font-size:13px; line-height:1.6; color:#94a3b8;">
            If you didn't request this change, ignore this email and your address stays the same.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc; padding:20px 32px; text-align:center; border-top:1px solid #e4e6eb;">
          <p style="margin:0; font-size:12px; color:#94a3b8;">© CivilAxis · Built for civil engineers</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```
