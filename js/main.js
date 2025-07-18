// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const materias = document.querySelectorAll('.materia');
    const modal = document.getElementById('modal-materia');
    const closeModal = document.querySelector('.close-button');

    // Función para limpiar todos los resaltados
    const clearHighlights = () => {
        materias.forEach(m => {
            m.classList.remove('prereq-highlight', 'successor-highlight');
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
            
            // Aquí puedes configurar el enlace a los recursos si lo tienes
            // document.getElementById('modal-recursos').href = "tu/enlace/" + materia.id;

            modal.style.display = 'block';
        });

        // Evento para resaltar prerrequisitos al pasar el mouse
        materia.addEventListener('mouseover', () => {
            clearHighlights();
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
    });

    // Limpiar resaltados cuando el mouse sale de la grilla
    document.querySelector('.malla-grid').addEventListener('mouseleave', clearHighlights);

    // --- Lógica del Modal ---
    const cerrarModal = () => {
        modal.style.display = 'none';
    };

    closeModal.addEventListener('click', cerrarModal);

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            cerrarModal();
        }
    });
});
