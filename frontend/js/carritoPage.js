document.addEventListener("DOMContentLoaded", () => {
    const estadoVacio = document.getElementById("estadoVacio");
    const estadoLleno = document.getElementById("estadoLleno");

    if (!estadoVacio || !estadoLleno) return;

    const cartList = document.querySelector("#estadoLleno .cart-list");
    const cartCount = document.querySelector("#estadoLleno .cart-count");

    const summaryRows = document.querySelectorAll("#estadoLleno .summary-row");
    const subtotalEl = summaryRows?.[0]?.querySelector("span:last-child") || null;
    const totalEl = document.querySelector("#estadoLleno .summary-total span:last-child");

    const notaPedido = document.getElementById("notaPedido");

    function cargarNota() {
        if (!notaPedido) return;
        notaPedido.value = localStorage.getItem("checkoutNota") || "";
    }

    notaPedido?.addEventListener("input", () => {
        localStorage.setItem("checkoutNota", notaPedido.value);
    });


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

    function getCarrito() {
        return JSON.parse(localStorage.getItem("carrito") || "[]");
    }

    function setCarrito(carrito) {
        localStorage.setItem("carrito", JSON.stringify(carrito));
        window.dispatchEvent(new Event("carritoActualizado"));
    }

    function totalCantidad(carrito) {
        return carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0);
    }

    function totalPrecio(carrito) {
        return carrito.reduce((acc, item) => acc + (item.precio || 0) * (item.cantidad || 0), 0);
    }

    function money(n) {
        return `S/ ${Number(n || 0).toFixed(2)}`;
    }

    function mostrarEstado(carrito) {
        const vacio = carrito.length === 0;

        estadoVacio.style.display = vacio ? "block" : "none";
        estadoLleno.style.display = vacio ? "none" : "block";
    }

    function render() {
        const carrito = getCarrito();

        mostrarEstado(carrito);
        if (carrito.length === 0) return;

        if (cartList) cartList.innerHTML = "";

        carrito.forEach((item) => {
            const article = document.createElement("article");
            article.className = "cart-item";
            article.dataset.id = item.id;

            const img = normalizarImg(item.imagen || "");

            article.innerHTML = `
        <div class="cart-item__img">
          <img src="${img}" alt="${item.nombre || "Producto"}">
        </div>

        <div class="cart-item__info">
          <h3 class="cart-item__name">${item.nombre || ""}</h3>
          <p class="cart-item__price">${money(item.precio)}</p>
        </div>

        <div class="cart-item__actions">
          <div class="qty">
            <button type="button" class="qty__btn js-remove" aria-label="Eliminar">
              <i class="fa-regular fa-trash-can"></i>
            </button>

            <button type="button" class="qty__btn js-minus" aria-label="Disminuir">
              <i class="fa-solid fa-minus"></i>
            </button>

            <span class="qty__value">${item.cantidad || 1}</span>

            <button type="button" class="qty__btn js-plus" aria-label="Aumentar">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      `;

            cartList?.appendChild(article);
        });

        if (cartCount) cartCount.textContent = `(${totalCantidad(carrito)})`;

        const total = totalPrecio(carrito);
        if (subtotalEl) subtotalEl.textContent = money(total);
        if (totalEl) totalEl.textContent = money(total);
    }

    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".js-plus, .js-minus, .js-remove");
        if (!btn) return;

        const itemEl = btn.closest(".cart-item");
        if (!itemEl) return;

        const id = itemEl.dataset.id;
        if (!id) return;

        const carrito = getCarrito();
        const item = carrito.find((p) => p.id === id);
        if (!item) return;

        if (btn.classList.contains("js-plus")) {
            item.cantidad = (item.cantidad || 1) + 1;
        }

        if (btn.classList.contains("js-minus")) {
            const nueva = (item.cantidad || 1) - 1;
            item.cantidad = Math.max(1, nueva);
        }

        if (btn.classList.contains("js-remove")) {
            const nuevoCarrito = carrito.filter((p) => p.id !== id);
            setCarrito(nuevoCarrito);
            render();
            return;
        }

        setCarrito(carrito);
        render();
    });

    window.addEventListener("carritoActualizado", render);

    window.addEventListener("storage", (e) => {
        if (e.key === "carrito") render();
    });

    const btnIrPagar = document.querySelector(".pay-btn");

    btnIrPagar?.addEventListener("click", () => {
        const carrito = getCarrito();
        if (!carrito.length) {
            alert("Tu carrito está vacío.");
            return;
        }

        if (notaPedido) {
            localStorage.setItem("checkoutNota", notaPedido.value || "");
        }

        window.location.href = "./checkout.html";
    });


    render();
    cargarNota();
});

