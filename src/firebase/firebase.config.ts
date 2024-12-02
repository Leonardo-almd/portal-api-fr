import { initializeApp, credential, firestore, storage } from 'firebase-admin';
import * as serviceAccount from '../../firebase-adminsdk.json'
import admin from 'firebase-admin';

admin.initializeApp({
  credential: credential.cert(serviceAccount as any)
});

export const db = admin.firestore();
export const adm = admin
