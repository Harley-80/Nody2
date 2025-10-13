import mongoose from 'mongoose';

// Schéma pour les articles dans une commande
const articleCommandeSchema = new mongoose.Schema({
    produit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Produit',
        required: [true, 'Le produit est requis'],
    },
    nomProduit: {
        type: String,
        required: [true, 'Le nom du produit est requis'],
    },
    image: {
        type: String,
        required: [true, "L'image du produit est requise"],
    },
    prix: {
        type: Number,
        required: [true, 'Le prix est requis'],
        min: [0, 'Le prix ne peut pas être négatif'],
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
    sousTotal: {
        type: Number,
        required: true,
    },
});

// Schéma pour les adresses de commande
const adresseCommandeSchema = new mongoose.Schema({
    nomComplet: {
        type: String,
        required: [true, 'Le nom complet est requis'],
    },
    rue: {
        type: String,
        required: [true, 'La rue est requise'],
    },
    ville: {
        type: String,
        required: [true, 'La ville est requise'],
    },
    codePostal: {
        type: String,
        required: [true, 'Le code postal est requis'],
    },
    pays: {
        type: String,
        required: [true, 'Le pays est requis'],
        default: 'Sénégal',
    },
    telephone: {
        type: String,
    },
});

// Schéma principal de la commande
const commandeSchema = new mongoose.Schema(
    {
        numeroCommande: {
            type: String,
            unique: true,
            required: true,
            index: true,
        },
        utilisateur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: [true, "L'utilisateur est requis"],
            index: true,
        },
        articles: [articleCommandeSchema],
        adresseLivraison: {
            type: adresseCommandeSchema,
            required: [true, "L'adresse de livraison est requise"],
        },
        adresseFacturation: {
            type: adresseCommandeSchema,
            required: [true, "L'adresse de facturation est requise"],
        },
        sousTotal: {
            type: Number,
            required: [true, 'Le sous-total est requis'],
            min: [0, 'Le sous-total ne peut pas être négatif'],
        },
        fraisLivraison: {
            type: Number,
            required: [true, 'Les frais de livraison sont requis'],
            min: [0, 'Les frais de livraison ne peuvent pas être négatifs'],
            default: 0,
        },
        reduction: {
            type: Number,
            min: [0, 'La réduction ne peut pas être négative'],
            default: 0,
        },
        codePromo: {
            type: String,
            trim: true,
        },
        total: {
            type: Number,
            required: [true, 'Le total est requis'],
            min: [0, 'Le total ne peut pas être négatif'],
        },
        devise: {
            type: String,
            required: [true, 'La devise est requise'],
            enum: ['XOF', 'XAF', 'EUR', 'USD', 'CAD', 'CNY'],
            default: 'XOF',
        },
        statut: {
            type: String,
            required: [true, 'Le statut est requis'],
            enum: {
                values: [
                    'en_attente',
                    'confirmee',
                    'en_preparation',
                    'expediee',
                    'livree',
                    'annulee',
                    'remboursee',
                ],
                message: 'Statut invalide',
            },
            default: 'en_attente',
            index: true,
        },
        methodePaiement: {
            type: String,
            required: [true, 'La méthode de paiement est requise'],
            enum: ['carte_credit', 'paypal', 'stripe', 'virement', 'especes'],
            default: 'carte_credit',
        },
        statutPaiement: {
            type: String,
            required: [true, 'Le statut de paiement est requis'],
            enum: ['en_attente', 'paye', 'echec', 'rembourse', 'partiellement_rembourse'],
            default: 'en_attente',
            index: true,
        },
        datePaiement: {
            type: Date,
        },
        idPaiement: {
            type: String, // ID de la transaction de paiement (Stripe, etc.)
        },
        noteClient: {
            type: String,
            maxlength: [500, 'La note ne peut pas dépasser 500 caractères'],
        },
        suiviLivraison: {
            transporteur: {
                type: String,
                trim: true,
            },
            numeroSuivi: {
                type: String,
                trim: true,
            },
            urlSuivi: {
                type: String,
                trim: true,
            },
            dateExpedition: {
                type: Date,
            },
            dateLivraisonEstimee: {
                type: Date,
            },
        },
        datesStatut: {
            en_attente: { type: Date, default: Date.now },
            confirmee: { type: Date },
            en_preparation: { type: Date },
            expediee: { type: Date },
            livree: { type: Date },
            annulee: { type: Date },
            remboursee: { type: Date },
        },
        estCommandeExpress: {
            type: Boolean,
            default: false,
        },
        delaiLivraison: {
            type: Number, // en jours
            default: 7,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index composés pour les recherches
commandeSchema.index({ utilisateur: 1, createdAt: -1 });
commandeSchema.index({ statut: 1, createdAt: -1 });
commandeSchema.index({ 'suiviLivraison.numeroSuivi': 1 });
commandeSchema.index({ numeroCommande: 'text', 'articles.nomProduit': 'text' });

// Virtual pour le nombre d'articles
commandeSchema.virtual('nombreArticles').get(function () {
    return this.articles.reduce((total, article) => total + article.quantite, 0);
});

// Virtual pour vérifier si la commande est payée
commandeSchema.virtual('estPayee').get(function () {
    return this.statutPaiement === 'paye';
});

// Virtual pour vérifier si la commande peut être annulée
commandeSchema.virtual('peutEtreAnnulee').get(function () {
    const statutsNonAnnulables = ['expediee', 'livree', 'annulee', 'remboursee'];
    return !statutsNonAnnulables.includes(this.statut);
});

// Middleware de pré-sauvegarde pour générer le numéro de commande
commandeSchema.pre('save', async function (next) {
    if (this.isNew) {
        // Générer un numéro de commande unique: NODY-YYYYMMDD-XXXXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await mongoose.model('Commande').countDocuments({
            createdAt: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
            },
        });

        this.numeroCommande = `NODY-${dateStr}-${(count + 1).toString().padStart(5, '0')}`;

        // Calculer les totaux
        this.sousTotal = this.articles.reduce((total, article) => total + article.sousTotal, 0);
        this.total = this.sousTotal + this.fraisLivraison - this.reduction;
    }

    // Mettre à jour la date du statut quand il change
    if (this.isModified('statut') && this.statut) {
        this.datesStatut[this.statut] = new Date();
    }

    next();
});

