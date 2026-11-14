import { TaskItem } from '../types/projects';
import { PartnerId } from '../types/company';

class NotificationService {
  private static notifiedTasks = new Set<string>();

  /**
   * هل الإشعارات مدعومة في المتصفح؟
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * حالة الإذن الحالية
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * طلب إذن الإشعارات من المستخدم
   */
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        this.sendNotification('تم تفعيل إشعارات المهام بنجاح! 🔔', {
          body: 'ستصلك تنبيهات المهام والمواعيد المحددة مباشرة على شاشة هاتفك ولابتوبك.',
          tag: 'welcome_notification'
        });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return false;
    }
  }

  /**
   * إرسال إشعار فوري مع نغمة صوتية واهتزاز للهاتف
   */
  static sendNotification(title: string, options?: NotificationOptions): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    try {
      // إرسال الإشعار
      const notif = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        dir: 'rtl',
        lang: 'ar',
        ...options
      });

      // اهتزاز الهاتف
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([150, 80, 150]);
      }

      // تشغيل نغمة تنبيه صوتية ناعمة عبر Web Audio API
      this.playChime();

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn('Failed to dispatch notification:', err);
    }
  }

  /**
   * نغمة صوتية مدمجة دون الحاجة لتحميل ملفات خارجية
   */
  private static playChime(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // ignore
    }
  }

  /**
   * فحص المهام وتنبيه الشريك بالمهام العاجلة ومواعيد التسليم
   */
  static checkTasksDue(tasks: TaskItem[], currentPartner: PartnerId): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toTimeString().slice(0, 5); // HH:mm

    tasks.forEach(task => {
      if (task.status === 'completed') return;
      if (task.assignedTo !== currentPartner && task.assignedTo !== 'both') return;

      const taskKey = `${task.id}-${task.dueDate}-${task.dueTime || 'default'}`;
      if (this.notifiedTasks.has(taskKey)) return;

      // إذا كانت المهمة موعدها اليوم
      if (task.dueDate === todayStr) {
        // إذا كان لها وقت محدد ووصلنا له أو اقتربنا منه
        if (task.dueTime) {
          if (nowTimeStr >= task.dueTime) {
            this.sendNotification(`حان موعد تسليم المهمة: ${task.title} ⏰`, {
              body: `الموعد المحدد: اليوم الساعة ${task.dueTime} - اضغط هنا لمعاينة وإنجاز المهمة.`,
              tag: task.id
            });
            this.notifiedTasks.add(taskKey);
          }
        } else {
          // تنبيه صباحي بالموعد اليوم
          this.sendNotification(`مهمة مطلوب تسليمها اليوم: ${task.title} ⚡`, {
            body: `أولوية: ${task.priority === 'urgent' ? 'عاجلة جداً' : 'أولوية'} | افتح المنصة لإنجازها.`,
            tag: task.id
          });
          this.notifiedTasks.add(taskKey);
        }
      }
    });
  }
}

export { NotificationService };
