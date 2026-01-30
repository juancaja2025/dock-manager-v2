const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================== BASE DE DATOS EN MEMORIA =====================
let turnos = [];
let turnoCounter = 1;

// ===================== ESTILOS CSS COMPARTIDOS =====================
const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    min-height: 100vh;
    color: #fff;
  }
  .container { max-width: 500px; margin: 0 auto; padding: 20px; }
  .container-wide { max-width: 900px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  .subtitle { color: #94a3b8; margin-bottom: 24px; }
  .card { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
  .btn { 
    display: block; width: 100%; padding: 16px; border: none; border-radius: 12px; 
    font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 12px;
    transition: transform 0.2s, opacity 0.2s;
  }
  .btn:hover { transform: scale(1.02); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-blue { background: linear-gradient(135deg, #0099A8 0%, #007A87 100%); color: white; }
  .btn-green { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; }
  .btn-orange { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; }
  .btn-red { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
  input, select { 
    width: 100%; padding: 16px; border: 2px solid rgba(255,255,255,0.1); 
    border-radius: 12px; font-size: 18px; background: rgba(255,255,255,0.05); 
    color: white; margin-bottom: 8px;
  }
  input::placeholder { color: #64748b; }
  input:focus, select:focus { outline: none; border-color: #0099A8; }
  .error { background: rgba(239,68,68,0.2); color: #fca5a5; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
  .success { background: rgba(34,197,94,0.2); color: #86efac; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
  .icon-circle { 
    width: 80px; height: 80px; border-radius: 50%; 
    display: flex; align-items: center; justify-content: center; 
    font-size: 40px; margin: 0 auto 16px;
  }
  .icon-blue { background: rgba(0,153,168,0.2); }
  .icon-green { background: rgba(34,197,94,0.2); }
  .icon-orange { background: rgba(249,115,22,0.2); }
  .badge { 
    display: inline-block; padding: 4px 12px; border-radius: 20px; 
    font-size: 12px; font-weight: 600; 
  }
  .badge-yellow { background: rgba(234,179,8,0.2); color: #fde047; }
  .badge-blue { background: rgba(0,153,168,0.2); color: #67e8f9; }
  .badge-green { background: rgba(34,197,94,0.2); color: #86efac; }
  .badge-orange { background: rgba(249,115,22,0.2); color: #fdba74; }
  .badge-red { background: rgba(239,68,68,0.2); color: #fca5a5; }
  .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
  .tab { 
    flex: 1; padding: 12px; border-radius: 8px; border: none; 
    background: rgba(255,255,255,0.05); color: #94a3b8; cursor: pointer;
    font-weight: 600;
  }
  .tab.active { background: #0099A8; color: white; }
  .turno-card { 
    background: rgba(255,255,255,0.05); border-radius: 12px; 
    padding: 16px; margin-bottom: 12px; 
    display: flex; justify-content: space-between; align-items: center;
  }
  .turno-info h3 { font-size: 18px; margin-bottom: 4px; }
  .turno-info p { color: #94a3b8; font-size: 14px; }
  .turno-meta { text-align: right; }
  .turno-meta .time { color: #94a3b8; font-size: 14px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .kpi { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: center; }
  .kpi-value { font-size: 32px; font-weight: 700; color: #0099A8; }
  .kpi-label { color: #94a3b8; font-size: 14px; }
  .dock-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 16px; }
  .dock { 
    padding: 12px 8px; border-radius: 8px; text-align: center; 
    font-weight: 600; font-size: 14px;
  }
  .dock-free { background: rgba(34,197,94,0.2); color: #86efac; }
  .dock-occupied { background: rgba(239,68,68,0.2); color: #fca5a5; }
  .warehouse { margin-bottom: 24px; }
  .warehouse h3 { margin-bottom: 12px; color: #94a3b8; }
  .nav { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .nav a { 
    padding: 8px 16px; background: rgba(255,255,255,0.1); 
    border-radius: 8px; color: white; text-decoration: none; font-size: 14px;
  }
  .nav a:hover { background: rgba(255,255,255,0.2); }
`;

// ===================== FUNCIONES HELPER =====================
function generarId() {
  return 'TRN-' + String(turnoCounter++).padStart(3, '0');
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status) {
  const badges = {
    'ESPERANDO_ASIGNACION': '<span class="badge badge-yellow">Esperando</span>',
    'DARSENA_ASIGNADA': '<span class="badge badge-blue">Asignada</span>',
    'ATRACADO': '<span class="badge badge-green">Atracado</span>',
    'DESATRACADO': '<span class="badge badge-orange">Desatracado</span>',
    'EGRESADO': '<span class="badge badge-red">Egresado</span>'
  };
  return badges[status] || status;
}

// ===================== RUTAS API =====================

// Registrar entrada
app.post('/api/entrada', (req, res) => {
  const { truck } = req.body;
  if (!truck) return res.json({ success: false, error: 'Patente requerida' });
  
  // Buscar turno activo existente
  const existente = turnos.find(t => t.truck === truck.toUpperCase() && t.status !== 'EGRESADO');
  if (existente) {
    return res.json({ success: true, id: existente.id, existing: true });
  }
  
  // Crear nuevo turno
  const turno = {
    id: generarId(),
    truck: truck.toUpperCase(),
    carrier: 'Por asignar',
    type: 'INBOUND',
    warehouse: '',
    dock: '',
    status: 'ESPERANDO_ASIGNACION',
    ts_entrada: new Date().toISOString(),
    ts_asignacion: null,
    ts_atracado: null,
    ts_desatracado: null,
    ts_egreso: null
  };
  
  turnos.push(turno);
  res.json({ success: true, id: turno.id, existing: false });
});

// Obtener turno por ID
app.get('/api/turno/:id', (req, res) => {
  const turno = turnos.find(t => t.id === req.params.id);
  if (!turno) return res.json({ success: false, error: 'Turno no encontrado' });
  res.json({ success: true, turno });
});

// Obtener turno por patente
app.get('/api/turno/truck/:truck', (req, res) => {
  const turno = turnos.find(t => t.truck === req.params.truck.toUpperCase() && t.status !== 'EGRESADO');
  if (!turno) return res.json({ success: false, error: 'Turno no encontrado' });
  res.json({ success: true, turno });
});

// Obtener todos los turnos
app.get('/api/turnos', (req, res) => {
  res.json({ success: true, turnos });
});

// Asignar dársena
app.post('/api/asignar', (req, res) => {
  const { turnoId, dock, warehouse } = req.body;
  const turno = turnos.find(t => t.id === turnoId);
  
  if (!turno) return res.json({ success: false, error: 'Turno no encontrado' });
  if (turno.status !== 'ESPERANDO_ASIGNACION') {
    return res.json({ success: false, error: 'El turno ya tiene dársena asignada' });
  }
  
  // Verificar que el dock no esté ocupado
  const dockOcupado = turnos.find(t => t.dock === dock && t.status !== 'EGRESADO' && t.status !== 'DESATRACADO');
  if (dockOcupado) {
    return res.json({ success: false, error: 'Esa dársena ya está ocupada' });
  }
  
  turno.dock = dock;
  turno.warehouse = warehouse;
  turno.status = 'DARSENA_ASIGNADA';
  turno.ts_asignacion = new Date().toISOString();
  
  res.json({ success: true });
});

// Atraque automático (escanear QR de dársena)
app.post('/api/dock/:dockId', (req, res) => {
  const dockId = req.params.dockId;
  
  // Buscar turno asignado a esta dársena
  const turno = turnos.find(t => t.dock === dockId && t.status !== 'EGRESADO' && t.status !== 'DESATRACADO');
  
  if (!turno) {
    return res.json({ success: false, error: 'No hay ningún camión asignado a esta dársena' });
  }
  
  if (turno.status === 'DARSENA_ASIGNADA') {
    turno.status = 'ATRACADO';
    turno.ts_atracado = new Date().toISOString();
    return res.json({ success: true, action: 'atracado', truck: turno.truck });
  } else if (turno.status === 'ATRACADO') {
    turno.status = 'DESATRACADO';
    turno.ts_desatracado = new Date().toISOString();
    turno.dock = ''; // Liberar dock
    return res.json({ success: true, action: 'desatracado', truck: turno.truck });
  } else {
    return res.json({ success: false, error: 'Estado no válido: ' + turno.status });
  }
});

// Registrar salida
app.post('/api/salida', (req, res) => {
  const { truck } = req.body;
  const turno = turnos.find(t => t.truck === truck.toUpperCase() && t.status === 'DESATRACADO');
  
  if (!turno) {
    return res.json({ success: false, error: 'No se encontró un turno desatracado para esa patente' });
  }
  
  turno.status = 'EGRESADO';
  turno.ts_egreso = new Date().toISOString();
  
  res.json({ success: true, turno });
});

// ===================== PÁGINAS HTML =====================

// Home
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dock Manager - OCASA</title>
      <style>${styles}</style>
    </head><body>
      <div class="container" style="text-align: center; padding-top: 60px;">
        <div class="icon-circle icon-blue" style="margin-bottom: 24px;">🚛</div>
        <h1>Dock Manager</h1>
        <p class="subtitle">Sistema de gestión de dársenas</p>
        <div class="card">
          <a href="/operador" class="btn btn-blue">📋 Panel Operador</a>
          <a href="/garita" class="btn btn-green">🛡️ Control Garita</a>
          <a href="/entrada" class="btn btn-orange">🚛 Entrada Vehículos</a>
        </div>
      </div>
    </body></html>
  `);
});

// Página Entrada
app.get('/entrada', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Entrada - Dock Manager</title>
      <style>${styles}</style>
    </head><body>
      <div class="container" style="text-align: center; padding-top: 40px;">
        <div class="icon-circle icon-blue">🚛</div>
        <h1>Registro de Ingreso</h1>
        <p class="subtitle">Ingresá tu patente para registrarte</p>
        
        <div id="error" class="error" style="display:none;"></div>
        <div id="success" class="success" style="display:none;"></div>
        
        <div class="card">
          <input type="text" id="truck" placeholder="Ej: AA-123-BB" maxlength="10"
                 style="text-transform: uppercase; font-family: monospace; font-size: 24px; text-align: center;">
          <button class="btn btn-blue" onclick="registrar()" id="btnSubmit">
            🚛 Registrar Ingreso
          </button>
        </div>
      </div>
      
      <script>
        document.getElementById('truck').addEventListener('keyup', function(e) {
          this.value = this.value.toUpperCase();
          if (e.key === 'Enter') registrar();
        });
        
        async function registrar() {
          const truck = document.getElementById('truck').value.trim();
          if (!truck) { showError('Ingresá tu patente'); return; }
          
          document.getElementById('btnSubmit').disabled = true;
          document.getElementById('btnSubmit').innerHTML = '⏳ Procesando...';
          
          try {
            const res = await fetch('/api/entrada', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ truck })
            });
            const data = await res.json();
            
            if (data.success) {
              showSuccess(data.existing ? '✅ Ya tenés un turno activo' : '✅ ¡Registrado correctamente!');
              setTimeout(() => { window.location.href = '/turno/' + data.id; }, 1500);
            } else {
              showError(data.error);
              document.getElementById('btnSubmit').disabled = false;
              document.getElementById('btnSubmit').innerHTML = '🚛 Registrar Ingreso';
            }
          } catch(e) {
            showError('Error de conexión');
            document.getElementById('btnSubmit').disabled = false;
            document.getElementById('btnSubmit').innerHTML = '🚛 Registrar Ingreso';
          }
        }
        
        function showError(msg) {
          document.getElementById('success').style.display = 'none';
          document.getElementById('error').textContent = msg;
          document.getElementById('error').style.display = 'block';
        }
        function showSuccess(msg) {
          document.getElementById('error').style.display = 'none';
          document.getElementById('success').textContent = msg;
          document.getElementById('success').style.display = 'block';
        }
      </script>
    </body></html>
  `);
});

// Página Turno (estado del chofer)
app.get('/turno/:id', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mi Turno - Dock Manager</title>
      <style>${styles}
        .timeline { margin-top: 20px; }
        .timeline-item { display: flex; align-items: center; padding: 12px 0; border-left: 2px solid rgba(255,255,255,0.1); margin-left: 12px; padding-left: 24px; position: relative; }
        .timeline-item::before { content: ''; position: absolute; left: -6px; width: 10px; height: 10px; border-radius: 50%; background: #64748b; }
        .timeline-item.done::before { background: #22c55e; }
        .timeline-item.current::before { background: #0099A8; box-shadow: 0 0 0 4px rgba(0,153,168,0.3); }
        .timeline-time { color: #94a3b8; font-size: 14px; width: 80px; }
        .timeline-text { flex: 1; }
      </style>
    </head><body>
      <div class="container" style="padding-top: 20px;">
        <div id="content">
          <div style="text-align: center;">
            <div class="icon-circle icon-blue">⏳</div>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
      
      <script>
        const turnoId = '${req.params.id}';
        
        async function loadTurno() {
          try {
            const res = await fetch('/api/turno/' + turnoId);
            const data = await res.json();
            
            if (data.success) {
              renderTurno(data.turno);
            } else {
              document.getElementById('content').innerHTML = '<div class="error">Turno no encontrado</div>';
            }
          } catch(e) {
            document.getElementById('content').innerHTML = '<div class="error">Error de conexión</div>';
          }
        }
        
        function renderTurno(t) {
          const statusText = {
            'ESPERANDO_ASIGNACION': '⏳ Esperando asignación de dársena',
            'DARSENA_ASIGNADA': '📍 Dirigite a la dársena ' + t.dock,
            'ATRACADO': '🔄 Operación en curso en ' + t.dock,
            'DESATRACADO': '✅ Operación finalizada. Dirigite a la salida',
            'EGRESADO': '👋 ¡Hasta pronto!'
          };
          
          const iconClass = t.status === 'DESATRACADO' || t.status === 'EGRESADO' ? 'icon-green' : 'icon-blue';
          
          let html = '<div style="text-align: center;">';
          html += '<div class="icon-circle ' + iconClass + '">🚛</div>';
          html += '<h1>' + t.truck + '</h1>';
          html += '<p class="subtitle">' + statusText[t.status] + '</p>';
          html += '</div>';
          
          html += '<div class="card">';
          html += '<div class="timeline">';
          
          html += '<div class="timeline-item ' + (t.ts_entrada ? 'done' : '') + '">';
          html += '<div class="timeline-time">' + (t.ts_entrada ? formatTime(t.ts_entrada) : '--:--') + '</div>';
          html += '<div class="timeline-text">Ingreso registrado</div></div>';
          
          html += '<div class="timeline-item ' + (t.ts_asignacion ? 'done' : (t.status === 'ESPERANDO_ASIGNACION' ? 'current' : '')) + '">';
          html += '<div class="timeline-time">' + (t.ts_asignacion ? formatTime(t.ts_asignacion) : '--:--') + '</div>';
          html += '<div class="timeline-text">Dársena asignada' + (t.dock ? ': ' + t.dock : '') + '</div></div>';
          
          html += '<div class="timeline-item ' + (t.ts_atracado ? 'done' : (t.status === 'DARSENA_ASIGNADA' ? 'current' : '')) + '">';
          html += '<div class="timeline-time">' + (t.ts_atracado ? formatTime(t.ts_atracado) : '--:--') + '</div>';
          html += '<div class="timeline-text">Atracado</div></div>';
          
          html += '<div class="timeline-item ' + (t.ts_desatracado ? 'done' : (t.status === 'ATRACADO' ? 'current' : '')) + '">';
          html += '<div class="timeline-time">' + (t.ts_desatracado ? formatTime(t.ts_desatracado) : '--:--') + '</div>';
          html += '<div class="timeline-text">Desatracado</div></div>';
          
          html += '<div class="timeline-item ' + (t.ts_egreso ? 'done' : (t.status === 'DESATRACADO' ? 'current' : '')) + '">';
          html += '<div class="timeline-time">' + (t.ts_egreso ? formatTime(t.ts_egreso) : '--:--') + '</div>';
          html += '<div class="timeline-text">Egreso</div></div>';
          
          html += '</div></div>';
          
          html += '<p style="text-align:center; color:#64748b; font-size:14px; margin-top:16px;">🔄 Actualizando automáticamente</p>';
          
          document.getElementById('content').innerHTML = html;
        }
        
        function formatTime(ts) {
          return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        }
        
        loadTurno();
        setInterval(loadTurno, 5000);
      </script>
    </body></html>
  `);
});

// Página Dock (QR de dársena)
app.get('/dock/:dockId', (req, res) => {
  const dockId = req.params.dockId;
  res.send(`
    <!DOCTYPE html>
    <html><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dársena ${dockId} - Dock Manager</title>
      <style>${styles}</style>
    </head><body>
      <div class="container" style="text-align: center; padding-top: 40px;">
        <div id="loading">
          <div class="icon-circle icon-blue">⚓</div>
          <h1>Dársena ${dockId}</h1>
          <p class="subtitle">⏳ Procesando...</p>
        </div>
        <div id="result" style="display:none;"></div>
      </div>
      
      <script>
        async function procesar() {
          try {
            const res = await fetch('/api/dock/${dockId}', { method: 'POST' });
            const data = await res.json();
            
            document.getElementById('loading').style.display = 'none';
            document.getElementById('result').style.display = 'block';
            
            if (data.success) {
              if (data.action === 'atracado') {
                document.getElementById('result').innerHTML = 
                  '<div class="card"><div class="icon-circle icon-green">✅</div>' +
                  '<h1 style="color:#22c55e;">¡Atracado!</h1>' +
                  '<p class="subtitle">Camión ' + data.truck + '</p>' +
                  '<p style="color:#94a3b8;">Dársena ${dockId}</p></div>';
              } else {
                document.getElementById('result').innerHTML = 
                  '<div class="card"><div class="icon-circle icon-orange">🚪</div>' +
                  '<h1 style="color:#f97316;">¡Desatracado!</h1>' +
                  '<p class="subtitle">Camión ' + data.truck + '</p>' +
                  '<p style="color:#94a3b8;">Puede dirigirse a la salida</p></div>';
              }
            } else {
              document.getElementById('result').innerHTML = 
                '<div class="card"><div class="icon-circle" style="background:rgba(239,68,68,0.2);">❌</div>' +
                '<h1 style="color:#ef4444;">Error</h1>' +
                '<p class="subtitle">' + data.error + '</p>' +
                '<button class="btn btn-blue" onclick="location.reload()">Reintentar</button></div>';
            }
          } catch(e) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('result').style.display = 'block';
            document.getElementById('result').innerHTML = 
              '<div class="card"><div class="icon-circle" style="background:rgba(239,68,68,0.2);">❌</div>' +
              '<h1 style="color:#ef4444;">Error de conexión</h1>' +
              '<button class="btn btn-blue" onclick="location.reload()">Reintentar</button></div>';
          }
        }
        
        procesar();
      </script>
    </body></html>
  `);
});

// Página Salida
app.get('/salida', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Salida - Dock Manager</title>
      <style>${styles}</style>
    </head><body>
      <div class="container" style="text-align: center; padding-top: 40px;">
        <div class="icon-circle icon-orange">🚪</div>
        <h1>Registro de Salida</h1>
        <p class="subtitle">Ingresá tu patente para registrar egreso</p>
        
        <div id="error" class="error" style="display:none;"></div>
        <div id="success" class="success" style="display:none;"></div>
        
        <div class="card">
          <input type="text" id="truck" placeholder="Ej: AA-123-BB" maxlength="10"
                 style="text-transform: uppercase; font-family: monospace; font-size: 24px; text-align: center;">
          <button class="btn btn-orange" onclick="registrar()" id="btnSubmit">
            🚪 Registrar Salida
          </button>
        </div>
      </div>
      
      <script>
        document.getElementById('truck').addEventListener('keyup', function(e) {
          this.value = this.value.toUpperCase();
          if (e.key === 'Enter') registrar();
        });
        
        async function registrar() {
          const truck = document.getElementById('truck').value.trim();
          if (!truck) { showError('Ingresá tu patente'); return; }
          
          document.getElementById('btnSubmit').disabled = true;
          document.getElementById('btnSubmit').innerHTML = '⏳ Procesando...';
          
          try {
            const res = await fetch('/api/salida', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ truck })
            });
            const data = await res.json();
            
            if (data.success) {
              showSuccess('✅ ¡Egreso registrado! Buen viaje 🚛');
            } else {
              showError(data.error);
              document.getElementById('btnSubmit').disabled = false;
              document.getElementById('btnSubmit').innerHTML = '🚪 Registrar Salida';
            }
          } catch(e) {
            showError('Error de conexión');
            document.getElementById('btnSubmit').disabled = false;
            document.getElementById('btnSubmit').innerHTML = '🚪 Registrar Salida';
          }
        }
        
        function showError(msg) {
          document.getElementById('success').style.display = 'none';
          document.getElementById('error').textContent = msg;
          document.getElementById('error').style.display = 'block';
        }
        function showSuccess(msg) {
          document.getElementById('error').style.display = 'none';
          document.getElementById('success').textContent = msg;
          document.getElementById('success').style.display = 'block';
        }
      </script>
    </body></html>
  `);
});

// Página Operador
app.get('/operador', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Operador - Dock Manager</title>
      <style>${styles}</style>
    </head><body>
      <div class="container-wide">
        <h1>📋 Panel Operador</h1>
        <p class="subtitle">Gestión de dársenas y turnos</p>
        
        <div class="nav">
          <a href="/">🏠 Inicio</a>
          <a href="/garita">🛡️ Garita</a>
        </div>
        
        <div class="grid-2" id="kpis">
          <div class="kpi"><div class="kpi-value">-</div><div class="kpi-label">En predio</div></div>
          <div class="kpi"><div class="kpi-value">-</div><div class="kpi-label">Atracados</div></div>
        </div>
        
        <h2 style="margin-top: 24px; margin-bottom: 16px;">Turnos activos</h2>
        <div id="turnos"></div>
        
        <h2 style="margin-top: 24px; margin-bottom: 16px;">Estado de dársenas</h2>
        <div id="docks"></div>
      </div>
      
      <script>
        let allTurnos = [];
        
        async function loadData() {
          try {
            const res = await fetch('/api/turnos');
            const data = await res.json();
            allTurnos = data.turnos;
            renderKPIs();
            renderTurnos();
            renderDocks();
          } catch(e) {
            console.error(e);
          }
        }
        
        function renderKPIs() {
          const enPredio = allTurnos.filter(t => t.status !== 'EGRESADO').length;
          const atracados = allTurnos.filter(t => t.status === 'ATRACADO').length;
          document.getElementById('kpis').innerHTML = 
            '<div class="kpi"><div class="kpi-value">' + enPredio + '</div><div class="kpi-label">En predio</div></div>' +
            '<div class="kpi"><div class="kpi-value">' + atracados + '</div><div class="kpi-label">Atracados</div></div>';
        }
        
        function renderTurnos() {
          const activos = allTurnos.filter(t => t.status !== 'EGRESADO');
          if (activos.length === 0) {
            document.getElementById('turnos').innerHTML = '<div class="card" style="text-align:center; color:#64748b;">No hay turnos activos</div>';
            return;
          }
          
          let html = '';
          activos.forEach(t => {
            html += '<div class="turno-card">';
            html += '<div class="turno-info">';
            html += '<h3>' + t.truck + ' ' + getStatusBadge(t.status) + '</h3>';
            html += '<p>' + t.carrier + (t.dock ? ' → ' + t.dock : '') + '</p>';
            html += '</div>';
            html += '<div class="turno-meta">';
            
            if (t.status === 'ESPERANDO_ASIGNACION') {
              html += '<select id="dock-' + t.id + '" style="width:120px; margin-right:8px; padding:8px; font-size:16px;">';
              for (let i = 1; i <= 40; i++) {
                const d = 'D-' + String(i).padStart(2, '0');
                const ocupada = allTurnos.some(x => x.dock === d && x.status !== 'EGRESADO' && x.status !== 'DESATRACADO');
                html += '<option value="' + d + '"' + (ocupada ? ' disabled style="color:#666;"' : '') + '>' + d + (ocupada ? ' (ocupada)' : '') + '</option>';
              }
              html += '</select>';
              html += '<button class="btn btn-green" style="display:inline-block; width:auto; padding:8px 16px; margin:0;" onclick="asignar(\'' + t.id + '\')">Asignar</button>';
            } else {
              html += '<div class="time">Ingreso: ' + formatTime(t.ts_entrada) + '</div>';
            }
            
            html += '</div></div>';
          });
          
          document.getElementById('turnos').innerHTML = html;
        }
        
        function renderDocks() {
          let html = '';
          
          // Nave 1: D-01 a D-20
          html += '<div class="warehouse"><h3>🏭 Nave 1</h3><div class="dock-grid">';
          for (let i = 1; i <= 20; i++) {
            const d = 'D-' + String(i).padStart(2, '0');
            const ocupada = allTurnos.some(t => t.dock === d && t.status !== 'EGRESADO' && t.status !== 'DESATRACADO');
            html += '<div class="dock ' + (ocupada ? 'dock-occupied' : 'dock-free') + '">' + d + '</div>';
          }
          html += '</div></div>';
          
          // Nave 2: D-21 a D-40
          html += '<div class="warehouse"><h3>🏭 Nave 2</h3><div class="dock-grid">';
          for (let i = 21; i <= 40; i++) {
            const d = 'D-' + String(i).padStart(2, '0');
            const ocupada = allTurnos.some(t => t.dock === d && t.status !== 'EGRESADO' && t.status !== 'DESATRACADO');
            html += '<div class="dock ' + (ocupada ? 'dock-occupied' : 'dock-free') + '">' + d + '</div>';
          }
          html += '</div></div>';
          
          document.getElementById('docks').innerHTML = html;
        }
        
        async function asignar(turnoId) {
          const dock = document.getElementById('dock-' + turnoId).value;
          const warehouse = parseInt(dock.split('-')[1]) <= 20 ? 'Nave 1' : 'Nave 2';
          
          try {
            const res = await fetch('/api/asignar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ turnoId, dock, warehouse })
            });
            const data = await res.json();
            if (data.success) {
              loadData();
            } else {
              alert(data.error);
            }
          } catch(e) {
            alert('Error de conexión');
          }
        }
        
        function getStatusBadge(status) {
          const badges = {
            'ESPERANDO_ASIGNACION': '<span class="badge badge-yellow">Esperando</span>',
            'DARSENA_ASIGNADA': '<span class="badge badge-blue">Asignada</span>',
            'ATRACADO': '<span class="badge badge-green">Atracado</span>',
            'DESATRACADO': '<span class="badge badge-orange">Desatracado</span>',
            'EGRESADO': '<span class="badge badge-red">Egresado</span>'
          };
          return badges[status] || status;
        }
        
        function formatTime(ts) {
          return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        }
        
        loadData();
        setInterval(loadData, 5000);
      </script>
    </body></html>
  `);
});

// Página Garita
app.get('/garita', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Garita - Dock Manager</title>
      <style>${styles}</style>
    </head><body>
      <div class="container-wide">
        <h1>🛡️ Control de Accesos</h1>
        <p class="subtitle">Vehículos en predio</p>
        
        <div class="nav">
          <a href="/">🏠 Inicio</a>
          <a href="/operador">📋 Operador</a>
        </div>
        
        <div class="tabs">
          <button class="tab active" onclick="showTab('predio')">En Predio</button>
          <button class="tab" onclick="showTab('egresos')">Egresos</button>
        </div>
        
        <div id="predio"></div>
        <div id="egresos" style="display:none;"></div>
      </div>
      
      <script>
        let allTurnos = [];
        
        async function loadData() {
          try {
            const res = await fetch('/api/turnos');
            const data = await res.json();
            allTurnos = data.turnos;
            renderPredio();
            renderEgresos();
          } catch(e) {
            console.error(e);
          }
        }
        
        function renderPredio() {
          const enPredio = allTurnos.filter(t => t.status !== 'EGRESADO');
          if (enPredio.length === 0) {
            document.getElementById('predio').innerHTML = '<div class="card" style="text-align:center; color:#64748b;">No hay vehículos en predio</div>';
            return;
          }
          
          let html = '';
          enPredio.forEach(t => {
            html += '<div class="turno-card">';
            html += '<div class="turno-info">';
            html += '<h3>' + t.truck + ' ' + getStatusBadge(t.status) + '</h3>';
            html += '<p>' + t.carrier + (t.dock ? ' → ' + t.dock : '') + '</p>';
            html += '</div>';
            html += '<div class="turno-meta">';
            html += '<div class="time">Ingreso</div>';
            html += '<div class="time">' + formatTime(t.ts_entrada) + '</div>';
            html += '</div></div>';
          });
          
          document.getElementById('predio').innerHTML = html;
        }
        
        function renderEgresos() {
          const egresos = allTurnos.filter(t => t.status === 'EGRESADO');
          if (egresos.length === 0) {
            document.getElementById('egresos').innerHTML = '<div class="card" style="text-align:center; color:#64748b;">No hay egresos registrados</div>';
            return;
          }
          
          let html = '';
          egresos.slice(-20).reverse().forEach(t => {
            html += '<div class="turno-card">';
            html += '<div class="turno-info">';
            html += '<h3>' + t.truck + '</h3>';
            html += '<p>' + t.carrier + '</p>';
            html += '</div>';
            html += '<div class="turno-meta">';
            html += '<div class="time">Egreso</div>';
            html += '<div class="time">' + formatTime(t.ts_egreso) + '</div>';
            html += '</div></div>';
          });
          
          document.getElementById('egresos').innerHTML = html;
        }
        
        function showTab(tab) {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          event.target.classList.add('active');
          document.getElementById('predio').style.display = tab === 'predio' ? 'block' : 'none';
          document.getElementById('egresos').style.display = tab === 'egresos' ? 'block' : 'none';
        }
        
        function getStatusBadge(status) {
          const badges = {
            'ESPERANDO_ASIGNACION': '<span class="badge badge-yellow">Esperando</span>',
            'DARSENA_ASIGNADA': '<span class="badge badge-blue">Asignada</span>',
            'ATRACADO': '<span class="badge badge-green">Atracado</span>',
            'DESATRACADO': '<span class="badge badge-orange">Desatracado</span>',
            'EGRESADO': '<span class="badge badge-red">Egresado</span>'
          };
          return badges[status] || status;
        }
        
        function formatTime(ts) {
          return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        }
        
        loadData();
        setInterval(loadData, 5000);
      </script>
    </body></html>
  `);
});

// ===================== INICIAR SERVIDOR =====================
app.listen(PORT, () => {
  console.log(`🚛 Dock Manager corriendo en puerto ${PORT}`);
});
