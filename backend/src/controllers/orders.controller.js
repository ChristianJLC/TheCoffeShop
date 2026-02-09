import { pool } from "../config/db.js";

const ALLOWED = new Set(["PENDIENTE_PAGO", "PAGADO", "FALLIDO", "CANCELADO"]);

export async function getOrder(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ ok: false, message: "ID inválido" });

        const { rows: pedidoRows } = await pool.query(
            `SELECT id, usuario_id, total, estado, creado_en
       FROM pedidos
       WHERE id = $1`,
            [id]
        );

        if (pedidoRows.length === 0) return res.status(404).json({ ok: false, message: "Pedido no existe" });

        const { rows: detalleRows } = await pool.query(
            `SELECT id, pedido_id, producto_id, cantidad, precio_unitario
       FROM detalle_pedidos
       WHERE pedido_id = $1
       ORDER BY id ASC`,
            [id]
        );

        return res.json({ ok: true, pedido: pedidoRows[0], detalle: detalleRows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Error obteniendo pedido" });
    }
}

export async function updateOrderStatus(req, res) {
    try {

        if (process.env.NODE_ENV === "production") {
            return res.status(403).json({ ok: false, message: "No permitido en producción" });
        }

        const id = Number(req.params.id);
        const { estado } = req.body;

        if (!Number.isFinite(id)) return res.status(400).json({ ok: false, message: "ID inválido" });
        if (!ALLOWED.has(String(estado))) {
            return res.status(400).json({
                ok: false,
                message: `Estado inválido. Usa: ${Array.from(ALLOWED).join(", ")}`
            });
        }

        const { rows } = await pool.query(
            `UPDATE pedidos
       SET estado = $2
       WHERE id = $1
       RETURNING id, usuario_id, total, estado, creado_en`,
            [id, estado]
        );

        if (rows.length === 0) return res.status(404).json({ ok: false, message: "Pedido no existe" });

        return res.json({ ok: true, pedido: rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Error actualizando estado" });
    }
}
