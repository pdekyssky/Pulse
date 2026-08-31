import Incident, { INCIDENT_STATUSES, INCIDENT_SEVERITIES } from '../models/Incidents.js';
import IncidentEvent from '../models/IncidentEvent.js';
import IncidentComment from '../models/IncidentComment.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import Alert from '../models/Alert.js';
import {
    createIncidentNotification,
    toUserRefId
} from './notificationController.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 6;


// Mapping of sort field names to database field names
const SORT_FIELDS = {
    started_at: 'startedAt',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    severity: 'severity',
    status: 'status'
};

// Helper function to convert a date to ISO string
// Frontend expects dates in ISO string format but the database stores them as Date objects
function toIso(value) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

// Public integer id from a populated ref (service, user, author).
// Returns null if the ref is missing, not populated, or has no numeric id.
function numericRefId(doc) {
    if (doc && typeof doc === 'object' && typeof doc.id === 'number') {
        return doc.id;
    }

    return null;
}

//Create a object containing the fields which frontend expects
function toPublicIncident(incident) {
    return {
        id: incident.id,
        title: incident.title,
        description: incident.description ?? null,
        status: incident.status,
        severity: incident.severity,
        service_id: numericRefId(incident.service),
        created_by_id: numericRefId(incident.createdBy),
        assigned_to_id: numericRefId(incident.assignedTo),
        started_at: toIso(incident.startedAt) ?? toIso(incident.createdAt),
        resolved_at: toIso(incident.resolvedAt),
        created_at: toIso(incident.createdAt),
        updated_at: toIso(incident.updatedAt)
    };
}

//Change incoming string ids to numeric ids and validate them
function parseNumericId(value) {
    if (value === undefined || value === null || value === '') {
        return { missing: true };
    }

    if (!/^\d+$/.test(String(value).trim())) {
        return { error: true };
    }

    const id = Number(value);

    if (!Number.isInteger(id) || id < 1) {
        return { error: true };
    }

    return { id };
}

//Change incoming string page and page_size to numbers and validate them
function parsePositiveInt(value, fallback) {
    if (value === undefined || value === null || value === '') {
        return { value: fallback };
    }

    if (!/^\d+$/.test(String(value).trim())) {
        return { error: true };
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        return { error: true };
    }

    return { value: parsed };
}

// Escape regex metacharacters so user search input is treated literally.
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// populate incident document with the service, createdBy, and assignedTo fields
function populateIncident(query) {
    return query
        .populate({ path: 'service', select: 'id' })
        .populate({ path: 'createdBy', select: 'id' })
        .populate({ path: 'assignedTo', select: 'id' });
}

// Ensure the incident document has numeric ids for the service, createdBy, and assignedTo fields
async function ensureIncidentIds(incident) {
    await incident.ensureNumericId();

    if (incident.service && typeof incident.service.ensureNumericId === 'function') {
        await incident.service.ensureNumericId();
    }

    if (incident.createdBy && typeof incident.createdBy.ensureNumericId === 'function') {
        await incident.createdBy.ensureNumericId();
    }

    if (incident.assignedTo && typeof incident.assignedTo.ensureNumericId === 'function') {
        await incident.assignedTo.ensureNumericId();
    }

    return incident;
}

// Parse an optional date field.
// Returns an object with a missing property if the value is undefined.
// Returns an object with an error property if the value is not a valid date.
// Returns an object with a value property if the value is a valid date.
function parseOptionalDate(value, fieldName) {
    if (value === undefined) {
        return { missing: true };
    }

    if (value === null || value === '') {
        return { value: null };
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return { error: `Invalid ${fieldName}` };
    }

    return { value: date };
}

//   find a service by its numeric id and return the service document.
async function findServiceByNumericId(serviceIdValue) {
    const parsed = parseNumericId(serviceIdValue);

    if (parsed.missing || parsed.error) {
        return { error: 'Invalid service_id' };
    }

    const service = await Service.findOne({ id: parsed.id }).select('_id id');
    if (!service) {
        return { error: 'Service not found' };
    }

    await service.ensureNumericId();
    return { service };
}

