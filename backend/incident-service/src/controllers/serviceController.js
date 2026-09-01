import Service, { SERVICE_STATUSES } from '../models/Service.js';
import { getUserById } from '../clients/userServiceClient.js';
import { ServiceClientError } from '../lib/internalHttp.js';

function toPublicService(service) {
    return {
        id: service.id,
        name: service.name,
        description: service.description ?? null,
        status: service.status,
        owner_id: service.owner_id ?? null,
        uptime: service.uptime ?? null,
        created_at: service.createdAt,
        updated_at: service.updatedAt
    };
}

function parseNumericId(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    if (!/^\d+$/.test(String(value).trim())) {
        return null;
    }

    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        return null;
    }

    return id;
}

function parseUptime(value) {
    if (value === undefined || value === null || value === '') {
        return { missing: true };
    }

    const uptime = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(uptime) || uptime < 0) {
        return { error: 'Invalid uptime' };
    }

    return { uptime };
}

function parseStatus(value) {
    if (value === undefined) {
        return {};
    }

    if (!SERVICE_STATUSES.includes(value)) {
        return { error: 'Invalid status. Must be operational, degraded, or down' };
    }

    return { status: value };
}

function identityFrom(req) {
    return {
        userId: req.userId,
        userRole: req.userRole,
        userName: req.userName
    };
}

async function findOwner(owner_id, req) {
    if (owner_id === undefined || owner_id === null || owner_id === '') {
        return { missing: true };
    }

    const numericId = Number(owner_id);
    const isNumericId =
        Number.isInteger(numericId) &&
        numericId > 0 &&
        String(numericId) === String(owner_id).trim();

    if (!isNumericId) {
        return { error: 'Invalid owner_id' };
    }

    try {
        const owner = await getUserById(numericId, identityFrom(req));
        return { owner };
    } catch (error) {
        if (error instanceof ServiceClientError && error.status === 404) {
            return { error: 'Owner not found' };
        }

        throw error;
    }
}

async function getServices(req, res) {
    try {
        const services = await Service.find().sort({ id: 1 });

        for (const service of services) {
            await service.ensureNumericId();
        }

        services.sort((a, b) => a.id - b.id);

        res.status(200).json(services.map(toPublicService));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

async function getServiceById(req, res) {
    try {
        const id = parseNumericId(req.params.id);
        if (id === null) {
            return res.status(400).json({ message: 'Invalid service ID' });
        }

        const service = await Service.findOne({ id });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        await service.ensureNumericId();
        res.status(200).json(toPublicService(service));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

async function createService(req, res) {
    try {
        const { name, description, status, owner_id, uptime } = req.body;
        const trimmedName = typeof name === 'string' ? name.trim() : '';

        if (!trimmedName) {
            return res.status(400).json({
                message: 'Name is required'
            });
        }

        const parsedUptime = parseUptime(uptime);
        if (parsedUptime.missing) {
            return res.status(400).json({
                message: 'Uptime is required'
            });
        }
        if (parsedUptime.error) {
            return res.status(400).json({
                message: parsedUptime.error
            });
        }

        const parsedStatus = parseStatus(status);
        if (parsedStatus.error) {
            return res.status(400).json({
                message: parsedStatus.error
            });
        }

        const ownerResult = await findOwner(owner_id, req);
        if (ownerResult.missing) {
            return res.status(400).json({
                message: 'Owner is required'
            });
        }
        if (ownerResult.error) {
            return res.status(400).json({
                message: ownerResult.error
            });
        }

        const service = await Service.create({
            name: trimmedName,
            description: description ? String(description) : null,
            status: parsedStatus.status,
            owner_id: ownerResult.owner.id,
            uptime: parsedUptime.uptime
        });

        res.status(201).json(toPublicService(service));
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

async function updateService(req, res) {
    try {
        const id = parseNumericId(req.params.id);

        if (id === null) {
            return res.status(400).json({
                message: 'Invalid service ID'
            });
        }

        const service = await Service.findOne({ id });

        if (!service) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }

        const { name, description, status, owner_id, uptime } = req.body;

        if (name !== undefined) {
            const trimmedName = typeof name === 'string' ? name.trim() : '';
            if (!trimmedName) {
                return res.status(400).json({
                    message: 'Name is required'
                });
            }
            service.name = trimmedName;
        }

        if (description !== undefined) {
            service.description = description ? String(description) : null;
        }

        if (status !== undefined) {
            const parsedStatus = parseStatus(status);
            if (parsedStatus.error) {
                return res.status(400).json({
                    message: parsedStatus.error
                });
            }
            service.status = parsedStatus.status;
        }

        if (uptime !== undefined) {
            const parsedUptime = parseUptime(uptime);
            if (parsedUptime.missing || parsedUptime.error) {
                return res.status(400).json({
                    message: parsedUptime.error || 'Invalid uptime'
                });
            }
            service.uptime = parsedUptime.uptime;
        }

        if (owner_id !== undefined) {
            const ownerResult = await findOwner(owner_id, req);
            if (ownerResult.missing || ownerResult.error) {
                return res.status(400).json({
                    message: ownerResult.error || 'Owner is required'
                });
            }
            service.owner_id = ownerResult.owner.id;
        }

        await service.save();

        res.status(200).json(toPublicService(service));
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

async function deleteService(req, res) {
    try {
        const id = parseNumericId(req.params.id);

        if (id === null) {
            return res.status(400).json({
                message: 'Invalid service ID'
            });
        }

        const service = await Service.findOneAndDelete({ id });

        if (!service) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }

        res.status(200).json({
            message: 'Service deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

export {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService
};
