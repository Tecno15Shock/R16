/**
 * app_motor.js - MOTOR CENTRAL DE DATOS (APP CORE)
 * @description Maneja estado global, peticiones a Supabase, escrituras atómicas y caché del sistema.
 * @version 2.1 (Actualizado con módulo de Proveedores y Motor de Purga/Reseteo)
 */

const AppMotor = {
    url: 'https://khazglefhixcdynrdixj.supabase.co',
    key: 'sb_publishable__ysP-HoZp2sWZLqQfnDOAg_zcTQSV3i',
    supabase: null,
    
    estadoGlobal: {
        session: null,
        local_id: null,
        configuracion: {},
        datosLocal: {},
        catalogo: [],
        proveedores: [],
        clientes: [],
        sistemaMonetario: { moneda_base: 'USD', secundarias: [] }
    },

    inicializar: async function() {
        if (!window.supabase) throw new Error("Librería Supabase no detectada.");
        this.supabase = window.supabase.createClient(this.url, this.key);
        
        const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();
        if (sessionError || !sessionData.session) throw new Error("NoAutorizado");
        this.estadoGlobal.session = sessionData.session;

        const userId = sessionData.session.user.id;
        const { data: perfil, error: errPerfil } = await this.supabase.from('perfiles').select('local_id, nombre, rol').eq('id', userId).single();
        if (errPerfil || !perfil?.local_id) throw new Error("Acceso Denegado: Usuario sin local.");

        this.estadoGlobal.local_id = perfil.local_id;
        await this.sincronizarDatosMaestros();
        return this.estadoGlobal;
    },

    sincronizarDatosMaestros: async function() {
        try {
            const [resConf, resLocal, resProv, resCat] = await Promise.all([
                this.supabase.from('configuraciones').select('*').eq('local_id', this.estadoGlobal.local_id).maybeSingle(),
                this.supabase.from('locales').select('nombre').eq('id', this.estadoGlobal.local_id).maybeSingle(),
                this.supabase.from('proveedores').select('*').eq('local_id', this.estadoGlobal.local_id).eq('activo', true),
                this.supabase.from('catalogo').select('*').eq('local_id', this.estadoGlobal.local_id)
            ]);
            
            if (resConf.data) { 
                this.estadoGlobal.configuracion = resConf.data; 
                this.estadoGlobal.sistemaMonetario = resConf.data.tasas || { moneda_base: 'USD', secundarias: [] }; 
            }
            if (resLocal.data) this.estadoGlobal.datosLocal = resLocal.data;
            if (resProv.data) this.estadoGlobal.proveedores = resProv.data;
            if (resCat.data) this.estadoGlobal.catalogo = resCat.data;
        } catch (e) { throw new Error("Error de sincronización."); }
    },

    _guardarConfigParcial: async function(columna, objetoJson) {
        if (!this.estadoGlobal.local_id) throw new Error("Motor no inicializado.");
        const payload = { local_id: this.estadoGlobal.local_id, [columna]: objetoJson };
        const { error } = await this.supabase.from('configuraciones').upsert(payload, { onConflict: 'local_id' });
        if (error) throw new Error(error.message);
        return true;
    },

    crearProveedor: async function(datos) {
        if (!datos.nombre_empresa) throw new Error("Nombre de empresa obligatorio.");
        const payload = { local_id: this.estadoGlobal.local_id, nombre_empresa: datos.nombre_empresa, rif_comercial: datos.rif_comercial || 'N/A', telefono: datos.telefono || '', moneda_preferida: datos.moneda_preferida || this.estadoGlobal.sistemaMonetario.moneda_base, activo: true };
        const { data, error } = await this.supabase.from('proveedores').insert([payload]).select().single();
        if (error) throw new Error(error.message);
        this.estadoGlobal.proveedores.push(data);
        return data;
    },

    registrarEntradaMercancia: async function(productoId, proveedorId, cantidad, costoTotal, monedaOperacion, nota) {
        if (cantidad <= 0) throw new Error("Cantidad debe ser mayor a 0.");
        let prod = this.estadoGlobal.catalogo.find(p => p.id === productoId);
        if (!prod) throw new Error("Producto no encontrado.");

        let nuevoStock = parseFloat(prod.stock || 0) + parseFloat(cantidad);
        const { error: errHistorial } = await this.supabase.from('proveedores_historial_entradas').insert([{
            local_id: this.estadoGlobal.local_id, producto_id: productoId, proveedor_id: proveedorId || null, cantidad: cantidad, costo_total_compra: costoTotal || 0, moneda_operacion: monedaOperacion || this.estadoGlobal.sistemaMonetario.moneda_base, nota: nota || 'Ingreso'
        }]);
        if (errHistorial) throw new Error(errHistorial.message);

        const { error: errStock } = await this.supabase.from('catalogo').update({ stock: nuevoStock }).eq('id', productoId);
        if (errStock) throw new Error(errStock.message);

        prod.stock = nuevoStock;
        return true;
    },

    actualizarReglasLaborales: async function(listaReglas) {
        await this._guardarConfigParcial('reglas_laborales', { lista: listaReglas });
        this.estadoGlobal.configuracion.reglas_laborales = { lista: listaReglas };
        return true;
    },

    obtenerReglasLaborales: function() { 
        return this.estadoGlobal.configuracion?.reglas_laborales?.lista || []; 
    },
	
    actualizarConciliacionesRules: async function(listaConciliaciones) {
        await this._guardarConfigParcial('conciliaciones', { lista: listaConciliaciones });
        this.estadoGlobal.configuracion.conciliaciones = { lista: listaConciliaciones };
        return true;
    },

    obtenerConciliacionesRules: function() { return this.estadoGlobal.configuracion?.conciliaciones?.lista || []; },

    actualizarIdentidad: async function(nuevoNombre) {
        if (!nuevoNombre || nuevoNombre.trim() === '') throw new Error("El nombre no puede estar vacío.");
        const { error: errLocal } = await this.supabase.from('locales').update({ nombre: nuevoNombre }).eq('id', this.estadoGlobal.local_id);
        if (errLocal) throw new Error(errLocal.message);

        const identidadObj = { ...(this.estadoGlobal.configuracion.identidad || {}), nombre: nuevoNombre };
        await this._guardarConfigParcial('identidad', identidadObj);
        
        this.estadoGlobal.configuracion.identidad = identidadObj;
        this.estadoGlobal.datosLocal.nombre = nuevoNombre;
        return true;
    },

    actualizarSistemaMonetario: async function(monedaBase, secundariasAnexadas) {
        if (!monedaBase) throw new Error("Seleccione moneda base.");
        const estructuraMonetaria = { moneda_base: monedaBase, secundarias: secundariasAnexadas };
        await this._guardarConfigParcial('tasas', estructuraMonetaria);
        this.estadoGlobal.configuracion.tasas = estructuraMonetaria;
        this.estadoGlobal.sistemaMonetario = estructuraMonetaria;
        return estructuraMonetaria;
    },

    actualizarPinSeguridad: async function(nuevoPin) {
        const identidadObj = { ...(this.estadoGlobal.configuracion.identidad || {}), admin_pass: nuevoPin };
        await this._guardarConfigParcial('identidad', identidadObj);
        this.estadoGlobal.configuracion.identidad = identidadObj;
        return true;
    },

    verificarPinAdministrador: function(pinIngresado) {
        const pinReal = this.estadoGlobal.configuracion?.identidad?.admin_pass;
        if (!pinReal) return true;
        return pinIngresado === pinReal;
    },
    
    ejecutarPurgaHistorial: async function(modulo, rango, parametro) {
        if (!this.estadoGlobal.local_id) throw new Error("Error crítico: Local ID no definido.");
        
        let query = this.supabase.from(modulo).delete().eq('local_id', this.estadoGlobal.local_id);

        if (rango === 'mes') {
            const inicio = `${parametro}-01T00:00:00Z`;
            const anio = parseInt(parametro.split('-')[0]);
            const mes = parseInt(parametro.split('-')[1]);
            const ultimoDia = new Date(anio, mes, 0).getDate();
            const fin = `${parametro}-${ultimoDia}T23:59:59Z`;
            query = query.gte('created_at', inicio).lte('created_at', fin);
        } 
        else if (rango === 'ano') {
            const inicio = `${parametro}-01-01T00:00:00Z`;
            const fin = `${parametro}-12-31T23:59:59Z`;
            query = query.gte('created_at', inicio).lte('created_at', fin);
        }

        const { error } = await query;
        if (error) throw new Error(error.message);
        return true;
    },

    ejecutarResetFabrica: async function() {
        if (!this.estadoGlobal.local_id) throw new Error("Error crítico: Local ID no definido.");
        
        const tablasABorrar = [
            'facturacion', 'cierres_caja', 'gastos_avances', 'movimientos_inv',
            'proveedores_historial_entradas', 'proveedores', 'clientes', 'catalogo'
        ];

        for (const tabla of tablasABorrar) {
            const { error } = await this.supabase.from(tabla).delete().eq('local_id', this.estadoGlobal.local_id);
            if (error) console.error(`Error borrando ${tabla}:`, error.message); 
        }

        const resetConfig = { identidad: this.estadoGlobal.configuracion.identidad || {} };
        await this.supabase.from('configuraciones').update(resetConfig).eq('local_id', this.estadoGlobal.local_id);

        return true;
    }
};
