import mongoose from 'mongoose';

const paiementSchema = new mongoose.Schema(
    {
        commande: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Commande',
            required: [true, 'La commande est requise'],
            index: true,
        },
        utilisateur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur',
            required: [true, "L'utilisateur est requis"],
            index: true,
        },
        idPaiementStripe: {
            type: String,
            required: [true, "L'ID Stripe est requis"],
            unique: true,
            index: true,
        },
        montant: {
            type: Number,
            required: [true, 'Le montant est requis'],
            min: [50, 'Le montant minimum est de 0.50€'], // 50 centimes en unité Stripe
        },
        devise: {
            type: String,
            required: [true, 'La devise est requise'],
            enum: ['usd', 'eur', 'xof', 'xaf', 'cad', 'cny'],
            default: 'eur',
            lowercase: true,
        },
        statut: {
            type: String,
            required: [true, 'Le statut est requis'],
            enum: {
                values: [
                    'en_attente',
                    'requiert_action',
                    'reussi',
                    'echoue',
                    'annule',
                    'rembourse',
                ],
                message: 'Statut de paiement invalide',
            },
            default: 'en_attente',
            index: true,
        },
        methodePaiement: {
            type: String,
            required: [true, 'La méthode de paiement est requise'],
            enum: [
                'carte',
                'paypal',
                'bancontact',
                'ideal',
                'sepa_debit',
                'apple_pay',
                'google_pay',
            ],
        },
        detailsCarte: {
            marque: String,
            pays: String,
            dernier4: String,
            expirationMois: Number,
            expirationAnnee: Number,
        },
        clientSecret: {
            type: String,
            required: [true, 'Le client secret est requis'],
        },
        paymentIntent: {
            type: Object, // Stocke l'objet PaymentIntent complet de Stripe
        },
        tentatives: {
            type: Number,
            default: 0,
            min: 0,
            max: 3,
        },
        erreur: {
            code: String,
            message: String,
            type: String,
        },
        dateTentative: {
            type: Date,
            default: Date.now,
        },
        dateReussite: Date,
        dateEchec: Date,
        dateRemboursement: Date,
        montantRembourse: {
            type: Number,
            default: 0,
            min: 0,
        },
        raisonRemboursement: {
            type: String,
            enum: ['demande_client', 'fraude', 'duplicata', 'produit_non_disponible', 'autre'],
            trim: true,
        },
        metadata: {
            type: Map,
            of: String,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index composés pour les recherches
paiementSchema.index({ utilisateur: 1, createdAt: -1 });
paiementSchema.index({ statut: 1, createdAt: -1 });
paiementSchema.index({ 'detailsCarte.dernier4': 1 });

// Virtual pour vérifier si le paiement est réussi
paiementSchema.virtual('estReussi').get(function () {
    return this.statut === 'reussi';
});

// Virtual pour vérifier si le paiement peut être remboursé
paiementSchema.virtual('peutEtreRembourse').get(function () {
    return this.statut === 'reussi' && this.montantRembourse < this.montant;
});

// Virtual pour le montant en unités Stripe (centimes)
paiementSchema.virtual('montantStripe').get(function () {
    // Stripe utilise les centimes pour EUR/USD
    const devisesCentimes = ['eur', 'usd', 'cad'];
    return devisesCentimes.includes(this.devise) ? this.montant : this.montant;
});

// Middleware de pré-sauvegarde
paiementSchema.pre('save', function (next) {
    if (this.isModified('statut')) {
        const maintenant = new Date();

        switch (this.statut) {
            case 'reussi':
                this.dateReussite = maintenant;
                break;
            case 'echoue':
                this.dateEchec = maintenant;
                break;
            case 'rembourse':
                this.dateRemboursement = maintenant;
                break;
        }
    }

    if (this.isModified('tentatives')) {
        this.dateTentative = new Date();
    }

    next();
});

// Méthode pour enregistrer une tentative échouée
paiementSchema.methods.enregistrerEchec = function (erreur) {
    this.tentatives += 1;
    this.statut = 'echoue';
    this.erreur = {
        code: erreur.code || 'unknown',
        message: erreur.message || 'Erreur inconnue',
        type: erreur.type || 'api_error',
    };

    return this.save();
};

// Méthode pour traiter un remboursement
paiementSchema.methods.traiterRemboursement = function (montant, raison) {
    this.montantRembourse += montant;
    this.raisonRemboursement = raison;

    if (this.montantRembourse >= this.montant) {
        this.statut = 'rembourse';
    }

    return this.save();
};

// Static method pour les statistiques de paiement
paiementSchema.statics.getStatistiques = async function (periode = 'mois') {
    const maintenant = new Date();
    let dateDebut;

    switch (periode) {
        case 'jour':
            dateDebut = new Date(
                maintenant.getFullYear(),
                maintenant.getMonth(),
                maintenant.getDate()
            );
            break;
        case 'semaine':
            dateDebut = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'mois':
            dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
            break;
        case 'annee':
            dateDebut = new Date(maintenant.getFullYear(), 0, 1);
            break;
        default:
            dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    }

    const [
        totalPaiements,
        paiementsReussis,
        paiementsEchoues,
        chiffreAffaireTotal,
        chiffreAffairePeriode,
        tauxReussite,
        methodesPaiement,
    ] = await Promise.all([
        this.countDocuments({ createdAt: { $gte: dateDebut } }),
        this.countDocuments({ statut: 'reussi', createdAt: { $gte: dateDebut } }),
        this.countDocuments({ statut: 'echoue', createdAt: { $gte: dateDebut } }),
        this.aggregate([
            { $match: { statut: 'reussi' } },
            { $group: { _id: null, total: { $sum: '$montant' } } },
        ]),
        this.aggregate([
            { $match: { statut: 'reussi', createdAt: { $gte: dateDebut } } },
            { $group: { _id: null, total: { $sum: '$montant' } } },
        ]),
        this.aggregate([
            { $match: { createdAt: { $gte: dateDebut } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    reussis: {
                        $sum: { $cond: [{ $eq: ['$statut', 'reussi'] }, 1, 0] },
                    },
                },
            },
        ]),
        this.aggregate([
            { $match: { statut: 'reussi', createdAt: { $gte: dateDebut } } },
            {
                $group: {
                    _id: '$methodePaiement',
                    count: { $sum: 1 },
                    montantTotal: { $sum: '$montant' },
                },
            },
            { $sort: { count: -1 } },
        ]),
    ]);

    const tauxReussiteCalc = tauxReussite[0]
        ? (tauxReussite[0].reussis / tauxReussite[0].total) * 100
        : 0;

    return {
        totalPaiements,
        paiementsReussis,
        paiementsEchoues,
        chiffreAffaireTotal: chiffreAffaireTotal[0]?.total || 0,
        chiffreAffairePeriode: chiffreAffairePeriode[0]?.total || 0,
        tauxReussite: Math.round(tauxReussiteCalc * 100) / 100,
        methodesPaiement,
    };
};

export default mongoose.model('Paiement', paiementSchema);
