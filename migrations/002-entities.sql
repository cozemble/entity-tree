insert into entity(entity_id, entity_name, path, data)
values ('t1', 'tenant', 'tenant.t1', '{"name": "Mike''s Chocolate Factory", "ownerId": "user.u1"}');

insert into entity(entity_id, entity_name, path, data)
values ('u1', 'user', 'tenant.t1.user.u1', '{"first_name": "Mike"}');