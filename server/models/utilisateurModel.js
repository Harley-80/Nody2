import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

// Sous-schéma pour les adresses
const adresseSchema = new mongoose.Schema({
    rue: {
        type: String,
        required: [true, 'La rue est requise'],
        trim: true,
        maxlength: [200, 'La rue ne peut pas dépasser 200 caractères'],
    },
    ville: {
        type: String,
        required: [true, 'La ville est requise'],
        trim: true,
        maxlength: [100, 'La ville ne peut pas dépasser 100 caractères'],
    },
    codePostal: {
        type: String,
        required: [true, 'Le code postal est requis'],
        trim: true,
        match: [/^[0-9]{5}$/, 'Le code postal doit contenir 5 chiffres'],
    },
    pays: {
        type: String,
        required: [true, 'Le pays est requis'],
        trim: true,
        default: 'Sénégal',
    },
    estAdressePrincipale: {
        type: Boolean,
        default: false,
    },
});

// Schéma principal pour les utilisateurs
const utilisateurSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom est requis'],
            trim: true,
            maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
        },
        prenom: {
            type: String,
            required: [true, 'Le prénom est requis'],
            trim: true,
            maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
        },
        email: {
            type: String,
            required: [true, "L'email est requis"],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Veuillez fournir un email valide'],
            index: true,
        },
        motDePasse: {
            type: String,
            required: [true, 'Le mot de passe est requis'],
            minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
            select: false,
        },
        telephone: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return !v || validator.isMobilePhone(v, 'fr-FR');
                },
                message: 'Numéro de téléphone invalide',
            },
        },
        dateNaissance: {
            type: Date,
            validate: {
                validator: function (date) {
                    return !date || date < new Date();
                },
                message: 'La date de naissance doit être valide',
            },
        },
        genre: {
            type: String,
            enum: {
                values: ['homme', 'femme'],
                message: 'Le genre doit être homme',
            },
            default: 'genre',
        },
        adresses: [adresseSchema],
        preferences: {
            newsletter: {
                type: Boolean,
                default: true,
            },
            notifications: {
                type: Boolean,
                default: true,
            },
            devise: {
                type: String,
                enum: ['XOF', 'XAF', 'EUR', 'USD', 'CAD', 'CNY'],
                default: 'XOF',
            },
            langue: {
                type: String,
                enum: ['fr', 'en'],
                default: 'fr',
            },
        },
        role: {
            type: String,
            enum: {
                values: ['client', 'vendeur', 'admin'],
                message: 'Le rôle doit être client, vendeur ou admin',
            },
            default: 'client',
        },
        avatar: {
            type: String,
            default: null,
        },
        estVerifie: {
            type: Boolean,
            default: false,
        },
        dateVerification: {
            type: Date,
        },
        tokenReinitialisation: String,
        expirationTokenReinitialisation: Date,
        dateDerniereConnexion: {
            type: Date,
        },
        estActif: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index composé pour les recherches
utilisateurSchema.index({ nom: 1, prenom: 1 });
utilisateurSchema.index({ 'preferences.devise': 1 });
utilisateurSchema.index({ 'preferences.langue': 1 });

// Virtual pour le nom complet
utilisateurSchema.virtual('nomComplet').get(function () {
    return `${this.prenom} ${this.nom}`;
});

// Middleware de pré-sauvegarde pour hacher le mot de passe
utilisateurSchema.pre('save', async function (next) {
    if (!this.isModified('motDePasse')) return next();

    // Hachage du mot de passe avec bcrypt
    try {
        const salt = await bcrypt.genSalt(12);
        this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Méthode pour comparer les mots de passe
utilisateurSchema.methods.comparerMotDePasse = async function (motDePasseCandidate) {
    return await bcrypt.compare(motDePasseCandidate, this.motDePasse);
};

// Méthode pour obtenir les adresses principales
utilisateurSchema.methods.getAdressePrincipale = function () {
    return this.adresses.find(adresse => adresse.estAdressePrincipale) || this.adresses[0];
};

// Méthode pour mettre à jour la date de dernière connexion
utilisateurSchema.methods.mettreAJourDerniereConnexion = function () {
    this.dateDerniereConnexion = new Date();
    return this.save();
};

// Static method pour trouver par email
utilisateurSchema.statics.trouverParEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

export default mongoose.model('Utilisateur', utilisateurSchema);
