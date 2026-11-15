// src/services/authService.ts
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithCustomToken
} from 'firebase/auth';
import { auth } from './firebase';
import { PartnerId, PartnerProfile } from '../types/company';

export interface AuthenticatedPartner {
  uid: string;
  email: string;
  partnerId: PartnerId;
  displayName: string;
  roleTitle: string;
  isAuthenticated: boolean;
  authMethod: 'firebase_auth' | 'session_token';
  lastLogin: string;
  token?: string;
}

export const PARTNER_ACCOUNTS: Record<PartnerId, {
  email: string;
  displayName: string;
  roleTitle: string;
  defaultUid: string;
}> = {
  mohamed: {
    email: 'mohamed@tecnolobia.com',
    displayName: 'المهندس محمد البحر',
    roleTitle: 'شريك مؤسس ومدير تنفيذي تقني',
    defaultUid: 'partner_mohamed'
  },
  tarek: {
    email: 'tarek@tecnolobia.com',
    displayName: 'المهندس طارق حافظ',
    roleTitle: 'شريك مؤسس ومدير تنفيذي للأعمال',
    defaultUid: 'partner_tarek'
  }
};

const AUTH_STORAGE_KEY = 'tecnolobia_auth_session';

export class AuthService {
  private static currentPartner: AuthenticatedPartner | null = null;
  private static listeners: ((partner: AuthenticatedPartner | null) => void)[] = [];

  /**
   * تهيئة التحقق من الجلسة ومراقبة حالة Firebase Auth
   */
  static init(): void {
    // 1. استرجاع الجلسة المحفوظة بأمان محلياً
    const saved = this.getSavedSession();
    if (saved) {
      this.currentPartner = saved;
    }

    // 2. المراقبة الرسمية لـ Firebase Auth State
    if (auth) {
      onAuthStateChanged(auth, (user: User | null) => {
        if (user) {
          const partnerId = this.resolvePartnerIdFromUser(user);
          const partnerInfo = PARTNER_ACCOUNTS[partnerId];
          const authenticated: AuthenticatedPartner = {
            uid: user.uid,
            email: user.email || partnerInfo.email,
            partnerId,
            displayName: partnerInfo.displayName,
            roleTitle: partnerInfo.roleTitle,
            isAuthenticated: true,
            authMethod: 'firebase_auth',
            lastLogin: new Date().toISOString()
          };
          this.setSession(authenticated);
        } else if (!saved) {
          this.setSession(null);
        }
      });
    }
  }

  /**
   * تسجيل الدخول الرسمي للشريك بحساب موثوق وكلمة سر / رمز أمان PIN
   */
  static async loginPartner(
    partnerId: PartnerId, 
    credentialSecret: string
  ): Promise<{ success: boolean; error?: string }> {
    const partnerInfo = PARTNER_ACCOUNTS[partnerId];
    if (!partnerInfo) {
      return { success: false, error: 'شريك غير معرف بالنظام' };
    }

    if (!credentialSecret || !credentialSecret.trim()) {
      return { success: false, error: 'كلمة المرور أو رمز PIN مطلوب لتسجيل الدخول' };
    }

    const trimmedSecret = credentialSecret.trim();

    // 1. التحقق عبر Firebase Authentication أولاً إذا كان مفعلاً
    if (auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, partnerInfo.email, trimmedSecret);
        const idToken = await userCredential.user.getIdToken();
        const authenticated: AuthenticatedPartner = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || partnerInfo.email,
          partnerId,
          displayName: partnerInfo.displayName,
          roleTitle: partnerInfo.roleTitle,
          isAuthenticated: true,
          authMethod: 'firebase_auth',
          lastLogin: new Date().toISOString(),
          token: idToken
        };
        this.setSession(authenticated);
        return { success: true };
      } catch (fbErr: any) {
        // إذا كان خطأ كلمة سر خاطئة صريح من Firebase، نمنع الدخول فوراً
        if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
          return { success: false, error: 'كلمة المرور غير صحيحة لحساب الشريك في Firebase.' };
        }
      }
    }

    // 2. التحقق من الخادم الآمن (Backend Verification) دون أي مسارات تخطي محلية
    try {
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          credentialSecret: trimmedSecret
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.token) {
        const authenticated: AuthenticatedPartner = {
          uid: partnerInfo.defaultUid,
          email: partnerInfo.email,
          partnerId,
          displayName: partnerInfo.displayName,
          roleTitle: partnerInfo.roleTitle,
          isAuthenticated: true,
          authMethod: 'session_token',
          lastLogin: new Date().toISOString(),
          token: data.token
        };
        this.setSession(authenticated);
        return { success: true };
      }

      return { 
        success: false, 
        error: data.error || 'رمز أمان PIN أو كلمة المرور غير صحيحة' 
      };
    } catch (netErr) {
      return { success: false, error: 'تعذر الاتصال بخادم المصادقة الآمن للتأكد من الهوية' };
    }
  }

  /**
   * تسجيل الخروج وإلغاء الجلسة بالكامل
   */
  static async logout(): Promise<void> {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        // ignore
      }
    }
    this.setSession(null);
  }

  /**
   * جلب الشريك الحالي الموثوق
   */
  static getCurrentPartner(): AuthenticatedPartner | null {
    if (!this.currentPartner) {
      this.currentPartner = this.getSavedSession();
    }
    return this.currentPartner;
  }

  /**
   * الحصول على رمز دخول مشفر وموثق (Bearer Token) لإرساله للخادم الآمن
   */
  static async getAuthBearerToken(partnerId: PartnerId): Promise<string> {
    // 1. تجربة جلب Firebase ID Token إذا كان المستخدم مسجلاً في Firebase Auth
    if (auth && auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        if (idToken) return idToken;
      } catch (e) {
        // fallback to session token
      }
    }

    // 2. استخدام التوكن الموثق المحفوظ في الجلسة النشطة
    const session = this.getCurrentPartner();
    if (session && session.partnerId === partnerId && session.token) {
      return session.token;
    }

    return '';
  }

  /**
   * الاشتراك في تغيرات حالة التوثيق
   */
  static subscribe(callback: (partner: AuthenticatedPartner | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.getCurrentPartner());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private static setSession(session: AuthenticatedPartner | null): void {
    this.currentPartner = session;
    if (typeof window !== 'undefined') {
      if (session) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    this.listeners.forEach(cb => cb(session));
  }

  private static getSavedSession(): AuthenticatedPartner | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private static resolvePartnerIdFromUser(user: User): PartnerId {
    if (user.email === 'tarek@tecnolobia.com' || user.uid === 'partner_tarek') {
      return 'tarek';
    }
    return 'mohamed';
  }
}

AuthService.init();
