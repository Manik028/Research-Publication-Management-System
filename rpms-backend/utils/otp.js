const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * 6-digit OTP using crypto.randomInt (cryptographically secure), NOT
 * Math.random() — the master plan is explicit that OTPs must not use a
 * predictable generator.
 */
function generateOtp() {
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

/** OTPs are hashed with bcrypt before storage, exactly like passwords —
 * the raw 6-digit code never touches the database in any column. */
async function hashOtp(otp) {
    return bcrypt.hash(otp, 10);
}

async function compareOtp(otp, hash) {
    return bcrypt.compare(String(otp), hash);
}

module.exports = { generateOtp, hashOtp, compareOtp };
