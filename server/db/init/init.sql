-- Criação dos schemas
CREATE SCHEMA IF NOT EXISTS keycloak;
CREATE SCHEMA IF NOT EXISTS service;

-- Comentários nos schemas
COMMENT ON SCHEMA keycloak IS '🔐 Schema exclusivo para as tabelas internas do Keycloak. Não modificar manualmente.';
COMMENT ON SCHEMA service IS '🌐 Schema da aplicação NestJS. Todas as tabelas customizadas da aplicação devem ser criadas aqui.';
