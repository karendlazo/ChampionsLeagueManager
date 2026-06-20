const API_URL = 'https://api-champions-qkuq.onrender.com/api';

function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden-section');
    });
    
    document.getElementById(viewId).classList.remove('hidden-section');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(
        btn => btn.getAttribute('onclick') === `navigate('${viewId}')`
    );
    if(activeBtn) {
        activeBtn.classList.add('active');
    }

    if (viewId === 'teams') loadTeams();
    if (viewId === 'matches') loadMatches();
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    
    if (isError) {
        toast.className = 'fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(229,62,62,0.4)] transform transition-all duration-300 z-[200] font-medium flex items-center gap-3 bg-brand-danger text-white border border-red-400';
        toastIcon.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    } else {
        toast.className = 'fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(212,175,55,0.3)] transform transition-all duration-300 z-[200] font-medium flex items-center gap-3 bg-brand-card text-brand-gold border border-brand-gold/50';
        toastIcon.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    }
    
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
    }, 3500);
}

function closeModals() {
    document.getElementById('teamModal').classList.add('hidden');
    document.getElementById('matchModal').classList.add('hidden');
    document.getElementById('teamForm').reset();
    document.getElementById('matchForm').reset();
    document.getElementById('teamId').value = '';
    document.getElementById('matchId').value = '';
}

async function fetchAPI(endpoint, options = {}) {
    try {
        const url = `${API_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        // Si es 204 (No Content, como al eliminar), no hay JSON que parsear
        if (response.status === 204) return {};
        
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        
        if (!response.ok) {
            // Atrapamos los errores "bonitos" del GlobalExceptionHandler
            let message = 'Error en la petición';
            if (data.error) {
                message = data.error; // Errores de negocio o BD (409)
            } else if (typeof data === 'object') {
                const firstError = Object.values(data)[0];
                if (firstError) message = firstError; // Errores de validación (400)
            }
            showToast(message, true);
            throw new Error(message);
        }
        return data;
    } catch (error) {
        if (!error.message || error.message === 'Failed to fetch') {
            showToast('Error de conexión con el servidor', true);
        }
        throw error;
    }
}


async function loadTeams() {
    const grid = document.getElementById('teamsGrid');
    grid.innerHTML = '<div class="col-span-full text-center py-20 text-brand-gold animate-pulse text-xl font-semibold">Cargando la élite europea...</div>';
    
    try {
        const teams = await fetchAPI('/equipos');
        window.currentTeams = teams; 
        
        if (!teams || teams.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500 text-xl border-2 border-dashed border-gray-700 rounded-2xl">No hay equipos registrados en el torneo.</div>';
            return;
        }

        grid.innerHTML = teams.map(team => `
            <div class="bg-brand-card rounded-2xl p-6 border border-brand-gold/10 hover:border-brand-gold transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] group relative transform hover:-translate-y-1">
                <div class="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 z-20">
                    <button onclick="editTeam('${team.id}')" class="text-brand-gold hover:text-white transition p-2 bg-brand-deep rounded-lg hover:bg-brand-gold/20"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                    <button onclick="deleteTeam('${team.id}')" class="text-brand-danger hover:text-white transition p-2 bg-brand-deep rounded-lg hover:bg-brand-danger/20"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
                <div class="w-20 h-20 bg-brand-deep rounded-full mx-auto mb-5 flex items-center justify-center border-2 border-brand-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                    <span class="text-3xl font-black text-brand-light uppercase">${team.nombre.substring(0, 2)}</span>
                </div>
                <h3 class="text-2xl font-bold text-center mb-1 text-white truncate px-2" title="${team.nombre}">${team.nombre}</h3>
                <p class="text-center text-sm font-semibold text-brand-gold mb-6 uppercase tracking-wider">${team.pais}</p>
                <div class="space-y-3 text-sm text-gray-300 bg-brand-deep/50 p-4 rounded-xl">
                    <div class="flex justify-between items-center"><span class="opacity-60 text-xs uppercase tracking-wider">Estadio</span> <span class="font-medium truncate ml-2 text-right" title="${team.estadio}">${team.estadio}</span></div>
                    <div class="flex justify-between items-center"><span class="opacity-60 text-xs uppercase tracking-wider">DT</span> <span class="font-medium truncate ml-2 text-right" title="${team.directorTecnico}">${team.directorTecnico}</span></div>
                    <div class="flex justify-between items-center pt-3 border-t border-brand-gold/10 mt-2"><span class="font-bold text-brand-gold uppercase tracking-wider">Puntos</span> <span class="font-black text-white text-xl">${team.puntos}</span></div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error cargando equipos:", error);
    }
}

function openTeamModal() {
    document.getElementById('teamModalTitle').textContent = 'Nuevo Equipo';
    document.getElementById('teamForm').reset();
    document.getElementById('teamId').value = '';
    document.getElementById('teamModal').classList.remove('hidden');
}

