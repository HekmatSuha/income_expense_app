import { I18n } from "i18n-js";
import { findBestAvailableLanguage, getLocales } from "expo-localization";

export const translations = {
  en: {
    welcome: "Welcome",
    appName: "Income Expense",
    quickActions: {
      addIncome: "Add Income",
      addExpense: "Add Expense",
      transfer: "Transfer",
      transactions: "Transactions",
    },
    navigation: {
      home: "Home",
      bankAccounts: "Bank Accounts",
      notebook: "Notebook",
    },
    home: {
      today: "Today",
      income: "Income",
      expense: "Expense",
      balance: "Balance",
      previousBalance: "Previous Balance",
      totalBalance: "Total Balance",
      recentTransactions: "Recent Transactions",
      noTransactions: "No recent transactions yet.",
      paymentMethods: "Payment Methods",
      noPaymentMethods:
        "No income has been recorded yet. Once money comes in, we'll summarize the total received via each payment method and currency.",
      monthlyBudget: "Monthly Budget",
      budget: "Budget",
      spentThisMonth: "Spent this month",
      remaining: "Remaining",
      exceededBy: "Exceeded by",
      noBudgetSet:
        "Set a monthly budget target by tapping this card. We'll track how much you've spent in the selected currency and highlight any excess.",
      setBudget: "Set Monthly Budget",
      budgetAmount: "Budget amount",
      currency: "Currency",
      save: "Save",
      cancel: "Cancel",
      selectCurrency: "Select currency",
      selectLanguage: "Select Language",
      close: "Close",
      more: "More",
    },
    drawer: {
      account: "Account",
      myProfile: "My Profile",
      settings: "Settings",
      securityPrivacy: "Security & Privacy",
      security: "Security",
      notifications: "Notifications",
      support: "Support",
      helpSupport: "Help & Support",
      sendFeedback: "Send Feedback",
      language: "Language",
      appLanguage: "App Language",
      signOut: "Sign Out",
      version: "Income Expense App v1.0.0",
      guest: "Guest",
      notSignedIn: "Not signed in",
    },
    alerts: {
      userSettings: "User Settings",
      userSettingsBody:
        "Navigate to your profile to update personal details and app preferences.",
      securityPrivacy: "Security & Privacy",
      securityPrivacyBody:
        "Biometric login, passcodes, and other security controls live here.",
      notifications: "Notifications",
      notificationsBody:
        "Configure push and email alerts from the notifications panel.",
      helpSupport: "Help & Support",
      helpSupportBody:
        "Reach support@incomeexpense.app or browse FAQs from the help center.",
      appearance: "Appearance",
      appearanceBody: "Theme customization is coming soon!",
      feedback: "Feedback",
      feedbackBody:
        "We'd love to hear your ideas. Send feedback from the help center.",
      error: "Error",
      signOutFailed: "Failed to sign out. Please try again.",
      positiveBudget: "Enter a positive budget amount.",
    },
  },
  tr: {
    welcome: "Hoş geldiniz",
    appName: "Gelir Gider",
    quickActions: {
      addIncome: "Gelir Ekle",
      addExpense: "Gider Ekle",
      transfer: "Transfer",
      transactions: "İşlemler",
    },
    navigation: {
      home: "Ana Sayfa",
      bankAccounts: "Banka Hesapları",
      notebook: "Not Defteri",
    },
    home: {
      today: "Bugün",
      income: "Gelir",
      expense: "Gider",
      balance: "Bakiye",
      previousBalance: "Önceki Bakiye",
      totalBalance: "Toplam Bakiye",
      recentTransactions: "Son İşlemler",
      noTransactions: "Henüz son işlem yok.",
      paymentMethods: "Ödeme Yöntemleri",
      noPaymentMethods:
        "Henüz gelir kaydedilmedi. Para geldiğinde her ödeme yöntemi ve para birimine göre toplamları göstereceğiz.",
      monthlyBudget: "Aylık Bütçe",
      budget: "Bütçe",
      spentThisMonth: "Bu ay harcanan",
      remaining: "Kalan",
      exceededBy: "Aşılan tutar",
      noBudgetSet:
        "Bu karta dokunarak aylık bütçe hedefi belirleyin. Seçilen para biriminde harcamaları takip edip aşım varsa vurgulayacağız.",
      setBudget: "Aylık Bütçe Belirle",
      budgetAmount: "Bütçe tutarı",
      currency: "Para birimi",
      save: "Kaydet",
      cancel: "İptal",
      selectCurrency: "Para birimi seç",
      selectLanguage: "Dil seç",
      close: "Kapat",
      more: "Daha fazla",
    },
    drawer: {
      account: "Hesap",
      myProfile: "Profilim",
      settings: "Ayarlar",
      securityPrivacy: "Güvenlik ve Gizlilik",
      security: "Güvenlik",
      notifications: "Bildirimler",
      support: "Destek",
      helpSupport: "Yardım ve Destek",
      sendFeedback: "Geri Bildirim Gönder",
      language: "Dil",
      appLanguage: "Uygulama Dili",
      signOut: "Çıkış Yap",
      version: "Gelir Gider Uyg. v1.0.0",
      guest: "Misafir",
      notSignedIn: "Giriş yapılmadı",
    },
    alerts: {
      userSettings: "Kullanıcı Ayarları",
      userSettingsBody:
        "Kişisel bilgileri ve uygulama tercihlerini güncellemek için profilinize gidin.",
      securityPrivacy: "Güvenlik ve Gizlilik",
      securityPrivacyBody:
        "Biyometrik giriş, şifreler ve diğer güvenlik kontrolleri burada.",
      notifications: "Bildirimler",
      notificationsBody:
        "Bildirim panelinden push ve e-posta uyarılarını yapılandırın.",
      helpSupport: "Yardım ve Destek",
      helpSupportBody:
        "support@incomeexpense.app adresinden bize ulaşın veya sık sorulan sorulara göz atın.",
      appearance: "Görünüm",
      appearanceBody: "Tema özelleştirmesi yakında geliyor!",
      feedback: "Geri Bildirim",
      feedbackBody:
        "Fikirlerinizi duymak isteriz. Yardım merkezinden geri bildirim gönderin.",
      error: "Hata",
      signOutFailed: "Çıkış yapılamadı. Lütfen tekrar deneyin.",
      positiveBudget: "Pozitif bir bütçe tutarı girin.",
    },
  },
  ru: {
    welcome: "Добро пожаловать",
    appName: "Доходы и расходы",
    quickActions: {
      addIncome: "Добавить доход",
      addExpense: "Добавить расход",
      transfer: "Перевод",
      transactions: "Транзакции",
    },
    navigation: {
      home: "Главная",
      bankAccounts: "Банковские счета",
      notebook: "Блокнот",
    },
    home: {
      today: "Сегодня",
      income: "Доход",
      expense: "Расход",
      balance: "Баланс",
      previousBalance: "Предыдущий баланс",
      totalBalance: "Общий баланс",
      recentTransactions: "Недавние операции",
      noTransactions: "Недавних операций пока нет.",
      paymentMethods: "Способы оплаты",
      noPaymentMethods:
        "Доходы пока не добавлены. Когда появятся поступления, мы покажем суммы по каждому способу оплаты и валюте.",
      monthlyBudget: "Месячный бюджет",
      budget: "Бюджет",
      spentThisMonth: "Потрачено в этом месяце",
      remaining: "Осталось",
      exceededBy: "Превышено на",
      noBudgetSet:
        "Нажмите на эту карту, чтобы задать месячный бюджет. Мы будем отслеживать траты в выбранной валюте и подсвечивать превышение.",
      setBudget: "Задать месячный бюджет",
      budgetAmount: "Сумма бюджета",
      currency: "Валюта",
      save: "Сохранить",
      cancel: "Отмена",
      selectCurrency: "Выберите валюту",
      selectLanguage: "Выберите язык",
      close: "Закрыть",
      more: "Еще",
    },
    drawer: {
      account: "Аккаунт",
      myProfile: "Мой профиль",
      settings: "Настройки",
      securityPrivacy: "Безопасность и конфиденциальность",
      security: "Безопасность",
      notifications: "Уведомления",
      support: "Поддержка",
      helpSupport: "Помощь и поддержка",
      sendFeedback: "Отправить отзыв",
      language: "Язык",
      appLanguage: "Язык приложения",
      signOut: "Выйти",
      version: "Доходы и расходы v1.0.0",
      guest: "Гость",
      notSignedIn: "Вход не выполнен",
    },
    alerts: {
      userSettings: "Настройки пользователя",
      userSettingsBody:
        "Откройте профиль, чтобы обновить личные данные и предпочтения приложения.",
      securityPrivacy: "Безопасность и конфиденциальность",
      securityPrivacyBody:
        "Биометрия, пароли и другие настройки безопасности находятся здесь.",
      notifications: "Уведомления",
      notificationsBody:
        "Настройте push и email оповещения в панели уведомлений.",
      helpSupport: "Помощь и поддержка",
      helpSupportBody:
        "Пишите на support@incomeexpense.app или смотрите FAQ в центре помощи.",
      appearance: "Внешний вид",
      appearanceBody: "Настройка темы скоро появится!",
      feedback: "Отзыв",
      feedbackBody:
        "Нам важны ваши идеи. Отправьте отзыв из центра помощи.",
      error: "Ошибка",
      signOutFailed: "Не удалось выйти. Попробуйте еще раз.",
      positiveBudget: "Введите положительную сумму бюджета.",
    },
  },
  kk: {
    welcome: "Қош келдіңіз",
    appName: "Кіріс Шығыс",
    quickActions: {
      addIncome: "Кіріс қосу",
      addExpense: "Шығыс қосу",
      transfer: "Аудару",
      transactions: "Транзакциялар",
    },
    navigation: {
      home: "Басты бет",
      bankAccounts: "Банк шоттары",
      notebook: "Жазба",
    },
    home: {
      today: "Бүгін",
      income: "Кіріс",
      expense: "Шығыс",
      balance: "Қалдық",
      previousBalance: "Алдыңғы қалдық",
      totalBalance: "Жалпы қалдық",
      recentTransactions: "Соңғы транзакциялар",
      noTransactions: "Әзірге транзакциялар жоқ.",
      paymentMethods: "Төлем әдістері",
      noPaymentMethods:
        "Әзірге кіріс тіркелмеді. Ақша түскенде әр төлем әдісі мен валюта бойынша сомаларды көрсетеміз.",
      monthlyBudget: "Айлық бюджет",
      budget: "Бюджет",
      spentThisMonth: "Осы айда жұмсалды",
      remaining: "Қалды",
      exceededBy: "Асып түсті",
      noBudgetSet:
        "Бұл картаны түртіп, айлық бюджет нысанасын қойыңыз. Таңдалған валютада шығындарды бақылап, артық шығынды көрсетеміз.",
      setBudget: "Айлық бюджетті қою",
      budgetAmount: "Бюджет сомасы",
      currency: "Валюта",
      save: "Сақтау",
      cancel: "Бас тарту",
      selectCurrency: "Валютаны таңдаңыз",
      selectLanguage: "Тілді таңдаңыз",
      close: "Жабу",
      more: "Тағы",
    },
    drawer: {
      account: "Есептік жазба",
      myProfile: "Менің профилім",
      settings: "Баптаулар",
      securityPrivacy: "Қауіпсіздік және құпиялылық",
      security: "Қауіпсіздік",
      notifications: "Хабарламалар",
      support: "Қолдау",
      helpSupport: "Көмек және қолдау",
      sendFeedback: "Кері байланыс жіберу",
      language: "Тіл",
      appLanguage: "Қосымша тілі",
      signOut: "Шығу",
      version: "Кіріс Шығыс v1.0.0",
      guest: "Қонақ",
      notSignedIn: "Кіру жасалмаған",
    },
    alerts: {
      userSettings: "Пайдаланушы баптаулары",
      userSettingsBody:
        "Профильге өтіп, жеке деректер мен қолданба қалауларын жаңартыңыз.",
      securityPrivacy: "Қауіпсіздік және құпиялылық",
      securityPrivacyBody:
        "Биометрия, құпия сөздер және басқа қауіпсіздік басқармалары осы жерде.",
      notifications: "Хабарламалар",
      notificationsBody:
        "Хабарлама панелінен push және email ескертулерін баптаңыз.",
      helpSupport: "Көмек және қолдау",
      helpSupportBody:
        "support@incomeexpense.app мекенжайына жазыңыз немесе Жиі қойылатын сұрақтарды қараңыз.",
      appearance: "Сыртқы түрі",
      appearanceBody: "Тақырыпты баптау жақында қосылады!",
      feedback: "Кері байланыс",
      feedbackBody:
        "Ұсыныстарыңызды қуана оқимыз. Көмек орталығынан пікір жіберіңіз.",
      error: "Қате",
      signOutFailed: "Шығу сәтсіз. Қайта көріңіз.",
      positiveBudget: "Бюджетке оң сома енгізіңіз.",
    },
  },
};

export const supportedLocales = Object.keys(translations);

// Pick the best match from the device locales and fall back to English.
export const resolveLocale = () => {
  const best = findBestAvailableLanguage(supportedLocales);
  if (best?.languageTag) {
    const normalized = best.languageTag.split("-")[0];
    if (supportedLocales.includes(best.languageTag)) return best.languageTag;
    if (supportedLocales.includes(normalized)) return normalized;
  }

  const deviceLanguage = getLocales()[0]?.languageCode;
  if (deviceLanguage && supportedLocales.includes(deviceLanguage)) {
    return deviceLanguage;
  }

  return "en";
};

const i18n = new I18n(translations);
i18n.defaultLocale = "en";
i18n.enableFallback = true;
i18n.locale = resolveLocale();

export default i18n;
