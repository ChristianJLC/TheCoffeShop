document.addEventListener("DOMContentLoaded", () => {
    // ====== CONTADOR + / - ======
    const btnPlus = document.getElementById("btn-plus");
    const btnMinus = document.getElementById("btn-minus");
    const inputCantidad = document.getElementById("cantidad");

    btnPlus?.addEventListener("click", () => {
        inputCantidad.value = parseInt(inputCantidad.value, 10) + 1;
    });

    btnMinus?.addEventListener("click", () => {
        const valor = parseInt(inputCantidad.value, 10);
        if (valor > 1) inputCantidad.value = valor - 1;
    });

    // ====== DATOS DEL PRODUCTO ======
    const btnAgregar = document.querySelector(".contenedor-producto_info_agregar");

    const productoNombre =
        document.querySelector(".contenedor-producto_info h2")?.textContent?.trim() || "";

    const productoDesc =
        document.querySelector(".contenedor-producto_info p")?.textContent?.trim() || "";

    const productoPrecioTexto =
        document.querySelector(".contenedor-producto_info span")?.textContent || "";

    const productoImg =
        document.querySelector(".contenedor-producto_img img")?.getAttribute("src") || "";

    const precioNumero = parseFloat(
        productoPrecioTexto.replace(",", ".").match(/(\d+(\.\d+)?)/)?.[0] || "0"
    );

    // ====== MODAL ======
    const overlay = document.getElementById("modal-overlay");
    const btnClose = document.getElementById("modal-close");
    const btnSeguir = document.getElementById("btn-seguir");

    const modalImg = document.getElementById("modal-img");
    const modalName = document.getElementById("modal-name");
    const modalPrice = document.getElementById("modal-price");
    const modalDesc = document.getElementById("modal-desc");
    const modalBadge = document.getElementById("modal-badge");

    function abrirModal() {
        overlay?.classList.add("is-open");
    }

    function cerrarModal() {
        overlay?.classList.remove("is-open");
    }

    overlay?.addEventListener("click", (e) => {
        if (e.target === overlay) cerrarModal();
    });

    btnClose?.addEventListener("click", cerrarModal);
    btnSeguir?.addEventListener("click", cerrarModal);

    // ====== LOCALSTORAGE CARRITO ======
    function getCarrito() {
        return JSON.parse(localStorage.getItem("carrito") || "[]");
    }

    function setCarrito(carrito) {
        localStorage.setItem("carrito", JSON.stringify(carrito));
    }

    // ====== AGREGAR AL CARRITO ======
    btnAgregar?.addEventListener("click", () => {
        const cantidad = parseInt(inputCantidad.value, 10);
        const carrito = getCarrito();

        // id simple (luego será id real de BD)
        const id = productoNombre.toLowerCase().replace(/\s+/g, "-");

        const existente = carrito.find((p) => p.id === id);

        if (existente) {
            existente.cantidad += cantidad;
        } else {
            carrito.push({
                id,
                nombre: productoNombre,
                descripcion: productoDesc,
                precio: precioNumero,
                imagen: productoImg,
                cantidad,
            });
        }

        setCarrito(carrito);

        // ✅ disparar evento para que carrito.js (y cualquier otro) actualice el badge si quieres
        window.dispatchEvent(new Event("carritoActualizado"));

        // llenar modal
        modalImg.src = productoImg;
        modalImg.alt = productoNombre;
        modalName.textContent = productoNombre;
        modalDesc.textContent = productoDesc;
        modalPrice.textContent = `S/ ${precioNumero.toFixed(2)}`;
        modalBadge.textContent = cantidad;

        abrirModal();
    });
});
