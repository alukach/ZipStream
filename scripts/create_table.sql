DROP TABLE "bundles";
CREATE TABLE "bundles" (
    id              text PRIMARY KEY NOT NULL,
    secret          text NOT NULL,
    files           json[] NOT NULL,
    expirationDate  timestamp NOT NULL,
    filename        text NOT NULL
);