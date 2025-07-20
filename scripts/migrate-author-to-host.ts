// scripts/migrate-author-to-host.ts
import 'dotenv/config'; // Charger les variables d'environnement
import { adminDb } from '../src/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Ce script migre le champ 'authorName' vers 'hostName' dans la collection 'spaces'.
 * Il lit tous les documents, copie la valeur de 'authorName' dans 'hostName',
 * puis supprime 'authorName'.
 *
 * Pour l'exécuter, utilisez la commande : npx ts-node --project tsconfig.scripts.json scripts/migrate-author-to-host.ts
 */
const migrateAuthorToHost = async () => {
  console.log('Début du script de migration authorName -> hostName...');

  const spacesRef = adminDb.collection('spaces');
  const snapshot = await spacesRef.get();

  if (snapshot.empty) {
    console.log('Aucun document trouvé dans la collection 'spaces'. Aucune migration nécessaire.');
    return;
  }

  let migratedCount = 0;

  // Utiliser un batch pour des écritures efficaces si le nombre de documents est élevé
  const batch = adminDb.batch();

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    // Vérifier si le champ 'authorName' existe
    if (data.authorName !== undefined) {
      const docRef = spacesRef.doc(doc.id);
      
      console.log(`Migration du document ${doc.id}: authorName -> hostName`);

      batch.update(docRef, {
        hostName: data.authorName, // Copier la valeur
        authorName: FieldValue.delete() // Supprimer l'ancien champ
      });
      migratedCount++;
    }
  });

  if (migratedCount === 0) {
      console.log('Aucun document avec le champ 'authorName' trouvé. Aucune migration nécessaire.');
      return;
  }

  console.log(`Application du batch pour ${migratedCount} document(s)...`);
  await batch.commit();

  console.log(`✅ Migration terminée avec succès ! ${migratedCount} document(s) mis à jour.`);
};

// Lancer la fonction
migrateAuthorToHost();
