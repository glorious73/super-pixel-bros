// Bilingual support: English (default) + Arabic. Toggle with L.
// Arabic strings are pure-Arabic runs with Latin key names embedded
// (ENTER, WASD...); canvas text sets ctx.direction so shaping and
// ordering are correct. Numbers stay Western digits in both languages.

const EN = {
  'app.title': 'SUPER PIXEL BROS',
  'press_enter': 'PRESS  ENTER  TO  START',
  'controls.move': 'ARROWS/WASD MOVE    SPACE JUMP',
  'controls.actions': 'N DAY/NIGHT  M MUTE  R RETRY  L LANG  F SCALE  T TOUCH',
  'best': 'BEST {n}',
  'cast_line': '5 HEROES   5 WORLDS   DAY OR NIGHT',
  'choose_hero': 'CHOOSE YOUR HERO',
  'map.title': 'ADVENTURE MAP',
  'map.hint': '← → SELECT   ENTER PLAY   Q TITLE',
  'map.node': 'STAGE {n}',
  'rotate': 'ROTATE TO LANDSCAPE',
  'select_hint': '←  →  SELECT          ENTER  GO!',
  'spd': 'SPD',
  'jmp': 'JMP',
  'level': '{n}  {name}',
  'intro.night': 'NIGHT — MORE FOES, COINS x2',
  'intro.day': 'DAYTIME — STANDARD RISK',
  'hud.score': 'SCORE {n}',
  'hud.day': 'DAY   [N]',
  'hud.night': 'NIGHT [N]',
  'hud.sound_on': 'SOUND ON  [M]',
  'hud.sound_off': 'SOUND OFF [M]',
  'paused': 'PAUSED',
  'pause_hint': 'ESC RESUME   N DAY/NIGHT   M MUTE   Q TITLE',
  'course_clear': 'COURSE CLEAR!',
  'stage_bonus': 'STAGE BONUS  +1000',
  'score': 'SCORE  {n}',
  'next_stage': 'PRESS ENTER FOR NEXT STAGE',
  'press_enter2': 'PRESS ENTER',
  'game_over': 'GAME OVER',
  'retry_hint': 'ENTER RETRY STAGE    ESC TITLE',
  'thanks': 'THANK YOU!',
  'kingdom_saved': 'THE PIXEL KINGDOM IS SAVED',
  'final_score': 'FINAL SCORE  {n}',
  'coins': 'COINS  {n}',
  'mode': 'MODE  {m}',
  'title_back': 'PRESS ENTER FOR TITLE',
  'hero.rosso.name': 'ROSSO',
  'hero.rosso.blurb': 'BALANCED  SURVIVES 1 EXTRA HIT',
  'hero.bolt.name': 'BOLT',
  'hero.bolt.blurb': 'SPEED DEMON  FRAGILE',
  'hero.aqua.name': 'AQUA',
  'hero.aqua.blurb': 'MEGA JUMP  FLOATY FALLS',
  'hero.faris.name': 'FARIS',
  'hero.faris.blurb': 'ARMORED  SURVIVES 3 HITS',
  'hero.sahm.name': 'SAHM',
  'hero.sahm.blurb': 'SUPER SPEED  SLIPPERY',
  'level.plains': 'SUNNY PLAINS',
  'level.hills': 'ROLLING HILLS',
  'level.caves': 'DARK CAVES',
  'level.sky': 'SKY HEIGHTS',
  'level.fortress': 'LAVA FORTRESS',
  'footer': 'SUPER PIXEL BROS · ←→/WASD move · SPACE jump · N day/night'
    + ' · M mute · ESC pause · R retry · F scaling · L language',
};

