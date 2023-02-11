import express from 'express';
import {PostgreSqlContainer, StartedPostgreSqlContainer} from "testcontainers";
import {Client} from "pg";
import fs from "fs";

const app = express()
const port = 3000

let client: Client | null = null

function mandatoryClient(): Client {
    if (!client) {
        throw new Error("Client not initialized")
    }
    return client
}

app.get('/:id*', async (req, res) => {
    const id = req.path.substring(1).replace(/\//g, '.')
    console.log(`GET ${id}`)
    const result = await mandatoryClient().query("SELECT * FROM entity WHERE path = $1", [id])
    if (result) {
        return res.setHeader("Content-type", "application/json").send(result.rows)
    }
    return res.status(404).send(`Not found: ${id}`)
})

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
}

async function start() {
    console.log("Starting postgres...")
    const container = await new PostgreSqlContainer().start()
    console.log("Migrating database...")
    await migrateDatabase(container)
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
}

start().catch(console.error)
