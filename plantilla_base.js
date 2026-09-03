/**
 * plantilla_base.js - ARQUITECTURA VISUAL UNIFICADA Y PERSONALIZABLE
 * @description Maneja la interfaz global, crimson carmesí sobrio, tipografías dinámicas, temas guardados en Supabase y barra limpia.
 * @version 6.0 (Crimson Carmsí, Tipografías dinámicas Supabase, Sincronización total)
 */

const THEMES = {
    premium: { bg: '#FDFBF7', primary: '#5C0614', secondary: '#8B0000', gold: '#D4AF37', text: '#2A2A2A', card: '#FFFFFF', input: '#FFFFFF' },
    oscuro: { bg: '#0A0103', primary: '#3A030A', secondary: '#660000', gold: '#D4AF37', text: '#FDF8F0', card: '#121212', input: '#1E1E1E' },
    navideno: { bg: '#F2F7F4', primary: '#0B5329', secondary: '#8B0000', gold: '#D4AF37', text: '#111111', card: '#FFFFFF', input: '#FFFFFF' },
    halloween: { bg: '#121212', primary: '#FF6600', secondary: '#8B0000', gold: '#FF9900', text: '#F5F5F5', card: '#1E1E1E', input: '#2A2A2A' }
};

const TYPOGRAPHIES = {
    roboto: { main: "'Roboto', sans-serif", title: "'Playfair Display', serif", buttons: "'Roboto', sans-serif" },
    montserrat: { main: "'Montserrat', sans-serif", title: "'Cinzel', serif", buttons: "'Montserrat', sans-serif" },
    inter: { main: "'Inter', sans-serif", title: "'Oswald', sans-serif", buttons: "'Inter', sans-serif" },
    lato: { main: "'Lato', sans-serif", title: "'Georgia', serif", buttons: "'Lato', sans-serif" }
};

// Aplicar tema y tipografía inicial desde localStorage o valores por defecto antes de renderizar
(function inicializarEstilosPrevios() {
    const temaActivo = localStorage.getItem('app_theme_name') || 'premium';
    const tipoImpreso = localStorage.getItem('app_typography_name') || 'roboto';
    const cfg = THEMES[temaActivo] || THEMES.premium;
    const fontCfg = TYPOGRAPHIES[tipoImpreso] || TYPOGRAPHIES.roboto;
    
    const root = document.documentElement;
    root.style.setProperty('--bg', cfg.bg);
    root.style.setProperty('--text', cfg.text);
    root.style.setProperty('--primary', cfg.primary);
    root.style.setProperty('--secondary', cfg.secondary);
    root.style.setProperty('--active-gold', cfg.gold);
    root.style.setProperty('--card-bg', cfg.card);
    root.style.setProperty('--input-bg', cfg.input);

    root.style.setProperty('--main-font', fontCfg.main);
    root.style.setProperty('--title-font', fontCfg.title);
    root.style.setProperty('--btn-font', fontCfg.buttons);
})();

