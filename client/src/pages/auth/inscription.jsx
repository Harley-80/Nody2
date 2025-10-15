import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import './Auth.scss';

// Composant pour la page d'inscription
const Inscription = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Contexte d'authentification et traduction
    const { register } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Gestion des changements dans les champs du formulaire
    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Réinitialiser l'erreur pour le champ modifié
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    // Validation du formulaire avant soumission
    const validateForm = () => {
        const newErrors = {};

        // Validation du prénom
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'Le prénom est requis';
        }

        // Validation du nom
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Le nom est requis';
        }

        // Validation de l'email
        if (!formData.email.trim()) {
            newErrors.email = "L'email est requis";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "L'email est invalide";
        }

        // Validation du mot de passe
        if (!formData.password) {
            newErrors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        // Validation de la confirmation du mot de passe
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        // Validation de l'acceptation des conditions d'utilisation
        if (!formData.acceptTerms) {
            newErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation";
        }

        // Mettre à jour les erreurs dans l'état
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Gestion de la soumission du formulaire
    const handleSubmit = async e => {
        e.preventDefault();

        // Valider le formulaire avant de soumettre
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        // Tenter de s'inscrire avec les données du formulaire
        try {
            const result = await register(formData);
            if (result.success) {
                navigate('/');
            }
        } catch (error) {
            console.error("Erreur d'inscription:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">{t('nav.register')}</h1>
                        <p className="auth-subtitle">Rejoignez la communauté Nody</p>
                    </div>

                    {/* Formulaire d'inscription */}
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName" className="form-label">
                                    {t('auth.firstName')}
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={`form-control ${errors.firstName ? 'error' : ''}`}
                                    placeholder="Votre prénom"
                                    disabled={loading}
                                />
                                {errors.firstName && (
                                    <span className="error-message">{errors.firstName}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName" className="form-label">
                                    {t('auth.lastName')}
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={`form-control ${errors.lastName ? 'error' : ''}`}
                                    placeholder="Votre nom"
                                    disabled={loading}
                                />
                                {errors.lastName && (
                                    <span className="error-message">{errors.lastName}</span>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                {t('auth.email')}
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`form-control ${errors.email ? 'error' : ''}`}
                                placeholder="votre@email.com"
                                disabled={loading}
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                {t('auth.password')}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`form-control ${errors.password ? 'error' : ''}`}
                                placeholder="Votre mot de passe"
                                disabled={loading}
                            />
                            {errors.password && (
                                <span className="error-message">{errors.password}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                {t('auth.confirmPassword')}
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                                placeholder="Confirmez votre mot de passe"
                                disabled={loading}
                            />
                            {errors.confirmPassword && (
                                <span className="error-message">{errors.confirmPassword}</span>
                            )}
                        </div>

                        {/* Acceptation des conditions d'utilisation */}
                        <div className="form-group checkbox-group">
                            <input
                                type="checkbox"
                                id="acceptTerms"
                                name="acceptTerms"
                                checked={formData.acceptTerms}
                                onChange={handleChange}
                                className="checkbox-input"
                                disabled={loading}
                            />
                            <label htmlFor="acceptTerms" className="checkbox-label">
                                J'accepte les{' '}
                                <Link to="/conditions-utilisation" className="terms-link">
                                    conditions d'utilisation
                                </Link>{' '}
                                et la{' '}
                                <Link to="/politique-confidentialite" className="terms-link">
                                    politique de confidentialité
                                </Link>
                            </label>
                            {errors.acceptTerms && (
                                <span className="error-message">{errors.acceptTerms}</span>
                            )}
                        </div>

                        {/* Bouton de soumission du formulaire */}
                        <button
                            type="submit"
                            className="btn btn-primary auth-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Inscription...
                                </>
                            ) : (
                                t('nav.register')
                            )}
                        </button>
                    </form>

                    {/* Pied de page avec lien vers la connexion */}
                    <div className="auth-footer">
                        <p className="auth-switch">
                            {t('auth.hasAccount')}{' '}
                            <Link to="/connexion" className="auth-link">
                                {t('nav.login')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Inscription;
