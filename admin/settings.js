import { auth, signOut } from './admin-core.js';

export function renderSettings(container) {
    const user = auth.currentUser;
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-6 text-white fade-in">Paramètres</h2>
        <div class="max-w-md bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg fade-in">
            <h3 class="text-lg font-bold mb-4 text-white">Profil Administrateur</h3>
            <div class="flex items-center gap-4 mb-6">
                <div class="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center font-bold text-2xl text-black">A</div>
                <div>
                    <p class="font-bold text-white">Super Admin</p>
                    <p class="text-gray-400 text-sm">${user ? user.email : 'Mode Test'}</p>
                </div>
            </div>
            
            <div class="mb-6">
                <label class="block text-gray-400 text-sm mb-2">Version App</label>
                <div class="bg-gray-700 p-3 rounded text-white text-sm">v2.0.0 (SPA Edition)</div>
            </div>

            <button onclick="window.handleLogout()" class="w-full border border-red-500 text-red-500 py-3 rounded-lg hover:bg-red-500 hover:text-white transition font-bold flex items-center justify-center gap-2">
                <i class="fa-solid fa-sign-out-alt"></i> Se Déconnecter
            </button>
        </div>
    `;
}