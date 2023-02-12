import express from 'express';
import {PostgreSqlContainer, StartedPostgreSqlContainer} from "testcontainers";
import {Client} from "pg";
import fs from "fs";
import {Entity} from './entity';

const app = express()
const port = 3000

let client: Client | null = null

// get entities and children from unrestricted entity table
app.get('/e/:id*', async (req, res) => {
    const id = urlNameToLtree(req.path.substring(3))
    const children = req.query.child ? ensureArray(req.query.child) : []
    console.log(`GET ${id}, children: ${JSON.stringify(req.query.child)}`)
    const result = await mandatoryClient().query("SELECT * FROM entity WHERE path = $1", [id])
    if (result && result.rows && result.rows.length === 1) {
        let entity: Entity = result.rows[0]
        const childEntities = await fetchChildren(mandatoryClient(), id, children)
        return res.setHeader("Content-type", "application/json").send({[entity.entity_name]: {...entity}, ...childEntities})
    }
    return res.status(404).send(`Not found: ${id}`)
})

// get entities and children from unrestricted entity table
app.get('/u/:userId/*', async (req, res) => {
    return res.setHeader("Content-type", "application/json").send({path: req.path, userId: req.params.userId})
})

async function distinctEntityNames(client: Client) {
    const entityNames = await client.query("select distinct(entity_name) from entity;")
    return entityNames.rows.map(row => row.entity_name)
}

async function fetchEntity(client: Client, id: string, acc: Promise<Awaited<{ [p: string]: Entity[] }>>, child: string) {
    const result = await client.query("SELECT * FROM entity WHERE path = $1", [id])
    if (result && result.rows) {
        return {...await acc, [child]: result.rows}
    }
    return acc
}

function referencesEntityName(entityNames: string[], path: string) {
    return entityNames.some(entityName => path.endsWith('.' + entityName))
}

async function fetchEntities(client: Client, id: string) {
    const result = await client.query("SELECT * FROM entity WHERE path ~ $1", [id + ".*"])
    if (result && result.rows) {
        return result.rows
    }
    return []

}

async function fetchChildren(client: Client, parentId: string, children: string[]) {
    const entityNames = await distinctEntityNames(client)
    return await children.reduce(async (acc, child) => {
        const id = parentId + "." + urlNameToLtree(child)
        if (referencesEntityName(entityNames, id)) {
            return {...await acc, [child]: await fetchEntities(client, id)}
        }
        return await fetchEntity(client, id, acc, child);

    }, Promise.resolve({} as { [key: string]: Entity[] }))
}

function urlNameToLtree(name: string) {
    return name.replace(/\//g, '.')
}

function mandatoryClient(): Client {
    if (!client) {
        throw new Error("Client not initialized")
    }
    return client
}

function ensureArray(child: any) {
    if (Array.isArray(child)) {
        return child
    }
    return [child]
}

async function migrateDatabase(container: StartedPostgreSqlContainer) {
    client = new Client({
        host: container.getHost(),
        port: container.getPort(),
        database: container.getDatabase(),
        user: container.getUsername(),
        password: container.getPassword(),
    })
    await client.connect()

    await client.query(fs.readFileSync('./migrations/001-tables.sql', 'utf8'))
    await client.query(fs.readFileSync('./migrations/002-entities.sql', 'utf8'))
    await client.query(fs.readFileSync('./migrations/003-restricted_entity.sql', 'utf8'))
}

function pgConnectString(container: StartedPostgreSqlContainer) {
    return `postgres://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${container.getPort()}/${container.getDatabase()}`
}

async function start() {
    console.log("Starting postgres...")
    const container = await new PostgreSqlContainer().start()
    console.log("Migrating database...")
    await migrateDatabase(container)
    app.listen(port, () => {
        console.log("Postgres connect string = " + pgConnectString(container))
        console.log("\nTry http://localhost:3000/e/tenant/t1")
        console.log("or http://localhost:3000/e/tenant/t1?child=record/rec1&child=model\n")
    })
}

start().catch(console.error)
