const ProjectModel = require('../models/projectModel');

const getProjects = async (req, res) => {
    try {
        const projects = await ProjectModel.getAllProjects();
        return res.status(200).json({ success: true, data: projects });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addProject = async (req, res) => {
    try {
        const { title, status, timeline, budget } = req.body || {};
        const managerId = req.user.id;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Project title is required' });
        }

        const parsedBudget = budget === undefined || budget === null || budget === ''
            ? null
            : Number(budget);

        if (parsedBudget !== null && Number.isNaN(parsedBudget)) {
            return res.status(400).json({ success: false, message: 'Budget must be a number' });
        }

        const newId = await ProjectModel.createProject(
            String(title).trim(),
            status || 'Planned',
            timeline ? String(timeline).trim() : null,
            parsedBudget,
            managerId
        );

        const created = await ProjectModel.getProjectById(newId);

        return res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: created,
        });
    } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteProject = async (req, res) => {
    try {
        const projectId = Number(req.params.id);
        const managerId = Number(req.user.id);

        const project = await ProjectModel.getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (Number(project.MANAGER_ID) !== managerId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: '403 Forbidden: You are not the manager of this project.',
            });
        }

        await ProjectModel.deleteProject(projectId);
        return res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getProjects, addProject, deleteProject };
