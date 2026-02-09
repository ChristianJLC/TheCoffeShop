import { pool } from "../config/db.js";

async function mpGetPayment(paymentId) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN en .env");

    const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!r.ok) {
        const txt = await r.text();
        throw new Error(`MP payment fetch failed: ${r.status} ${txt}`);
    }
    return r.json();
}

// Webhook Mercado Pago

export async function mpWebhook(req, res) {
    
    try {
        const body = req.body || {};
        const query = req.query || {};

        const type = query.type || query.topic || body.type || body.topic;
        const paymentId =
            query["data.id"] ||
            query.id ||
            body?.data?.id ||
            body?.id;

        if (!paymentId) {
            return res.status(200).json({ ok: true, ignored: true, reason: "No payment id" });
        }

        if (type && type !== "payment") {
            return res.status(200).json({ ok: true, ignored: true, reason: "Not payment" });
        }

        const payment = await mpGetPayment(paymentId);

        const mpStatus = payment.status; 
        const externalRef = payment.external_reference;

        if (!externalRef) {
            return res.status(200).json({ ok: true, ignored: true, reason: "No external_reference" });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const { rows: intentRows } = await client.query(
                `SELECT *
         FROM checkout_intents
         WHERE external_reference = $1
         FOR UPDATE`,
                [externalRef]
            );

            if (intentRows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(200).json({ ok: true, ignored: true, reason: "Intent not found" });
            }

            const intent = intentRows[0];

            if (intent.status === "paid" || intent.pedido_id) {
                await client.query("COMMIT");
                return res.status(200).json({ ok: true, already: true });
            }

            if (mpStatus !== "approved") {
                const newStatus =
                    mpStatus === "rejected" || mpStatus === "cancelled"
                        ? "failed"
                        : "pending";

                await client.query(
                    `UPDATE checkout_intents
           SET status = $1, mp_payment_id = $2, updated_at = NOW()
           WHERE external_reference = $3`,
                    [newStatus, Number(paymentId), externalRef]
                );

                await client.query("COMMIT");
                return res.status(200).json({ ok: true, status: newStatus });
            }

            const carrito = intent.carrito_json; 
            const items = carrito?.items || [];

            if (!Array.isArray(items) || items.length === 0) {
                await client.query(
                    `UPDATE checkout_intents
           SET status = 'failed', mp_payment_id = $1, updated_at = NOW()
           WHERE external_reference = $2`,
                    [Number(paymentId), externalRef]
                );
                await client.query("COMMIT");
                return res.status(200).json({ ok: true, status: "failed", reason: "No items in intent" });
            }

            const { rows: pedidoRows } = await client.query(
                `INSERT INTO pedidos (usuario_id, total, estado, creado_en, mp_payment_id, mp_status)
         VALUES ($1, $2, $3, NOW(), $4, $5)
         RETURNING id, total, estado, creado_en`,
                [
                    intent.usuario_id,
                    Number(intent.total),
                    "PAGADO",
                    Number(paymentId),
                    mpStatus,
                ]
            );

            const pedido = pedidoRows[0];

            for (const it of items) {
                await client.query(
                    `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario)
           VALUES ($1, $2, $3, $4)`,
                    [
                        pedido.id,
                        Number(it.producto_id),
                        Number(it.cantidad),
                        Number(it.precio_unitario),
                    ]
                );
            }

            await client.query(
                `UPDATE checkout_intents
         SET status = 'paid',
             mp_payment_id = $1,
             pedido_id = $2,
             updated_at = NOW()
         WHERE external_reference = $3`,
                [Number(paymentId), pedido.id, externalRef]
            );

            await client.query("COMMIT");
            return res.status(200).json({ ok: true, created: true, pedido_id: pedido.id });
        } catch (e) {
            await client.query("ROLLBACK");
            console.error("Webhook tx error:", e);
            return res.status(200).json({ ok: true, error: true }); // 200 para que MP no reintente infinito
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Webhook error:", err);
        return res.status(200).json({ ok: true, error: true }); // 200 por seguridad
    }
}
