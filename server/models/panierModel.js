import mongoose from 'mongoose';

// Schéma pour les articles dans le panier
const articlePanierSchema = new mongoose.Schema({
    produit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Produit',
        required: [true, 'Le produit est requis'],
    },
    quantite: {
        type: Number,
        required: [true, 'La quantité est requise'],
        min: [1, 'La quantité doit être au moins 1'],
        max: [100, 'La quantité ne peut pas dépasser 100'],
    },
    variante: {
        taille: {
            type: String,
            required: [true, 'La taille est requise'],
        },
        couleur: {
            type: String,
            required: [true, 'La couleur est requise'],
        },
        sku: {
            type: String,
        },
    },
    prix: {
        type: Number,
        required: [true, 'Le prix est requis'],
        min: [0, 'Le prix ne peut pas être négatif'],
    },
    ajouteLe: {
        type: Date,
        default: Date.now,
    },
});

// Schéma principal du panier
const panierSchema = new mongoose.Schema(
    {
        utilisateur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: [true, "L'utilisateur est requis"],
            unique: true,
            index: true,
        },
        articles: [articlePanierSchema],
        codePromo: {
            type: String,
            trim: true,
        },
        reduction: {
            type: Number,
            min: [0, 'La réduction ne peut pas être négative'],
            default: 0,
        },
        devise: {
            type: String,
            required: [true, 'La devise est requise'],
            enum: ['XOF', 'XAF', 'EUR', 'USD', 'CAD', 'CNY'],
            default: 'XOF',
        },
        dateModification: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual pour le sous-total
panierSchema.virtual('sousTotal').get(function () {
    return this.articles.reduce((total, article) => {
        return total + article.prix * article.quantite;
    }, 0);
});

// Virtual pour le total après réduction
panierSchema.virtual('total').get(function () {
    return this.sousTotal - this.reduction;
});

// Virtual pour le nombre d'articles
panierSchema.virtual('nombreArticles').get(function () {
    return this.articles.reduce((total, article) => total + article.quantite, 0);
});

// Virtual pour vérifier si le panier est vide
panierSchema.virtual('estVide').get(function () {
    return this.articles.length === 0;
});

// Middleware de pré-sauvegarde pour mettre à jour la date de modification
panierSchema.pre('save', function (next) {
    this.dateModification = new Date();
    next();
});

// Méthode pour ajouter un article au panier
panierSchema.methods.ajouterArticle = function (article) {
    // Vérifier si l'article existe déjà avec la même variante
    const articleExistant = this.articles.find(
        a =>
            a.produit.toString() === article.produit.toString() &&
            a.variante.taille === article.variante.taille &&
            a.variante.couleur === article.variante.couleur
    );

    // Si l'article existe, augmenter la quantité
    if (articleExistant) {
        articleExistant.quantite += article.quantite;
        // Limiter la quantité maximale
        if (articleExistant.quantite > 100) {
            articleExistant.quantite = 100;
        }
    } else {
        this.articles.push(article);
    }

    return this.save();
};

// Méthode pour mettre à jour la quantité d'un article
panierSchema.methods.mettreAJourQuantite = function (articleId, nouvelleQuantite) {
    const article = this.articles.id(articleId);

    // Vérifier que la nouvelle quantité est dans les limites
    if (article) {
        article.quantite = Math.min(Math.max(nouvelleQuantite, 1), 100);
        return this.save();
    }

    throw new Error('Article non trouvé dans le panier');
};

// Méthode pour supprimer un article
panierSchema.methods.supprimerArticle = function (articleId) {
    const article = this.articles.id(articleId);

    if (article) {
        article.deleteOne();
        return this.save();
    }

    throw new Error('Article non trouvé dans le panier');
};

// Méthode pour vider le panier
panierSchema.methods.vider = function () {
    this.articles = [];
    this.codePromo = undefined;
    this.reduction = 0;
    return this.save();
};

// Méthode pour appliquer un code promo
panierSchema.methods.appliquerCodePromo = function (codePromo, pourcentageReduction) {
    this.codePromo = codePromo;
    this.reduction = (this.sousTotal * pourcentageReduction) / 100;
    return this.save();
};

// Méthode pour supprimer le code promo
panierSchema.methods.supprimerCodePromo = function () {
    this.codePromo = undefined;
    this.reduction = 0;
    return this.save();
};

// Static method pour créer ou récupérer le panier d'un utilisateur
panierSchema.statics.trouverOuCreer = async function (utilisateurId) {
    let panier = await this.findOne({ utilisateur: utilisateurId }).populate(
        'articles.produit',
        'nom images slug prixMin prixMax variantes estActive'
    );

    if (!panier) {
        panier = await this.create({ utilisateur: utilisateurId });
    }

    return panier;
};

export default mongoose.model('Panier', panierSchema);
