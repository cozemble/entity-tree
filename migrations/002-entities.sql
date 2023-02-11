insert into entity(entity_id, entity_name, path, data)
values ('t1', 'tenant', 'tenant.t1', '{"name": "Mike''s Chocolate Factory", "ownerId": "user.u1"}');

insert into entity(entity_id, entity_name, path, data)
values ('u1', 'user', 'tenant.t1.user.u1', '{"first_name": "Mike"}');

insert into entity(entity_id, entity_name, path, data)
values ('r1', 'role', 'tenant.t1.user.u1.role.r1', '{"role": "owner"}');

insert into entity(entity_id, entity_name, path, data)
values ('r2', 'role', 'tenant.t1.user.u1.role.r2', '{"role": "developer"}');

insert into entity(entity_id, entity_name, path, data)
values ('u2', 'user', 'tenant.t1.user.u2', '{"first_name": "Dan"}');

insert into entity(entity_id, entity_name, path, data)
values ('r3', 'role', 'tenant.t1.user.u2.role.r2', '{"role": "booking_agent"}');

insert into entity(entity_id, entity_name, path, data)
values ('m1', 'model', 'tenant.t1.model.m1', '{"name": "Car", "properties": ["color", "make", "model", "year"]}');

insert into entity(entity_id, entity_name, path, data)
values ('rec1', 'record', 'tenant.t1.record.rec1', '{"modelId": "model.m1", "make": "Ford", "model": "Fiesta", "year": 2005}');
