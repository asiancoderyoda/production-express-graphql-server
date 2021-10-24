CREATE TABLE user_entity (
    id uuid NOT NULL PRIMARY KEY,
    userName text NOT NULL,
    email varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp DEFAULT CURRENT_TIMESTAMP                            
);

INSERT INTO user_entity (id, email, password) VALUES (1,'Bi Bom Si', 'Bhakta123@');

SELECT * FROM user_entity;

DELETE FROM user_entity
WHERE id = '52227d61-99c8-42a2-ad4d-fae295d2a472';