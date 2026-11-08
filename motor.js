/**
 * motor.js - MOTOR CENTRAL DE DATOS (APP CORE)
 * @description Maneja estado global, peticiones a Supabase, escrituras atómicas y caché del sistema.
 * @version 2.2 (Actualizado con módulo de Proveedores, Motor de Purga, Reseteo e Identidad Fiscal Multi-país)
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

    /**
     * [NOTA] inicializar: Conecta con Supabase, valida la sesión activa del usuario y obtiene su 'local_id' para sincronizar los datos.
     */
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

    /**
     * [NOTA] sincronizarDatosMaestros: Descarga y actualiza de forma masiva los datos de configuraciones, datos del local, proveedores y catálogo desde Supabase.
     */
    sincronizarDatosMaestros: async function() {
        try {
            const [resConf, resLocal, resProv, resCat] = await Promise.all([
                this.supabase.from('configuraciones').select('*').eq('local_id', this.estadoGlobal.local_id).maybeSingle(),
                this.supabase.from('locales').select('*').eq('id', this.estadoGlobal.local_id).maybeSingle(),
                this.supabase.from('proveedores').select('*').eq('local_id', this.estadoGlobal.local_id).eq('activo', true),
                this.supabase.from('catalogo').select('*').eq('local_id', this.estadoGlobal.local_id)
            ]);
            
            if (resConf.data) { this.estadoGlobal.configuracion = resConf.data; this.estadoGlobal.sistemaMonetario = resConf.data.tasas || { moneda_base: 'USD', secundarias: [] }; }
            if (resLocal.data) this.estadoGlobal.datosLocal = resLocal.data;
            if (resProv.data) this.estadoGlobal.proveedores = resProv.data;
            if (resCat.data) this.estadoGlobal.catalogo = resCat.data;
        } catch (e) { throw new Error("Error de sincronización."); }
    },

    /**
     * [NOTA] _guardarConfigParcial: Guarda o actualiza de manera atómica (upsert) un segmento JSON específico dentro de la tabla de configuraciones.
     */
    _guardarConfigParcial: async function(columna, objetoJson) {
        if (!this.estadoGlobal.local_id) throw new Error("Motor no inicializado.");
        const payload = { local_id: this.estadoGlobal.local_id, [columna]: objetoJson };
        const { error } = await this.supabase.from('configuraciones').upsert(payload, { onConflict: 'local_id' });
        if (error) throw new Error(error.message);
        return true;
    },

    /**
     * [NOTA] crearProveedor: Inserta un nuevo proveedor comercial asociado al local actual en la base de datos.
     */
    crearProveedor: async function(datos) {
        if (!datos.nombre_empresa) throw new Error("Nombre de empresa obligatorio.");
        const payload = { local_id: this.estadoGlobal.local_id, nombre_empresa: datos.nombre_empresa, rif_comercial: datos.rif_comercial || 'N/A', telefono: datos.telefono || '', moneda_preferida: datos.moneda_preferida || this.estadoGlobal.sistemaMonetario.moneda_base, activo: true };
        const { data, error } = await this.supabase.from('proveedores').insert([payload]).select().single();
        if (error) throw new Error(error.message);
        this.estadoGlobal.proveedores.push(data);
        return data;
    },

    /**
     * [NOTA] registrarEntradaMercancia: Registra el ingreso de mercancía de un proveedor y actualiza automáticamente el stock sumándolo al producto en el catálogo.
     */
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

    /**
     * [NOTA] actualizarConciliacionesRules: Almacena las reglas de conciliación bancaria y pasarelas en la configuración.
     */
    actualizarConciliacionesRules: async function(listaConciliaciones) {
        await this._guardarConfigParcial('conciliaciones', { lista: listaConciliaciones });
        this.estadoGlobal.configuracion.conciliaciones = { lista: listaConciliaciones };
        return true;
    },

    /**
     * [NOTA] obtenerConciliacionesRules: Devuelve la lista actual de reglas de conciliación configuradas.
     */
    obtenerConciliacionesRules: function() { return this.estadoGlobal.configuracion?.conciliaciones?.lista || []; },

    /**
     * [NOTA] actualizarIdentidad: Modifica el nombre comercial del establecimiento tanto en la tabla locales como en el JSON de configuración.
     */
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

    /**
     * [NOTA] actualizarSistemaMonetario: Guarda la moneda base del sistema y la lista de monedas secundarias con sus tasas de cambio y operaciones.
     */
    actualizarSistemaMonetario: async function(monedaBase, secundariasAnexadas) {
        if (!monedaBase) throw new Error("Seleccione moneda base.");
        const estructuraMonetaria = { moneda_base: monedaBase, secundarias: secundariasAnexadas };
        await this._guardarConfigParcial('tasas', estructuraMonetaria);
        this.estadoGlobal.configuracion.tasas = estructuraMonetaria;
        this.estadoGlobal.sistemaMonetario = estructuraMonetaria;
        return estructuraMonetaria;
    },

    /**
     * [NOTA] actualizarPinSeguridad: Actualiza la contraseña o PIN maestro de administración en la configuración global.
     */
    actualizarPinSeguridad: async function(nuevoPin) {
        const identidadObj = { ...(this.estadoGlobal.configuracion.identidad || {}), admin_pass: nuevoPin };
        await this._guardarConfigParcial('identidad', identidadObj);
        this.estadoGlobal.configuracion.identidad = identidadObj;
        return true;
    },

    /**
     * [NOTA] verificarPinAdministrador: Compara el PIN ingresado por el usuario con el PIN maestro configurado para autorizar acciones protegidas.
     */
    verificarPinAdministrador: function(pinIngresado) {
        const pinReal = this.estadoGlobal.configuracion?.identidad?.admin_pass;
        if (!pinReal) return true;
        return pinIngresado === pinReal;
    },

    /* ========================================================================================= */
    /* MÓDULO DE PURGA Y MANTENIMIENTO DE BASE DE DATOS                                          */
    /* ========================================================================================= */
    
    /**
     * [NOTA] ejecutarPurgaHistorial: Elimina selectivamente registros de una tabla específica filtrando por rangos de tiempo (mes o año).
     */
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

    /**
     * [NOTA] ejecutarResetFabrica: Restablece el sistema eliminando todos los registros operativos de las tablas del local y vaciando configuraciones.
     */
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
    },

    /**
     * [NOTA] actualizarIdentidadYFiscalidad: Guarda el nombre comercial, el país fiscal seleccionado (con su respectivo régimen de América) y el RIF/NIT/RUC en Supabase.
     */
    async actualizarIdentidadYFiscalidad(datos) {
        if (!this.estadoGlobal.local_id) throw new Error("No hay local activo.");

        // 1. Actualizar en la tabla 'locales' de Supabase
        const { error: errLocal } = await this.supabase
            .from('locales')
            .update({
                nombre: datos.nombre,
                pais_fiscal: datos.pais_fiscal,
                identificacion_fiscal: datos.identificacion_fiscal
            })
            .eq('id', this.estadoGlobal.local_id);

        if (errLocal) throw errLocal;

        // 2. Guardar los parámetros fiscales combinados dentro de la columna 'identidad' (que ya existe)
        const identidadActual = this.estadoGlobal.configuracion.identidad || {};
        const identidadFusionada = {
            ...identidadActual,
            nombre: datos.nombre,
            pais_fiscal: datos.pais_fiscal,
            identificacion_fiscal: datos.identificacion_fiscal,
            regimen_cobranza: datos.regimen_cobranza
        };

        await this._guardarConfigParcial('identidad', identidadFusionada);

        // 3. Refrescar los datos maestros en memoria
        await this.sincronizarDatosMaestros();
    }
};