//find a user by its numeric id and return the user document
async function findUserByNumericId(userIdValue, fieldName) {
    if (userIdValue === null) {
        return { user: null };
    }

    //parse the numeric id
    const parsed = parseNumericId(userIdValue);
    if (parsed.missing || parsed.error) {
        return { error: `Invalid ${fieldName}` };
    }

    //find the user by the numeric id and return only _id and id fields
    const user = await User.findOne({ id: parsed.id }).select('_id id');
    if (!user) {
        return { error: 'User not found' };
    }

    if (typeof user.id !== 'number') {
        await user.ensureNumericId();
    }

    return { user };
}

// Load a public incident object by its MongoDB ID and convert it to the public incident object expected by the frontend
async function loadPublicIncident(mongoId) {
    //Load incident document by its ID and populate the service, createdBy, and assignedTo fields
    const incident = await populateIncident(Incident.findById(mongoId));
    //Ensure the incident document has numeric ids for the service, createdBy, and assignedTo fields
    await ensureIncidentIds(incident);
    //Convert the incident document to the public incident object
    return toPublicIncident(incident);
}

// Build a filter object for the incident list query
async function buildListFilter(query) {
    const filter = {};

    //Filter by status
    if (query.status !== undefined && query.status !== '') {
        if (!INCIDENT_STATUSES.includes(query.status)) {
            return { error: 'Invalid status' };
        }
        filter.status = query.status;
    }

    //Filter by severity
    if (query.severity !== undefined && query.severity !== '') {
        if (!INCIDENT_SEVERITIES.includes(query.severity)) {
            return { error: 'Invalid severity' };
        }
        filter.severity = query.severity;
    }

    //Parse numeric id and filter by its id
    if (query.service_id !== undefined && query.service_id !== '') {
        const parsed = parseNumericId(query.service_id);
        if (parsed.missing || parsed.error) {
            return { error: 'Invalid service_id' };
        }

        //Find the service by the numeric id and return only _id field
        const service = await Service.findOne({ id: parsed.id }).select('_id');
        if (!service) {
            return { empty: true };
        }
        filter.service = service._id;
    }

    //Parse numeric id and filter by its id
    if (query.assigned_to_id !== undefined && query.assigned_to_id !== '') {
        const parsed = parseNumericId(query.assigned_to_id);
        if (parsed.missing || parsed.error) {
            return { error: 'Invalid assigned_to_id' };
        }

        //Find the user by the numeric id and return only _id field
        const user = await User.findOne({ id: parsed.id }).select('_id');
        if (!user) {
            return { empty: true };
        }
        filter.assignedTo = user._id;
    }

    //Filter by search
    if (query.search !== undefined && String(query.search).trim().length > 0) {
        const search = String(query.search).trim();
        const incMatch = search.match(/^inc-(\d+)$/i);
        //Create an array to store the search clauses
        const searchClauses = [];

        //If the search is an incident id, add the incident id to the search clauses
        if (incMatch) {
            searchClauses.push({ id: Number(incMatch[1]) });
        }
        //If the search is a numeric id, add the numeric id to the search clauses
        else if (/^\d+$/.test(search)) {
            searchClauses.push({ id: Number(search) });
        }

        //Create a regex to search the title and description
        const regex = new RegExp(escapeRegex(search), 'i');
        //Add the title and description to the search clauses
        searchClauses.push({ title: regex }, { description: regex });
        filter.$or = searchClauses;
    }

    return { filter };
}

//Return an empty page object with the page, page_size, total, and total_pages fields
function emptyPage(page, pageSize) {
    return {
        items: [],
        page,
        page_size: pageSize,
        total: 0,
        total_pages: 0
    };
}

