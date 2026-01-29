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

    window.addEventListener("carritoActualizado", actualizarBadgeNav);

    window.addEventListener("storage", (e) => {
        if (e.key === "carrito") actualizarBadgeNav();
    });

    /*window.addEventListener("storage", actualizarBadgeNav);*/
});
