// backend/src/templates/emailTemplates.ts
// ─────────────────────────────────────────────────────────────
// Professional HTML Email Templates
// Mobile responsive, dark themed, ApptitudeTest.live branding
// ─────────────────────────────────────────────────────────────

/**
 * Generate verification email HTML
 */
export const getVerificationEmailTemplate = (
  userName: string,
  verificationUrl: string
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email — ApptitudeTest.live</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:linear-gradient(145deg,#12121a,#1a1a2e);border-radius:16px;border:1px solid rgba(157,0,255,0.2);overflow:hidden;">

          <!-- Header Gradient Bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#9D00FF,#FF00AA,#00F5FF);"></td>
          </tr>

          <!-- Logo Section -->
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,rgba(157,0,255,0.2),rgba(255,0,170,0.2));border:1px solid rgba(157,0,255,0.3);line-height:56px;font-size:24px;">⚡</div>
              <h1 style="margin:16px 0 4px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:3px;">ApptitudeTest.live</h1>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;">Intelligence Platform</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:0 40px 32px;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#ffffff;font-weight:600;">Verify Your Email</h2>
              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
                Hello <strong style="color:#ffffff;">${userName}</strong>,<br/>
                Thank you for signing up! Please verify your email address to activate your account.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${verificationUrl}" target="_blank"
                       style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#9D00FF,#7B00CC);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:1.5px;text-transform:uppercase;box-shadow:0 4px 20px rgba(157,0,255,0.35);">
                      VERIFY EMAIL
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.35);">
                Or copy and paste this link in your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#9D00FF;word-break:break-all;line-height:1.5;">
                ${verificationUrl}
              </p>

              <!-- Expiry Warning -->
              <div style="padding:14px 18px;background:rgba(255,183,0,0.08);border:1px solid rgba(255,183,0,0.2);border-radius:10px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:rgba(255,183,0,0.85);">
                  ⏱ This verification link expires in <strong>30 minutes</strong>. After that, you'll need to request a new one.
                </p>
              </div>

              <!-- Security Note -->
              <div style="padding:14px 18px;background:rgba(255,51,102,0.06);border:1px solid rgba(255,51,102,0.15);border-radius:10px;">
                <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);">
                  🔒 If you didn't create an account on ApptitudeTest.live, please ignore this email. No action is needed.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.2);">
                © ${new Date().getFullYear()} ApptitudeTest.live — All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Generate password reset email HTML
 */
export const getPasswordResetEmailTemplate = (
  userName: string,
  resetUrl: string
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password — ApptitudeTest.live</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:linear-gradient(145deg,#12121a,#1a1a2e);border-radius:16px;border:1px solid rgba(0,245,255,0.2);overflow:hidden;">

          <!-- Header Gradient Bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#00F5FF,#9D00FF,#FF00AA);"></td>
          </tr>

          <!-- Logo Section -->
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,rgba(0,245,255,0.2),rgba(157,0,255,0.2));border:1px solid rgba(0,245,255,0.3);line-height:56px;font-size:24px;">🔑</div>
              <h1 style="margin:16px 0 4px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:3px;">ApptitudeTest.live</h1>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;">Intelligence Platform</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:0 40px 32px;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#ffffff;font-weight:600;">Reset Your Password</h2>
              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;">
                Hello <strong style="color:#ffffff;">${userName}</strong>,<br/>
                We received a request to reset your password. Click the button below to set a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${resetUrl}" target="_blank"
                       style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#00F5FF,#00C4CC);color:#0a0a0f;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:1.5px;text-transform:uppercase;box-shadow:0 4px 20px rgba(0,245,255,0.35);">
                      RESET PASSWORD
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.35);">
                Or copy and paste this link in your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#00F5FF;word-break:break-all;line-height:1.5;">
                ${resetUrl}
              </p>

              <!-- Expiry Warning -->
              <div style="padding:14px 18px;background:rgba(255,183,0,0.08);border:1px solid rgba(255,183,0,0.2);border-radius:10px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:rgba(255,183,0,0.85);">
                  ⏱ This reset link expires in <strong>30 minutes</strong>. After that, you'll need to request a new one.
                </p>
              </div>

              <!-- Security Note -->
              <div style="padding:14px 18px;background:rgba(255,51,102,0.06);border:1px solid rgba(255,51,102,0.15);border-radius:10px;">
                <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);">
                  🔒 If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.2);">
                © ${new Date().getFullYear()} ApptitudeTest.live — All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
