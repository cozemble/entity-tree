import express from 'express';
import {entities, entityWithId} from "./entities";
import {entityPresenters} from "./entityPresenter";

const app = express();
const port = 3000;

app.get('/:id*', (req, res) => {
    const id = (req.params as any)['id']
    let maybeEntity = entityWithId(id)
    if (maybeEntity) {
        const maybePresenter = entityPresenters.get(maybeEntity.entityName)
        if (maybePresenter) {
            maybeEntity = maybePresenter(entities, maybeEntity)
        }
        return res.setHeader("Content-type", "application/json").send(maybeEntity)
    }
    return res.status(404).send(`Not found: ${id}`)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})