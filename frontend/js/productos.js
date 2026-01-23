const btnPlus = document.getElementById("btn-plus");
const btnMinus = document.getElementById("btn-minus");
const inputCantidad = document.getElementById("cantidad");

btnPlus.addEventListener("click", () => {
    inputCantidad.value = parseInt(inputCantidad.value) + 1;
});

btnMinus.addEventListener("click", () => {
    let valor = parseInt(inputCantidad.value);

    if (valor > 1) {
        inputCantidad.value = valor - 1;
    }
});
