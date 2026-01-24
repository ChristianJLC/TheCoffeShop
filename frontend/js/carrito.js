document.addEventListener("DOMContentLoaded", () => {
    const navBadge = document.querySelector(".CartButton_quantity__3sdzT");
    if (!navBadge) return;

    function getCarrito() {
        return JSON.parse(localStorage.getItem("carrito") || "[]");
    }

    function totalCantidad(carrito) {
        return carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0);
    }

    function actualizarBadgeNav() {
        const carrito = getCarrito();
        navBadge.textContent = totalCantidad(carrito);
    }

    actualizarBadgeNav();

    // 🔥 cuando productos.js agregue algo, se actualiza al instante
    window.addEventListener("carritoActualizado", actualizarBadgeNav);

    // 🔥 también se actualiza si cambias de pestaña/ventana
    window.addEventListener("storage", actualizarBadgeNav);
});
