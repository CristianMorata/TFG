import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: Auth, private firestore: Firestore) { }

  // Método para registrar un nuevo usuario
  register({
    email,
    password,
    role
  }: {
    email: string;
    password: string;
    role: string;
  }) {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then(async userCredential => {
        const user = userCredential.user;

        // Guarda el rol en Firestore
        const userRef = doc(this.firestore, `users/${user.uid}`);
        await setDoc(userRef, {
          email: user.email,
          role: role,
          createdAt: new Date()
        });

        return user;
      })
      .catch(error => {
        console.error('Error al registrar el usuario:', error);
        throw error;
      });
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then(userCredential => {
        return userCredential.user;
      })
      .catch(error => {
        console.error('Error al iniciar sesión:', error);
        throw error;
      });
  }

  getUserRole(uid: string): Promise<string | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return getDoc(userRef)
      .then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          return data.role;
        } else {
          return null;
        }
      })
      .catch(error => {
        console.error('Error obteniendo el rol del usuario:', error);
        return null;
      });
  }
}
