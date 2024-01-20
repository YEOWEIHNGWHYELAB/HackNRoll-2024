// Create a unique constraint on RootInfo nodes
CREATE CONSTRAINT FOR (n:RootInfo) REQUIRE n.phone_number IS UNIQUE;
CREATE CONSTRAINT FOR (n:RootInfo) REQUIRE n.ssn IS UNIQUE;
CREATE CONSTRAINT FOR (n:RootInfo) REQUIRE n.key_identifier IS UNIQUE;