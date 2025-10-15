import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCart } from '../../contexts/CartContext.jsx';
import SearchBar from '../SearchBar.jsx';
import UserDropdown from '../UserDropdown.jsx';
import LangueSelector from '../LangueSelector.jsx';
import DeviseSelector from '../DeviseSelector.jsx';
import './Header.scss';

// Composant Header
const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { estAuthentifie, utilisateur, deconnecter } = useAuth();
    const { nombreArticles } = useCart();
    const navigate = useNavigate();

    // Fonction pour ouvrir/fermer le menu mobile
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleDeconnexion = async () => {
        await deconnecter();
        navigate('/');
    };

    return (
        <header className="header-sticky">
            <div className="container">
                {/* Barre supérieure */}
                <div className="header-top py-2 border-bottom d-none d-md-block">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="d-flex align-items-center gap-4">
                                <LangueSelector />
                                <DeviseSelector />
                            </div>
                        </div>
                        <div className="col-md-6 text-end">
                            <nav className="nav-top">
                                <Link to="/a-propos" className="text-muted small me-3">
                                    À propos
                                </Link>
                                <Link to="/contact" className="text-muted small me-3">
                                    Contact
                                </Link>
                                <Link to="/aide" className="text-muted small">
                                    Aide
                                </Link>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Barre principale */}
                <div className="header-main py-3">
                    <div className="row align-items-center">
                        {/* Logo */}
                        <div className="col-6 col-md-3">
                            <Link to="/" className="navbar-brand">
                                <div className="d-flex align-items-center">
                                    <img
                                        src="/src/assets/logo/neos-brands-solid.svg"
                                        alt="Nody"
                                        width="32"
                                        height="32"
                                        className="me-2"
                                    />
                                    <span className="fw-bold fs-4 text-primary">NODY</span>
                                </div>
                            </Link>
                        </div>

                        {/* Navigation desktop */}
                        <div className="col-md-6 d-none d-md-block">
                            <nav className="navbar-nav nav-main">
                                <div className="d-flex justify-content-center gap-4">
                                    <Link to="/" className="nav-link fw-medium">
                                        Accueil
                                    </Link>
                                    <Link to="/boutique" className="nav-link fw-medium">
                                        Boutique
                                    </Link>
                                    <Link to="/categories" className="nav-link fw-medium">
                                        Catégories
                                    </Link>
                                    <Link to="/nouveautes" className="nav-link fw-medium">
                                        Nouveautés
                                    </Link>
                                </div>
                            </nav>
                        </div>

                        {/* Actions utilisateur */}
                        <div className="col-6 col-md-3">
                            <div className="d-flex justify-content-end align-items-center gap-3">
                                {/* Barre de recherche (mobile) */}
                                <div className="d-md-none">
                                    <button
                                        className="btn btn-link text-dark p-0"
                                        onClick={() => {
                                            /* Ouvrir modal recherche */
                                        }}
                                    >
                                        <i className="bi bi-search fs-5"></i>
                                    </button>
                                </div>

                                {/* Barre de recherche (desktop) */}
                                <div className="d-none d-md-block">
                                    <SearchBar />
                                </div>

                                {/* Compte utilisateur */}
                                {estAuthentifie ? (
                                    <UserDropdown
                                        utilisateur={utilisateur}
                                        onDeconnexion={handleDeconnexion}
                                    />
                                ) : (
                                    <div className="d-none d-md-flex gap-2">
                                        <Link
                                            to="/connexion"
                                            className="btn btn-outline-primary btn-sm"
                                        >
                                            Connexion
                                        </Link>
                                        <Link to="/inscription" className="btn btn-primary btn-sm">
                                            Inscription
                                        </Link>
                                    </div>
                                )}

                                {/* Panier */}
                                <Link to="/panier" className="position-relative">
                                    <i className="bi bi-cart3 fs-5 text-dark"></i>
                                    {nombreArticles > 0 && (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                            {nombreArticles}
                                        </span>
                                    )}
                                </Link>

                                {/* Menu mobile */}
                                <button
                                    className="navbar-toggler d-md-none border-0"
                                    type="button"
                                    onClick={toggleMenu}
                                >
                                    <i className={`bi bi-${isMenuOpen ? 'x' : 'list'} fs-4`}></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu mobile */}
                {isMenuOpen && (
                    <div className="header-mobile d-md-none">
                        <div className="py-3 border-top">
                            <nav className="navbar-nav">
                                <Link to="/" className="nav-link py-2" onClick={toggleMenu}>
                                    Accueil
                                </Link>
                                <Link to="/boutique" className="nav-link py-2" onClick={toggleMenu}>
                                    Boutique
                                </Link>
                                <Link
                                    to="/categories"
                                    className="nav-link py-2"
                                    onClick={toggleMenu}
                                >
                                    Catégories
                                </Link>
                                <Link
                                    to="/nouveautes"
                                    className="nav-link py-2"
                                    onClick={toggleMenu}
                                >
                                    Nouveautés
                                </Link>

                                {!estAuthentifie && (
                                    <>
                                        <Link
                                            to="/connexion"
                                            className="nav-link py-2"
                                            onClick={toggleMenu}
                                        >
                                            Connexion
                                        </Link>
                                        <Link
                                            to="/inscription"
                                            className="nav-link py-2"
                                            onClick={toggleMenu}
                                        >
                                            Inscription
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
