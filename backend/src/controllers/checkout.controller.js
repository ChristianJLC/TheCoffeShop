import { pool } from "../config/db.js";
import crypto from "crypto";


function moneyNumber(v) {
    const n = Number(v || 0);
    return Math.round(n * 100) / 100;
}

export async function validateCart(req, res) {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "Carrito vacío.",
            });
        }

        const hasProductoId = items.every((it) =>
            Number.isFinite(Number(it.producto_id))
        );

        if (!hasProductoId) {
            return res.status(400).json({
                ok: false,
                message: "Debes enviar producto_id numérico.",
            });
        }

        const ids = items.map((it) => Number(it.producto_id));
        const cantidadesMap = new Map(
            items.map((it) => [
                Number(it.producto_id),
                Math.max(1, Number(it.cantidad || 1)),
            ])
        );

        const { rows: productosDB } = await pool.query(
            `SELECT id, nombre, precio, imagen
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

        const validatedItems = productosDB.map((p) => {
            const cantidad = cantidadesMap.get(p.id);
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

        const subtotal = moneyNumber(
            validatedItems.reduce((acc, it) => acc + it.total_item, 0)
        );
        const delivery = 0;
        const total = moneyNumber(subtotal + delivery);

        return res.json({
            ok: true,
            items: validatedItems,
            subtotal,
            delivery,
            total,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            ok: false,
            message: "Error en validateCart.",
        });
    }
}


export async function createOrder(req, res) {
    try {
        const { items, usuario_id = null, customer = {}, note = null } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "Carrito vacío.",
            });
        }

        const hasProductoId = items.every((it) =>
            Number.isFinite(Number(it.producto_id))
        );

        if (!hasProductoId) {
            return res.status(400).json({
                ok: false,
                message: "Debes enviar producto_id numérico.",
            });
        }

        const ids = items.map((it) => Number(it.producto_id));
        const cantidadesMap = new Map(
            items.map((it) => [
                Number(it.producto_id),
                Math.max(1, Number(it.cantidad || 1)),
            ])
        );

        const { rows: productosDB } = await pool.query(
            `SELECT id, nombre, precio
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
            const cantidad = cantidadesMap.get(p.id);
            const precioUnit = moneyNumber(p.precio);
            return {
                producto_id: p.id,
                nombre: p.nombre,
                cantidad,
                precio_unitario: precioUnit,
                total_item: moneyNumber(precioUnit * cantidad),
            };
        });

        const subtotal = moneyNumber(
            detalle.reduce((acc, it) => acc + it.total_item, 0)
        );
        const delivery = 0;
        const total = moneyNumber(subtotal + delivery);

        //External reference (clave para Mercado Pago)
        const external_reference = crypto.randomUUID();

        //Guardar INTENT (temporal)
        await pool.query(
            `INSERT INTO checkout_intents
       (external_reference, usuario_id, carrito_json, customer_json, note, status, total)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, 'pending', $6)`,
            [
                external_reference,
                usuario_id,
                JSON.stringify({ items: detalle }),
                JSON.stringify(customer),
                note,
                total,
            ]
        );

        return res.json({
            ok: true,
            external_reference,
            subtotal,
            delivery,
            total,
            message: "Checkout intent creado. Procede al pago.",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            ok: false,
            message: "Error creando checkout intent.",
        });
    }
}
