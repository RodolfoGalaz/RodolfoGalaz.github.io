document.addEventListener('DOMContentLoaded', () => {
    const materias = document.querySelectorAll('.materia');
    const modal = document.getElementById('modal-materia');
    const closeModal = document.querySelector('.close-button');

    const clearHighlights = () => {
        materias.forEach(m => {
            m.classList.remove('prereq-highlight');
        });
    };

    materias.forEach(materia => {
        // Evento para mostrar el modal al hacer clic
        materia.addEventListener('click', () => {
            document.getElementById('modal-nombre').textContent = materia.dataset.nombre;
            document.getElementById('modal-codigo').textContent = materia.id;
            document.getElementById('modal-sct').textContent = materia.dataset.sct;
            
            const prereqText = materia.dataset.prereq ? materia.dataset.prereq.split(',').join(', ') : "No tiene";
            document.getElementById('modal-prereq').textContent = prereqText;

            const descElement = document.getElementById('modal-desc');
            if (materia.dataset.desc) {
                descElement.textContent = materia.dataset.desc;
                descElement.style.display = 'block';
            } else {
                descElement.style.display = 'none';
            }

            const recursosBtn = document.getElementById('modal-recursos');
            if (materia.dataset.recursos) {
                recursosBtn.href = materia.dataset.recursos;
                recursosBtn.style.display = 'inline-block';
            } else {
                recursosBtn.style.display = 'none';
            }
            
            modal.classList.add('active'); // Usamos una clase para la animación
        });

        // Evento para resaltar prerrequisitos al pasar el mouse
        materia.addEventListener('mouseenter', () => {
            const prereqCodes = materia.dataset.prereq.split(',');
            
            if (prereqCodes[0] !== "") {
                prereqCodes.forEach(code => {
                    const prereqElement = document.getElementById(code.trim());
                    if (prereqElement) {
                        prereqElement.classList.add('prereq-highlight');
                    }
                });
            }
        });

        // ===== SOLUCIÓN AL HOVER FANTASMA =====
        // Cuando el mouse sale de la materia, limpiamos los resaltados.
        materia.addEventListener('mouseleave', clearHighlights);
    });

    // --- Lógica del Modal ---
    const cerrarModal = () => {
        modal.classList.remove('active'); // Usamos la clase para la animación de salida
    };

    closeModal.addEventListener('click', cerrarModal);

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            cerrarModal();
        }
    });
});
