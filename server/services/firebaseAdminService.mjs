// server/services/firebaseAdminService.mjs
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * خدمة إدارة تكامل Firebase Admin SDK و Cloud Firestore الموحدة
 * (Unified Firebase Admin SDK & Cloud Firestore Service)
 * تضمن:
 * 1. تهيئة مركزية موحدة لـ Firebase Admin App.
 * 2. الوصول الآمن لخدمات Auth و Cloud Firestore.
 * 3. عزل الفضاء السحابي التام بين بيئات Staging و Production (Namespace Isolation).
 * 4. تطبيق سياسة الإغلاق عند الفشل (Fail-Closed Policy) في البيئة السحابية.
 */
export class FirebaseAdminService {
  static #app = null;
  static #auth = null;
  static #firestore = null;
  static #mockFirestore = undefined;

  /**
   * تحديد معرف مشروع GCP المستهدف
   */
  static getProjectId() {
    return process.env.GOOGLE_CLOUD_PROJECT || 
           process.env.GCLOUD_PROJECT || 
           process.env.FIREBASE_PROJECT_ID || 
           (process.env.CRM_STAGING_NAMESPACE ? 'tecnolobia-staging' : 'modeer-27c2d');
  }

  /**
   * التحقق مما إذا كان الخادم يعمل في بيئة سحابية حية (Cloud Mode)
   */
  static isCloudMode() {
    return Boolean(
      process.env.K_SERVICE || 
      process.env.K_REVISION || 
      process.env.CLOUD_RUN_SERVICE || 
      (process.env.NODE_ENV === 'production' && !process.env.CRM_ISOLATED_MODE) ||
      process.env.STAGING_MODE === 'true'
    );
  }

  /**
   * التحقق مما إذا كان الخادم متصلاً بمحاكي Firestore الرسمي (Firebase Emulator)
   */
  static isEmulatorMode() {
    return Boolean(process.env.FIRESTORE_EMULATOR_HOST);
  }

  /**
   * استخراج اسم المجموعة المعزولة وفقاً لبيئة العمل (Staging vs Production)
   * يضمن منع أي كتابة أو تعديل على مجموعات الإنتاج الحية عند العمل في Staging
   */
  static getCollectionName(baseCollection) {
    const namespace = process.env.CRM_STAGING_NAMESPACE || 
      (this.isCloudMode() && process.env.STAGING_MODE === 'true' ? 'staging' : null);
    
    if (namespace && namespace !== 'production') {
      return `${namespace}_${baseCollection}`;
    }
    return baseCollection;
  }

  /**
   * تهيئة والحصول على تطبيق Firebase Admin الرئيسي
   */
  static getApp() {
    if (this.#app) return this.#app;

    try {
      this.#app = admin.getApps().length > 0 ? 
        admin.getApp() : 
        admin.initializeApp({ projectId: this.getProjectId() });
    } catch (e) {
      if (this.isCloudMode()) {
        const err = new Error(`CRITICAL_INFRASTRUCTURE_ERROR: فشل تهيئة Firebase Admin في البيئة السحابية: ${e.message}`);
        err.code = 'FIREBASE_ADMIN_INIT_FAILED';
        throw err;
      }
      return null;
    }
    return this.#app;
  }

  /**
   * الحصول على محرك التحقق من الهوية Firebase Admin Auth
   */
  static getAuth() {
    if (this.#auth) return this.#auth;
    const app = this.getApp();
    if (!app) {
      if (this.isCloudMode()) {
        const err = new Error('AUTH_SERVICE_UNAVAILABLE: خدمة المصادقة Firebase Admin غير متاحة في البيئة السحابية.');
        err.code = 'AUTH_SERVICE_UNAVAILABLE';
        throw err;
      }
      return null;
    }
    this.#auth = getAuth(app);
    return this.#auth;
  }

  /**
   * الحصول على قاعدة بيانات Cloud Firestore الرسمية
   * في البيئة السحابية (Cloud Mode): تفشل الخدمة فوراً إذا كانت قاعدة البيانات غير متاحة (Fail-Closed)
   */
  static getFirestore() {
    if (this.#mockFirestore !== undefined) {
      if (this.#mockFirestore === null) {
        if (this.isCloudMode()) {
          const err = new Error('FIRESTORE_UNAVAILABLE: قاعدة بيانات Cloud Firestore غير مهيأة أو غير متاحة في البيئة السحابية.');
          err.code = 'FIRESTORE_UNAVAILABLE';
          err.status = 503;
          throw err;
        }
        return null;
      }
      return this.#mockFirestore;
    }
    if (this.#firestore) return this.#firestore;

    const app = this.getApp();
    if (!app) {
      if (this.isCloudMode()) {
        const err = new Error('FIRESTORE_UNAVAILABLE: قاعدة بيانات Cloud Firestore غير مهيأة في البيئة السحابية.');
        err.code = 'FIRESTORE_UNAVAILABLE';
        err.status = 503;
        throw err;
      }
      return null;
    }

    try {
      this.#firestore = getFirestore(app);
      try {
        this.#firestore.settings({ ignoreUndefinedProperties: true });
      } catch (_) {}
      return this.#firestore;
    } catch (err) {
      if (this.isCloudMode()) {
        const error = new Error(`FIRESTORE_UNAVAILABLE: تعذر الاتصال بـ Cloud Firestore في البيئة السحابية: ${err.message}`);
        error.code = 'FIRESTORE_UNAVAILABLE';
        error.status = 503;
        throw error;
      }
      return null;
    }
  }

  /**
   * موفر مخصص للاختبارات المعزولة (Testing Adapter Hook)
   */
  static setMockFirestore(mockInstance) {
    this.#mockFirestore = mockInstance;
  }

  static clearMockFirestore() {
    this.#mockFirestore = undefined;
  }
}
