CREATE EXTENSION IF NOT EXISTS ltree;
--- this stores models and records in the tree as json
--- e.g. a model for Customer would have entity_name of "Model", and the data would be a cozemble model describing
--- a Customer (first name, last name, email and phone). A record for a Customer would have entity_name of "Record",
--- and the data would be a cozemble record adhering to the Customer model.
CREATE TABLE entity
(
    entity_id   VARCHAR NOT NULL UNIQUE,
    entity_name VARCHAR NOT NULL,
    path        ltree   NOT NULL,
    data        JSONB   NOT NULL,
    PRIMARY KEY (entity_id)
);

CREATE INDEX entity_path_idx ON entity USING GIST (path);

--- this flattens the data in a record into its paths.  For the customer record above, this would
--- have 4 rows, one for each field in the record, first name, last name, email and phone.
create table entity_paths
(
    entity_id varchar not null references entity (entity_id) on delete cascade,
    path      ltree   not null,
    value     varchar not null
);

CREATE INDEX entity_paths_path_idx ON entity_paths USING GIST (path);