async function editTeam(id) {
    const team = window.currentTeams.find(t => String(t.id) === String(id));
    if (!team) return;
    
    document.getElementById('teamModalTitle').textContent = 'Editar Equipo';
    document.getElementById('teamId').value = team.id;
    document.getElementById('teamName').value = team.nombre;
    document.getElementById('teamCountry').value = team.pais;
    document.getElementById('teamStadium').value = team.estadio;
    document.getElementById('teamCoach').value = team.directorTecnico;
    document.getElementById('teamPoints').value = team.puntos;
    
    document.getElementById('teamModal').classList.remove('hidden');
}

document.getElementById('teamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('teamId').value;
    
    const teamData = {
        nombre: document.getElementById('teamName').value,
        pais: document.getElementById('teamCountry').value,
        estadio: document.getElementById('teamStadium').value,
        directorTecnico: document.getElementById('teamCoach').value,
        puntos: parseInt(document.getElementById('teamPoints').value) || 0
    };

    try {
        if (id) {
            await fetchAPI(`/equipos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(teamData) // Sin mandar el ID en el body
            });
            showToast('Equipo actualizado exitosamente');
        } else {
            await fetchAPI('/equipos', {
                method: 'POST',
                body: JSON.stringify(teamData) // Sin crear un ID de mentira
            });
            showToast('Equipo creado exitosamente');
        }
        closeModals();
        loadTeams();
    } catch (error) {
        console.error("Error guardando equipo:", error);
    }
});


async function deleteTeam(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.')) {
        try {
            await fetchAPI(`/equipos/${id}`, { method: 'DELETE' });
            showToast('Equipo eliminado de la competición');
            loadTeams();
        } catch (error) {
            console.error("Error eliminando equipo:", error);
        }
    }
}

async function loadMatches() {
    const grid = document.getElementById('matchesGrid');
    grid.innerHTML = '<div class="col-span-full text-center py-20 text-brand-gold animate-pulse text-xl font-semibold">Cargando calendario...</div>';
    
    try {
        const matches = await fetchAPI('/partidos');
        window.currentMatches = matches;
        
        if (!matches || matches.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500 text-xl border-2 border-dashed border-gray-700 rounded-2xl">No hay partidos programados.</div>';
            return;
        }

        grid.innerHTML = matches.map(match => {
            const localGoals = parseInt(match.golesLocal) || 0;
            const visitorGoals = parseInt(match.golesVisitante) || 0;
            const localWins = localGoals > visitorGoals;
            const visitorWins = visitorGoals > localGoals;
            
            return `
            <div class="bg-brand-card rounded-2xl p-6 border border-brand-gold/10 hover:border-brand-gold/50 transition-all duration-300 shadow-xl relative group overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-b from-transparent to-brand-deep/50 pointer-events-none"></div>
                <div class="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-20">
                    <button onclick="editMatch('${match.id}')" class="text-brand-gold hover:text-white transition p-2 bg-brand-deep/80 backdrop-blur rounded-lg hover:bg-brand-gold/20"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                    <button onclick="deleteMatch('${match.id}')" class="text-brand-danger hover:text-white transition p-2 bg-brand-deep/80 backdrop-blur rounded-lg hover:bg-brand-danger/20"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
                
                <div class="flex justify-between items-center mb-6 text-xs font-bold uppercase tracking-widest relative z-10 border-b border-white/5 pb-3">
                    <span class="text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full">${match.fase}</span>
                    <span class="text-gray-400 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ${match.fecha ? new Date(match.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                    </span>
                </div>
                
                <div class="flex justify-between items-center bg-brand-deep rounded-xl p-3 md:p-5 mb-5 border border-brand-gold/5 relative z-10 shadow-inner">
                    <div class="text-center w-[35%] flex flex-col items-center gap-2">
                        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-card flex items-center justify-center border ${localWins ? 'border-brand-gold' : 'border-white/10'} shadow-lg">
                            <span class="font-bold text-xs md:text-sm text-white">${match.equipoLocal?.nombre ? match.equipoLocal.nombre.substring(0, 3).toUpperCase() : '???'}</span>
                        </div>
                        <div class="font-bold text-sm md:text-base truncate w-full px-1 md:px-2 ${localWins ? 'text-brand-gold' : 'text-white'}" title="${match.equipoLocal?.nombre}">${match.equipoLocal?.nombre || 'Desconocido'}</div>
                    </div>
                    
                    <div class="flex items-center justify-center gap-2 md:gap-4 w-[30%] bg-brand-card py-2 md:py-3 px-2 md:px-4 rounded-xl border border-brand-gold/20 shadow-md">
                        <span class="text-xl md:text-3xl font-black ${localWins ? 'text-brand-gold' : 'text-white'}">${localGoals}</span>
                        <span class="text-gray-500 font-bold mx-1">-</span>
                        <span class="text-xl md:text-3xl font-black ${visitorWins ? 'text-brand-gold' : 'text-white'}">${visitorGoals}</span>
                    </div>
                    
                    <div class="text-center w-[35%] flex flex-col items-center gap-2">
                        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-card flex items-center justify-center border ${visitorWins ? 'border-brand-gold' : 'border-white/10'} shadow-lg">
                            <span class="font-bold text-xs md:text-sm text-white">${match.equipoVisitante?.nombre ? match.equipoVisitante.nombre.substring(0, 3).toUpperCase() : '???'}</span>
                        </div>
                        <div class="font-bold text-sm md:text-base truncate w-full px-1 md:px-2 ${visitorWins ? 'text-brand-gold' : 'text-white'}" title="${match.equipoVisitante?.nombre}">${match.equipoVisitante?.nombre || 'Desconocido'}</div>
                    </div>
                </div>
                
                <div class="text-center text-sm text-gray-400 font-medium relative z-10 flex items-center justify-center gap-2 bg-brand-deep/30 py-2 rounded-lg">
                    <svg class="w-4 h-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    ${match.estadio || 'Estadio por definir'}
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Error cargando partidos:", error);
    }
}

async function populateTeamSelects() {
    try {
        const teams = await fetchAPI('/equipos');
        window.currentTeams = teams;
        const localSelect = document.getElementById('matchLocalTeam');
        const visitorSelect = document.getElementById('matchVisitorTeam');
        
        const options = '<option value="">Seleccione un equipo</option>' + 
            teams.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');
            
        localSelect.innerHTML = options;
        visitorSelect.innerHTML = options;
    } catch (error) {
        console.error("Error obteniendo equipos para selects:", error);
    }
}

async function openMatchModal() {
    document.getElementById('matchModalTitle').textContent = 'Nuevo Partido';
    document.getElementById('matchForm').reset();
    document.getElementById('matchId').value = '';
    await populateTeamSelects();
    document.getElementById('matchDate').valueAsDate = new Date();
    document.getElementById('matchModal').classList.remove('hidden');
}

async function editMatch(id) {
    const match = window.currentMatches.find(m => String(m.id) === String(id));
    if (!match) return;
    
    await populateTeamSelects();
    
    document.getElementById('matchModalTitle').textContent = 'Editar Partido';
    document.getElementById('matchId').value = match.id;
    document.getElementById('matchLocalTeam').value = match.equipoLocal?.id || '';
    document.getElementById('matchVisitorTeam').value = match.equipoVisitante?.id || '';
    document.getElementById('matchLocalGoals').value = match.golesLocal || 0;
    document.getElementById('matchVisitorGoals').value = match.golesVisitante || 0;
    
    if (match.fecha) {
        document.getElementById('matchDate').value = match.fecha.split('T')[0];
    }
    
    document.getElementById('matchPhase').value = match.fase;
    document.getElementById('matchStadium').value = match.estadio;
    
    document.getElementById('matchModal').classList.remove('hidden');
}

document.getElementById('matchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const localTeamId = document.getElementById('matchLocalTeam').value;
    const visitorTeamId = document.getElementById('matchVisitorTeam').value;
    
    // Validar localmente por si acaso
    if (localTeamId === visitorTeamId) {
        showToast('Un equipo no puede jugar contra sí mismo', true);
        return;
    }
    
    const id = document.getElementById('matchId').value;
    
    // Enviamos exactamente lo que el DTO pide
    const matchData = {
        equipoLocalId: parseInt(localTeamId),
        equipoVisitanteId: parseInt(visitorTeamId),
        golesLocal: parseInt(document.getElementById('matchLocalGoals').value) || 0,
        golesVisitante: parseInt(document.getElementById('matchVisitorGoals').value) || 0,
        fecha: document.getElementById('matchDate').value,
        fase: document.getElementById('matchPhase').value,
        estadio: document.getElementById('matchStadium').value
    };

    try {
        if (id) {
            await fetchAPI(`/partidos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(matchData)
            });
            showToast('Partido actualizado exitosamente');
        } else {
            await fetchAPI('/partidos', {
                method: 'POST',
                body: JSON.stringify(matchData)
            });
            showToast('Partido agendado exitosamente');
        }
        closeModals();
        loadMatches();
    } catch (error) {
        console.error("Error guardando partido:", error);
    }
});


async function deleteMatch(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este partido? La historia se borrará.')) {
        try {
            await fetchAPI(`/partidos/${id}`, { method: 'DELETE' });
            showToast('Partido eliminado');
            loadMatches();
        } catch (error) {
            console.error("Error eliminando partido:", error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    navigate('home');
});