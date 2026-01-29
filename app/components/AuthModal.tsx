'use client';

import { useStore } from '../context/StoreContext';
import { useState, useEffect } from 'react';

type UserSection = 'main' | 'orders' | 'profile' | 'addresses';

export default function AuthModal() {
  const { isAuthOpen, setAuthOpen, login, logout, user, isLoggedIn } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [activeSection, setActiveSection] = useState<UserSection>('main');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAuthOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setAuthOpen]);

  // Reset section when modal closes or user logs out
  useEffect(() => {
    if (!isAuthOpen || !isLoggedIn) {
      setActiveSection('main');
    }
  }, [isAuthOpen, isLoggedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (mode === 'register' && !name) {
      setError('Por favor ingrese su nombre');
      setIsLoading(false);
      return;
    }

    if (!email || !password) {
      setError('Por favor complete todos los campos');
      setIsLoading(false);
      return;
    }

    const success = await login(email, password, mode === 'register' ? name : undefined);
    
    if (!success) {
      setError(mode === 'login' ? 'Error al iniciar sesión' : 'Error al registrarse');
    }
    
    setIsLoading(false);
  };

  if (!isAuthOpen) return null;

  // Secciones del panel de usuario
  const renderUserSection = () => {
    switch (activeSection) {
      case 'orders':
        return (
          <div className="user-section">
            <button className="back-btn" onClick={() => setActiveSection('main')}>
              ← VOLVER
            </button>
            <h3>MIS PEDIDOS</h3>
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>Aún no tenés pedidos</p>
              <small>Cuando realices una compra, tus pedidos aparecerán aquí</small>
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="user-section">
            <button className="back-btn" onClick={() => setActiveSection('main')}>
              ← VOLVER
            </button>
            <h3>MI PERFIL</h3>
            <div className="profile-info">
              <div className="profile-field">
                <label>NOMBRE</label>
                <p>{user?.name || 'Sin nombre'}</p>
              </div>
              <div className="profile-field">
                <label>EMAIL</label>
                <p>{user?.email}</p>
              </div>
              <div className="profile-field">
                <label>MIEMBRO DESDE</label>
                <p>{new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })}</p>
              </div>
            </div>
          </div>
        );
      
      case 'addresses':
        return (
          <div className="user-section">
            <button className="back-btn" onClick={() => setActiveSection('main')}>
              ← VOLVER
            </button>
            <h3>MIS DIRECCIONES</h3>
            <div className="empty-state">
              <span className="empty-icon">📍</span>
              <p>Sin direcciones guardadas</p>
              <small>Agregá una dirección para agilizar tus compras</small>
            </div>
            <button className="add-address-btn">+ AGREGAR DIRECCIÓN</button>
          </div>
        );
      
      default:
        return (
          <div className="auth-logged">
            <div className="auth-avatar">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2>¡HOLA, {user?.name?.toUpperCase() || 'USUARIO'}!</h2>
            <p className="user-email">{user?.email}</p>
            
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Pedidos</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Favoritos</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Reseñas</span>
              </div>
            </div>
            
            <div className="auth-menu">
              <button className="auth-menu-item" onClick={() => setActiveSection('orders')}>
                <span className="menu-icon">📦</span>
                MIS PEDIDOS
                <span className="menu-arrow">→</span>
              </button>
              <button className="auth-menu-item" onClick={() => setActiveSection('profile')}>
                <span className="menu-icon">👤</span>
                MI PERFIL
                <span className="menu-arrow">→</span>
              </button>
              <button className="auth-menu-item" onClick={() => setActiveSection('addresses')}>
                <span className="menu-icon">📍</span>
                DIRECCIONES
                <span className="menu-arrow">→</span>
              </button>
            </div>
            
            <button className="auth-logout" onClick={logout}>
              CERRAR SESIÓN
            </button>
          </div>
        );
    }
  };

  return (
    <>
      <div className="auth-modal-overlay" onClick={() => setAuthOpen(false)} />
      <div className="auth-modal">
        <button className="auth-close" onClick={() => setAuthOpen(false)}>✕</button>
        
        {isLoggedIn ? (
          // VISTA DE USUARIO LOGUEADO
          renderUserSection()
        ) : (
          // VISTA DE LOGIN/REGISTRO
          <div className="auth-form-container">
            <h2>{mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}</h2>
            
            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <div className="auth-field">
                  <label>NOMBRE</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
              )}
              
              <div className="auth-field">
                <label>EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
              
              <div className="auth-field">
                <label>CONTRASEÑA</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? 'CARGANDO...' : (mode === 'login' ? 'ENTRAR' : 'REGISTRARME')}
              </button>
            </form>

            <div className="auth-switch">
              {mode === 'login' ? (
                <p>¿No tenés cuenta? <button onClick={() => setMode('register')}>Crear una</button></p>
              ) : (
                <p>¿Ya tenés cuenta? <button onClick={() => setMode('login')}>Iniciar sesión</button></p>
              )}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .auth-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9998;
          animation: fadeIn 0.2s ease;
        }
        .auth-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          z-index: 9999;
          width: 90%;
          max-width: 400px;
          padding: 40px;
          animation: scaleIn 0.3s ease;
        }
        @keyframes scaleIn {
          from { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
          to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .auth-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #999;
        }
        .auth-form-container h2,
        .auth-logged h2 {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 3px;
          margin: 0 0 30px 0;
          text-align: center;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .auth-field label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #666;
        }
        .auth-field input {
          padding: 15px;
          border: 1px solid #e0e0e0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .auth-field input:focus {
          border-color: #000;
        }
        .auth-error {
          color: #d32f2f;
          font-size: 12px;
          margin: 0;
          text-align: center;
        }
        .auth-submit {
          background: #000;
          color: #fff;
          border: none;
          padding: 18px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .auth-submit:hover {
          background: #333;
        }
        .auth-submit:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .auth-switch {
          text-align: center;
          margin-top: 25px;
          padding-top: 25px;
          border-top: 1px solid #f0f0f0;
        }
        .auth-switch p {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        .auth-switch button {
          background: none;
          border: none;
          color: #000;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
        }
        .auth-logged {
          text-align: center;
        }
        .auth-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #000;
          color: #fff;
          font-size: 32px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .auth-logged h2 {
          margin-bottom: 5px;
        }
        .user-email {
          color: #666;
          font-size: 14px;
          margin: 0 0 25px 0;
        }
        .user-stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 30px;
          padding: 20px 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .stat-number {
          font-size: 24px;
          font-weight: 800;
        }
        .stat-label {
          font-size: 10px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .auth-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 25px;
        }
        .auth-menu-item {
          background: #f8f8f8;
          border: none;
          padding: 16px 15px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }
        .auth-menu-item:hover {
          background: #f0f0f0;
        }
        .menu-icon {
          font-size: 16px;
        }
        .menu-arrow {
          margin-left: auto;
          font-size: 14px;
          color: #999;
        }
        .auth-logout {
          background: none;
          border: 1px solid #000;
          padding: 15px 30px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .auth-logout:hover {
          background: #000;
          color: #fff;
        }
        
        /* Secciones del usuario */
        .user-section {
          text-align: center;
        }
        .user-section h3 {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 3px;
          margin: 20px 0 30px;
        }
        .back-btn {
          background: none;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          color: #666;
          padding: 0;
          display: block;
          text-align: left;
        }
        .back-btn:hover {
          color: #000;
        }
        .empty-state {
          padding: 40px 20px;
          background: #f8f8f8;
          margin-bottom: 20px;
        }
        .empty-icon {
          font-size: 40px;
          display: block;
          margin-bottom: 15px;
        }
        .empty-state p {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px;
        }
        .empty-state small {
          font-size: 12px;
          color: #888;
        }
        .add-address-btn {
          background: #000;
          color: #fff;
          border: none;
          padding: 15px 30px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          cursor: pointer;
          width: 100%;
        }
        .add-address-btn:hover {
          background: #333;
        }
        .profile-info {
          text-align: left;
        }
        .profile-field {
          padding: 15px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .profile-field:last-child {
          border-bottom: none;
        }
        .profile-field label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #999;
          display: block;
          margin-bottom: 5px;
        }
        .profile-field p {
          font-size: 14px;
          margin: 0;
        }
      `}} />
    </>
  );
}
