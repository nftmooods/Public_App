// scripts/seed.ts
import 'dotenv/config'; // Charger les variables d'environnement
import { adminDb } from '../src/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Ce script ajoute un nouvel "Space" (événement) à la collection 'spaces' de Firestore.
 * Il est pré-rempli avec des données fictives pour faciliter les tests et le développement.
 * 
 * Pour l'exécuter, utilisez la nouvelle commande fournie.
 */
const createFictionalEvent = async () => {
  console.log("Début du script pour ajouter un événement fictif...");

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const fictionalEvent = {
      name: "Lancement Exclusif de la V2 d'ApeChain",
      projectUrl: 'https://apechain.space',
      dateTime: Timestamp.fromDate(tomorrow),
      authorName: "L'équipe ApeChain",
      createdBy: 'system-seed-script',
      createdAt: Timestamp.now(),
    };

    const docRef = await adminDb.collection('spaces').add(fictionalEvent);

    console.log('✅ Événement fictif ajouté avec succès !');
    console.log(`   - ID du document : ${docRef.id}`);
    console.log(`   - Nom : "${fictionalEvent.name}"`);
    console.log(`   - Date : ${tomorrow.toLocaleString()}`);

  } catch (error) {
    console.error("❌ Une erreur est survenue lors de la création de l'événement fictif :");
    console.error(error);
    process.exit(1);
  }
};

createFictionalEvent();
