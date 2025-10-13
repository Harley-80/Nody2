import { body, validationResult } from 'express-validator';

// Gestionnaire des erreurs de validation
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    // S'il y a des erreurs, renvoyer une réponse 400 avec les messages d'erreur
    if (!errors.isEmpty()) {
        const messages = errors.array().map(error => error.msg);
        return res.status(400).json({
            success: false,
            message: 'Données du formulaire invalides',
            errors: messages,
        });
    }

    next();
};

// Règles de validation pour l'inscription
export const validateInscription = [
    body('nom')
        .trim()
        .notEmpty()
        .withMessage('Le nom est requis')
        .isLength({ min: 2, max: 50 })
        .withMessage('Le nom doit contenir entre 2 et 50 caractères')
        .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
        .withMessage('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),

    body('prenom')
        .trim()
        .notEmpty()
        .withMessage('Le prénom est requis')
        .isLength({ min: 2, max: 50 })
        .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
        .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
        .withMessage('Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'),

    body('email').isEmail().withMessage('Veuillez fournir un email valide').normalizeEmail(),

    body('motDePasse')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage(
            'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
        ),

    body('confirmationMotDePasse').custom((value, { req }) => {
        if (value !== req.body.motDePasse) {
            throw new Error('Les mots de passe ne correspondent pas');
        }
        return true;
    }),

    handleValidationErrors,
];

// Règles de validation pour la connexion
export const validateConnexion = [
    body('email').isEmail().withMessage('Veuillez fournir un email valide').normalizeEmail(),

    body('motDePasse').notEmpty().withMessage('Le mot de passe est requis'),

    handleValidationErrors,
];

// Règles de validation pour la réinitialisation du mot de passe
export const validateMotDePasseOublie = [
    body('email').isEmail().withMessage('Veuillez fournir un email valide').normalizeEmail(),

    handleValidationErrors,
];

// Règles de validation pour la réinitialisation du mot de passe
export const validateReinitialiserMotDePasse = [
    body('motDePasse')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage(
            'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
        ),

    body('confirmationMotDePasse').custom((value, { req }) => {
        if (value !== req.body.motDePasse) {
            throw new Error('Les mots de passe ne correspondent pas');
        }
        return true;
    }),

    handleValidationErrors,
];

// Règles de validation pour la mise à jour du profil
export const validateProfil = [
    body('nom')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Le nom doit contenir entre 2 et 50 caractères')
        .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
        .withMessage('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),

    body('prenom')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
        .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
        .withMessage('Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'),

    body('telephone')
        .optional()
        .trim()
        .matches(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)
        .withMessage('Numéro de téléphone français invalide'),

    body('dateNaissance')
        .optional()
        .isDate()
        .withMessage('Date de naissance invalide')
        .custom(value => {
            const dateNaissance = new Date(value);
            const aujourdHui = new Date();
            const age = aujourdHui.getFullYear() - dateNaissance.getFullYear();

            if (age < 13) {
                throw new Error('Vous devez avoir au moins 13 ans');
            }
            return true;
        }),

    handleValidationErrors,
];
