const cozemble = {
    root: {
        tenant1: {
            users: [],
            models: [],
            records: [],
            tenants: []
        }
    }
}

export type Entity = {
    id: string
    entityName: string
    data: any
    path: string
}

const tenant1: Entity = {
    id: '86786',
    entityName: 'Tenant',
    data: {"name": "Mike's Chocolate Factory", ownerId: "54345"},
    path: '/tenants/86786'
}

const mike: Entity = {
    id: '54345',
    entityName: 'User',
    data: {"name": "Mike"},
    path: '/tenants/86786/users/54345'
}

const mikeOwner: Entity = {
    id: '65345',
    entityName: 'Role',
    data: {"role": "owner"},
    path: '/tenants/86786/users/54345/roles/65345'
}

const mikeDeveloper: Entity = {
    id: '3455',
    entityName: 'Role',
    data: {"role": "developer"},
    path: '/tenants/86786/users/54345/roles/3455'
}

const dan: Entity = {
    id: '11244',
    entityName: 'User',
    data: {"name": "Dan"},
    path: '/tenants/86786/users/11244'
}

const danBookingAgent: Entity = {
    id: '998765',
    entityName: 'Role',
    data: {"role": "booking_agent"},
    path: '/tenants/86786/users/11244/roles/998765'
}

const carModel: Entity = {
    id: '877655',
    entityName: 'Model',
    data: {"name": "Car", properties: ["make", "model", "year"]},
    path: '/tenants/86786/models/877655'
}

const carRecord: Entity = {
    id: '445677',
    entityName: 'Record',
    data: {"modelId": "877655", "make": "Ford", "model": "Fiesta", "year": 2005},
    path: '/tenants/86786/records/445677'
}

export const entities: Entity[] = [
    tenant1,
    mike,
    mikeOwner,
    mikeDeveloper,
    dan,
    danBookingAgent,
    carModel,
    carRecord
]

export function entityWithId(id: string): Entity | null {
    return entities.find(entity => entity.id === id) ?? null
}