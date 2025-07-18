// En js/script.js, al principio de todo el archivo

// Registrar el Service Worker para la funcionalidad PWA y offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registrado con éxito:', registration);
            })
            .catch(error => {
                console.log('Fallo en el registro del Service Worker:', error);
            });
    });
}

// ... aquí comienza el resto de tu código con document.addEventListener ...

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DE LA BASE DE DATOS Y CONSTANTES ---
    const db = new Dexie("AlquimistaDB_Final_v5");
    db.version(1).stores({
        archivos: '++id, nombre, tipo, tamano, carpetaId, data',
        carpetas: '++id, nombre',
        asignaturas: '++id, nombre, color',
        bloquesClase: '++id, asignaturaId, tipo, dia, horaInicio, horaFin, sala',
        config: 'key, value',
        eventos: '++id, date, time, endTime, title, type',
        tareas: '++id, text, completed, priority'
    });
    
    // --- SELECTORES GLOBALES DE ELEMENTOS ---
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const settingsTrigger = document.getElementById('settings-trigger');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const root = document.documentElement;
    
    // --- NAVEGACIÓN Y TEMAS ---
    async function applyTheme(theme) {
        const themeColors = { rojo: 'var(--accent-red)', azul: 'var(--accent-blue)', verde: 'var(--accent-green)', purpura: 'var(--accent-purple)' };
        root.style.setProperty('--accent-primary', themeColors[theme] || 'var(--accent-red)');
        await db.config.put({ key: 'theme', value: theme });
    }
    settingsTrigger.addEventListener('click', () => settingsPanel.classList.add('visible'));
    closeSettingsBtn.addEventListener('click', () => settingsPanel.classList.remove('visible'));
    themeButtons.forEach(btn => btn.addEventListener('click', () => applyTheme(btn.dataset.theme)));
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.target;
            document.querySelector('.nav-link.active').classList.remove('active');
            link.classList.add('active');
            document.querySelector('.content-section.active').classList.remove('active');
            document.getElementById(targetId).classList.add('active');
            window.dispatchEvent(new CustomEvent('tabChanged', { detail: { tabId: targetId } }));
        });
    });

    // --- MÓDULO MALLA Y GPA ---
    const cursos = document.querySelectorAll('.malla-grid-container .curso');
    const gpaValueEl = document.getElementById('gpa-value');
    const gradeModal = document.getElementById('grade-modal');
    const gradeForm = document.getElementById('grade-form');
    async function initMalla() {
        const config = await db.config.get('mallaData') || { value: { estados: {}, notas: {} } };
        const estadosGuardados = config.value.estados;
        const notasGuardadas = config.value.notas;
        function guardarMallaData() { db.config.put({ key: 'mallaData', value: { estados: estadosGuardados, notas: notasGuardadas } }); }
        function calcularYMostrarGPA() {
            let totalSCT = 0, sumaPonderada = 0;
            cursos.forEach((curso, index) => {
                if (estadosGuardados[index] === 'aprobado' && notasGuardadas[index]) {
                    const nota = parseFloat(notasGuardadas[index]), sct = parseInt(curso.dataset.sct);
                    if (!isNaN(nota) && sct > 0) { sumaPonderada += nota * sct; totalSCT += sct; }
                }
            });
            gpaValueEl.textContent = totalSCT > 0 ? (sumaPonderada / totalSCT).toFixed(2) : "N/A";
        }
        cursos.forEach((curso, index) => {
            const estado = estadosGuardados[index] || 'normal';
            curso.dataset.estado = estado;
            curso.classList.toggle('cursando', estado === 'cursando');
            curso.classList.toggle('aprobado', estado === 'aprobado');
            curso.addEventListener('click', () => {
                const estadosCiclo = ['normal', 'cursando', 'aprobado'];
                const nuevoIndice = (estadosCiclo.indexOf(curso.dataset.estado) + 1) % estadosCiclo.length;
                const nuevoEstado = estadosCiclo[nuevoIndice];
                curso.dataset.estado = nuevoEstado;
                estadosGuardados[index] = nuevoEstado;
                curso.classList.remove('cursando', 'aprobado');
                if(nuevoEstado !== 'normal') curso.classList.add(nuevoEstado);
                if (nuevoEstado === 'aprobado' && !notasGuardadas[index]) {
                    document.getElementById('grade-course-name').textContent = curso.querySelector('span').textContent;
                    document.getElementById('grade-course-index').value = index;
                    gradeModal.classList.add('visible');
                } else if (nuevoEstado !== 'aprobado') { delete notasGuardadas[index]; }
                guardarMallaData();
                calcularYMostrarGPA();
            });
        });
        gradeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const index = document.getElementById('grade-course-index').value;
            const nota = parseFloat(document.getElementById('grade-input').value);
            if (!isNaN(nota) && nota >= 1.0 && nota <= 7.0) {
                notasGuardadas[index] = nota;
                guardarMallaData();
                calcularYMostrarGPA();
                gradeModal.classList.remove('visible');
            } else { alert("Nota no válida."); }
        });
        document.getElementById('cancel-grade-btn').addEventListener('click', () => gradeModal.classList.remove('visible'));
        calcularYMostrarGPA();
    }

    // --- MÓDULO CALENDARIO Y EVENTOS ---
    const calendarDays = document.getElementById('calendar-days');
    const eventModal = document.getElementById('event-modal');
    let currentDate = new Date();
    async function renderCalendar() {
        const events = await db.eventos.toArray();
        const year = currentDate.getFullYear(), month = currentDate.getMonth();
        const today = new Date();
        document.getElementById('month-year').textContent = `${new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(currentDate)} ${year}`;
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        calendarDays.innerHTML = '';
        for (let i = 0; i < firstDayOfMonth; i++) calendarDays.innerHTML += `<div class="empty"></div>`;
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            const dayNumber = document.createElement('span');
            dayNumber.textContent = day;
            dayCell.appendChild(dayNumber);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) dayCell.classList.add('current-day');
            if (events.some(e => e.date === dateStr)) dayCell.classList.add('has-event');
            dayCell.addEventListener('click', () => openEventModal(dateStr));
            calendarDays.appendChild(dayCell);
        }
    }
    function openEventModal(date, time = '') {
        document.getElementById('event-form').reset();
        document.getElementById('event-date').value = date;
        document.getElementById('event-time-input').value = time;
        eventModal.classList.add('visible');
    }
    document.getElementById('prev-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('next-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    document.getElementById('cancel-event-btn').addEventListener('click', () => eventModal.classList.remove('visible'));
    document.getElementById('event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await db.eventos.add({ date: document.getElementById('event-date').value, time: document.getElementById('event-time-input').value, endTime: document.getElementById('event-end-time-input').value, title: document.getElementById('event-title-input').value, type: document.getElementById('event-type-input').value });
        eventModal.classList.remove('visible');
        renderCalendar();
        window.renderWeeklySchedule();
    });
    window.openEventModal = openEventModal;

    // --- MÓDULO HORARIO ---
    const scheduleBody = document.getElementById('schedule-body');
    const classModal = document.getElementById('class-modal');
    let weekStartDate = new Date();
    function setupScheduleView() {
        scheduleBody.innerHTML = '';
        const startTime = 8.5, endTime = 19.5, timeStep = 0.5;
        for (let time = startTime; time < endTime; time += timeStep) {
            const row = document.createElement('tr'), timeCell = document.createElement('td');
            timeCell.className = 'time-cell';
            const hour = Math.floor(time), minutes = (time % 1) * 60;
            timeCell.textContent = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            row.appendChild(timeCell);
            for (let day = 0; day < 6; day++) {
                const slotCell = document.createElement('td');
                slotCell.className = 'slot-cell';
                slotCell.dataset.day = day; slotCell.dataset.time = time;
                row.appendChild(slotCell);
            }
            scheduleBody.appendChild(row);
        }
    }
    async function renderWeeklySchedule() {
        document.querySelectorAll('.schedule-event, .schedule-class').forEach(el => el.remove());
        const today = new Date(), dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);
        weekStartDate = startOfWeek;
        const asignaturas = await db.asignaturas.toArray();
        const bloques = await db.bloquesClase.toArray();
        bloques.forEach(bloque => {
            const asignatura = asignaturas.find(a => a.id === bloque.asignaturaId);
            if(!asignatura) return;
            const [startHour, startMinute] = bloque.horaInicio.split(':').map(Number);
            const [endHour, endMinute] = bloque.horaFin.split(':').map(Number);
            const startTimeDecimal = startHour + startMinute / 60;
            const endTimeDecimal = endHour + endMinute / 60;
            const durationDecimal = Math.max(0.5, endTimeDecimal - startTimeDecimal);
            const targetCell = document.querySelector(`.slot-cell[data-day="${bloque.dia}"][data-time="${startTimeDecimal}"]`);
            if (targetCell) {
                const classEl = document.createElement('div');
                classEl.className = 'schedule-class';
                classEl.style.height = `${(durationDecimal / 0.5) * 40 - 2}px`;
                classEl.style.background = asignatura.color;
                classEl.innerHTML = `<span class="schedule-class-inner">${asignatura.nombre}</span> <span class="schedule-class-type">${bloque.tipo}</span>`;
                targetCell.appendChild(classEl);
            }
        });
        const events = await db.eventos.toArray();
        for (let i = 0; i < 6; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            const dateStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
            events.filter(e => e.date === dateStr).forEach(event => {
                const [startHour, startMinute] = event.time.split(':').map(Number);
                const [endHour, endMinute] = event.endTime.split(':').map(Number);
                const startTimeDecimal = startHour + startMinute / 60;
                const endTimeDecimal = endHour + endMinute / 60;
                const durationDecimal = Math.max(0.5, endTimeDecimal - startTimeDecimal);
                const targetCell = document.querySelector(`.slot-cell[data-day="${i}"][data-time="${startTimeDecimal}"]`);
                if (targetCell) {
                    const eventEl = document.createElement('div');
                    eventEl.className = 'schedule-event';
                    eventEl.textContent = event.title;
                    eventEl.dataset.type = event.type;
                    eventEl.style.height = `${(durationDecimal / 0.5) * 40 - 4}px`;
                    targetCell.appendChild(eventEl);
                }
            });
        }
    }
    scheduleBody.addEventListener('click', (e) => {
        const targetCell = e.target.closest('.slot-cell');
        if (!targetCell) return;
        const dayIndex = parseInt(targetCell.dataset.day, 10), timeDecimal = parseFloat(targetCell.dataset.time);
        const hour = Math.floor(timeDecimal), minutes = (timeDecimal % 1) * 60;
        const clickedTime = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        const clickedDate = new Date(weekStartDate);
        clickedDate.setDate(weekStartDate.getDate() + dayIndex);
        const dateStr = `${clickedDate.getFullYear()}-${String(clickedDate.getMonth() + 1).padStart(2, '0')}-${String(clickedDate.getDate()).padStart(2, '0')}`;
        window.openEventModal(dateStr, clickedTime);
    });
    async function initHorario() {
        const classModal = document.getElementById('class-modal');
        const addClassBtn = document.getElementById('add-class-btn');
        const addClassForm = document.getElementById('add-class-form');
        const cancelClassBtn = document.getElementById('cancel-class-btn');
        const addBlockBtn = document.getElementById('add-class-block-btn');
        const blocksContainer = document.getElementById('class-blocks-container');
        const fixedClassList = document.getElementById('fixed-class-list');
        
        function createBlockInputs() {
            const blockDiv = document.createElement('div');
            blockDiv.className = 'class-block';
            blockDiv.innerHTML = `
                <select class="class-block-type"><option value="Cátedra">Cátedra</option><option value="Ayudantía">Ayudantía</option></select>
                <select class="class-block-day"><option value="0">Lunes</option><option value="1">Martes</option><option value="2">Miércoles</option><option value="3">Jueves</option><option value="4">Viernes</option><option value="5">Sábado</option></select>
                <input type="time" class="class-block-start" required>
                <input type="time" class="class-block-end" required>
                <input type="text" class="class-block-room" placeholder="Sala (Opcional)">
            `;
            blocksContainer.appendChild(blockDiv);
        }

        async function renderFixedClassList() {
            const asignaturas = await db.asignaturas.toArray();
            fixedClassList.innerHTML = '';
            asignaturas.forEach(asig => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${asig.nombre}</span><button class="delete-btn" data-id="${asig.id}">✖</button>`;
                li.style.borderLeftColor = asig.color;
                fixedClassList.appendChild(li);
            });
        }

        addClassBtn.addEventListener('click', () => { addClassForm.reset(); blocksContainer.innerHTML = ''; createBlockInputs(); classModal.classList.add('visible'); });
        cancelClassBtn.addEventListener('click', () => classModal.classList.remove('visible'));
        addBlockBtn.addEventListener('click', createBlockInputs);

        addClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const asignaturaId = await db.asignaturas.add({
                nombre: document.getElementById('class-title-input').value,
                color: document.getElementById('class-color-input').value
            });
            const blockElements = blocksContainer.querySelectorAll('.class-block');
            for (const blockEl of blockElements) {
                await db.bloquesClase.add({
                    asignaturaId,
                    tipo: blockEl.querySelector('.class-block-type').value,
                    dia: blockEl.querySelector('.class-block-day').value,
                    horaInicio: blockEl.querySelector('.class-block-start').value,
                    horaFin: blockEl.querySelector('.class-block-end').value,
                    sala: blockEl.querySelector('.class-block-room').value
                });
            }
            classModal.classList.remove('visible');
            renderFixedClassList();
            renderWeeklySchedule();
        });

        fixedClassList.addEventListener('click', async (e) => {
            if(e.target.classList.contains('delete-btn')) {
                const id = parseInt(e.target.dataset.id);
                await db.bloquesClase.where('asignaturaId').equals(id).delete();
                await db.asignaturas.delete(id);
                renderFixedClassList();
                renderWeeklySchedule();
            }
        });
        setupScheduleView();
        renderFixedClassList();
    }
    window.renderWeeklySchedule = renderWeeklySchedule;

    // --- MÓDULO BIBLIOTECA ---
    const fileForm = document.getElementById('add-file-form');
    const folderForm = document.getElementById('add-folder-form');
    const libraryGrid = document.getElementById('file-library');
    async function initLibrary() {
        const fileFolderSelect = document.getElementById('file-folder-select');
        async function populateFolderSelect() {
            const carpetas = await db.carpetas.toArray();
            fileFolderSelect.innerHTML = '<option value="root">Archivo Raíz</option>';
            carpetas.forEach(c => fileFolderSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`);
        }
        async function renderLibrary() {
            libraryGrid.innerHTML = '';
            const carpetas = await db.carpetas.toArray();
            const archivos = await db.archivos.toArray();
            function createFolderContainer(carpeta, files) {
                const container = document.createElement('div'); container.className = 'folder-container';
                const header = document.createElement('div'); header.className = 'folder-header'; header.textContent = carpeta.nombre; container.appendChild(header);
                const content = document.createElement('div'); content.className = 'folder-content';
                if (files.length === 0) { content.innerHTML = '<p style="color: var(--font-color-muted); font-style: italic;">Carpeta vacía.</p>'; } 
                else {
                    files.forEach(archivo => {
                        let icon = '📜'; if (archivo.tipo.startsWith('image/')) icon = '🖼️'; if (archivo.tipo === 'application/pdf') icon = '📄';
                        const card = document.createElement('div'); card.className = 'scroll-card';
                        card.innerHTML = `<div class="icon">${icon}</div><h4>${archivo.nombre}</h4><div class="file-info">${(archivo.tamano / 1024 / 1024).toFixed(2)} MB</div><div class="actions"><button class="open-file" data-id="${archivo.id}">Abrir</button><button class="delete-file" data-id="${archivo.id}">Borrar</button></div>`;
                        content.appendChild(card);
                    });
                }
                container.appendChild(content); return container;
            }
            libraryGrid.appendChild(createFolderContainer({ id: 'root', nombre: 'Archivo Raíz' }, archivos.filter(a => a.carpetaId === 'root' || !a.carpetaId)));
            carpetas.forEach(c => libraryGrid.appendChild(createFolderContainer(c, archivos.filter(a => a.carpetaId == c.id))));
        }
        folderForm.addEventListener('submit', async (e) => { e.preventDefault(); const name = document.getElementById('folder-name-input').value.trim(); if(name) { await db.carpetas.add({nombre: name}); folderForm.reset(); populateFolderSelect(); renderLibrary(); } });
        fileForm.addEventListener('submit', async (e) => { e.preventDefault(); const file = document.getElementById('file-input').files[0]; const name = document.getElementById('file-custom-name').value.trim(); if(file && name) { await db.archivos.add({nombre: name, tipo: file.type, tamano: file.size, carpetaId: fileFolderSelect.value, data: file}); fileForm.reset(); renderLibrary(); } });
        libraryGrid.addEventListener('click', async (e) => { const id = parseInt(e.target.dataset.id); if (!id) return; if (e.target.classList.contains('open-file')) { const a = await db.archivos.get(id); window.open(URL.createObjectURL(a.data), '_blank'); } else if (e.target.classList.contains('delete-file')) { if (confirm('¿Borrar este pergamino?')) { await db.archivos.delete(id); renderLibrary(); } } });
        window.renderLibrary = renderLibrary;
        populateFolderSelect();
    }

    // --- MÓDULO TAREAS ---
    const taskForm = document.getElementById('add-task-form');
    const taskList = document.getElementById('task-list');
    async function renderTasks() {
        const tasks = await db.tareas.toArray();
        const priorityMap = { alta: 3, normal: 2, baja: 1 };
        tasks.sort((a, b) => (priorityMap[b.priority] || 2) - (priorityMap[a.priority] || 2));
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `priority-${task.priority} ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `<span data-id="${task.id}">${task.text}</span><button class="delete-btn" data-id="${task.id}">✖</button>`;
            taskList.appendChild(li);
        });
    };
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('task-input').value.trim();
        if (text) {
            await db.tareas.add({ text, completed: false, priority: document.getElementById('task-priority-input').value });
            taskForm.reset();
            document.getElementById('task-priority-input').value = 'normal';
            await renderTasks();
            await renderDashboard();
        }
    });
    taskList.addEventListener('click', async (e) => {
        const id = parseInt(e.target.dataset.id);
        if (!id) return;
        if (e.target.matches('span')) {
            const task = await db.tareas.get(id);
            await db.tareas.update(id, { completed: !task.completed });
        } else if (e.target.matches('.delete-btn')) {
            await db.tareas.delete(id);
        }
        await renderTasks();
        await renderDashboard();
    });
    
    // --- MÓDULO DASHBOARD Y POMODORO ---
    const sound = document.getElementById('pomodoro-sound');
    let timerId = null, timeLeft = 25 * 60, isPaused = true, mode = 'work';
    async function renderDashboard() {
        const todayStr = new Date().toISOString().slice(0, 10);
        const events = await db.eventos.where('date').equals(todayStr).sortBy('time');
        document.getElementById('today-events-list').innerHTML = events.length ? events.map(e => `<li>${e.time} - ${e.title}</li>`).join('') : '<li>No hay eventos para hoy.</li>';
        const tasks = await db.tareas.where('completed').equals(0).toArray();
        const priorityMap = { alta: 3, normal: 2, baja: 1 };
        tasks.sort((a, b) => (priorityMap[b.priority] || 2) - (priorityMap[a.priority] || 2));
        document.getElementById('urgent-tasks-list').innerHTML = tasks.length ? tasks.slice(0, 3).map(t => `<li class="priority-${t.priority}">${t.text}</li>`).join('') : '<li>¡Ningún decreto urgente!</li>';
    }
    function updateTimerDisplay() { const minutes = Math.floor(timeLeft / 60), seconds = timeLeft % 60; document.getElementById('pomodoro-timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; }
    function switchMode() { mode = mode === 'work' ? 'break' : 'work'; timeLeft = mode === 'work' ? 25 * 60 : 5 * 60; document.getElementById('pomodoro-mode').textContent = mode === 'work' ? "¡A Trabajar!" : "Descanso Merecido"; isPaused = true; updateTimerDisplay(); }
    document.getElementById('pomodoro-start').addEventListener('click', () => { if (isPaused) { isPaused = false; timerId = setInterval(() => { timeLeft--; updateTimerDisplay(); if (timeLeft <= 0) { clearInterval(timerId); sound.play(); switchMode(); } }, 1000); } });
    document.getElementById('pomodoro-pause').addEventListener('click', () => { isPaused = true; clearInterval(timerId); });
    document.getElementById('pomodoro-reset').addEventListener('click', () => { isPaused = true; clearInterval(timerId); mode = 'work'; timeLeft = 25 * 60; document.getElementById('pomodoro-mode').textContent = "¡A Trabajar!"; updateTimerDisplay(); });
    window.addEventListener('tabChanged', e => { if (e.detail.tabId === 'dashboard') renderDashboard(); });

    // --- INICIALIZACIÓN GLOBAL ---
    (async () => {
        const themeConfig = await db.config.get('theme');
        await applyTheme(themeConfig ? themeConfig.value : 'rojo');
        await initMalla();
        await renderCalendar();
        await initHorario();
        await renderWeeklySchedule();
        await initLibrary();
        await renderTasks();
        await renderDashboard();
    })();
});
