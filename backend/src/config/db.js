import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // requerido por Neon
    },
});

pool
    .query("SELECT NOW()")
    .then(() => console.log("PostgreSQL conectado a Neon ✅"))
    .catch((err) => console.error("Error conectando a PostgreSQL:", err));
