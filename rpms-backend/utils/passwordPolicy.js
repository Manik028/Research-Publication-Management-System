/**
 * Shared password policy — used by both registration and password reset,
 * so the rule lives in exactly one place instead of drifting apart.
 *
 * Minimum length + one of each character class. Deliberately NOT requiring
 * a password-history check or an external "common password" list — the
 * master plan explicitly says not to make the policy unnecessarily
 * annoying, and those two add real complexity for a course project.
 */
const MIN_LENGTH = 8;

function validatePassword(password) {
    const value = String(password || '');

    if (value.length < MIN_LENGTH) {
        return { valid: false, message: `Password must be at least ${MIN_LENGTH} characters.` };
    }
    if (!/[a-z]/.test(value)) {
        return { valid: false, message: 'Password must include at least one lowercase letter.' };
    }
    if (!/[A-Z]/.test(value)) {
        return { valid: false, message: 'Password must include at least one uppercase letter.' };
    }
    if (!/[0-9]/.test(value)) {
        return { valid: false, message: 'Password must include at least one number.' };
    }
    if (!/[^A-Za-z0-9]/.test(value)) {
        return { valid: false, message: 'Password must include at least one special character.' };
    }

    return { valid: true, message: null };
}

module.exports = { validatePassword, MIN_LENGTH };
