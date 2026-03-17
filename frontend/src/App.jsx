import React, { useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

import { 
  Package, Users, HardDrive, Cpu, 
  Power, Plus, CheckCircle2, AlertCircle, X, Download,
  ChevronDown, ChevronUp
} from 'lucide-react';

export default function App() {
  const [systemInfo, setSystemInfo] = useState({});
  const [expandedCard, setExpandedCard] = useState(null); // 'paquetes' | 'usuarios' | null
  
  const [userData, setUserData] = useState({ name: '', password: '', repeat: '' });
  const [pkgName, setPkgName] = useState('');
  
  const [loadingPkg, setLoadingPkg] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

  useEffect(() => {
    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const res = await axios.get('/system/');
      setSystemInfo(res.data);
    } catch (e) {
      console.error("Failed to fetch system info");
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 8000);
  };

  const toggleCard = (card) => {
    setExpandedCard(expandedCard === card ? null : card);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoadingUser(true);
    try {
      if (userData.password !== userData.repeat) {
        throw new Error("Las contraseñas no coinciden");
      }
      await axios.post('/users/', {
        name: userData.name,
        password: userData.password,
        repeat_password: userData.repeat
      });
      showNotification('success', `Usuario ${userData.name} creado exitosamente.`);
      setUserData({ name: '', password: '', repeat: '' });
      setExpandedCard(null);
      fetchSystemInfo();
    } catch (e) {
      showNotification('error', e.response?.data?.detail || e.message || "Error al crear usuario.");
    } finally {
      setLoadingUser(false);
    }
  };

  const handlePkgSubmit = async (e) => {
    e.preventDefault();
    if (!pkgName) return;
    setLoadingPkg(true);
    try {
      const res = await axios.post('/packages/', { name: pkgName });
      showNotification('success', `Paquete ${pkgName} instalado correctamente. \\n\\n${res.data.log || ''}`);
      setPkgName('');
      setExpandedCard(null);
    } catch (e) {
      showNotification('error', e.response?.data?.detail || "Error al instalar el paquete.");
    } finally {
      setLoadingPkg(false);
    }
  };

  const reboot = async () => {
    if(window.confirm("¿Seguro que deseas reiniciar el sistema?")) {
      try {
        await axios.post('/reboot/');
        showNotification('success', 'Reiniciando sistema...');
      } catch (e) {
        showNotification('error', 'Error al reiniciar.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* Background decoration */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        <header className="mb-12 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              Admin Control Panel
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Visión general y gestión del sistema interactiva</p>
          </div>
           <button 
              onClick={reboot}
              className="mt-6 sm:mt-0 px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-2xl text-sm font-bold tracking-wide transition-all flex items-center gap-2 group shadow-lg shadow-rose-900/20"
            >
              <Power className="w-5 h-5 group-hover:scale-110 transition-transform" />
              REINICIAR SERVIDOR
            </button>
        </header>

        {/* Floating Notification */}
        {notification && (
          <div className={`fixed top-6 right-6 p-4 rounded-xl shadow-2xl flex items-start space-x-3 z-50 animate-in slide-in-from-top-2 fade-in duration-300 max-w-md w-full ${notification.type === 'success' ? 'bg-emerald-950/90 border border-emerald-500/50 shadow-emerald-900/50' : 'bg-rose-950/90 border border-rose-500/50 shadow-rose-900/50'} backdrop-blur-md`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />}
            <div className="flex-1 whitespace-pre-line">
              <h4 className={`text-sm font-bold tracking-wide ${notification.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {notification.type === 'success' ? 'ÉXITO' : 'ERROR'}
              </h4>
              <p className="text-sm text-slate-200 mt-1 leading-relaxed">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* PAQUETES CARD (Accordion) */}
          <div className={`bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl transition-all duration-300 shadow-xl overflow-hidden ${expandedCard === 'paquetes' ? 'ring-2 ring-indigo-500/50' : 'hover:border-indigo-500/30'}`}>
            {/* Header / Trigger */}
            <div 
              className="p-6 cursor-pointer flex items-center justify-between group"
              onClick={() => toggleCard('paquetes')}
            >
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <Package className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Gestor de Paquetes</h3>
                  <p className="text-sm text-indigo-300/70 mt-1 font-medium">Instalar software via APT</p>
                </div>
              </div>
              <div className="text-slate-500 group-hover:text-indigo-400 transition-colors">
                {expandedCard === 'paquetes' ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </div>
            </div>

            {/* Expanded Content */}
            <div className={`transition-all duration-500 ease-in-out ${expandedCard === 'paquetes' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 pt-0 border-t border-slate-800/50 bg-slate-950/30">
                <p className="text-slate-400 text-sm mb-6 mt-4">El paquete será descargado e instalado mediante el gestor APT en el sistema.</p>
                <form onSubmit={handlePkgSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2" htmlFor="pkgname">Nombre del Paquete</label>
                      <input 
                        id="pkgname"
                        type="text" 
                        required
                        placeholder="ej: mc, htop, vim"
                        value={pkgName}
                        onChange={(e) => setPkgName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={loadingPkg || !pkgName}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {loadingPkg ? (
                        <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Instalando...</>
                      ) : (
                        <><Download className="w-5 h-5" /> Instalar Ahora</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* USUARIOS CARD (Accordion) */}
          <div className={`bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl transition-all duration-300 shadow-xl overflow-hidden ${expandedCard === 'usuarios' ? 'ring-2 ring-cyan-500/50' : 'hover:border-cyan-500/30'}`}>
            {/* Header / Trigger */}
            <div 
              className="p-6 cursor-pointer flex items-center justify-between group"
              onClick={() => toggleCard('usuarios')}
            >
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <Users className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Sudoers</h3>
                  <p className="text-sm text-cyan-300/70 mt-1 font-medium">Gestionar usuarios de sistema</p>
                </div>
              </div>
              <div className="text-slate-500 group-hover:text-cyan-400 transition-colors">
                {expandedCard === 'usuarios' ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </div>
            </div>

            {/* Expanded Content */}
            <div className={`transition-all duration-500 ease-in-out ${expandedCard === 'usuarios' ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 pt-0 border-t border-slate-800/50 bg-slate-950/30">
                <p className="text-slate-400 text-sm mb-6 mt-4">Crea un nuevo usuario en el sistema con privilegios elevados preconfigurados en sudoers.</p>
                <form onSubmit={handleUserSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Usuario</label>
                      <input 
                        type="text" 
                        required
                        value={userData.name}
                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Contraseña</label>
                        <input 
                          type="password" 
                          required
                          value={userData.password}
                          onChange={(e) => setUserData({...userData, password: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Repetir Contraseña</label>
                        <input 
                          type="password" 
                          required
                          value={userData.repeat}
                          onChange={(e) => setUserData({...userData, repeat: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={loadingUser || !userData.name || userData.password !== userData.repeat}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-2xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {loadingUser ? (
                        <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creando...</>
                      ) : (
                        <><Plus className="w-5 h-5" /> Crear Usuario</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* DISCO CARD (Info only - always visible) */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-colors pointer-events-none" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl shadow-inner">
                <HardDrive className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Almacenamiento</h3>
                <p className="text-sm text-emerald-300/70 mt-1 font-medium">Espacio total en /</p>
              </div>
            </div>
            <div className="mt-8 flex items-end justify-between relative z-10 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80">
              <span className="text-4xl font-extrabold font-mono tracking-tight text-emerald-400">
                {systemInfo.disk ? systemInfo.disk.split(' / ')[0] : '...'}
              </span>
              <span className="text-sm font-semibold text-slate-400 mb-1 tracking-wide">
                DE {systemInfo.disk ? systemInfo.disk.split(' / ')[1] : '...'}
              </span>
            </div>
          </div>

          {/* MEMORIA CARD (Info only - always visible) */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full group-hover:bg-amber-500/20 transition-colors pointer-events-none" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl shadow-inner">
                <Cpu className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Memoria RAM</h3>
                <p className="text-sm text-amber-300/70 mt-1 font-medium">Uso actual en host</p>
              </div>
            </div>
            <div className="mt-8 relative z-10 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80">
              <span className="text-4xl font-extrabold font-mono tracking-tight text-amber-400">{systemInfo.memory || '...'}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
