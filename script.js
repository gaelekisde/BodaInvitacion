// Clase para manejar las familias
class GestorFamilias {
    constructor() {
        this.familias = [];
        this.initEventListeners();
        this.inicializarDatos();
    }

    // Inicializar datos de forma asíncrona
    async inicializarDatos() {
        this.familias = await this.cargarFamilias();
        this.actualizarUI();
    }

    // Inicializar event listeners
    initEventListeners() {
        // Formulario de familia
        document.getElementById('form-familia').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.agregarFamilia();
        });
    }

    // Agregar nueva familia
    async agregarFamilia() {
        const apellido = document.getElementById('apellido-familia').value.trim();
        const codigo = document.getElementById('codigo-familia').value.trim().toUpperCase();
        const integrantes = parseInt(document.getElementById('integrantes-familia').value);
        const notas = document.getElementById('notas-familia').value.trim();

        // Validaciones
        if (!apellido || !codigo || !integrantes) {
            this.mostrarMensaje('Por favor, completa todos los campos obligatorios.', 'error');
            return;
        }

        if (this.familias.some(familia => familia.codigo === codigo)) {
            this.mostrarMensaje('El código de familia ya existe. Por favor, usa uno diferente.', 'error');
            return;
        }

        // Crear nueva familia
        const nuevaFamilia = {
            id: Date.now(),
            apellido: apellido,
            codigo: codigo,
            integrantes: integrantes,
            notas: notas || '',
            mensaje: '',
            estado: 'Pendiente',
            fechaCreacion: new Date().toISOString()
        };

        // Agregar a la lista local
        this.familias.push(nuevaFamilia);
        
        // Guardar en localStorage
        localStorage.setItem('gestor-bodas-familias', JSON.stringify(this.familias));
        
        // Enviar a la API
        try {
            const familiaParaAPI = {
                Apellido: apellido,
                CodigoFamilia: codigo,
                NumeroPersonas: integrantes,
                Mensaje: '',
                Notas: notas || '',
                Estado: 'Pendiente'
            };
            
            const response = await fetch('http://localhost:3000/api/families', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(familiaParaAPI)
            });
            
            if (response.ok) {
                console.log(`Familia ${apellido} agregada a la API exitosamente`);
            } else {
                console.log('Error al agregar familia a la API:', response.status, response.statusText);
            }
        } catch (error) {
            console.log('No se pudo agregar la familia a la API:', error.message);
        }
        
        this.actualizarUI();
        this.limpiarFormulario();
        this.mostrarMensaje(`Familia ${apellido} agregada exitosamente.`, 'success');
    }

    // Eliminar familia
    async eliminarFamilia(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta familia?')) {
            // Convertir id a número para asegurar compatibilidad
            const idNumerico = parseInt(id);
            
            // Validar que el ID sea un número válido
            if (isNaN(idNumerico)) {
                console.error('ID inválido:', id);
                this.mostrarMensaje('Error: ID de familia inválido.', 'error');
                return;
            }
            
            // Buscar la familia antes de eliminar para obtener el código
            const familiaAEliminar = this.familias.find(familia => familia.id === idNumerico);
            if (!familiaAEliminar) {
                this.mostrarMensaje('Error: Familia no encontrada.', 'error');
                return;
            }
            
            // Eliminar de la lista local
            this.familias = this.familias.filter(familia => familia.id !== idNumerico);
            
            // Guardar en localStorage
            localStorage.setItem('gestor-bodas-familias', JSON.stringify(this.familias));
            
            // Eliminar de la API usando el código de familia
            try {
                const response = await fetch(`http://localhost:3000/api/families/${familiaAEliminar.codigo}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    console.log(`Familia ${familiaAEliminar.apellido} (código: ${familiaAEliminar.codigo}) eliminada de la API`);
                } else {
                    console.log('Error al eliminar familia de la API:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Error al eliminar la familia de la API:', error);
            }
            
            this.actualizarUI();
            this.mostrarMensaje('Familia eliminada exitosamente.', 'success');
        }
    }

    // Actualizar toda la UI
    actualizarUI() {
        this.renderizarFamilias();
        this.actualizarResumen();
    }

    // Renderizar lista de familias
    renderizarFamilias() {
        const container = document.getElementById('lista-familias');
        container.innerHTML = '';

        if (this.familias.length === 0) {
            container.innerHTML = `
                <div class="no-familias">
                    <p>📝 No hay familias registradas aún</p>
                    <p>Agrega la primera familia usando el formulario de abajo</p>
                </div>
            `;
            return;
        }

        this.familias.forEach(familia => {
            const familiaCard = this.crearTarjetaFamilia(familia);
            container.appendChild(familiaCard);
        });
    }

    // Crear tarjeta de familia
    crearTarjetaFamilia(familia) {
        const div = document.createElement('div');
        div.className = 'familia-card';
        
        // Asegurar que el ID sea un número válido
        const idSeguro = familia.id || Date.now();
        
        div.innerHTML = `
            <div class="familia-preview" onclick="gestor.toggleFamiliaDetails('${idSeguro}')">
                <div class="familia-preview-content">
                    <div class="familia-apellido-preview">Familia ${familia.apellido}</div>
                    <div class="familia-codigo-preview">${familia.codigo}</div>
                    <div class="familia-integrantes-preview">${familia.integrantes} ${familia.integrantes === 1 ? 'persona' : 'personas'}</div>
                </div>
                <div class="expand-icon">▼</div>
            </div>
            
            <div class="familia-details-container" id="details-${idSeguro}" style="display: none;">
                <button class="btn-eliminar" onclick="event.stopPropagation(); gestor.eliminarFamilia('${idSeguro}')" title="Eliminar familia">×</button>
                
                <div class="familia-details">
                    <div class="detail-row">
                        <div class="detail-item">
                            <span class="detail-icon">👥</span>
                            <div class="detail-content">
                                <span class="detail-label">Integrantes</span>
                                <span class="detail-value">${familia.integrantes} ${familia.integrantes === 1 ? 'persona' : 'personas'}</span>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-icon">🏷️</span>
                            <div class="detail-content">
                                <span class="detail-label">Código de Familia</span>
                                <span class="detail-value">${familia.codigo}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-item">
                            <span class="detail-icon">📅</span>
                            <div class="detail-content">
                                <span class="detail-label">Fecha de Registro</span>
                                <span class="detail-value">${this.formatearFecha(familia.fechaCreacion)}</span>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-icon">📊</span>
                            <div class="detail-content">
                                <span class="detail-label">Estado</span>
                                <span class="detail-value">${familia.estado || 'Pendiente'}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${familia.notas ? `
                    <div class="detail-row full-width">
                        <div class="detail-item">
                            <span class="detail-icon">📝</span>
                            <div class="detail-content">
                                <span class="detail-label">Notas</span>
                                <span class="detail-value">${familia.notas}</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${familia.mensaje ? `
                    <div class="detail-row full-width">
                        <div class="detail-item">
                            <span class="detail-icon">💬</span>
                            <div class="detail-content">
                                <span class="detail-label">Mensaje</span>
                                <span class="detail-value">${familia.mensaje}</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="familia-stats">
                        <div class="stat-item">
                            <span class="stat-number">${familia.integrantes}</span>
                            <span class="stat-label">Invitados</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.calcularDiasRegistrada(familia.fechaCreacion)}</span>
                            <span class="stat-label">Días registrada</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return div;
    }

    // Función para mostrar/ocultar detalles de familia
    toggleFamiliaDetails(id) {
        const detailsContainer = document.getElementById(`details-${id}`);
        const card = detailsContainer.closest('.familia-card');
        const expandIcon = card.querySelector('.expand-icon');
        
        if (detailsContainer.style.display === 'none') {
            detailsContainer.style.display = 'block';
            expandIcon.textContent = '▲';
            card.classList.add('expanded');
        } else {
            detailsContainer.style.display = 'none';
            expandIcon.textContent = '▼';
            card.classList.remove('expanded');
        }
    }

    // Actualizar resumen
    actualizarResumen() {
        const totalFamilias = this.familias.length;
        const totalInvitados = this.familias.reduce((total, familia) => total + familia.integrantes, 0);

        document.getElementById('total-familias').textContent = totalFamilias;
        document.getElementById('total-invitados').textContent = totalInvitados;
    }

    // Limpiar formulario
    limpiarFormulario() {
        document.getElementById('form-familia').reset();
    }

    // Mostrar mensaje
    mostrarMensaje(mensaje, tipo) {
        // Remover mensaje anterior si existe
        const mensajeAnterior = document.querySelector('.mensaje');
        if (mensajeAnterior) {
            mensajeAnterior.remove();
        }

        const div = document.createElement('div');
        div.className = `mensaje mensaje-${tipo}`;
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            ${tipo === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
        `;
        div.textContent = mensaje;

        // Agregar animación CSS
        if (!document.querySelector('#mensaje-styles')) {
            const style = document.createElement('style');
            style.id = 'mensaje-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(div);

        // Remover después de 3 segundos
        setTimeout(() => {
            if (div.parentNode) {
                div.remove();
            }
        }, 3000);
    }

    // Formatear fecha
    formatearFecha(fechaISO) {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Calcular días desde que se registró la familia
    calcularDiasRegistrada(fechaISO) {
        const fechaRegistro = new Date(fechaISO);
        const hoy = new Date();
        const diferencia = hoy - fechaRegistro;
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        return dias >= 0 ? dias : 0;
    }

    async cargarFamilias() {
        try {
            const response = await fetch('http://localhost:3000/api/families/');

            if (response.ok) {
                const familiasAPI = await response.json();
                
                // Transformar los datos de la API al formato interno
                const familiasTransformadas = familiasAPI.map((familia, index) => {
                    // Asegurar que el ID sea un número válido
                    let id;
                    if (familia.CodigoFamilia && !isNaN(parseInt(familia.CodigoFamilia.replace('FAM', '')))) {
                        id = parseInt(familia.CodigoFamilia.replace('FAM', ''));
                    } else {
                        // Si no hay código válido, usar timestamp + index para evitar duplicados
                        id = Date.now() + index;
                    }
                    
                    return {
                        id: id,
                        apellido: familia.Apellido || '',
                        codigo: familia.CodigoFamilia || `FAM${id}`,
                        integrantes: familia.NumeroPersonas || 1,
                        notas: familia.Notas || '',
                        mensaje: familia.Mensaje || '',
                        estado: familia.Estado || 'Pendiente',
                        fechaCreacion: new Date().toISOString()
                    };
                });
                
                localStorage.setItem('gestor-bodas-familias', JSON.stringify(familiasTransformadas));
                return familiasTransformadas;
            } else {
                console.log('Error al obtener familias:', response.status);
            }
        } catch (error) {
            console.log('API no disponible, cargando desde localStorage:', error.message);
        }

        const familiasLocal = localStorage.getItem('gestor-bodas-familias');
        return familiasLocal ? JSON.parse(familiasLocal) : [];
    }

    async guardarFamilias() {
        // Guardar en localStorage siempre
        localStorage.setItem('gestor-bodas-familias', JSON.stringify(this.familias));
        
        try {
            // Transformar los datos al formato que espera la API
            const familiasParaAPI = this.familias.map(familia => ({
                Apellido: familia.apellido,
                CodigoFamilia: familia.codigo,
                NumeroPersonas: familia.integrantes,
                Mensaje: familia.mensaje || '',
                Notas: familia.notas || '',
                Estado: familia.estado || 'Pendiente'
            }));
            
            // Intentar sincronizar con la API si está disponible
            const response = await fetch('http://localhost:3000/api/families', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(familiasParaAPI)
            });
            
            if (response.ok) {
                console.log('Datos sincronizados con la API');
            } else {
                console.log('Error al sincronizar con la API:', response.status, response.statusText);
            }
        } catch (error) {
            console.log('No se pudo sincronizar con la API, datos guardados localmente:', error.message);
        }
    }
}

// Inicializar la aplicación cuando se carga la página
let gestor;

document.addEventListener('DOMContentLoaded', () => {
    gestor = new GestorFamilias();
});
