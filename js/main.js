// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const materias = document.querySelectorAll('.materia');
    const modal = document.getElementById('modal-materia');
    const closeModal = document.querySelector('.close-button');

    materias.forEach(materia => {
        materia.addEventListener('click', () => {
            // Obtener datos del atributo data-*
            const nombre = materia.dataset.nombre;
            const codigo = materia.dataset.codigo;
            const descripcion = materia.dataset.descripcion;
            const recursos = materia.dataset.recursos;

            // Llenar el modal con la información
            document.getElementById('modal-nombre').textContent = nombre;
            document.getElementById('modal-codigo').textContent = codigo;
            document.getElementById('modal-descripcion').textContent = descripcion;
            document.getElementById('modal-recursos').href = recursos;

            // Mostrar el modal
            modal.style.display = 'block';
        });
    });

    // Función para cerrar el modal
    const cerrarModal = () => {
        modal.style.display = 'none';
    };

    // Cerrar al hacer clic en la 'X'
    closeModal.addEventListener('click', cerrarModal);

    // Cerrar al hacer clic fuera del contenido del modal
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            cerrarModal();
        }
    });
});