//Get the incidents that match the filter and return them in a page object
const getIncidents = async (req, res) => {
    try {
        //Parse the page and page_size query parameters and return an object with a missing or error property if the value is not a valid positive integer
        const pageResult = parsePositiveInt(req.query.page, DEFAULT_PAGE);
        const pageSizeResult = parsePositiveInt(req.query.page_size, DEFAULT_PAGE_SIZE);

        if (pageResult.error) {
            return res.status(400).json({
                message: 'Invalid page'
            });
        }

        if (pageSizeResult.error) {
            return res.status(400).json({
                message: 'Invalid page_size'
            });
        }
        //Parse the page and page_size query parameters and return an object with a value property if the value is a valid positive integer
        const page = pageResult.value;
        const pageSize = pageSizeResult.value;

        //Initialize sorting parameters with the default values
        let sortField = 'startedAt';
        let sortDirection = -1;

        //If the sort_by query parameter is provided, map the sort_by value to the corresponding field name and set the sortField variable
        if (req.query.sort_by !== undefined && req.query.sort_by !== '') {
            const mapped = SORT_FIELDS[req.query.sort_by];
            if (!mapped) {
                return res.status(400).json({
                    message: 'Invalid sort_by'
                });
            }
            sortField = mapped;
        }

        //If the sort_order query parameter is provided, set the sortDirection variable to 1 if the sort_order is asc and -1 if the sort_order is desc
        if (req.query.sort_order !== undefined && req.query.sort_order !== '') {
            if (req.query.sort_order !== 'asc' && req.query.sort_order !== 'desc') {
                return res.status(400).json({
                    message: 'Invalid sort_order'
                });
            }
            sortDirection = req.query.sort_order === 'asc' ? 1 : -1;
        }

        //Build a filter object for the incident list query
        const listFilter = await buildListFilter(req.query);

        //Return an error message if the filter is invalid
        if (listFilter.error) {
            return res.status(400).json({
                message: listFilter.error
            });
        }
        //Return an empty page object if the filter is empty
        if (listFilter.empty) {
            return res.status(200).json(emptyPage(page, pageSize));
        }
        //Count the total number of incidents that match the filter
        const total = await Incident.countDocuments(listFilter.filter);
        //Calculate the total number of pages
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        //Calculate the number of incidents to skip
        const skip = (page - 1) * pageSize;

        //Find the incidents that match the filter and populate the service, createdBy, and assignedTo fields
        const incidents = await populateIncident(
            Incident.find(listFilter.filter)
                .sort({ [sortField]: sortDirection, createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
        );

        //Ensure the incident document has numeric ids for the service, createdBy, and assignedTo fields
        for (const incident of incidents) {
            await ensureIncidentIds(incident);
        }

        //Return the incidents in a page object
        res.status(200).json({
            items: incidents.map(toPublicIncident),
            page,
            page_size: pageSize,
            total,
            total_pages: totalPages
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

//Get an incident by its numeric id and return the incident document
const getIncidentById = async (req, res) => {
    try {
        //Parse the numeric id and return an object with a missing or error property if the value is not a valid positive integer
        const parsed = parseNumericId(req.params.id);

        if (parsed.missing || parsed.error) {
            return res.status(400).json({
                message: 'Invalid incident ID'
            });
        }

        //Find the incident by the numeric id and populate the service, createdBy, and assignedTo fields
        const incident = await populateIncident(Incident.findOne({ id: parsed.id }));

        if (!incident) {
            return res.status(404).json({
                message: 'Incident not found'
            });
        }
        //Ensure the incident document has numeric ids for the service, createdBy, and assignedTo fields
        await ensureIncidentIds(incident);

        res.status(200).json(toPublicIncident(incident));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

//Find an incident by its numeric id and return the incident document
async function findIncidentByParamId(req, res) {
    const parsed = parseNumericId(req.params.id);

    if (parsed.missing || parsed.error) {
        res.status(400).json({
            message: 'Invalid incident ID'
        });
        return null;
    }

    const incident = await Incident.findOne({ id: parsed.id });

    if (!incident) {
        res.status(404).json({
            message: 'Incident not found'
        });
        return null;
    }

    await incident.ensureNumericId();
    return incident;
}

//Convert an incident event document to a public incident event object
function toPublicEvent(event, incidentId) {
    return {
        id: event.id,
        incident_id: incidentId,
        author_id: numericRefId(event.author),
        event_type: event.eventType,
        message: event.message,
        created_at: toIso(event.createdAt)
    };
}

//Convert an incident comment document to a public incident comment object
function toPublicComment(comment, incidentId) {
    return {
        id: comment.id,
        incident_id: incidentId,
        author_id: numericRefId(comment.author),
        content: comment.content,
        created_at: toIso(comment.createdAt),
        updated_at: toIso(comment.updatedAt)
    };
}

//Ensure the author document has a numeric id
async function ensureAuthorId(doc) {
    await doc.ensureNumericId();

    if (doc.author && typeof doc.author.ensureNumericId === 'function') {
        await doc.author.ensureNumericId();
    }

    return doc;
}

//Get the incident events that match the incident id and return them in a public incident event object
const getIncidentEvents = async (req, res) => {
    try {
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        //Find the incident events that match the incident id and populate the author field
        const events = await IncidentEvent.find({ incident: incident._id })
            .sort({ createdAt: 1, id: 1 })
            .populate({ path: 'author', select: 'id' });

        //Ensure the author document has a numeric id
        for (const event of events) {
            await ensureAuthorId(event);
        }

        res.status(200).json(events.map((event) => toPublicEvent(event, incident.id)));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

//Get the incident comments that match the incident id and return them in a public incident comment object
const getIncidentComments = async (req, res) => {
    try {
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        //Find the incident comments that match the incident id and populate the author field
        const comments = await IncidentComment.find({ incident: incident._id })
            .sort({ createdAt: 1, id: 1 })
            .populate({ path: 'author', select: 'id' });

        for (const comment of comments) {
            await ensureAuthorId(comment);
        }

        res.status(200).json(comments.map((comment) => toPublicComment(comment, incident.id)));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

//Trim a required string and return the trimmed string
function trimRequiredString(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
}

//Check if the user can modify the comment
function canModifyComment(comment, user) {
    if (user.role === 'admin') {
        return true;
    }

    return String(comment.author?._id || comment.author) === String(user._id);
}

//Find a comment by its numeric id and return the comment document
async function findCommentForIncident(req, res, incident) {
    const parsed = parseNumericId(req.params.commentId);

    if (parsed.missing || parsed.error) {
        res.status(400).json({
            message: 'Invalid comment ID'
        });
        return null;
    }

    //Find the comment by the numeric id and the incident id and populate the author field
    const comment = await IncidentComment.findOne({
        id: parsed.id,
        incident: incident._id
    }).populate({ path: 'author', select: 'id' });

    if (!comment) {
        res.status(404).json({
            message: 'Comment not found'
        });
        return null;
    }

    await ensureAuthorId(comment);
    return comment;
}

//Load a public incident event object
async function loadPublicEvent(eventMongoId, incidentId) {
    const event = await IncidentEvent.findById(eventMongoId)
        .populate({ path: 'author', select: 'id' });
    await ensureAuthorId(event);
    return toPublicEvent(event, incidentId);
}

//Load a public incident comment object
async function loadPublicComment(commentMongoId, incidentId) {
    const comment = await IncidentComment.findById(commentMongoId)
        .populate({ path: 'author', select: 'id' });
    await ensureAuthorId(comment);
    return toPublicComment(comment, incidentId);
}

//Create an incident event and return the incident event document
const createIncidentEvent = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        //Find the incident by the numeric id and return an error message if the incident is not found
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        //Trim the event type and message query parameters and return the trimmed string
        const eventType = trimRequiredString(req.body.event_type);
        const message = trimRequiredString(req.body.message);

        //Return an error message if the event type is not provided
        if (!eventType) {
            return res.status(400).json({
                message: 'Event type is required'
            });
        }

        if (!message) {
            return res.status(400).json({
                message: 'Message is required'
            });
        }

        //Create an incident event document
        const event = await IncidentEvent.create({
            incident: incident._id,
            author: req.user._id,
            eventType,
            message
        });

        //Get the assignee id and the author id and create an incident notification if the assignee id is not the same as the author id
        const assigneeId = toUserRefId(incident.assignedTo);
        const authorId = toUserRefId(req.user._id);
        if (assigneeId && assigneeId !== authorId) {
            //Create an incident notification
            await createIncidentNotification({
                recipientUserId: incident.assignedTo,
                type: 'incident_event',
                title: 'New investigation event',
                message: `${req.user.name} added an event on INC-${incident.id} "${incident.title}".`,
                incident
            });
        }

        res.status(201).json(await loadPublicEvent(event._id, incident.id));
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
};

//Create an incident comment and return the incident comment document
const createIncidentComment = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        //Find the incident by the numeric id and return an error message if the incident is not found
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }
        
        //Trim the content query parameter and return the trimmed string
        const content = trimRequiredString(req.body.content);
        if (!content) {
            return res.status(400).json({
                message: 'Content is required'
            });
        }

        //Create an incident comment document
        const comment = await IncidentComment.create({
            incident: incident._id,
            author: req.user._id,
            content
        });

        //Get the assignee id and the author id and create an incident notification if the assignee id is not the same as the author id
        const assigneeId = toUserRefId(incident.assignedTo);
        const authorId = toUserRefId(req.user._id);
        if (assigneeId && assigneeId !== authorId) {
            await createIncidentNotification({
                recipientUserId: incident.assignedTo,
                type: 'incident_comment',
                title: 'New comment on incident',
                message: `${req.user.name} commented on INC-${incident.id} "${incident.title}".`,
                incident
            });
        }

        //Load the public incident comment document and return it in a public incident comment object
        res.status(201).json(await loadPublicComment(comment._id, incident.id));
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
};

//Update an incident comment and return the updated incident comment document
const updateIncidentComment = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        //Find the incident by the numeric id and return an error message if the incident is not found
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        //Find the comment by the numeric id and the incident id and return an error message if the comment is not found
        const comment = await findCommentForIncident(req, res, incident);
        if (!comment) {
            return;
        }

        //Check if the user can modify the comment and return an error message if the user cannot modify the comment
        if (!canModifyComment(comment, req.user)) {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }

        //Trim the content query parameter and return the trimmed string
        const content = trimRequiredString(req.body.content);
        if (!content) {
            return res.status(400).json({
                message: 'Content is required'
            });
        }

        //Update the content of the comment and save the comment document
        comment.content = content;
        await comment.save({ validateModifiedOnly: true });

        res.status(200).json(await loadPublicComment(comment._id, incident.id));
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
};

//Delete an incident comment and return a success message
const deleteIncidentComment = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        //Find the incident by the numeric id and return an error message if the incident is not found
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        //Find the comment by the numeric id and the incident id and return an error message if the comment is not found
        const comment = await findCommentForIncident(req, res, incident);
        if (!comment) {
            return;
        }

        //Check if the user can modify the comment and return an error message if the user cannot modify the comment
        if (!canModifyComment(comment, req.user)) {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }

        //Delete the comment and return a success message
        await comment.deleteOne();

        res.status(200).json({
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

//Create an incident and return the incident document
const createIncident = async (req, res) => {
    try {
        //Check if the user is authorized and return an error message if the user is not authorized
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }

        //Trim the title query parameter and return the trimmed string
        const { title, description, severity, service_id } = req.body;
        const trimmedTitle = typeof title === 'string' ? title.trim() : '';

        //Return an error message if the title is not provided
        if (!trimmedTitle) {
            return res.status(400).json({
                message: 'Title is required'
            });
        }

        //Return an error message if the description is not provided
        if (description === undefined) {
            return res.status(400).json({
                message: 'Description is required'
            });
        }

        //Return an error message if the description is not a string
        if (description !== null && typeof description !== 'string') {
            return res.status(400).json({
                message: 'Invalid description'
            });
        }

        //Return an error message if the severity is not valid
        if (!INCIDENT_SEVERITIES.includes(severity)) {
            return res.status(400).json({
                message: 'Invalid severity. Must be critical, high, medium, or low'
            });
        }

        //Find the service by the numeric id and return an error message if the service is not found
        const serviceResult = await findServiceByNumericId(service_id);
        if (serviceResult.error) {
            return res.status(400).json({
                message: serviceResult.error
            });
        }

        //Parse the started_at query parameter and return an error message if the started_at is not valid
        const startedAtResult = parseOptionalDate(req.body.started_at, 'started_at');
        if (startedAtResult.error) {
            return res.status(400).json({
                message: startedAtResult.error
            });
        }

        //Create an incident document
        const incident = await Incident.create({
            title: trimmedTitle,
            description: typeof description === 'string' && description.trim() ? description.trim() : null,
            status: 'investigating',
            severity,
            service: serviceResult.service._id,
            createdBy: req.user._id,
            assignedTo: null,
            startedAt: startedAtResult.missing || startedAtResult.value === null
                ? new Date()
                : startedAtResult.value,
            resolvedAt: null
        });

        res.status(201).json(await loadPublicIncident(incident._id));
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
};

//Update an incident and return the updated incident document
const updateIncident = async (req, res) => {
    try {
        //Find the incident by the numeric id and return an error message if the incident is not found
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        //Return an error message if the created_by_id is changed
        //Check if the created_by_id is provided and return an error message if it is we cant change creaator by this controller 
        if (Object.prototype.hasOwnProperty.call(req.body, 'created_by_id')) {
            return res.status(400).json({
                message: 'created_by_id cannot be changed'
            });
        }

        //Get the previous assignee id and the previous status
        const previousAssigneeId = toUserRefId(incident.assignedTo);
        const previousStatus = incident.status;

        //Trim the title, description, status, severity, service_id, assigned_to_id, started_at, and resolved_at query parameters and return the trimmed strings
        const {
            title,
            description,
            status,
            severity,
            service_id,
            assigned_to_id,
            started_at,
            resolved_at
        } = req.body;

        //Update the title of the incident if it is provided
        if (title !== undefined) {
            const trimmedTitle = typeof title === 'string' ? title.trim() : '';
            if (!trimmedTitle) {
                return res.status(400).json({
                    message: 'Title is required'
                });
            }
            incident.title = trimmedTitle;
        }

        //Update the description of the incident if it is provided
        if (description !== undefined) {
            if (description !== null && typeof description !== 'string') {
                return res.status(400).json({
                    message: 'Invalid description'
                });
            }
            incident.description = typeof description === 'string' && description.trim()
                ? description.trim()
                : null;
        }

        //Update the severity of the incident if it is provided
        if (severity !== undefined && severity !== null) {
            if (!INCIDENT_SEVERITIES.includes(severity)) {
                return res.status(400).json({
                    message: 'Invalid severity. Must be critical, high, medium, or low'
                });
            }
            incident.severity = severity;
        }

        //Update the service of the incident if it is provided
        if (service_id !== undefined) {
            if (service_id === null) {
                return res.status(400).json({
                    message: 'Invalid service_id'
                });
            }

            const serviceResult = await findServiceByNumericId(service_id);
            if (serviceResult.error) {
                return res.status(400).json({
                    message: serviceResult.error
                });
            }
            incident.service = serviceResult.service._id;
        }

        //Update the assigned_to_id of the incident if it is provided
        if (assigned_to_id !== undefined) {
            const userResult = await findUserByNumericId(assigned_to_id, 'assigned_to_id');
            if (userResult.error) {
                return res.status(400).json({
                    message: userResult.error
                });
            }
            incident.assignedTo = userResult.user ? userResult.user._id : null;
        }

        //Update the started_at of the incident if it is provided
        if (started_at !== undefined) {
            const startedAtResult = parseOptionalDate(started_at, 'started_at');
            if (startedAtResult.error) {
                return res.status(400).json({
                    message: startedAtResult.error
                });
            }
            if (startedAtResult.value) {
                incident.startedAt = startedAtResult.value;
            }
        }

        //Update the status of the incident if it is provided
        if (status !== undefined && status !== null) {
            if (!INCIDENT_STATUSES.includes(status)) {
                return res.status(400).json({
                    message: 'Invalid status. Must be investigating, identified, monitoring, or resolved'
                });
            }
            incident.status = status;
        }

        //Parse the resolved_at query parameter and return an error message if the resolved_at is not valid
        const resolvedAtResult = parseOptionalDate(resolved_at, 'resolved_at');
        if (resolvedAtResult.error) {
            return res.status(400).json({
                message: resolvedAtResult.error
            });
        }

        //Update the resolved_at of the incident if it is provided
        if (incident.status === 'resolved') {
            if (!resolvedAtResult.missing && resolvedAtResult.value) {
                incident.resolvedAt = resolvedAtResult.value;
            } else if (!incident.resolvedAt) {
                incident.resolvedAt = new Date();
            }
        } else if (previousStatus === 'resolved' && incident.status !== 'resolved') {
            incident.resolvedAt = null;
        } else if (!resolvedAtResult.missing && resolvedAtResult.value === null) {
            incident.resolvedAt = null;
        } else if (!resolvedAtResult.missing && resolvedAtResult.value) {
            incident.resolvedAt = resolvedAtResult.value;
        }

        await incident.save({ validateModifiedOnly: true });

        //Get the next assignee id and the actor id and check if the assignment has changed and the status has changed
        const nextAssigneeId = toUserRefId(incident.assignedTo);
        const actorId = toUserRefId(req.user?._id);
        const assignmentChanged = assigned_to_id !== undefined && nextAssigneeId !== previousAssigneeId;
        const statusChanged = incident.status !== previousStatus;

        //Create an incident notification if the assignment has changed and the next assignee id is not the same as the actor id
        if (assignmentChanged && nextAssigneeId && nextAssigneeId !== actorId) {
            await createIncidentNotification({
                recipientUserId: incident.assignedTo,
                type: 'incident_assigned',
                title: 'Incident assigned to you',
                message: `INC-${incident.id} "${incident.title}" was assigned to you.`,
                incident
            });
        }

        //Create an incident notification if the status has changed and the next assignee id is not the same as the actor id
        if (statusChanged && nextAssigneeId && nextAssigneeId !== actorId) {
            await createIncidentNotification({
                recipientUserId: incident.assignedTo,
                type: 'incident_status_changed',
                title: `Incident status changed to ${incident.status}`,
                message: `INC-${incident.id} "${incident.title}" is now ${incident.status}.`,
                incident
            });
        }

        //Load the public incident document and return it in a public incident object
        res.status(200).json(await loadPublicIncident(incident._id));
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
};

//Delete an incident and return a success message
const deleteIncident = async (req, res) => {
    try {
        const incident = await findIncidentByParamId(req, res);
        if (!incident) {
            return;
        }

        //Delete all the incident events, incident comments, and alerts associated with the incident
        await IncidentEvent.deleteMany({ incident: incident._id });
        await IncidentComment.deleteMany({ incident: incident._id });
        await Alert.updateMany(
            { incident: incident._id },
            { $set: { incident: null } }
        );

        //Delete the incident
        await incident.deleteOne();

        res.status(200).json({
            message: 'Incident deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

export { getIncidents, getIncidentById, getIncidentEvents, getIncidentComments, createIncident, updateIncident, deleteIncident, createIncidentEvent, createIncidentComment, updateIncidentComment, deleteIncidentComment };