const AR = {
  'app.title': 'SUPER PIXEL BROS',
  'press_enter': 'اضغط  ENTER  للبدء',
  'controls.move': 'تحرّك بالأسهم/WASD    اقفز بـ SPACE',
  'controls.actions': 'N ليل/نهار  M كتم  R إعادة  L لغة  F تكبير  T لمس',
  'best': 'الأفضل {n}',
  'cast_line': '5 أبطال   5 عوالم   نهار أو ليل',
  'choose_hero': 'اختر  بطلك',
  'map.title': 'خريطة  المغامرة',
  'map.hint': '← → للاختيار   ENTER للعب   Q للخروج',
  'map.node': 'المرحلة {n}',
  'rotate': 'أدر الجهاز للوضع الأفقي',
  'select_hint': '← → للاختيار          ENTER للبدء',
  'spd': 'سرعة',
  'jmp': 'قفز',
  'level': '{n}  {name}',
  'intro.night': 'ليل — أعداء أكثر، العملات ×2',
  'intro.day': 'نهار — خطر معتاد',
  'hud.score': 'النقاط {n}',
  'hud.day': 'نهار   [N]',
  'hud.night': 'ليل [N]',
  'hud.sound_on': 'الصوت يعمل [M]',
  'hud.sound_off': 'الصوت مكتوم [M]',
  'paused': 'إيقاف مؤقت',
  'pause_hint': 'ESC للمتابعة   N ليل/نهار   M كتم   Q للخروج',
  'course_clear': 'أنجزت  المرحلة!',
  'stage_bonus': 'مكافأة المرحلة  +1000',
  'score': 'النقاط  {n}',
  'next_stage': 'اضغط ENTER للمرحلة التالية',
  'press_enter2': 'اضغط ENTER',
  'game_over': 'انتهت  اللعبة',
  'retry_hint': 'ENTER لإعادة المرحلة    ESC للرئيسية',
  'thanks': 'شكراً!',
  'kingdom_saved': 'لقد نجت مملكة بكسل',
  'final_score': 'مجموع النقاط  {n}',
  'coins': 'العملات  {n}',
  'mode': 'الوضع  {m}',
  'title_back': 'اضغط ENTER للعنوان',
  'hero.rosso.name': 'روسو',
  'hero.rosso.blurb': 'متوازن — يتحمّل إصابة إضافية',
  'hero.bolt.name': 'بولت',
  'hero.bolt.blurb': 'سريع جداً — هشّ',
  'hero.aqua.name': 'أكوا',
  'hero.aqua.blurb': 'قفزة خارقة — هبوط ناعم',
  'hero.faris.name': 'فارس',
  'hero.faris.blurb': 'مدرَّع — يتحمّل 3 إصابات',
  'hero.sahm.name': 'سهم',
  'hero.sahm.blurb': 'الأسرع على الإطلاق — صعب القيادة',
  'level.plains': 'السهول المشمسة',
  'level.hills': 'التلال المتموّجة',
  'level.caves': 'الكهوف المظلمة',
  'level.sky': 'أعالي السماء',
  'level.fortress': 'قلعة الحمم',
  'footer': 'سوبر بكسل برذرز · الأسهم/WASD حركة · SPACE قفز · N'
    + ' ليل/نهار · M كتم · ESC إيقاف · R إعادة · F تكبير · L لغة',
};

const TABLES = { en: EN, ar: AR };

let lang = localStorage.getItem('pixelbros_lang') === 'ar' ? 'ar' : 'en';

function applyHtml() {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  const f = document.getElementById('footer');
  if (f) f.textContent = t('footer');
  const r = document.getElementById('rotate');
  if (r) r.textContent = t('rotate');
}

export function t(key, params) {
  let s = (TABLES[lang] && TABLES[lang][key]) ?? TABLES.en[key] ?? key;
  if (params) {
    for (const k in params) s = s.replaceAll('{' + k + '}', params[k]);
  }
  return s;
}

export const getLang = () => lang;
export const isArabic = () => lang === 'ar';
export const otherLang = () => (lang === 'ar' ? 'en' : 'ar');

export function setLang(next) {
  lang = TABLES[next] ? next : 'en';
  localStorage.setItem('pixelbros_lang', lang);
  applyHtml();
}
export const toggleLang = () => setLang(otherLang());

if (document.readyState === 'loading') {
  addEventListener('DOMContentLoaded', applyHtml);
} else {
  applyHtml();
}
