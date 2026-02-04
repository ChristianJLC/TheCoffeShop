import { pool } from "../config/db.js";

function moneyNumber(v) {
    const n = Number(v || 0);
    return Math.round(n * 100) / 100;
}

export async function validateCart(req, res) {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ ok: false, message: "Carrito vacío." });
        }

        const hasProductoId = items.every((it) => Number.isFinite(Number(it.producto_id)));

        if (hasProductoId) {
            const ids = items.map((it) => Number(it.producto_id));
            const cantidadesMap = new Map(items.map((it) => [Number(it.producto_id), Number(it.cantidad || 1)]));

            const { rows } = await pool.query(
                `SELECT id, nombre, precio, imagen
         FROM productos
         WHERE id = ANY($1::int[])`,
                [ids]
            );

            if (rows.length !== ids.length) {
                return res.status(400).json({
                    ok: false,
                    message: "Uno o más productos no existen en la base de datos.",
                });
            }

            const validatedItems = rows.map((p) => {
                const cantidad = Math.max(1, Number(cantidadesMap.get(p.id) || 1));
                const precioUnit = moneyNumber(p.precio);
                return {
                    producto_id: p.id,
                    nombre: p.nombre,
                    precio_unitario: precioUnit,
                    cantidad,
                    imagen: p.imagen,
                    total_item: moneyNumber(precioUnit * cantidad),
                };
            });

            const subtotal = moneyNumber(validatedItems.reduce((acc, it) => acc + it.total_item, 0));
            const delivery = 0;
            const total = moneyNumber(subtotal + delivery);

            return res.json({
                ok: true,
                items: validatedItems,
                subtotal,
                delivery,
                total,
            });
        }

        const subtotal = moneyNumber(validatedItems.reduce((acc, it) => acc + it.total_item, 0));
        const delivery = 0;
        const total = moneyNumber(subtotal + delivery);

        return res.json({
            ok: true,
            items: validatedItems,
            subtotal,
            delivery,
            total,
            warning: "Estás validando por nombre. Cambia a producto_id lo antes posible.",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Error en validateCart." });
    }
}

export async function createOrder(req, res) {
    const client = await pool.connect();
    try {
        const { items, usuario_id = null } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ ok: false, message: "Carrito vacío." });
        }

        const hasProductoId = items.every((it) => Number.isFinite(Number(it.producto_id)));
        if (!hasProductoId) {
            return res.status(400).json({
                ok: false,
                message: "Para crear pedido debes enviar producto_id numérico.",
            });
        }

        const ids = items.map((it) => Number(it.producto_id));
        const cantidadesMap = new Map(items.map((it) => [Number(it.producto_id), Number(it.cantidad || 1)]));

        const { rows: productosDB } = await client.query(
            `SELECT id, precio
       FROM productos
       WHERE id = ANY($1::int[])`,
            [ids]
        );

        if (productosDB.length !== ids.length) {
            return res.status(400).json({
                ok: false,
                message: "Uno o más productos no existen en la base de datos.",
            });
        }

        const detalle = productosDB.map((p) => {
            const cantidad = Math.max(1, Number(cantidadesMap.get(p.id) || 1));
            const precioUnit = moneyNumber(p.precio);
            return {
                producto_id: p.id,
                cantidad,
                precio_unitario: precioUnit,
                total_item: moneyNumber(precioUnit * cantidad),
            };
        });

        const subtotal = moneyNumber(detalle.reduce((acc, it) => acc + it.total_item, 0));
        const delivery = 0;
        const total = moneyNumber(subtotal + delivery);

        await client.query("BEGIN");

        const { rows: pedidoRows } = await client.query(
            `INSERT INTO pedidos (usuario_id, total, estado, creado_en)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, total, estado, creado_en`,
            [usuario_id, total, "PENDIENTE_PAGO"]
        );

        const pedido = pedidoRows[0];

        for (const item of detalle) {
            await client.query(
                `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
                [pedido.id, item.producto_id, item.cantidad, item.precio_unitario]
            );
        }

        await client.query("COMMIT");

        return res.json({
            ok: true,
            pedido,
            subtotal,
            delivery,
            total,
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        return res.status(500).json({ ok: false, message: "Error creando pedido." });
    } finally {
        client.release();
    }
}
