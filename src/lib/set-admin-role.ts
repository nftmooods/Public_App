
import { adminAuth } from './firebase-admin';
import type { UserRecord } from 'firebase-admin/auth';

const setEmailAsAdmin = async (email: string): Promise<void> => {
  // Valider l'entrée de l'e-mail
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    console.error('Erreur : Adresse e-mail invalide fournie. Veuillez fournir une adresse e-mail valide.');
    process.exit(1);
  }

  try {
    console.log(`Recherche de l'utilisateur : ${email}...`);
    const user: UserRecord = await adminAuth.getUserByEmail(email);

    // Vérifier si l'utilisateur est déjà un administrateur
    if (user.customClaims?.admin === true) {
      console.log(`L'utilisateur ${email} (UID : ${user.uid}) est déjà un administrateur.`);
      return;
    }

    console.log(`Définition des privilèges d'administrateur pour l'utilisateur ${user.uid}...`);
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });

    // Vérifier que la revendication a été définie avec succès
    const updatedUser = await adminAuth.getUser(user.uid);
    if (updatedUser.customClaims?.admin === true) {
      console.log(`✅ Succès ! ${email} (UID : ${user.uid}) est maintenant un administrateur.`);
      console.log("Remarque : L'utilisateur devra peut-être se reconnecter pour que les modifications de rôle prennent effet.");
    } else {
      throw new Error("Échec de la définition de la revendication d'administrateur après la tentative.");
    }
  } catch (error: any) {
    console.error('❌ Erreur lors du processus de définition du rôle d'administrateur :');
    if (error.code === 'auth/user-not-found') {
      console.error(`Aucun utilisateur trouvé avec l'e-mail : ${email}`);
    } else {
      console.error(`Erreur inattendue : ${error.message}`);
    }
    process.exit(1);
  }
};

// Exécuter le script
const emailArg = process.argv[2];
if (!emailArg) {
  console.error("Veuillez fournir une adresse e-mail en tant qu'argument de ligne de commande.");
  console.error("Usage: ts-node src/lib/set-admin-role.ts <adresse-e-mail-utilisateur>");
  process.exit(1);
}

setEmailAsAdmin(emailArg);
