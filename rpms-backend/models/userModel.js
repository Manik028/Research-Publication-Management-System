const { executeQuery, insertReturningId } = require('../config/db');

const USER_SELECT = `
    SELECT u.USER_ID       AS ID,
           u.FULL_NAME,
           u.EMAIL,
           u.DEPARTMENT,
           u.ORCID,
           u.TWO_FACTOR_ENABLED,
           u.ROLE_ID,
           r.ROLE_NAME     AS ROLE
    FROM "USER" u
    LEFT JOIN "ROLE" r ON u.ROLE_ID = r.ROLE_ID
`;

const UserModel = {
    // Includes the password hash - only used by the login flow.
    getUserByEmail: async (email) => {
        const sql = `
            SELECT u.USER_ID AS ID, u.FULL_NAME, u.EMAIL, u.PASSWORD, u.DEPARTMENT,
                   u.ORCID, u.TWO_FACTOR_ENABLED, u.ROLE_ID, r.ROLE_NAME AS ROLE
            FROM "USER" u
            LEFT JOIN "ROLE" r ON u.ROLE_ID = r.ROLE_ID
            WHERE LOWER(u.EMAIL) = LOWER(:email)
        `;
        const result = await executeQuery(sql, { email });
        return result.rows[0];
    },

    getAllUsers: async () => {
        const result = await executeQuery(`${USER_SELECT} ORDER BY u.FULL_NAME`);
        return result.rows;
    },

    getUserById: async (userId) => {
        const result = await executeQuery(
            `${USER_SELECT} WHERE u.USER_ID = :userId`,
            { userId }
        );
        return result.rows[0];
    },

    createUser: async (fullName, email, hashedPassword, department, orcid, roleId) => {
        const sql = `
            INSERT INTO "USER" (FULL_NAME, EMAIL, PASSWORD, DEPARTMENT, ORCID, ROLE_ID)
            VALUES (:fullName, :email, :password, :department, :orcid, :roleId)
            RETURNING USER_ID INTO :newId
        `;
        return insertReturningId(sql, {
            fullName,
            email,
            password: hashedPassword,
            department: department || null,
            orcid: orcid || null,
            roleId,
        });
    },

    /**
     * Partial update. Any field passed as undefined is left untouched, which is
     * what stops the Settings page (which only submits name + email) from
     * blanking out DEPARTMENT and ORCID.
     */
    updateUser: async (userId, { fullName, email, department, orcid }) => {
        const sql = `
            UPDATE "USER"
            SET FULL_NAME  = NVL(:fullName, FULL_NAME),
                EMAIL      = NVL(:email, EMAIL),
                DEPARTMENT = CASE WHEN :departmentProvided = 1 THEN :department ELSE DEPARTMENT END,
                ORCID      = CASE WHEN :orcidProvided = 1 THEN :orcid ELSE ORCID END
            WHERE USER_ID = :userId
        `;
        const result = await executeQuery(sql, {
            fullName: fullName === undefined ? null : fullName,
            email: email === undefined ? null : email,
            departmentProvided: department === undefined ? 0 : 1,
            department: department === undefined ? null : department,
            orcidProvided: orcid === undefined ? 0 : 1,
            orcid: orcid === undefined ? null : orcid,
            userId,
        });
        return result.rowsAffected;
    },

    getRoleByName: async (roleName) => {
        const sql = `SELECT ROLE_ID, ROLE_NAME FROM "ROLE" WHERE UPPER(ROLE_NAME) = UPPER(:roleName)`;
        const result = await executeQuery(sql, { roleName });
        return result.rows[0];
    },

    getAllRoles: async () => {
        const result = await executeQuery(
            `SELECT ROLE_ID, ROLE_NAME, DESCRIPTION FROM "ROLE" ORDER BY ROLE_ID`
        );
        return result.rows;
    },
};

module.exports = UserModel;
