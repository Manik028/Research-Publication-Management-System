const nodemailer = require('nodemailer');
const config = require('../config/env');

/**
 * Single place the app sends email from. Configured entirely through
 * environment variables — no credentials are ever hardcoded here or
 * exposed to the frontend.
 *
 * DEV FALLBACK: if SMTP isn't configured (no SMTP_HOST set), emails are
 * printed to the server console instead of actually being sent. This is
 * ONLY so the password-reset/2FA flow can be tested on a machine with no
 * real mail server configured — remove this fallback (or set real SMTP_*
 * env vars) before this is ever used somewhere that matters. The OTP
 * itself is never written to any persistent log or to AUDIT_LOG — this
 * console line is the one intentional, clearly-labelled exception, and
 * only fires when a real email couldn't be sent anyway.
 */
let transporter = null;

function getTransporter() {
    if (!config.smtp.host) return null;
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: config.smtp.user
            ? { user: config.smtp.user, password: config.smtp.password }
            : undefined,
    });
    return transporter;
}

async function sendMail(to, subject, html, devFallbackText) {
    const t = getTransporter();

    if (!t) {
        console.warn(
            '\n[emailService] SMTP not configured (SMTP_HOST is unset) — ' +
            'printing the email instead of sending it. Set SMTP_HOST/SMTP_PORT/' +
            'SMTP_USER/SMTP_PASSWORD/EMAIL_FROM in config/.env for real delivery.\n' +
            `To: ${to}\nSubject: ${subject}\n${devFallbackText || ''}\n`
        );
        return { devMode: true };
    }

    return t.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
    });
}

async function sendOtpEmail(to, otp, purpose) {
    const isReset = purpose === 'PASSWORD_RESET';
    const subject = isReset ? 'RPMS password reset code' : 'RPMS sign-in verification code';
    const intro = isReset
        ? 'Use this code to reset your RPMS password:'
        : 'Use this code to finish signing in to RPMS:';

    const html = `
        <p>${intro}</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>This code expires in 10 minutes and can only be used once.
        If you didn't request this, you can safely ignore this email.</p>
    `;

    return sendMail(to, subject, html, `Your code: ${otp}`);
}

module.exports = { sendMail, sendOtpEmail };
