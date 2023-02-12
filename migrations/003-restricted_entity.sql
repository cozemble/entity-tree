-- noinspection SqlNoDataSourceInspectionForFile

CREATE TABLE restricted_entity
(
    entity_id   VARCHAR NOT NULL UNIQUE,
    entity_name VARCHAR NOT NULL,
    path        LTREE   NOT NULL UNIQUE,
    data        JSONB   NOT NULL,
    PRIMARY KEY (entity_id)
);

CREATE INDEX restricted_entity_path_idx ON entity USING GIST (path);

CREATE TABLE restricted_entity_permit
(
    owner_path  LTREE NOT NULL references restricted_entity (path),
    permit_path LTREE NOT NULL,
    PRIMARY KEY (owner_path, permit_path)
);

CREATE TABLE restricted_entity_deny
(
    owner_path ltree NOT NULL references restricted_entity (path),
    deny_path  text  NOT NULL,
    PRIMARY KEY (owner_path, deny_path)
);

CREATE OR REPLACE FUNCTION is_permitted(p_owner_path ltree, p_query text)
    RETURNS boolean AS
$$
DECLARE
    l_permit_path ltree;
    l_deny_path   text;
BEGIN
    -- Get the first matching permit_path for the owner_path
    SELECT INTO l_permit_path permit_path
    FROM restricted_entity_permit
    WHERE owner_path = p_owner_path
      AND permit_path <@ (SELECT path FROM restricted_entity WHERE entity_id = split_part(p_query, '.', 3) LIMIT 1);

    -- Check if there is a matching deny_path for the owner_path
    SELECT INTO l_deny_path deny_path
    FROM restricted_entity_deny
    WHERE owner_path = p_owner_path
      AND (deny_path = '*' OR p_query LIKE deny_path || '%');

    -- Return true if permit_path exists and deny_path does not exist
    RETURN l_permit_path IS NOT NULL AND l_deny_path IS NULL;
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

INSERT INTO restricted_entity (entity_id, entity_name, path, data)
VALUES ('car_model', 'model', 'root.tenant.mikes_car_showroom.model.car_model', '{
  "name": "Car Model",
  "properties": [
    "make",
    "model",
    "year",
    "color"
  ]
}');

INSERT INTO restricted_entity (entity_id, entity_name, path, data)
VALUES ('customer_model', 'model', 'root.tenant.mikes_car_showroom.model.customer_model', '{
  "name": "Customer Model",
  "properties": [
    "name",
    "address",
    "phone"
  ]
}');

INSERT INTO restricted_entity_deny (owner_path, deny_path)
VALUES ('root.user.mike', 'root.user.*');

INSERT INTO restricted_entity_deny (owner_path, deny_path)
VALUES ('root.user.dan', 'root.user.*');

INSERT INTO restricted_entity_deny (owner_path, deny_path)
VALUES ('root.user.cherry', 'root.user.*');

INSERT INTO restricted_entity_permit (owner_path, permit_path)
VALUES ('root.user.mike', 'root.user.mike');

INSERT INTO restricted_entity_permit (owner_path, permit_path)
VALUES ('root.user.mike', 'root.tenant.mikes_car_showroom');

