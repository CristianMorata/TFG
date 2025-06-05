import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    // Escucha cambios de sesión
    onAuthStateChanged(this.auth, user => {
      this.userSubject.next(user);
    });
  }

  register({ email, password, role }: { email: string; password: string; role: string; }) {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then(async userCredential => {
        const user = userCredential.user;
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
      .then(userCredential => userCredential.user)
      .catch(error => {
        console.error('Error al iniciar sesión:', error);
        throw error;
      });
  }

  logout() {
    return signOut(this.auth);
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