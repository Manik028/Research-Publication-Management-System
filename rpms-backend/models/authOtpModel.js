const { executeQuery, insertReturningId } = require('../config/db');
const { generateOtp, hashOtp, compareOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../services/emailService');

const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

const AuthOtpModel = {
    /**
     * Rate-limits resends (one per RESEND_COOLDOWN_SECONDS), invalidates
     * any still-live OTP for this user+purpose (so only the newest one
     * ever verifies), creates and stores the new one, and emails it.
     * Returns { cooldown: true } instead of sending if called too soon.
     */
    issueOtp: async (userId, email, purpose) => {
        const recentResult = await executeQuery(
            `SELECT CREATED_AT FROM AUTH_OTP
             WHERE USER_ID = :userId AND PURPOSE = :purpose
             ORDER BY OTP_ID DESC FETCH FIRST 1 ROWS ONLY`,
            { userId, purpose }
        );

        if (recentResult.rows[0]) {
            const secondsSince = (Date.now() - new Date(recentResult.rows[0].CREATED_AT).getTime()) / 1000;
            if (secondsSince < RESEND_COOLDOWN_SECONDS) {
                return { cooldown: true, retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince) };
            }
        }

        // Invalidate any previous still-usable OTP for this purpose —
        // only the one we're about to send should ever verify.
        await executeQuery(
            `UPDATE AUTH_OTP SET IS_USED = 1
             WHERE USER_ID = :userId AND PURPOSE = :purpose AND IS_USED = 0`,
            { userId, purpose }
        );

        const otp = generateOtp();
        const otpHash = await hashOtp(otp);

        await insertReturningId(
            `INSERT INTO AUTH_OTP (USER_ID, OTP_HASH, PURPOSE, EXPIRES_AT)
             VALUES (:userId, :otpHash, :purpose, SYSTIMESTAMP + INTERVAL '${OTP_TTL_MINUTES}' MINUTE)
             RETURNING OTP_ID INTO :newId`,
            { userId, otpHash, purpose }
        );

        await sendOtpEmail(email, otp, purpose);
        return { cooldown: false };
    },

    /**
     * Verifies a submitted code against the newest unused, unexpired OTP
     * for this user+purpose. Every outcome (wrong code, expired, too many
     * attempts, none exists) returns a distinct reason so the controller
     * can give an honest, specific error — never a raw exception.
     */
    verifyOtp: async (userId, purpose, submittedOtp) => {
        const result = await executeQuery(
            `SELECT OTP_ID, OTP_HASH, EXPIRES_AT, ATTEMPT_COUNT, MAX_ATTEMPTS
             FROM AUTH_OTP
             WHERE USER_ID = :userId AND PURPOSE = :purpose AND IS_USED = 0
             ORDER BY OTP_ID DESC FETCH FIRST 1 ROWS ONLY`,
            { userId, purpose }
        );

        const row = result.rows[0];
        if (!row) return { ok: false, reason: 'NO_ACTIVE_OTP' };

        if (new Date(row.EXPIRES_AT).getTime() < Date.now()) {
            return { ok: false, reason: 'EXPIRED' };
        }

        if (row.ATTEMPT_COUNT >= row.MAX_ATTEMPTS) {
            return { ok: false, reason: 'TOO_MANY_ATTEMPTS' };
        }

        const matches = await compareOtp(submittedOtp, row.OTP_HASH);

        if (!matches) {
            await executeQuery(
                `UPDATE AUTH_OTP SET ATTEMPT_COUNT = ATTEMPT_COUNT + 1 WHERE OTP_ID = :otpId`,
                { otpId: row.OTP_ID }
            );
            return { ok: false, reason: 'INCORRECT' };
        }

        await executeQuery(`UPDATE AUTH_OTP SET IS_USED = 1 WHERE OTP_ID = :otpId`, { otpId: row.OTP_ID });
        return { ok: true };
    },
};

module.exports = AuthOtpModel;
