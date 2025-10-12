import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../contexts/ToastContext'
import './Auth.scss'

// Composant pour la page de mot de passe oublié
const MotDePasseOublie = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    // Contexte de traduction et de notifications
    const { t } = useTranslation()
    const { success, error } = useToast()

    // Gestion de la soumission du formulaire
    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true)

        // Simuler l'envoi d'un email de réinitialisation
        try {
            // Simulation d'envoi d'email
            await new Promise(resolve => setTimeout(resolve, 2000))

            success('Un email de réinitialisation a été envoyé !')
            setEmailSent(true)
        } catch (err) {
            error("Erreur lors de l'envoi de l'email")
        } finally {
            setLoading(false)
        }
    }

    // Rendu du composant MotDePasseOublie
    if (emailSent) {
        return (
            <div className='auth-page'>
                <div className='auth-container'>
                    <div className='auth-card'>
                        <div className='auth-header text-center'>
                            <div className='success-icon'>
                                <i className='fas fa-check-circle'></i>
                            </div>
                            <h1 className='auth-title'>Email envoyé !</h1>
                            <p className='auth-subtitle'>
                                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>
                            </p>
                            <p className='auth-text'>
                                Vérifiez votre boîte de réception et suivez les instructions pour
                                réinitialiser votre mot de passe.
                            </p>
                        </div>

                        <div className='auth-footer text-center'>
                            <Link to='/connexion' className='btn btn-primary'>
                                Retour à la connexion
                            </Link>
                            <p className='auth-help'>
                                Vous n'avez pas reçu l'email ?{' '}
                                <button className='resend-link' onClick={() => setEmailSent(false)}>
                                    Renvoyer
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Rendu du formulaire de demande de réinitialisation de mot de passe
    return (
        <div className='auth-page'>
            <div className='auth-container'>
                <div className='auth-card'>
                    <div className='auth-header'>
                        <h1 className='auth-title'>Mot de passe oublié</h1>
                        <p className='auth-subtitle'>
                            Entrez votre email pour recevoir un lien de réinitialisation
                        </p>
                    </div>

                    {/* Formulaire de réinitialisation de mot de passe */}
                    <form onSubmit={handleSubmit} className='auth-form'>
                        <div className='form-group'>
                            <label htmlFor='email' className='form-label'>
                                {t('auth.email')}
                            </label>
                            <input
                                type='email'
                                id='email'
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className='form-control'
                                placeholder='votre@email.com'
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type='submit'
                            className='btn btn-primary auth-btn'
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className='fas fa-spinner fa-spin'></i>
                                    Envoi en cours...
                                </>
                            ) : (
                                'Envoyer le lien de réinitialisation'
                            )}
                        </button>
                    </form>

                    <div className='auth-footer text-center'>
                        <Link to='/connexion' className='auth-link'>
                            ← Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MotDePasseOublie
