const { executeQuery, insertReturningId } = require('../config/db');

const PROJECT_SELECT = `
    SELECT p.PROJECT_ID  AS ID,
           p.TITLE,
           p.STATUS,
           p.TIMELINE,
           p.BUDGET,
           p.MANAGER_ID,
           u.FULL_NAME   AS MANAGER_NAME
    FROM PROJECT p
    JOIN "USER" u ON p.MANAGER_ID = u.USER_ID
`;

const ProjectModel = {
    getAllProjects: async () => {
        const result = await executeQuery(`${PROJECT_SELECT} ORDER BY p.PROJECT_ID DESC`);
        return result.rows;
    },

    getProjectById: async (projectId) => {
        const result = await executeQuery(
            `${PROJECT_SELECT} WHERE p.PROJECT_ID = :projectId`,
            { projectId }
        );
        return result.rows[0];
    },

    createProject: async (title, status, timeline, budget, managerId) => {
        const sql = `
            INSERT INTO PROJECT (TITLE, STATUS, TIMELINE, BUDGET, MANAGER_ID)
            VALUES (:title, :status, :timeline, :budget, :managerId)
            RETURNING PROJECT_ID INTO :newId
        `;
        return insertReturningId(sql, {
            title,
            status: status || 'Planned',
            timeline: timeline || null,
            budget: budget === undefined || budget === null ? null : budget,
            managerId,
        });
    },

    updateProject: async (projectId, { title, status, timeline, budget }) => {
        const sql = `
            UPDATE PROJECT
            SET TITLE    = NVL(:title, TITLE),
                STATUS   = NVL(:status, STATUS),
                TIMELINE = NVL(:timeline, TIMELINE),
                BUDGET   = NVL(:budget, BUDGET)
            WHERE PROJECT_ID = :projectId
        `;
        const result = await executeQuery(sql, {
            title: title ?? null,
            status: status ?? null,
            timeline: timeline ?? null,
            budget: budget ?? null,
            projectId,
        });
        return result.rowsAffected;
    },

    deleteProject: async (projectId) => {
        const result = await executeQuery(
            `DELETE FROM PROJECT WHERE PROJECT_ID = :projectId`,
            { projectId }
        );
        return result.rowsAffected;
    },

    // ---- PROJECT MEMBERSHIP (Block 5 / PROJECT_MEMBER) --------------------

    getMembers: async (projectId) => {
        const result = await executeQuery(
            `SELECT pm.PROJECT_ID, pm.USER_ID, u.FULL_NAME, u.EMAIL,
                    pm.MEMBER_ROLE, pm.JOIN_DATE
             FROM PROJECT_MEMBER pm
             JOIN "USER" u ON u.USER_ID = pm.USER_ID
             WHERE pm.PROJECT_ID = :projectId
             ORDER BY pm.JOIN_DATE`,
            { projectId }
        );
        return result.rows;
    },

    // Calls ADD_PROJECT_MEMBER (database/procedures_functions.sql) instead
    // of a raw INSERT — the procedure validates the project and user both
    // exist before writing, and duplicate membership is still caught by
    // PROJECT_MEMBER's own composite primary key either way.
    addMember: async (projectId, userId, role) => {
        await executeQuery(
            `BEGIN ADD_PROJECT_MEMBER(:projectId, :userId, :role); END;`,
            { projectId, userId, role: role || 'Researcher' }
        );
    },

    removeMember: async (projectId, userId) => {
        const result = await executeQuery(
            `DELETE FROM PROJECT_MEMBER WHERE PROJECT_ID = :projectId AND USER_ID = :userId`,
            { projectId, userId }
        );
        return result.rowsAffected;
    },
};

module.exports = ProjectModel;
