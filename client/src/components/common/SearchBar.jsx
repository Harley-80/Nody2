import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProduits } from '../../contexts/ProduitsContext.jsx';
import './SearchBar.scss';

// Composant de recherche
const SearchBar = () => {
    const [terme, setTerme] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [estOuvert, setEstOuvert] = useState(false);
    const { rechercherProduits } = useProduits();
    const navigate = useNavigate();
    const inputRef = useRef();
    const timeoutRef = useRef();
    
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Fonction de recherche
    const handleRecherche = async termeRecherche => {
        if (termeRecherche.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            const resultat = await rechercherProduits(termeRecherche, { limit: 5 });
            if (resultat.success) {
                setSuggestions(resultat.produits || []);
            }
        } catch (error) {
            console.error('Erreur recherche:', error);
        }
    };

    // Fonction de changement de valeur
    const handleChange = e => {
        const valeur = e.target.value;
        setTerme(valeur);

        // Caractéristiques de la recherche
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Délai avant la recherche
        timeoutRef.current = setTimeout(() => {
            handleRecherche(valeur);
        }, 300);
    };

    // Fonction de soumission du formulaire
    const handleSubmit = e => {
        e.preventDefault();
        if (terme.trim()) {
            navigate(`/boutique?search=${encodeURIComponent(terme)}`);
            setEstOuvert(false);
            setTerme('');
        }
    };

    // Fonction de clic sur une suggestion
    const handleSuggestionClick = produit => {
        navigate(`/produit/${produit.slug}`);
        setEstOuvert(false);
        setTerme('');
    };

    // Fonction de focus et de blur
    const handleFocus = () => {
        setEstOuvert(true);
    };

    // Fonction de blur
    const handleBlur = () => {
        // Timeout pour permettre le clic sur les suggestions
        setTimeout(() => setEstOuvert(false), 200);
    };

    return (
        <div className="search-bar position-relative">
            <form onSubmit={handleSubmit} className="d-flex">
                <div className="input-group">
                    <input
                        ref={inputRef}
                        type="text"
                        className="form-control search-input"
                        placeholder="Rechercher un produit..."
                        value={terme}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                    <button type="submit" className="btn btn-primary">
                        <i className="bi bi-search"></i>
                    </button>
                </div>
            </form>

            {/* Suggestions */}
            {estOuvert && suggestions.length > 0 && (
                <div className="search-suggestions">
                    {suggestions.map(produit => (
                        <div
                            key={produit._id}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(produit)}
                        >
                            <img
                                src={produit.images[0]}
                                alt={produit.nom}
                                className="suggestion-image"
                            />
                            <div className="suggestion-info">
                                <div className="suggestion-name">{produit.nom}</div>
                                <div className="suggestion-price text-primary fw-bold">
                                    {produit.prixMin.toFixed(2)} xof
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
