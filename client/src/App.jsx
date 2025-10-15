import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Contexts
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { ProduitsProvider } from './contexts/ProduitsContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';

// Layout
import Layout from './components/common/layout/Layout.jsx';
import AdminLayout from './components/common/layout/AdminLayout.jsx';

// Pages publiques
import Accueil from './pages/accueil.jsx';
import Boutique from './pages/Boutique.jsx';
import Categories from './pages/Categories.jsx';
import PageDetailProduit from './pages/PageDetailProduit.jsx';
import Nouveautes from './pages/Nouveautes.jsx';

// Pages authentification
import Connexion from './pages/auth/connexion.jsx';
import Inscription from './pages/auth/inscription.jsx';
import MotDePasseOublie from './pages/auth/MotDePasseOublie.jsx';

// Pages utilisateur
import Profil from './pages/profil.jsx';
import Panier from './pages/panier.jsx';
import Paiement from './pages/paiement.jsx';
import Confirmation from './pages/Confirmation.jsx';
import MesCommandes from './pages/MesCommandes.jsx';
import CommandeDetail from './pages/CommandeDetail.jsx';

// Pages admin
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminProduits from './pages/admin/Produits.jsx';
import AdminClients from './pages/admin/Clients.jsx';

// Routes protégées
import ProtectedRoute from './contexts/ProtectedRoute.jsx';

// Composants
import { ToastNody } from './components/ui/ToastNody.jsx';

// Composant principal de l'application
function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <ProduitsProvider>
                    <CartProvider>
                        <div className="App">
                            <ToastNody />

                            <Routes>
                                {/* Routes publiques avec layout principal */}
                                <Route path="/" element={<Layout />}>
                                    <Route index element={<Accueil />} />
                                    <Route path="boutique" element={<Boutique />} />
                                    <Route path="categories" element={<Categories />} />
                                    <Route path="categories/:slug" element={<Categories />} />
                                    <Route path="produit/:slug" element={<PageDetailProduit />} />
                                    <Route path="nouveautes" element={<Nouveautes />} />

                                    {/* Routes authentification */}
                                    <Route path="connexion" element={<Connexion />} />
                                    <Route path="inscription" element={<Inscription />} />
                                    <Route
                                        path="mot-de-passe-oublie"
                                        element={<MotDePasseOublie />}
                                    />
                                </Route>

                                {/* Routes utilisateur connecté */}
                                <Route path="/" element={<Layout />}>
                                    <Route
                                        path="profil"
                                        element={
                                            <ProtectedRoute>
                                                <Profil />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="panier"
                                        element={
                                            <ProtectedRoute>
                                                <Panier />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="paiement"
                                        element={
                                            <ProtectedRoute>
                                                <Paiement />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="confirmation"
                                        element={
                                            <ProtectedRoute>
                                                <Confirmation />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="mes-commandes"
                                        element={
                                            <ProtectedRoute>
                                                <MesCommandes />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="commande/:id"
                                        element={
                                            <ProtectedRoute>
                                                <CommandeDetail />
                                            </ProtectedRoute>
                                        }
                                    />
                                </Route>

                                {/* Routes admin */}
                                <Route
                                    path="/admin"
                                    element={
                                        <ProtectedRoute requireAdmin={true}>
                                            <AdminLayout />
                                        </ProtectedRoute>
                                    }
                                >
                                    <Route index element={<Dashboard />} />
                                    <Route path="produits" element={<AdminProduits />} />
                                    <Route path="clients" element={<AdminClients />} />
                                </Route>

                                {/* Route 404 */}
                                <Route
                                    path="*"
                                    element={
                                        <Layout>
                                            <div className="container text-center py-5">
                                                <h1 className="display-1 text-muted">404</h1>
                                                <h2 className="mb-4">Page non trouvée</h2>
                                                <p className="text-muted mb-4">
                                                    La page que vous recherchez n'existe pas ou a
                                                    été déplacée.
                                                </p>
                                                <a href="/" className="btn btn-primary">
                                                    Retour à l'accueil
                                                </a>
                                            </div>
                                        </Layout>
                                    }
                                />
                            </Routes>
                        </div>
                    </CartProvider>
                </ProduitsProvider>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