const UIBase = {
    loadingTimer: null,

    inyectarEstilosGlobales: function() {
        if (document.getElementById('styles_plantilla_base')) return;
        const style = document.createElement('style');
        style.id = 'styles_plantilla_base';
        
        style.innerHTML = `
            :root {
                --topbar-bg: #050505;
                --sidebar-bg: #080808;
                --danger: #8B0000; 
                --success: #2E7D32; 
                --warning: #B8860B; 
                --border-radius: 6px;
            }

            * { box-sizing: border-box; }
            body { font-family: var(--main-font, 'Roboto', sans-serif); background: var(--bg); color: var(--text); margin: 0; padding: 0; line-height: 1.5; transition: background 0.4s ease, color 0.4s ease; overflow-x: hidden; }
            
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            @keyframes spinGold { 100% { transform: rotate(360deg); } }
            
            .wrapper { display: block; min-height: 100vh; position: relative; padding-bottom: 100px; }

            /* BARRA SUPERIOR */
            .top-bar { 
                background: var(--topbar-bg); color: white; height: 60px; padding: 10px 20px; 
                display: flex; align-items: center; justify-content: flex-start; gap: 15px; 
                position: sticky; top: 0; z-index: 999; border-bottom: 2px solid var(--active-gold); 
                box-shadow: 0 4px 20px rgba(0,0,0,0.6); 
            }
            .menu-toggle-btn { 
                background: transparent; border: 1px solid var(--active-gold); color: var(--active-gold); 
                font-size: 1.4rem; cursor: pointer; width: 40px; height: 40px; border-radius: var(--border-radius); 
                display: flex; align-items: center; justify-content: center; transition: all 0.3s; line-height: 1; margin: 0;
            }
            .menu-toggle-btn:hover { background: rgba(212, 175, 55, 0.2); transform: scale(1.05); }
            
            .top-bar-title { 
                font-size: 1.15rem; font-weight: bold; color: var(--active-gold); 
                font-family: var(--title-font, serif); text-align: left; text-transform: uppercase; 
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }

            /* MENÚ LATERAL (SIDEBAR) */
            .sidebar { 
                position: fixed; top: 0; left: -300px; width: 300px; height: 100vh; 
                background: var(--sidebar-bg); color: #E0E0E0; padding: 20px 15px; 
                display: flex; flex-direction: column; gap: 4px; z-index: 1002; 
                transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); 
                box-shadow: 5px 0 25px rgba(0,0,0,0.7); border-right: 1px solid var(--active-gold); overflow-y: auto; 
            }
            .sidebar.open { transform: translateX(300px); }
            .sidebar-brand { font-family: var(--title-font, serif); font-size: 1.1rem; color: var(--active-gold); text-align: center; padding-bottom: 20px; border-bottom: 1px solid #222; margin-bottom: 15px; letter-spacing: 2px; text-transform: uppercase; }
            .sidebar .tab-btn { background: transparent; color: #CCCCCC; border: none; text-align: left; padding: 13px 15px; width: 100%; border-radius: var(--border-radius); cursor: pointer; font-size: 0.95rem; display: block; text-decoration: none; transition: all 0.2s; border-left: 3px solid transparent; font-family: var(--main-font); }
            .sidebar .tab-btn:hover { background: rgba(255, 255, 255, 0.05); color: #FFF; border-left: 3px solid var(--active-gold); transform: translateX(5px); }
            .sidebar .tab-btn.active { background: linear-gradient(90deg, var(--active-gold), transparent) !important; color: #000 !important; font-weight: bold; border-left: none; }
            
            .sidebar .btn-logout {
                margin-top: auto; 
                background: rgba(139, 0, 0, 0.15); color: #ff6666; border-left: 3px solid var(--danger);
                font-weight: bold; margin-bottom: 20px;
            }
            .sidebar .btn-logout:hover { background: var(--danger); color: white; border-left-color: white; }

            .sidebar-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 1001; opacity: 0; visibility: hidden; transition: opacity 0.4s ease; backdrop-filter: blur(2px); }
            .sidebar-overlay.active { opacity: 1; visibility: visible; }

            /* PANTALLAS DE CARGA Y BLOQUEO */
            .overlay-luxury { 
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
                background: radial-gradient(circle at center, #5C0614 0%, #2A050B 100%); 
                z-index: 999999; display: flex; justify-content: center; align-items: center; flex-direction: column; 
            }
            .card-luxury-menu { 
                background: #FFFFFF; 
                padding: 50px 40px; text-align: center; width: 90%; max-width: 480px; 
                box-shadow: 0 25px 60px rgba(0,0,0,0.8); position: relative; 
                animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
            }
            .card-luxury-menu::before, .card-luxury-menu::after { 
                content: ''; position: absolute; width: 40px; height: 40px; border-color: var(--active-gold); border-style: solid; 
            }
            .card-luxury-menu::before { top: 15px; left: 15px; border-width: 2px 0 0 2px; }
            .card-luxury-menu::after { bottom: 15px; right: 15px; border-width: 0 2px 2px 0; }

            .gold-spinner {
                width: 50px; height: 50px; margin: 0 auto 30px auto;
                border: 3px solid rgba(212, 175, 55, 0.2);
                border-top-color: var(--active-gold);
                border-radius: 50%;
                animation: spinGold 1s linear infinite;
            }

            .lux-title { color: #111111; font-family: var(--title-font, serif); font-size: 1.4rem; letter-spacing: 2px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; }
            .lux-quote { color: #555555; font-size: 0.95rem; margin-bottom: 25px; font-family: var(--main-font); line-height: 1.4; }
            .lux-subtitle { color: #777777; font-size: 0.85rem; margin-bottom: 15px; font-family: var(--main-font); line-height: 1.6; }
            
            /* ELEMENTOS Y COMPONENTES */
            .main-content { padding: 25px 20px 120px 20px; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
            
            /* Menús desplegables controlados por tipografía de componentes */
            input, select { 
                width: 100%; padding: 12px; margin-top: 6px; 
                border: 1px solid var(--active-gold); border-radius: var(--border-radius); 
                font-size: 0.95rem; background: var(--input-bg); color: var(--text); 
                border-left: 4px solid var(--secondary); outline: none; 
                transition: border 0.3s, box-shadow 0.3s; 
                font-family: var(--main-font); 
            }
            input:focus, select:focus { border-color: var(--active-gold); box-shadow: 0 0 8px rgba(212, 175, 55, 0.3); }

            /* Botones controlados por la tipografía de botones */
            button { 
                position: relative; overflow: hidden; 
                font-family: var(--btn-font, var(--title-font)); 
                border: none; padding: 12px 18px; border-radius: var(--border-radius); 
                cursor: pointer; font-weight: bold; width: 100%; margin-top: 15px; 
                font-size: 0.95rem; text-transform: uppercase; display: inline-flex; 
                align-items: center; justify-content: center; gap: 8px; 
                transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease; 
            }
            button::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); transform: skewX(-20deg); transition: left 0.5s ease; }
            button:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
            button:hover::after { left: 150%; }
            
            .btn-info { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: var(--active-gold); border: 1px solid var(--active-gold); }
            .btn-success { background: var(--success); color: white; }
            .btn-warning { background: var(--warning); color: white; }
            .btn-danger { background: var(--danger); color: #ffffff; }

            /* ACORDES E INTERFAZ */
            .acordeon-header {
                background: #8B0000; 
                border: 2px solid var(--active-gold); 
                border-radius: var(--border-radius);
                padding: 15px 20px;
                margin-top: 15px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: transform 0.2s ease, box-shadow 0.3s ease;
            }
            .acordeon-header:hover {
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); 
                transform: translateY(-2px);
            }
            .acordeon-title {
                margin: 0;
                font-family: var(--title-font, serif);
                font-size: 1.2rem;
                color: var(--active-gold); 
                text-transform: uppercase;
                font-weight: bold;
            }
            .acordeon-content {
                display: none; 
                padding: 20px;
                background: var(--card-bg);
                border: 1px solid var(--active-gold);
                border-top: none; 
                border-radius: 0 0 var(--border-radius) var(--border-radius);
                margin-bottom: 15px;
            }

            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            @media(max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }

            .tabla-permisos { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.9rem; }
            .tabla-permisos th { background: var(--primary); color: var(--active-gold); padding: 10px; text-align: center; font-family: var(--title-font); text-transform: uppercase; }
            .tabla-permisos td { padding: 10px; border-bottom: 1px solid rgba(212, 175, 55, 0.3); text-align: center; color: var(--text); }
            .tabla-permisos td:first-child { text-align: left; font-weight: bold; color: var(--primary); }
            .check-rol { width: 18px; height: 18px; cursor: pointer; accent-color: var(--active-gold); }

            .currency-row { display: grid; grid-template-columns: 2fr 1fr 2fr auto; gap: 10px; align-items: center; background: var(--input-bg); padding: 10px; border-radius: var(--border-radius); border-left: 3px solid var(--active-gold); margin-bottom: 10px; }
            .formula-preview { display: block; font-size: 0.8rem; color: var(--success); margin-top: 5px; font-weight: bold; }

            .switch-label { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--input-bg); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: var(--border-radius); margin-bottom: 8px; cursor: pointer; color: var(--text); font-weight: bold; }

            .danger-zone { margin-top: 25px; border: 2px dashed var(--danger); padding: 20px; border-radius: var(--border-radius); background: rgba(139,0,0,0.03); }
            .danger-title { color: var(--danger); font-family: var(--title-font); font-weight: bold; font-size: 1.1rem; margin-bottom: 5px; }

            /* PANTALLA DE BLOQUEO */
            .pantalla-bloqueo-card {
                background: var(--card-bg);
                color: var(--text);
                border: 2px solid var(--active-gold);
                box-shadow: 0 0 25px rgba(0, 0, 0, 0.7), inset 0 0 15px rgba(212, 175, 55, 0.1);
            }

            /* ESTILOS Y COLORES PARA MENÚS DESPLEGABLES (SELECT) */
            select { 
                width: 100%; 
                padding: 12px; 
                margin-top: 6px; 
                border: 1px solid var(--active-gold); 
                border-radius: var(--border-radius); 
                font-size: 0.95rem; 
                background: var(--input-bg); 
                color: var(--active-gold); /* Texto general del select en tono dorado dinámico */
                border-left: 4px solid var(--secondary); 
                outline: none; 
                transition: all 0.3s ease; 
                font-family: var(--main-font); 
            }

            select:focus { 
                border-color: var(--active-gold); 
                box-shadow: 0 0 12px var(--active-gold); 
            }

            /* Reglas/Opciones dentro del Menú Desplegable */
            select option {
                background-color: var(--card-bg);
                color: var(--active-gold); /* La letra de las reglas adquiere el tono dorado activo */
                font-weight: 500;
                padding: 10px;
            }

            /* Mejora visual al desplegar o al hacer hover en opciones */
            select option:hover,
            select option:focus,
            select option:active,
            select option:checked {
                background: linear-gradient(90deg, var(--primary), var(--secondary)) !important;
                color: var(--active-gold) !important;
            }
            .pin-wrapper { position: relative; width: 100%; margin-top: 15px; }
            .pin-wrapper input { text-align: center; font-size: 1.5rem; letter-spacing: 8px; padding-right: 50px; font-weight: bold; color: var(--primary); }
            .pin-toggle-btn { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: transparent; border: none; font-size: 1.5rem; width: 40px; height: 40px; margin: 0; padding: 0; color: var(--active-gold); box-shadow: none; }
            .pin-toggle-btn::after { display: none; }
            .pin-toggle-btn:hover { transform: translateY(-50%) scale(1.1); box-shadow: none; }
            .msg-red { color: var(--danger); font-weight: bold; margin-top: 10px; animation: fadeIn 0.3s; }
            .msg-green { color: var(--success); font-weight: bold; margin-top: 10px; font-size: 1.1rem; animation: fadeIn 0.3s; }
        `;
        document.head.appendChild(style);
    },

    inyectarEstructuraBase: function() {
        const urlP = window.location.pathname.split("/").pop();
        const pagActual = urlP || 'principal.html';

        if (!document.getElementById('loading_overlay')) {
            const loadingHTML = `
                <div id="loading_overlay" class="overlay-luxury">
                    <div class="card-luxury-menu">
                        <div class="gold-spinner"></div>
                        <div class="lux-title" id="loading_title_txt">CONSTRUYENDO SU PANEL</div>
                        <div class="lux-quote">"El éxito está en los detalles."</div>
                        <div class="lux-subtitle" id="loading_subtitle_txt">
                            Sincronizando su información operativa segura<br>y preparando su entorno de trabajo de alto<br>rendimiento...
                        </div>
                        <div id="alerta_internet_lento" style="display:none; color: var(--warning); font-size: 0.85rem; font-weight: bold; margin-top: 15px; border-top: 1px dashed var(--warning); padding-top: 10px;">
                            Latencia detectada. Mantenga la ventana abierta mientras finalizamos...
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('afterbegin', loadingHTML);
        }

        if (!document.getElementById('pantalla_bloqueo_global')) {
            const bloqueoHTML = `
                <div id="pantalla_bloqueo_global" class="overlay-luxury" style="display:none;">
                    <div class="card-luxury-menu pantalla-bloqueo-card">
                        <div class="lux-title" style="color: var(--primary);">ACCESO AUTORIZADO</div>
                        <div class="lux-quote" style="border-bottom: 1px solid var(--active-gold); padding-bottom:10px;">Ingrese sus credenciales de seguridad</div>
                        <div class="pin-wrapper">
                            <input type="password" id="pin_ingreso_global" placeholder="****" maxlength="8" autocomplete="new-password">
                            <button type="button" class="pin-toggle-btn" id="btn_ojo_pin" onclick="UIBase.toggleVerPin()">🙈</button>
                        </div>
                        <div id="controles_bloqueo">
                            <button class="btn-info" id="btn_desbloquear_pin" style="margin-top: 25px;">Verificar Acceso</button>
                            <button class="btn-danger" onclick="window.location.href='principal.html'" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); margin-top: 10px;">Volver al menú</button>
                        </div>
                        <div id="msj_respuesta_pin"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', bloqueoHTML);
        }

        if (!document.querySelector('.top-bar')) {
            const topBarHTML = `
                <header class="top-bar">
                    <button class="menu-toggle-btn" onclick="UIBase.toggleSidebar()">☰</button>
                    <div class="top-bar-title" id="main_top_title">CARGANDO...</div>
                </header>
            `;
            const wrapper = document.getElementById('main_wrapper') || document.body;
            wrapper.insertAdjacentHTML('afterbegin', topBarHTML);
        }

        if (!document.getElementById('sidebar')) {
            const navHTML = `
                <div id="sidebar-overlay" class="sidebar-overlay" onclick="UIBase.toggleSidebar()"></div>
                <aside id="sidebar" class="sidebar">
                    <div class="sidebar-brand">MENÚ EJECUTIVO</div>
                    <a href="principal.html" class="tab-btn ${pagActual === 'principal.html' ? 'active' : ''}">🏠 Menú Principal</a>
                    <a href="reglas_laborales.html" class="tab-btn ${pagActual === 'reglas_laborales.html' ? 'active' : ''}">⚖️ Reglas Laborales</a>
					<a href="precios.html" class="tab-btn ${pagActual === 'precios.html' ? 'active' : ''}">💰 Precios</a>
                    <a href="inventario.html" class="tab-btn ${pagActual === 'inventario.html' ? 'active' : ''}">📦 Inventario Físico</a>
                    <a href="trabajos_servicios.html" class="tab-btn ${pagActual === 'trabajos_servicios.html' ? 'active' : ''}">📱 Trabajos y Servicios</a>
                    <a href="avances.html" class="tab-btn ${pagActual === 'avances.html' ? 'active' : ''}">💸 Avances / Retiros</a>
                    <a href="conversor.html" class="tab-btn ${pagActual === 'conversor.html' ? 'active' : ''}">🧮 Conversor Monetario</a>
                    <a href="facturar.html" class="tab-btn ${pagActual === 'facturar.html' ? 'active' : ''}">🛒 Facturar Venta</a>
                    <a href="caja_registradora.html" class="tab-btn ${pagActual === 'caja_registradora.html' ? 'active' : ''}">🧾 Caja Registradora</a>
                    <a href="control_inventario.html" class="tab-btn ${pagActual === 'control_inventario.html' ? 'active' : ''}">📋 Control Inventario</a>
                    <a href="balance.html" class="tab-btn ${pagActual === 'balance.html' ? 'active' : ''}">📊 Balance y Lotes</a>
                    <a href="capital.html" class="tab-btn ${pagActual === 'capital.html' ? 'active' : ''}">📈 Capital e Inventario</a>
                    <a href="proveedores.html" class="tab-btn ${pagActual === 'proveedores.html' ? 'active' : ''}">🚚 Proveedores</a>
                    <a href="pagos_servicios.html" class="tab-btn ${pagActual === 'pagos_servicios.html' ? 'active' : ''}">🧾 Pagos y Servicios</a>
                    <a href="conciliacion.html" class="tab-btn ${pagActual === 'conciliacion.html' ? 'active' : ''}">💳 Conciliación</a>
                    <a href="empleados.html" class="tab-btn ${pagActual === 'empleados.html' ? 'active' : ''}">🧑‍💼 Vendedores</a>
                    <a href="clientes.html" class="tab-btn ${pagActual === 'clientes.html' ? 'active' : ''}">👥 Clientes y Fiados</a>
                    <a href="gestion_catalogo.html" class="tab-btn ${pagActual === 'gestion_catalogo.html' ? 'active' : ''}">📁 Gestión de Catálogo</a>
                    <a href="configuracion.html" class="tab-btn ${pagActual === 'configuracion.html' ? 'active' : ''}">⚙️ Configuración</a>
                    <div style="flex-grow: 1;"></div>
                    <button class="tab-btn btn-logout" onclick="UIBase.cerrarSesionGlobal()">🚪 Cerrar Sesión</button>
					<a href="" class="tab-btn ${pagActual === '' ? '' : ''}"></a>
                </aside>
            `;
            document.body.insertAdjacentHTML('beforeend', navHTML);
        }

        this.iniciarTimerConexionLenta();
    },

    sincronizarNombreLocal: function(nombreLocal) {
        const topTitle = document.getElementById('main_top_title');
        if(topTitle && nombreLocal) {
            topTitle.innerText = nombreLocal.toUpperCase();
        }
    },

    aplicarTemaYTipografiaGlobal: async function(nombreTema, nombreTipografia) {
        const cfg = THEMES[nombreTema] || THEMES.premium;
        const fontCfg = TYPOGRAPHIES[nombreTipografia] || TYPOGRAPHIES.roboto;
        const root = document.documentElement;

        root.style.setProperty('--bg', cfg.bg);
        root.style.setProperty('--text', cfg.text);
        root.style.setProperty('--primary', cfg.primary);
        root.style.setProperty('--secondary', cfg.secondary);
        root.style.setProperty('--active-gold', cfg.gold);
        root.style.setProperty('--card-bg', cfg.card);
        root.style.setProperty('--input-bg', cfg.input);

        root.style.setProperty('--main-font', fontCfg.main);
        root.style.setProperty('--title-font', fontCfg.title);
        root.style.setProperty('--btn-font', fontCfg.buttons);

        localStorage.setItem('app_theme_name', nombreTema);
        localStorage.setItem('app_typography_name', nombreTipografia);

        if (window.AppMotor && typeof AppMotor._guardarConfigParcial === 'function') {
            try {
                await AppMotor._guardarConfigParcial('apariencia', { tema: nombreTema, tipografia: nombreTipografia });
            } catch (e) {
                console.error("Error al guardar apariencia en Supabase:", e);
            }
        }
    },

    cerrarSesionGlobal: async function() {
        if(confirm("¿Está seguro de que desea cerrar la sesión actual?")) {
            this.mostrarCargando("CERRANDO SESIÓN", "Protegiendo sus datos y cerrando el sistema...");
            try {
                if(window.AppMotor && AppMotor.supabase) {
                    await AppMotor.supabase.auth.signOut();
                }
                localStorage.clear();
                window.location.href = 'index.html';
            } catch (error) {
                console.error("Error al cerrar sesión", error);
                window.location.href = 'index.html';
            }
        }
    },

    iniciarTimerConexionLenta: function() {
        if (this.loadingTimer) clearTimeout(this.loadingTimer);
        this.loadingTimer = setTimeout(() => {
            const overlay = document.getElementById('loading_overlay');
            const alerta = document.getElementById('alerta_internet_lento');
            if (overlay && overlay.style.display !== 'none' && alerta) alerta.style.display = 'block';
        }, 5000);
    },

    ocultarCargando: function() {
        if (this.loadingTimer) clearTimeout(this.loadingTimer);
        const overlay = document.getElementById('loading_overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 500); 
        }
    },

    mostrarCargando: function(titulo, subtitulo) {
        const overlay = document.getElementById('loading_overlay');
        const alerta = document.getElementById('alerta_internet_lento');
        if (overlay) {
            if(titulo) document.getElementById('loading_title_txt').innerText = titulo;
            if(subtitulo) document.getElementById('loading_subtitle_txt').innerHTML = subtitulo;
            if(alerta) alerta.style.display = 'none';
            overlay.style.display = 'flex';
            setTimeout(() => { overlay.style.opacity = '1'; }, 10);
            this.iniciarTimerConexionLenta();
        }
    },

    toggleSidebar: function() {
        const side = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if(side.classList.contains('open')) {
            side.classList.remove('open');
            overlay.classList.remove('active');
        } else {
            side.classList.add('open');
            overlay.classList.add('active');
        }
    },

    toggleVerPin: function() {
        const input = document.getElementById('pin_ingreso_global');
        const btn = document.getElementById('btn_ojo_pin');
        if (input.type === 'password') {
            input.type = 'text';
            btn.innerText = '👁️';
        } else {
            input.type = 'password';
            btn.innerText = '🙈';
        }
    },

    bloquearPantallaPIN: function(callbackVerificarPIN) {
        const bloqueo = document.getElementById('pantalla_bloqueo_global');
        const main = document.getElementById('main_wrapper');
        const input = document.getElementById('pin_ingreso_global');
        const btnVerificar = document.getElementById('btn_desbloquear_pin');
        const controles = document.getElementById('controles_bloqueo');
        const msj = document.getElementById('msj_respuesta_pin');

        if (bloqueo && main) {
            bloqueo.style.display = 'flex';
            main.style.display = 'none';
            input.value = '';
            msj.innerHTML = '';
            controles.style.display = 'block';

            btnVerificar.onclick = () => {
                const pinIngresado = input.value.trim();
                controles.style.display = 'none';
                msj.innerHTML = '<div class="msg-green">Verificando Credenciales...</div>';
                
                setTimeout(() => {
                    if (callbackVerificarPIN(pinIngresado)) {
                        msj.innerHTML = '<div class="msg-green">¡Acceso Autorizado!</div>';
                        setTimeout(() => {
                            bloqueo.style.display = 'none';
                            main.style.display = 'block';
                            input.value = '';
                            msj.innerHTML = '';
                            controles.style.display = 'block';
                        }, 500); 
                    } else {
                        msj.innerHTML = '<div class="msg-red">❌ Contraseña Incorrecta</div>';
                        input.value = '';
                        setTimeout(() => { msj.innerHTML = ''; controles.style.display = 'block'; }, 1500);
                    }
                }, 800);
            };
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    UIBase.inyectarEstilosGlobales();
    UIBase.inyectarEstructuraBase();
});
