import { Resend } from 'resend';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';

let _resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (env.RESEND_API_KEY === 'placeholder') {
    return null;
  }
  if (!_resendClient) {
    _resendClient = new Resend(env.RESEND_API_KEY);
  }
  return _resendClient;
}

const fromAddress = `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`;

export async function sendVerificationEmail(
  to: string,
  displayName: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${env.API_BASE_URL}/api/auth/verify-email?token=${token}`;

  const client = getResendClient();
  if (!client) { logger.warn({ to }, 'Verification email skipped: RESEND_API_KEY not configured'); return; }

  await client.emails.send({
    from: fromAddress,
    to,
    subject: 'Verify your Travel Sarthi account',
    html: `
      <div style="font-family: Raleway, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B35;">Welcome to Travel Sarthi, ${displayName}!</h1>
        <p>Please verify your email address to get started.</p>
        <a href="${verifyUrl}" style="
          display: inline-block;
          background: #FF6B35;
          color: white;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          margin: 20px 0;
        ">Verify Email Address</a>
        <p style="color: #7A7A9A; font-size: 14px;">This link expires in 24 hours.</p>
        <p style="color: #7A7A9A; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  });

  logger.info({ to }, 'Verification email sent');
}

export async function sendPasswordResetEmail(
  to: string,
  displayName: string,
  token: string,
): Promise<void> {
  const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${token}`;

  const client = getResendClient();
  if (!client) { logger.warn({ to }, 'Password reset email skipped: RESEND_API_KEY not configured'); return; }

  await client.emails.send({
    from: fromAddress,
    to,
    subject: 'Reset your Travel Sarthi password',
    html: `
      <div style="font-family: Raleway, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B35;">Password Reset Request</h1>
        <p>Hi ${displayName}, we received a request to reset your password.</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          background: #FF6B35;
          color: white;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          margin: 20px 0;
        ">Reset Password</a>
        <p style="color: #7A7A9A; font-size: 14px;">This link expires in 1 hour.</p>
        <p style="color: #7A7A9A; font-size: 12px;">If you didn't request this, please ignore this email. Your password will not change.</p>
      </div>
    `,
  });

  logger.info({ to }, 'Password reset email sent');
}

export async function sendFareAlertEmail(
  to: string,
  displayName: string,
  details: {
    origin: string;
    destination: string;
    price: string;
    targetPrice: string;
    deeplink: string;
  },
): Promise<void> {
  const client = getResendClient();
  if (!client) { logger.warn({ to }, 'Fare alert email skipped: RESEND_API_KEY not configured'); return; }

  await client.emails.send({
    from: fromAddress,
    to,
    subject: `Price Alert: ${details.origin} → ${details.destination} is now ${details.price}!`,
    html: `
      <div style="font-family: Raleway, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B35;">✈️ Price Alert Triggered!</h1>
        <p>Hi ${displayName}, a flight you're tracking has dropped to your target price.</p>
        <div style="background: #F8F6F2; border-radius: 16px; padding: 24px; margin: 20px 0;">
          <p><strong>${details.origin} → ${details.destination}</strong></p>
          <p>Current Price: <strong style="color: #0B7A75; font-size: 24px;">${details.price}</strong></p>
          <p style="color: #7A7A9A;">Your Target: ${details.targetPrice}</p>
        </div>
        <a href="${details.deeplink}" style="
          display: inline-block;
          background: #FF6B35;
          color: white;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
        ">Book Now</a>
      </div>
    `,
  });
}

export async function sendDisruptionEmail(
  to: string,
  displayName: string,
  details: {
    flightNumber: string;
    type: string;
    severity: string;
    delay?: number;
    recoveryUrl: string;
  },
): Promise<void> {
  const client = getResendClient();
  if (!client) { logger.warn({ to }, 'Disruption email skipped: RESEND_API_KEY not configured'); return; }

  await client.emails.send({
    from: fromAddress,
    to,
    subject: `Flight Alert: ${details.flightNumber} — ${details.type}`,
    html: `
      <div style="font-family: Raleway, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B6B;">⚠️ Flight Disruption Alert</h1>
        <p>Hi ${displayName}, your flight has been impacted.</p>
        <div style="background: #F8F6F2; border-radius: 16px; padding: 24px; margin: 20px 0;">
          <p><strong>Flight:</strong> ${details.flightNumber}</p>
          <p><strong>Type:</strong> ${details.type}</p>
          ${details.delay !== undefined ? `<p><strong>Delay:</strong> ${details.delay} minutes</p>` : ''}
        </div>
        <a href="${details.recoveryUrl}" style="
          display: inline-block;
          background: #0B7A75;
          color: white;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
        ">View Recovery Options</a>
      </div>
    `,
  });
}
