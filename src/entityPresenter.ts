import {Entity} from "./entities";

export type EntityPresenter = (allEntities: Entity[], entity: Entity) => Entity

export const entityPresenters: Map<string, EntityPresenter> = new Map()

function tenantPresenter(allEntities: Entity[], entity: Entity): Entity {
    return {
        ...entity,
        data: {
            ...entity.data,
            users: allEntities.filter(e => e.path.startsWith(entity.path + "/user") && e.entityName === "User")
        }
    }
}

function userPresenter(allEntities: Entity[], entity: Entity): Entity {
    return {
        ...entity,
        data: {
            ...entity.data,
            roles: allEntities.filter(e => e.path.startsWith(entity.path + "/roles")).map(e => e.id)
        }
    }
}

function rolePresenter(allEntities: Entity[], entity: Entity): Entity {
    return entity
}

entityPresenters.set("Tenant", tenantPresenter)
entityPresenters.set("User", userPresenter)
entityPresenters.set("Role", rolePresenter)
