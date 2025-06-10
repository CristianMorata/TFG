import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    // Suscribimos el BehaviorSubject al estado de Auth
    onAuthStateChanged(this.auth, user => {
      this.userSubject.next(user);
    });
  }

  async register({ email, password, role }: { email: string; password: string; role: string }) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      console.log('✅ Usuario creado en Auth con UID:', user.uid);

      // Guardamos también en Firestore bajo la colección "users"
      const userRef = doc(this.firestore, 'users', user.uid);
      await setDoc(userRef, {
        email,
        role,
        createdAt: new Date()
      });
      console.log('✅ Documento de usuario creado en Firestore con rol:', role);

      return user;
    } catch (err) {
      console.error('❌ Error en register():', err);
      throw err;
    }
  }

  async login(email: string, password: string) {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      return cred.user;
    } catch (err) {
      console.error('❌ Error en login():', err);
      throw err;
    }
  }

  async logout() {
    return await signOut(this.auth);
  }

  async getUserRole(uid: string): Promise<string | null> {
    try {
      const snap = await getDoc(doc(this.firestore, 'users', uid));
      if (snap.exists()) {
        return (snap.data() as any).role;
      }
      return null;
    } catch (err) {
      console.error('❌ Error en getUserRole():', err);
      return null;
    }
  }
}