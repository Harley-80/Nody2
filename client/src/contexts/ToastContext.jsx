import React, { createContext, useState, useContext, useCallback } from 'react';
import { ToastNody } from '../components/ui/ToastNody.jsx';

// Création du contexte
const ToastContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast doit être utilisé within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    // Afficher un toast
    const showToast = useCallback((message, type = 'info', duree = 5000) => {
        const id = Date.now().toString();
        const nouveauToast = {
            id,
            message,
            type,
            duree,
        };

        setToasts(prevToasts => [...prevToasts, nouveauToast]);

        // Supprimer automatiquement après la durée
        if (duree > 0) {
            setTimeout(() => {
                dismissToast(id);
            }, duree);
        }

        return id;
    }, []);

    // Cacher un toast
    const dismissToast = useCallback(id => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    // Méthodes pratiques pour différents types de toast
    const showSuccess = useCallback(
        (message, duree) => {
            return showToast(message, 'success', duree);
        },
        [showToast]
    );

    const showError = useCallback(
        (message, duree) => {
            return showToast(message, 'error', duree);
        },
        [showToast]
    );

    const showWarning = useCallback(
        (message, duree) => {
            return showToast(message, 'warning', duree);
        },
        [showToast]
    );

    const showInfo = useCallback(
        (message, duree) => {
            return showToast(message, 'info', duree);
        },
        [showToast]
    );

    const value = {
        toasts,
        showToast,
        dismissToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastNody />
        </ToastContext.Provider>
    );
};
