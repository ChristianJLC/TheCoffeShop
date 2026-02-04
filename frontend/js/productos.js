document.addEventListener("DOMContentLoaded", () => {
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

    const btnAgregar = document.querySelector(".contenedor-producto_info_agregar");

    const productoNombre =
        document.querySelector(".contenedor-producto_info h2")?.textContent?.trim() || "";

    const productoDesc =
        document.querySelector(".contenedor-producto_info p")?.textContent?.trim() || "";

    const productoPrecioTexto =
        document.querySelector(".contenedor-producto_info span")?.textContent || "";

    const productoImgRel =
        document.querySelector(".contenedor-producto_img img")?.getAttribute("src") || "";

    const productoImg = productoImgRel ? new URL(productoImgRel, window.location.href).href : "";

    const precioNumero = parseFloat(
        productoPrecioTexto.replace(",", ".").match(/(\d+(\.\d+)?)/)?.[0] || "0"
    );

    const productoId = Number(btnAgregar?.dataset?.productoId || 0);

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

    function getCarrito() {
        return JSON.parse(localStorage.getItem("carrito") || "[]");
    }

    function setCarrito(carrito) {
        localStorage.setItem("carrito", JSON.stringify(carrito));
    }

    btnAgregar?.addEventListener("click", () => {
        const cantidad = parseInt(inputCantidad.value, 10);
        const carrito = getCarrito();

        
        if (!productoId || Number.isNaN(productoId)) {
            alert("Falta data-producto-id en el botón Agregar (id real del producto).");
            return;
        }

       
        const id = productoNombre.toLowerCase().replace(/\s+/g, "-");

        const existente = carrito.find((p) => p.producto_id === productoId);

        if (existente) {
            existente.cantidad += cantidad;
        } else {
            carrito.push({
                producto_id: productoId, 
                id,                       
                nombre: productoNombre,
                descripcion: productoDesc,
                precio: precioNumero,     
                imagen: productoImg,
                cantidad,
            });
        }

        setCarrito(carrito);
        window.dispatchEvent(new Event("carritoActualizado"));

        if (modalImg) {
            modalImg.src = productoImg;
            modalImg.alt = productoNombre;
        }
        if (modalName) modalName.textContent = productoNombre;
        if (modalDesc) modalDesc.textContent = productoDesc;
        if (modalPrice) modalPrice.textContent = `S/ ${precioNumero.toFixed(2)}`;
        if (modalBadge) modalBadge.textContent = cantidad;

        abrirModal();
    });
});
