const botones = document.querySelectorAll('#bebidas .productos-filtros button');

const secciones = {
    'frapuccinos-productos': document.querySelector('.frapuccinos-productos'),
    'cafeCaliente-productos': document.querySelector('.cafeCaliente-productos'),
    'cafeFrio-productos': document.querySelector('.cafeFrio-productos')
};

botones.forEach(boton => {
    boton.addEventListener('click', () => {

        // Quitar activo a todos
        botones.forEach(b => b.classList.remove('filtro-activo'));
        boton.classList.add('filtro-activo');

        // Ocultar todas las secciones
        Object.values(secciones).forEach(sec => {
            sec.style.display = 'none';
        });

        // Mostrar la sección correspondiente
        const target = boton.dataset.target;
        secciones[target].style.display = 'block';
    });
});
