import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "thecoffeshop_db",
    password: "---------",
    port: 5432,
});

console.log("PostgreSQL conectado");