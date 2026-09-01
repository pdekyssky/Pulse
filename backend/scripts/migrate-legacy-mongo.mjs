/**
 * One-time copy from the legacy monolith database (`test`) into
 * pulse_users / pulse_incidents / pulse_alerts.
 *
 * Usage:
 *   SOURCE_MONGO_URI=... node backend/scripts/migrate-legacy-mongo.js
 */
import mongoose from 'mongoose';

function dbUri(base, name) {
    const url = new URL(base);
    url.pathname = `/${name}`;
    return url.toString();
}

function numericId(doc) {
    return typeof doc?.id === 'number' ? doc.id : null;
}

async function copyUsers(source, dest) {
    const users = await source.collection('users').find({}).toArray();
    if (users.length === 0) {
        console.log('No users to copy');
        return;
    }

    const docs = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        is_active: user.is_active !== false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }));

    await dest.collection('users').deleteMany({});
    await dest.collection('users').insertMany(docs);

    const maxId = Math.max(...docs.map((doc) => doc.id || 0), 0);
    await dest.collection('sequences').updateOne(
        { _id: 'user' },
        { $set: { seq: maxId } },
        { upsert: true }
    );
    console.log(`Copied ${docs.length} users (seq=${maxId})`);
}

async function copyIncidents(source, dest) {
    const [users, services, incidents, comments, events] = await Promise.all([
        source.collection('users').find({}).toArray(),
        source.collection('services').find({}).toArray(),
        source.collection('incidents').find({}).toArray(),
        source.collection('incidentcomments').find({}).toArray(),
        source.collection('incidentevents').find({}).toArray()
    ]);

    const userByOid = new Map(users.map((user) => [String(user._id), numericId(user)]));
    const serviceByOid = new Map(services.map((service) => [String(service._id), numericId(service)]));
    const incidentByOid = new Map(incidents.map((incident) => [String(incident._id), numericId(incident)]));

    const serviceDocs = services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description ?? null,
        status: service.status,
        owner_id: userByOid.get(String(service.owner)) ?? null,
        uptime: service.uptime,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
    })).filter((service) => typeof service.id === 'number' && typeof service.owner_id === 'number');

    const incidentDocs = incidents.map((incident) => ({
        id: incident.id,
        title: incident.title,
        description: incident.description ?? null,
        status: incident.status,
        severity: incident.severity,
        service_id: serviceByOid.get(String(incident.service)) ?? null,
        created_by_id: userByOid.get(String(incident.createdBy)) ?? null,
        assigned_to_id: incident.assignedTo ? (userByOid.get(String(incident.assignedTo)) ?? null) : null,
        startedAt: incident.startedAt,
        resolvedAt: incident.resolvedAt ?? null,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt
    })).filter((incident) => typeof incident.id === 'number' && typeof incident.service_id === 'number');

    const commentDocs = comments.map((comment) => ({
        id: comment.id,
        incident_id: incidentByOid.get(String(comment.incident)) ?? null,
        author_id: userByOid.get(String(comment.author)) ?? null,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
    })).filter((comment) => typeof comment.id === 'number' && typeof comment.incident_id === 'number');

    const eventDocs = events.map((event) => ({
        id: event.id,
        incident_id: incidentByOid.get(String(event.incident)) ?? null,
        author_id: userByOid.get(String(event.author)) ?? null,
        eventType: event.eventType,
        message: event.message,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
    })).filter((event) => typeof event.id === 'number' && typeof event.incident_id === 'number');

    await Promise.all([
        dest.collection('services').deleteMany({}),
        dest.collection('incidents').deleteMany({}),
        dest.collection('incidentcomments').deleteMany({}),
        dest.collection('incidentevents').deleteMany({})
    ]);

    if (serviceDocs.length) await dest.collection('services').insertMany(serviceDocs);
    if (incidentDocs.length) await dest.collection('incidents').insertMany(incidentDocs);
    if (commentDocs.length) await dest.collection('incidentcomments').insertMany(commentDocs);
    if (eventDocs.length) await dest.collection('incidentevents').insertMany(eventDocs);

    async function setSeq(name, docs) {
        const maxId = Math.max(0, ...docs.map((doc) => doc.id || 0));
        await dest.collection('sequences').updateOne(
            { _id: name },
            { $set: { seq: maxId } },
            { upsert: true }
        );
    }

    await setSeq('service', serviceDocs);
    await setSeq('incident', incidentDocs);
    await setSeq('incidentComment', commentDocs);
    await setSeq('incidentEvent', eventDocs);

    console.log(`Copied ${serviceDocs.length} services, ${incidentDocs.length} incidents, ${commentDocs.length} comments, ${eventDocs.length} events`);
}

async function copyAlerts(source, dest) {
    const [services, incidents, alerts] = await Promise.all([
        source.collection('services').find({}).toArray(),
        source.collection('incidents').find({}).toArray(),
        source.collection('alerts').find({}).toArray()
    ]);

    const serviceByOid = new Map(services.map((service) => [String(service._id), numericId(service)]));
    const incidentByOid = new Map(incidents.map((incident) => [String(incident._id), numericId(incident)]));

    const docs = alerts.map((alert) => ({
        id: alert.id,
        name: alert.name,
        description: alert.description ?? null,
        status: alert.status,
        severity: alert.severity,
        service_id: serviceByOid.get(String(alert.service)) ?? null,
        incident_id: alert.incident ? (incidentByOid.get(String(alert.incident)) ?? null) : null,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt
    })).filter((alert) => typeof alert.id === 'number' && typeof alert.service_id === 'number');

    await dest.collection('alerts').deleteMany({});
    if (docs.length) await dest.collection('alerts').insertMany(docs);

    const maxId = Math.max(0, ...docs.map((doc) => doc.id || 0));
    await dest.collection('sequences').updateOne(
        { _id: 'alert' },
        { $set: { seq: maxId } },
        { upsert: true }
    );
    console.log(`Copied ${docs.length} alerts (seq=${maxId})`);
}

const sourceUri = process.env.SOURCE_MONGO_URI;
if (!sourceUri) {
    console.error('SOURCE_MONGO_URI is required');
    process.exit(1);
}

const source = await mongoose.createConnection(sourceUri).asPromise();
const usersDb = await mongoose.createConnection(dbUri(sourceUri, 'pulse_users')).asPromise();
const incidentsDb = await mongoose.createConnection(dbUri(sourceUri, 'pulse_incidents')).asPromise();
const alertsDb = await mongoose.createConnection(dbUri(sourceUri, 'pulse_alerts')).asPromise();

try {
    await copyUsers(source, usersDb);
    await copyIncidents(source, incidentsDb);
    await copyAlerts(source, alertsDb);
    console.log('Legacy data migration complete');
} finally {
    await Promise.all([source.close(), usersDb.close(), incidentsDb.close(), alertsDb.close()]);
}
