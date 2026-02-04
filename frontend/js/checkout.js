document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // HELPERS (dinero / storage)
    // =========================
    function money(value) {
        const n = Number(value || 0);
        return `S/ ${n.toFixed(2)}`;
    }

    function getCarrito() {
        try {
            return JSON.parse(localStorage.getItem("carrito") || "[]");
        } catch {
            return [];
        }
    }

    // Normaliza rutas de imagen a /img/... (igual a lo que hiciste antes)
    function normalizarImg(src) {
        if (!src) return "";

        if (src.startsWith("/frontend/img/")) return src;
        if (src.startsWith("/img/")) return "/frontend" + src;

        const idx = src.indexOf("/img/");
        if (idx !== -1) return "/frontend" + src.slice(idx);

        const idx2 = src.indexOf("img/");
        if (idx2 !== -1) return "/frontend/" + src.slice(idx2);

        const idx3 = src.indexOf("/frontend/img/");
        if (idx3 !== -1) return src.slice(idx3);

        return src;
    }


    // =========================
    // RESUMEN (checkout right)
    // =========================
    const summaryItems = document.getElementById("summaryItems");
    const sumLabelSubtotal = document.getElementById("sumLabelSubtotal");
    const sumSubtotal = document.getElementById("sumSubtotal");
    const sumDelivery = document.getElementById("sumDelivery");
    const sumTotal = document.getElementById("sumTotal");

    function renderResumen() {
        const carrito = getCarrito();

        if (!summaryItems) return;

        // Si carrito vacío
        if (!carrito.length) {
            summaryItems.innerHTML = `<div class="summary-empty">Tu carrito está vacío.</div>`;
            if (sumLabelSubtotal) sumLabelSubtotal.textContent = `Subtotal (0 productos)`;
            if (sumSubtotal) sumSubtotal.textContent = money(0);
            if (sumDelivery) sumDelivery.textContent = money(0);
            if (sumTotal) sumTotal.textContent = money(0);
            return;
        }

        // Render items
        summaryItems.innerHTML = carrito
            .map((item) => {
                const nombre = item.nombre || "Producto";
                const precio = Number(item.precio || 0);
                const cantidad = Number(item.cantidad || 1);
                const img = normalizarImg(item.imagen || "");

                const totalItem = precio * cantidad;

                return `
          <div class="summary-item">
            <div class="summary-item__img">
              <img src="${img}" alt="${nombre}">
              <span class="summary-item__badge">${cantidad}</span>
            </div>

            <div class="summary-item__info">
              <div class="summary-item__name">${nombre}</div>
            </div>

            <div class="summary-item__price">${money(totalItem)}</div>
          </div>
        `;
            })
            .join("");

        // Totales
        const cantidadProductos = carrito.reduce((acc, item) => acc + Number(item.cantidad || 1), 0);
        const subtotal = carrito.reduce(
            (acc, item) => acc + Number(item.precio || 0) * Number(item.cantidad || 1),
            0
        );

        const delivery = 0; // por ahora fijo (luego si quieres lo hacemos dinámico)
        const total = subtotal + delivery;

        if (sumLabelSubtotal) sumLabelSubtotal.textContent = `Subtotal (${cantidadProductos} productos)`;
        if (sumSubtotal) sumSubtotal.textContent = money(subtotal);
        if (sumDelivery) sumDelivery.textContent = money(delivery);
        if (sumTotal) sumTotal.textContent = money(total);
    }

    // Render inicial del resumen
    renderResumen();

    // Si vienes del carrito y cambian cantidades, re-render:
    window.addEventListener("carritoActualizado", renderResumen);
    window.addEventListener("storage", (e) => {
        if (e.key === "carrito") renderResumen();
    });

    // =========================
    // REFERENCIAS PASOS
    // =========================
    const steps = [
        document.getElementById("paso-1"),
        document.getElementById("paso-2"),
        document.getElementById("paso-3"),
    ];

    const stepperItems = document.querySelectorAll(".stepper-item");
    const stepperLines = document.querySelectorAll(".stepper-line");

    const btnNexts = document.querySelectorAll(".js-next");
    const btnPrevs = document.querySelectorAll(".js-prev");

    // Inputs paso 1
    const nombre = document.getElementById("nombre");
    const apellido = document.getElementById("apellido");
    const celular = document.getElementById("celular");
    const correo = document.getElementById("correo");
    const comprobante = document.getElementById("comprobante");

    // Paso 2 textarea + contador
    const comentarios = document.getElementById("comentarios");
    const counter = document.getElementById("counterNota") || document.querySelector(".counter");

    // Paso 3 pago
    const pagoRadio = document.getElementById("pagoTarjeta") || document.querySelector('input[name="pago"]');
    const payDetails = document.getElementById("payDetails") || document.querySelector(".pay-details");
    const btnPagar = document.getElementById("btnPagar");
    const chkDatos = document.getElementById("chkDatos");
    const chkTerminos = document.getElementById("chkTerminos");

    let currentStep = 1; // 1..3

    // =========================
    // UI Stepper + Steps
    // =========================
    function setActiveStep(stepNumber) {
        currentStep = stepNumber;

        // mostrar/ocultar pasos
        steps.forEach((stepEl, idx) => {
            if (!stepEl) return;
            stepEl.classList.toggle("is-active", idx === stepNumber - 1);
        });

        // bolitas
        stepperItems.forEach((item, idx) => {
            item.classList.remove("is-active", "is-done");
            const stepIndex = idx + 1;

            if (stepIndex < stepNumber) item.classList.add("is-done");
            if (stepIndex === stepNumber) item.classList.add("is-active");
        });

        // barras (líneas)
        stepperLines.forEach((lineEl, idx) => {
            lineEl.classList.toggle("is-done", idx + 1 < stepNumber);
        });

        if (stepNumber === 3) syncPagoUI();

        steps[stepNumber - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // =========================
    // Validación (Paso 1)
    // =========================
    function showFieldError(input, message) {
        if (!input) return;
        input.style.borderColor = "#c82014";

        let small = input.parentElement?.querySelector(".field-error");
        if (!small) {
            small = document.createElement("small");
            small.className = "field-error";
            small.style.color = "#c82014";
            small.style.display = "block";
            small.style.marginTop = "6px";
            small.style.fontSize = "13px";
            input.parentElement?.appendChild(small);
        }
        small.textContent = message;
    }

    function clearFieldError(input) {
        if (!input) return;
        input.style.borderColor = "#dcdcdc";
        const small = input.parentElement?.querySelector(".field-error");
        if (small) small.remove();
    }

    function validarPaso1() {
        let ok = true;

        if (!nombre?.value.trim()) {
            showFieldError(nombre, "Escribe tu nombre.");
            ok = false;
        } else clearFieldError(nombre);

        if (!apellido?.value.trim()) {
            showFieldError(apellido, "Escribe tu apellido.");
            ok = false;
        } else clearFieldError(apellido);

        const cel = celular?.value.trim() || "";
        const soloNumeros = cel.replace(/\D/g, "");
        if (!soloNumeros || soloNumeros.length < 9) {
            showFieldError(celular, "Celular inválido (mínimo 9 dígitos).");
            ok = false;
        } else clearFieldError(celular);

        if (correo && correo.value.trim()) {
            const esEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim());
            if (!esEmail) {
                showFieldError(correo, "Correo inválido.");
                ok = false;
            } else clearFieldError(correo);
        } else {
            clearFieldError(correo);
        }

        return ok;
    }

    // =========================
    // Paso 2: contador nota
    // =========================
    function updateCounter() {
        if (!comentarios || !counter) return;
        counter.textContent = `${comentarios.value.length}/48`;
    }

    const savedNote = localStorage.getItem("checkoutNota") || "";
    if (comentarios) comentarios.value = savedNote;
    updateCounter();

    comentarios?.addEventListener("input", () => {
        updateCounter();
        localStorage.setItem("checkoutNota", comentarios.value);
    });

    // =========================
    // Paso 3: pago oculto
    // =========================
    function syncPagoUI() {
        if (!pagoRadio || !payDetails) return;
        payDetails.classList.toggle("is-open", !!pagoRadio.checked);

        // (Opcional) si quieres deshabilitar pagar hasta aceptar checks:
        if (btnPagar) {
            const okChecks = (!chkDatos || chkDatos.checked) && (!chkTerminos || chkTerminos.checked);
            btnPagar.disabled = !pagoRadio.checked || !okChecks;
            btnPagar.style.opacity = btnPagar.disabled ? "0.6" : "1";
            btnPagar.style.cursor = btnPagar.disabled ? "not-allowed" : "pointer";
        }
    }

    // inicia desmarcado
    if (pagoRadio) pagoRadio.checked = false;
    syncPagoUI();

    pagoRadio?.addEventListener("change", syncPagoUI);
    chkDatos?.addEventListener("change", syncPagoUI);
    chkTerminos?.addEventListener("change", syncPagoUI);

    // =========================
    // NEXT / PREV
    // =========================
    btnNexts.forEach((btn) => {
        btn.addEventListener("click", () => {
            const next = parseInt(btn.dataset.next, 10);

            if (currentStep === 1) {
                if (!validarPaso1()) return;

                const cliente = {
                    nombre: nombre?.value.trim() || "",
                    apellido: apellido?.value.trim() || "",
                    celular: celular?.value.trim() || "",
                    correo: correo?.value.trim() || "",
                    comprobante: comprobante?.value || "",
                };
                localStorage.setItem("checkoutCliente", JSON.stringify(cliente));
            }

            setActiveStep(next);
        });
    });

    btnPrevs.forEach((btn) => {
        btn.addEventListener("click", () => {
            const prev = parseInt(btn.dataset.prev, 10);
            setActiveStep(prev);
        });
    });

    // =========================
    // PAGAR (por ahora demo)
    // =========================
    btnPagar?.addEventListener("click", async () => {
        const carrito = getCarrito();
        if (!carrito.length) {
            alert("Tu carrito está vacío.");
            return;
        }

        if (pagoRadio && !pagoRadio.checked) {
            alert("Selecciona un método de pago para continuar.");
            return;
        }

        if ((chkDatos && !chkDatos.checked) || (chkTerminos && !chkTerminos.checked)) {
            alert("Debes aceptar las condiciones para continuar.");
            return;
        }

        // IMPORTANTE: el carrito debe tener producto_id real (de la tabla productos)
        const items = carrito.map((p) => ({
            producto_id: Number(p.producto_id),
            cantidad: Number(p.cantidad || 1),
        }));

        // validación rápida por si falta producto_id
        const faltanIds = items.some((x) => !x.producto_id || Number.isNaN(x.producto_id));
        if (faltanIds) {
            alert("Error: Hay productos sin producto_id. Debes guardar el id real del producto en el carrito.");
            return;
        }

        try {
            const r = await fetch("http://localhost:3000/api/checkout/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuario_id: null, // luego si haces login, manda el id real
                    items,
                }),
            });

            const data = await r.json();

            if (!r.ok || !data.ok) {
                alert(data.message || "No se pudo crear el pedido.");
                return;
            }

            console.log("Pedido creado:", data);

            // ✅ Total oficial calculado por DB
            alert(`Pedido #${data.pedido.id} creado. Total: S/ ${Number(data.total).toFixed(2)}`);

            // Aquí recién va Izipay:
            // 1) Crear pago con data.total
            // 2) Redirigir o mostrar pasarela

        } catch (err) {
            console.error(err);
            alert("Error conectando con el backend.");
        }
    });


    // INICIO
    setActiveStep(1);
});
