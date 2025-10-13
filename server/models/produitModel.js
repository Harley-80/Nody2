import mongoose from 'mongoose';

// Schéma pour les variantes de produits
const varianteSchema = new mongoose.Schema({
    taille: {
        type: String,
        required: [true, 'La taille est requise pour la variante'],
        trim: true,
    },
    couleur: {
        type: String,
        required: [true, 'La couleur est requise pour la variante'],
        trim: true,
    },
    codeCouleur: {
        type: String,
        trim: true,
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    prix: {
        type: Number,
        required: [true, 'Le prix est requis'],
        min: [0, 'Le prix ne peut pas être négatif'],
    },
    prixPromo: {
        type: Number,
        min: [0, 'Le prix promo ne peut pas être négatif'],
        validate: {
            validator: function (value) {
                return !value || value <= this.prix;
            },
            message: 'Le prix promo ne peut pas être supérieur au prix normal',
        },
    },
    quantite: {
        type: Number,
        required: [true, 'La quantité est requise'],
        min: [0, 'La quantité ne peut pas être négative'],
        default: 0,
    },
    images: [
        {
            type: String,
        },
    ],
    estActive: {
        type: Boolean,
        default: true,
    },
});

// Sous-schéma pour les avis des produits
const avisSchema = new mongoose.Schema(
    {
        utilisateur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: true,
        },
        note: {
            type: Number,
            required: true,
            min: [1, 'La note doit être au moins 1'],
            max: [5, 'La note ne peut pas dépasser 5'],
        },
        commentaire: {
            type: String,
            trim: true,
            maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères'],
        },
        estVerifie: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Schéma principal pour les produits
const produitSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom du produit est requis'],
            trim: true,
            maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères'],
            index: true,
        },
        description: {
            type: String,
            required: [true, 'La description est requise'],
            trim: true,
        },
        descriptionCourte: {
            type: String,
            trim: true,
            maxlength: [300, 'La description courte ne peut pas dépasser 300 caractères'],
        },
        categorie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Categorie',
            required: [true, 'La catégorie est requise'],
            index: true,
        },
        marque: {
            type: String,
            trim: true,
            maxlength: [100, 'La marque ne peut pas dépasser 100 caractères'],
            index: true,
        },
        variantes: [varianteSchema],
        images: [
            {
                type: String,
                required: [true, 'Au moins une image est requise'],
            },
        ],
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        caracteristiques: [
            {
                nom: {
                    type: String,
                    required: true,
                    trim: true,
                },
                valeur: {
                    type: String,
                    required: true,
                    trim: true,
                },
            },
        ],
        prixMin: {
            type: Number,
            min: [0, 'Le prix minimum ne peut pas être négatif'],
        },
        prixMax: {
            type: Number,
            min: [0, 'Le prix maximum ne peut pas être négatif'],
        },
        noteMoyenne: {
            type: Number,
            default: 0,
            min: [0, 'La note moyenne ne peut pas être négative'],
            max: [5, 'La note moyenne ne peut pas dépasser 5'],
        },
        nombreAvis: {
            type: Number,
            default: 0,
        },
        avis: [avisSchema],
        metaTitre: {
            type: String,
            trim: true,
            maxlength: [60, 'Le meta titre ne peut pas dépasser 60 caractères'],
        },
        metaDescription: {
            type: String,
            trim: true,
            maxlength: [160, 'La meta description ne peut pas dépasser 160 caractères'],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        estEnPromotion: {
            type: Boolean,
            default: false,
        },
        pourcentagePromo: {
            type: Number,
            min: [0, 'Le pourcentage promo ne peut pas être négatif'],
            max: [100, 'Le pourcentage promo ne peut pas dépasser 100'],
        },
        estNouveau: {
            type: Boolean,
            default: false,
        },
        estPopulaire: {
            type: Boolean,
            default: false,
        },
        quantiteVendue: {
            type: Number,
            default: 0,
            min: 0,
        },
        seuilAlerteStock: {
            type: Number,
            default: 5,
            min: 0,
        },
        estActive: {
            type: Boolean,
            default: true,
        },
        vendeur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index composés pour les recherches et filtres
produitSchema.index({ categorie: 1, prixMin: 1 });
produitSchema.index({ marque: 1, estActive: 1 });
produitSchema.index({ estNouveau: 1, createdAt: -1 });
produitSchema.index({ estEnPromotion: 1, pourcentagePromo: -1 });
produitSchema.index({ tags: 1 });
produitSchema.index({ 'variantes.quantite': 1 });

// Virtual pour le stock total
produitSchema.virtual('stockTotal').get(function () {
    return this.variantes.reduce((total, variante) => total + variante.quantite, 0);
});

// Virtual pour vérifier si en stock
produitSchema.virtual('enStock').get(function () {
    return this.stockTotal > 0;
});

// Virtual pour le prix de départ
produitSchema.virtual('prixDepart').get(function () {
    const prixVariantes = this.variantes.map(v => v.prixPromo || v.prix);
    return prixVariantes.length > 0 ? Math.min(...prixVariantes) : 0;
});

// Middleware pour calculer les prix min/max et générer le slug
produitSchema.pre('save', function (next) {
    // Calcul des prix min/max
    if (this.variantes && this.variantes.length > 0) {
        const prix = this.variantes.map(v => v.prixPromo || v.prix);
        this.prixMin = Math.min(...prix);
        this.prixMax = Math.max(...prix);
    }

    // Génération du slug
    if (this.isModified('nom')) {
        this.slug = this.nom
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    next();
});

// Méthode pour mettre à jour la note moyenne
produitSchema.methods.mettreAJourNoteMoyenne = function () {
    if (this.avis.length === 0) {
        this.noteMoyenne = 0;
        this.nombreAvis = 0;
    } else {
        const sommeNotes = this.avis.reduce((sum, avis) => sum + avis.note, 0);
        this.noteMoyenne = Math.round((sommeNotes / this.avis.length) * 10) / 10;
        this.nombreAvis = this.avis.length;
    }
    return this.save();
};

// Méthode pour vérifier la disponibilité d'une variante
produitSchema.methods.verifierDisponibilite = function (taille, couleur, quantite = 1) {
    const variante = this.variantes.find(
        v => v.taille === taille && v.couleur === couleur && v.estActive
    );
    return variante && variante.quantite >= quantite;
};

// Static method pour trouver les produits en promotion
produitSchema.statics.trouverEnPromotion = function () {
    return this.find({
        estEnPromotion: true,
        estActive: true,
        'variantes.0': { $exists: true }, // Au moins une variante
    }).sort({ pourcentagePromo: -1, createdAt: -1 });
};

// Static method pour trouver les nouveaux produits
produitSchema.statics.trouverNouveaux = function (limit = 10) {
    return this.find({
        estNouveau: true,
        estActive: true,
        'variantes.0': { $exists: true },
    })
        .sort({ createdAt: -1 })
        .limit(limit);
};

export default mongoose.model('Produit', produitSchema);
