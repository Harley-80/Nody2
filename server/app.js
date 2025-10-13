import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/env.js';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { logger } from './utils/logger.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import utilisateursRoutes from './routes/utilisateursRoutes.js';
import produitsRoutes from './routes/produitsRoutes.js';
import categorieRoutes from './routes/categorieRoutes.js';
import commandesRoutes from './routes/commandesRoutes.js';
import paiementRoutes from './routes/paiementRoutes.js';

// Pour obtenir __dirname dans les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Classe principale de l'application
class App {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    // Configuration des middlewares
    setupMiddleware() {
        // Sécurité Helmet
        this.app.use(helmet());

        // Compression Gzip
        this.app.use(compression());

        // CORS
        this.app.use(
            cors({
                origin: config.clientUrl,
                credentials: true,
            })
        );

        // Limitation du débit
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limite chaque IP à 100 requêtes par windowMs
            message: {
                success: false,
                message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
            },
        });
        this.app.use('/api/', limiter);

        // Analyseur du corps des requêtes
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Sanitization des données
        this.app.use(mongoSanitize());
        this.app.use(xss());

        // Enregistrement HTTP
        if (config.env === 'development') {
            this.app.use(morgan('dev'));
        } else {
            this.app.use(
                morgan('combined', {
                    stream: { write: message => logger.info(message.trim()) },
                })
            );
        }

        // Servir les fichiers statiques
        this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Middleware de requête logger
        this.app.use((req, res, next) => {
            logger.debug(`${req.method} ${req.path} - IP: ${req.ip}`);
            next();
        });
    }

    setupRoutes() {
        // Routes API
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/utilisateurs', utilisateursRoutes);
        this.app.use('/api/produits', produitsRoutes);
        this.app.use('/api/categories', categorieRoutes);
        this.app.use('/api/commandes', commandesRoutes);
        this.app.use('/api/paiements', paiementRoutes);

        // Route de santé
        this.app.get('/api/health', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'API Nody est opérationnelle',
                timestamp: new Date().toISOString(),
                environment: config.env,
            });
        });

        // Gestion des routes non trouvées
        this.app.all('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: `Route ${req.originalUrl} non trouvée`,
            });
        });
    }

    // Gestion des erreurs
    setupErrorHandling() {
        this.app.use(errorHandler);
    }

    // Démarrer le serveur
    async start() {
        try {
            await connectDB();

            this.server = this.app.listen(config.port, () => {
                logger.info(`Serveur Nody démarré sur le port ${config.port}`);
                logger.info(`Environnement: ${config.env}`);
                logger.info(`URL Client: ${config.clientUrl}`);
            });
        } catch (error) {
            logger.error('Erreur lors du démarrage du serveur:', error);
            process.exit(1);
        }
    }
}

export default App;
