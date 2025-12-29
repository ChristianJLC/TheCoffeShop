const botonesBebidas = document.querySelectorAll('#bebidas .productos-filtros button');
const seccionesBebidas = {
    'frapuccinos-productos': document.querySelector('.frapuccinos-productos'),
    'cafeCaliente-productos': document.querySelector('.cafeCaliente-productos'),
    'cafeFrio-productos': document.querySelector('.cafeFrio-productos')
};
botonesBebidas.forEach(boton => {
    boton.addEventListener('click', () => {
        botonesBebidas.forEach(b => b.classList.remove('filtro-activo'));
        boton.classList.add('filtro-activo');
        Object.values(seccionesBebidas).forEach(sec => {
            sec.style.display = 'none';
        });
        const target = boton.dataset.target;
        seccionesBebidas[target].style.display = 'block';
    });
});

const botonesAlimentos = document.querySelectorAll('#alimentos .productos-filtros button');
const seccionesAlimentos = {
    'pastries-productos': document.querySelector('.pastries-productos'),
    'postres-productos': document.querySelector('.postres-productos'),
    'sandwich-productos': document.querySelector('.sandwich-productos')
};
botonesAlimentos.forEach(boton => {
    boton.addEventListener('click', () => {
        botonesAlimentos.forEach(b => b.classList.remove('filtro-activo'));
        boton.classList.add('filtro-activo');
        Object.values(seccionesAlimentos).forEach(sec => {
            sec.style.display = 'none';
        });
        const target = boton.dataset.target;
        seccionesAlimentos[target].style.display = 'block';
    });
});