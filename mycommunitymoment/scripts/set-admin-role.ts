
// scripts/set-admin-role.ts
import 'dotenv/config'; // Assurez-vous que les variables d'environnement sont chargées
import { adminAuth, adminDb } from '../src/lib/firebase-admin';

/**
 * Ce script assigne un rôle de super-administrateur à un utilisateur.
 * Il fait deux choses :
 * 1. Ajoute une "custom claim" { SuperAdmin: true } au token d'authentification pour les règles de sécurité.
 * 2. Ajoute un champ { SuperAdmin: true } au document de l'utilisateur dans Firestore pour un accès facile côté client.
 *
 * Usage:
 * npx ts-node --project tsconfig.scripts.json scripts/set-admin-role.ts <email_de_l_utilisateur>
 */
const grantAdminRole = async (email: string) => {
  if (!email || !email.includes('@')) {
    console.error('❌ Erreur : Veuillez fournir une adresse e-mail valide.');
    process.exit(1);
  }

  try {
    // 1. Récupérer l'utilisateur par e-mail
    console.log(`Recherche de l'utilisateur : ${email}...`);
    const user = await adminAuth.getUserByEmail(email);
    const userId = user.uid;

    // 2. Assigner la "custom claim" de SuperAdmin
    console.log(`Assignation de la custom claim 'SuperAdmin' à l'utilisateur ${userId}...`);
    await adminAuth.setCustomUserClaims(userId, { SuperAdmin: true });

    // 3. Mettre à jour le document utilisateur dans Firestore
    console.log(`Mise à jour du document dans Firestore pour l'utilisateur ${userId}...`);
    const userDocRef = adminDb.collection('users').doc(userId);
    
    // Mettre à jour ou créer le champ SuperAdmin
    await userDocRef.set({ SuperAdmin: true }, { merge: true });

    // 4. Confirmer le succès
    console.log(`✅ Succès ! L'utilisateur ${email} est maintenant un Super Administrateur (claim et BDD).`);
    console.log("   Il devra se déconnecter et se reconnecter pour que les changements prennent effet.");

  } catch (error: any) {
    console.error('❌ Une erreur est survenue :');
    if (error.code === 'auth/user-not-found') {
      console.error(`   L'utilisateur avec l'e-mail "${email}" n'a pas été trouvé.`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
};

const emailArg = process.argv[2];
grantAdminRole(emailArg);
