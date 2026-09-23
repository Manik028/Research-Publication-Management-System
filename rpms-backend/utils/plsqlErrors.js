/**
 * Every custom business-rule error raised from PL/SQL in this project uses
 * RAISE_APPLICATION_ERROR(-20001 .. -20099, 'readable message') — see
 * database/procedures_functions.sql, transactions.sql. node-oracledb
 * surfaces these as a JS Error whose message looks like:
 *
 *   "ORA-20003: A reviewer cannot be assigned to review their own
 *    publication.\nORA-06512: at \"RPMS_APP.ASSIGN_REVIEWER\", line 24..."
 *
 * These are EXPECTED validation failures (bad input, business rule hit) —
 * they belong to the caller as a 400, not a 500. Anything outside the
 * -20001..-20099 range is a genuine unexpected server error and should
 * still be logged and returned as a 500.
 */
// Our own custom errors (RAISE_APPLICATION_ERROR -20001..-20099), plus the
// common Oracle constraint-violation codes a bad request can still trigger
// even after passing procedure-level checks (e.g. SUBMIT_REVIEW doesn't
// re-check the SCORE 1-10 range itself — the table's own CHECK constraint
// does, and that's ORA-02290, not one of our custom codes).
const CONSTRAINT_VIOLATION_CODES = new Set([
    1,     // ORA-00001 unique constraint violated
    1400,  // ORA-01400 cannot insert NULL
    2290,  // ORA-02290 check constraint violated
    2291,  // ORA-02291 integrity constraint violated (parent key not found)
]);

function isPlsqlBusinessError(err) {
    const num = err?.errorNum;
    if (typeof num !== 'number') return false;
    return (num >= 20001 && num <= 20099) || CONSTRAINT_VIOLATION_CODES.has(num);
}

/** Strips the ORA-06512 stack-trace lines, keeping just the message we wrote. */
function cleanPlsqlMessage(err) {
    const firstLine = String(err?.message || '').split('\n')[0];
    return firstLine.replace(/^ORA-\d+:\s*/, '').trim() || 'Request could not be completed.';
}

module.exports = { isPlsqlBusinessError, cleanPlsqlMessage };