// Méthode pour mettre à jour le statut
commandeSchema.methods.mettreAJourStatut = function (nouveauStatut, options = {}) {
    const ancienStatut = this.statut;
    this.statut = nouveauStatut;
    this.datesStatut[nouveauStatut] = new Date();

    // Options supplémentaires (numéro de suivi, etc.)
    if (options.numeroSuivi) {
        this.suiviLivraison.numeroSuivi = options.numeroSuivi;
    }
    if (options.transporteur) {
        this.suiviLivraison.transporteur = options.transporteur;
    }
    if (options.urlSuivi) {
        this.suiviLivraison.urlSuivi = options.urlSuivi;
    }

    return this.save();
};

// Méthode pour ajouter un article
commandeSchema.methods.ajouterArticle = function (article) {
    // Vérifier si l'article existe déjà avec la même variante
    const articleExistant = this.articles.find(
        a =>
            a.produit.toString() === article.produit.toString() &&
            a.variante.taille === article.variante.taille &&
            a.variante.couleur === article.variante.couleur
    );

    if (articleExistant) {
        articleExistant.quantite += article.quantite;
        articleExistant.sousTotal = articleExistant.prix * articleExistant.quantite;
    } else {
        this.articles.push({
            ...article,
            sousTotal: article.prix * article.quantite,
        });
    }

    return this.save();
};

// Static method pour trouver les commandes d'un utilisateur
commandeSchema.statics.trouverParUtilisateur = function (utilisateurId, options = {}) {
    const { page = 1, limit = 10, statut } = options;

    let query = { utilisateur: utilisateurId };
    if (statut) query.statut = statut;

    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('articles.produit', 'nom images slug');
};

// Static method pour les statistiques de commandes
commandeSchema.statics.getStatistiques = async function () {
    const aujourdHui = new Date();
    const debutMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1);
    const debutAnnee = new Date(aujourdHui.getFullYear(), 0, 1);

    const [
        totalCommandes,
        commandesMois,
        commandesAnnee,
        chiffreAffaireTotal,
        chiffreAffaireMois,
        chiffreAffaireAnnee,
        commandesParStatut,
    ] = await Promise.all([
        this.countDocuments(),
        this.countDocuments({ createdAt: { $gte: debutMois } }),
        this.countDocuments({ createdAt: { $gte: debutAnnee } }),
        this.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
        this.aggregate([
            { $match: { createdAt: { $gte: debutMois } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        this.aggregate([
            { $match: { createdAt: { $gte: debutAnnee } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        this.aggregate([{ $group: { _id: '$statut', count: { $sum: 1 } } }]),
    ]);

    return {
        totalCommandes,
        commandesMois,
        commandesAnnee,
        chiffreAffaireTotal: chiffreAffaireTotal[0]?.total || 0,
        chiffreAffaireMois: chiffreAffaireMois[0]?.total || 0,
        chiffreAffaireAnnee: chiffreAffaireAnnee[0]?.total || 0,
        commandesParStatut: commandesParStatut.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {}),
    };
};

export default mongoose.model('Commande', commandeSchema);
