import mongoose from 'mongoose';

// Schéma pour les catégories de produits
const categorieSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom de la catégorie est requis'],
            trim: true,
            unique: true,
            maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
            index: true,
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Categorie',
            default: null,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
        },
        image: {
            type: String,
            default: null,
        },
        icone: {
            type: String,
            default: null,
        },
        ordreAffichage: {
            type: Number,
            default: 0,
            min: [0, "L'ordre d'affichage ne peut pas être négatif"],
        },
        estActive: {
            type: Boolean,
            default: true,
        },
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
        nombreProduits: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index pour les recherches hiérarchiques
categorieSchema.index({ parent: 1 });
categorieSchema.index({ ordreAffichage: 1, nom: 1 });

// Virtual pour les sous-catégories
categorieSchema.virtual('sousCategories', {
    ref: 'Categorie',
    localField: '_id',
    foreignField: 'parent',
});

// Virtual pour le chemin complet (breadcrumb)
categorieSchema.virtual('chemin').get(function () {
    return this.parent ? `${this.parent.chemin} > ${this.nom}` : this.nom;
});

// Middleware pour générer le slug avant sauvegarde
categorieSchema.pre('save', function (next) {
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

// Méthode pour obtenir toutes les sous-catégories récursivement
categorieSchema.methods.getToutesSousCategories = async function () {
    const sousCategories = await mongoose.model('Categorie').find({ parent: this._id });
    let toutesSousCategories = [...sousCategories];

    // Récursion pour obtenir les sous-catégories des sous-catégories
    for (const sousCategorie of sousCategories) {
        const sousSousCategories = await sousCategorie.getToutesSousCategories();
        toutesSousCategories = toutesSousCategories.concat(sousSousCategories);
    }

    return toutesSousCategories;
};

// Static method pour trouver les catégories racines
categorieSchema.statics.trouverRacines = function () {
    return this.find({ parent: null, estActive: true }).sort({ ordreAffichage: 1, nom: 1 });
};

// Static method pour trouver par slug
categorieSchema.statics.trouverParSlug = function (slug) {
    return this.findOne({ slug, estActive: true });
};

export default mongoose.model('Categorie', categorieSchema);
