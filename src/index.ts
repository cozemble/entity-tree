import express from 'express';
import bodyParser from 'body-parser';
import {PostgreSqlContainer, StartedPostgreSqlContainer} from "testcontainers";
import {Client} from "pg";
import fs from "fs";
import {Entity} from './entity';

const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
const port = 3000

let superUser: Client | null = null
let appUser: Client | null = null

// get entities and children from unrestricted entity table
app.get('/e/:id*', async (req, res) => {
    const id = urlNameToLtree(req.path.substring(3))
    const children = req.query.child ? ensureArray(req.query.child) : []
    console.log(`GET ${id}, children: ${JSON.stringify(req.query.child)}`)
    let result = await mandatorySuperUser().query("SELECT * FROM entity WHERE path = $1", [id])
    if (result && result.rows && result.rows.length === 1) {
        let entity: Entity = result.rows[0]
        const childEntities = await fetchChildren(mandatorySuperUser(), id, children)
        return res.setHeader("Content-type", "application/json").send({[entity.entity_name]: {...entity}, ...childEntities})
    }
    return res.status(404).send(`Not found: ${id}`)
})

// get entities and children from unrestricted entity table
app.get('/u/:userId/*', async (req, res) => {
    return res.setHeader("Content-type", "application/json").send({path: req.path, userId: req.params.userId})
})

async function runRawSql(sql:string) {
    try {
        let result = await mandatoryAppUser().query(sql)
        console.log({result})
        if(Array.isArray(result)) {
            result = result[result.length - 1]
        }

        if (result && result.rows) {
            return result.rows
        }
        return "no rows"
    } catch (e:any) {
        return `while running sql '${sql}': ${e.message}`
    }
}

app.post('/sql', async (req, res) => {
    const result = await runRawSql(req.body.sql as string);

    return res.setHeader("Content-type", "text/html").send(`<form method="post" action="/sql">
    <textarea name="sql" style="width: 100%; height: 100px">${req.body.sql}</textarea>
    <input type="submit" value="Submit">
</form>
<br/>
<br/>
<pre>${JSON.stringify(result, null, 2)}</pre>
`)
})

app.get("/sql", async (req, res) => {
    return res.setHeader("Content-type", "text/html").send(`
<form method="post" action="/sql">
    <textarea name="sql" style="width: 100%; height: 100px"></textarea>
    <input type="submit" value="Submit">
</form>
`)

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

function mandatorySuperUser(): Client {
    if (!superUser) {
        throw new Error("Client not initialized")
    }
    return superUser
}

function mandatoryAppUser(): Client {
    if (!appUser) {
        throw new Error("Client not initialized")
    }
    return appUser
}

function ensureArray(child: any) {
    if (Array.isArray(child)) {
        return child
    }
    return [child]
}

async function migrateDatabase(container: StartedPostgreSqlContainer) {
    superUser = new Client({
        host: container.getHost(),
        port: container.getPort(),
        database: container.getDatabase(),
        user: container.getUsername(),
        password: container.getPassword(),
    })
    await superUser.connect()

    await superUser.query(fs.readFileSync('./migrations/001-tables.sql', 'utf8'))
    await superUser.query(fs.readFileSync('./migrations/002-entities.sql', 'utf8'))
    await superUser.query(fs.readFileSync('./migrations/003-restricted_entity.sql', 'utf8'))
}

function pgConnectString(container: StartedPostgreSqlContainer, username = container.getUsername(), password = container.getPassword()) {
    return `postgres://${username}:${password}@${container.getHost()}:${container.getPort()}/${container.getDatabase()}`
}

async function establishAppUser(container: StartedPostgreSqlContainer) {
    appUser = new Client({
        host: container.getHost(),
        port: container.getPort(),
        database: container.getDatabase(),
        user: "appuser",
        password: "appuser"
    })
    await appUser.connect()

}

async function start() {
    console.log("Starting postgres...")
    const container = await new PostgreSqlContainer().start()
    console.log("Migrating database...")
    await migrateDatabase(container)
    await establishAppUser(container)
    app.listen(port, () => {
        console.log("Postgres super user connect string = " + pgConnectString(container))
        console.log("Postgres app user connect string = " + pgConnectString(container, "appuser", "appuser"))
        console.log("\nTry http://localhost:3000/e/tenant/t1")
        console.log("or http://localhost:3000/e/tenant/t1?child=record/rec1&child=model\n")
        console.log("or http://localhost:3000/sql\n")
    })
}

start().catch(console.error)
