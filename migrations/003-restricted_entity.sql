CREATE TABLE restricted_entity
(
    entity_id   VARCHAR NOT NULL UNIQUE,
    entity_name VARCHAR NOT NULL,
    path        LTREE   NOT NULL,
    data        JSONB   NOT NULL,
    PRIMARY KEY (entity_id)
);

CREATE INDEX restricted_entity_path_idx ON entity USING GIST (path);

CREATE TABLE restricted_entity_permit
(
    owner_path  LTREE NOT NULL,
    permit_path LTREE NOT NULL,
    PRIMARY KEY (owner_path, permit_path)
);

CREATE TABLE restricted_entity_deny
(
    owner_path LTREE NOT NULL,
    deny_path  LTREE NOT NULL,
    PRIMARY KEY (owner_path, deny_path)
);

CREATE OR REPLACE FUNCTION is_permitted(p_user_path ltree, p_entity_path ltree)
    RETURNS BOOLEAN AS
$$
DECLARE
    v_result BOOLEAN;
BEGIN
    SELECT COALESCE((SELECT 1
                     FROM restricted_entity_permit
                     WHERE owner_path = p_user_path
                       AND permit_path <@ p_entity_path), 0) > 0 AND COALESCE((SELECT 1
                                                                               FROM restricted_entity_deny
                                                                               WHERE owner_path = p_user_path
                                                                                 AND deny_path <@ p_entity_path), 0) = 0
    INTO v_result;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;


INSERT INTO restricted_entity (entity_id, entity_name, path, data)
VALUES ('root', 'root', 'root', '{}');

INSERT INTO restricted_entity (entity_id, entity_name, path, data)
VALUES ('mike', 'user', 'root.user.mike', '{
  "name": "Mike"
}');

INSERT INTO restricted_entity (entity_id, entity_name, path, data)
VALUES ('dan', 'user', 'root.user.dan', '{
  "name": "Dan"
}');

INSERT INTO restricted_entity (entity_id, entity_name, path, data)
VALUES ('cherry', 'user', 'root.user.cherry', '{
  "name": "Cherry"
}');

INSERT INTO restricted_entity (entity_id, entity_name, path, data)
VALUES ('mikes_car_showroom', 'tenant', 'root.tenant.mikes_car_showroom', '{
  "name": "Mikes Car Showroom"
}');

INSERT INTO restricted_entity (entity_id, entity_name, path, data)
VALUES ('dans_bakery', 'tenant', 'root.tenant.dans_bakery', '{
  "name": "Dans Bakery"
}');

INSERT INTO restricted_entity (entity_id, entity_name, path, data)
VALUES ('cherrys_ice_cream_parlour', 'tenant', 'root.tenant.cherrys_ice_cream_parlour', '{
  "name": "Cherrys Ice Cream Parlour"
}');

INSERT INTO restricted_entity_deny (owner_path, deny_path)
VALUES ('root.user', 'root.user');

INSERT INTO restricted_entity_permit (owner_path, permit_path)
VALUES ('root.user.mike', 'root.user.mike');

INSERT INTO restricted_entity_permit (owner_path, permit_path)
VALUES ('root.user.mike', 'root.tenant.mikes_car_showroom');

