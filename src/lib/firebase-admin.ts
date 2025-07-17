
// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
// Importer le type ServiceAccount pour garantir la sécurité du typage
import type { ServiceAccount } from 'firebase-admin';

// Valider que la variable d'environnement existe
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  throw new Error("La variable d'environnement FIREBASE_SERVICE_ACCOUNT_KEY n'est pas définie. Assurez-vous qu'elle est dans votre fichier .env.local");
}

// Analyser la clé de manière sécurisée
let serviceAccount: ServiceAccount;
try {
  const serviceAccountJSON = JSON.parse(serviceAccountKey);
  // Remplacer les caractères de nouvelle ligne échappés dans la clé privée,
  // un problème courant lors de l'utilisation de variables d'environnement.
  serviceAccount = {
    ...serviceAccountJSON,
    private_key: serviceAccountJSON.private_key.replace(/\\n/g, '\n'),
  };
} catch (error) {
  throw new Error("Erreur lors de l'analyse de FIREBASE_SERVICE_ACCOUNT_KEY. Assurez-vous qu'il s'agit d'un JSON valide.");
}


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
