import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD),
    port: Number(process.env.DB_PORT),
});

pool
    .query("SELECT NOW()")
    .then(() => console.log("PostgreSQL conectado ✅"))
    .catch((err) => console.error("Error conectando a PostgreSQL:", err));
