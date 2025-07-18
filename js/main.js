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

            // ===== LÓGICA DEL BOTÓN DE RECURSOS =====
            const recursosBtn = document.getElementById('modal-recursos');
            if (materia.dataset.recursos) {
                recursosBtn.href = materia.dataset.recursos;
                recursosBtn.style.display = 'inline-block'; // Muestra el botón
            } else {
                recursosBtn.style.display = 'none'; // Oculta el botón si no hay enlace
            }
            
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

    document.querySelector('.malla-grid').addEventListener('mouseleave', clearHighlights);

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
