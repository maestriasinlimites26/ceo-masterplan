import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, getDoc } from 'firebase/firestore';
import { Crown, CheckSquare, Square, Target, Briefcase, Plus, Trash2, RefreshCcw, ImagePlus, Flame, ChevronRight, ChevronLeft, Medal, X, Clock, Calendar as CalendarIcon, Settings, AlertTriangle, Zap, Play, Lock, User, Mail, Users, Filter, BarChart2, Unlock, Heart, ShieldAlert, Archive, PauseCircle, Trophy, MoreVertical, CalendarX, Scissors, Activity, GripVertical, Diamond, CalendarDays, Power, Award, Rocket, Shield, Star, Gem, Hexagon, Octagon, Sparkles, ChevronDown, Crosshair, Radar, Plane, Home, TrendingUp, Dumbbell, Map, Compass, SlidersHorizontal, Search, CloudUpload, Check, Moon, Sun, Maximize2, Minimize2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCW-wHcr8ADijFipkDuVqVGBHeZRFfsBFk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ceo-masterplan.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ceo-masterplan",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ceo-masterplan.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "464670034426",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:464670034426:web:90088f39fd3e9985487c43"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ceo-masterplan-v31-final';

// --- UTILIDADES DE TIEMPO ---
const formatDateStr = (y, m, d) => `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

const to24h = (h12, m, ampm) => {
  let h = parseInt(h12, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const to12h = (time24) => {
  if (!time24) return { h12: '12', m: '00', ampm: 'AM' };
  let [h, m] = time24.split(':');
  h = parseInt(h, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return { h12: h12.toString().padStart(2, '0'), m: m.padStart(2, '0'), ampm };
};

const formatAMPM = (timeStr) => {
  if (!timeStr) return '';
  const parsed = to12h(timeStr);
  return `${parsed.h12}:${parsed.m} ${parsed.ampm}`;
};

const timeToMinutes = (time24) => {
  if (!time24) return 0;
  const [h, m] = time24.split(':').map(Number);
  return h * 60 + m;
};

const getHalfHourSlots = (ampm) => {
  const slots = [];
  for (let i = 0; i < 24; i++) {
    let h24 = ampm === 'AM' ? (i < 2 ? 0 : Math.floor(i / 2)) : (i < 2 ? 12 : Math.floor(i / 2) + 12);
    let mins = h24 * 60 + (i % 2 === 1 ? 30 : 0);
    let h12 = h24 % 12 || 12;
    let mStr = i % 2 === 1 ? '30' : '00';
    slots.push({
      label: `${h12.toString().padStart(2, '0')}:${mStr}`,
      h12: h12.toString().padStart(2, '0'),
      m: mStr,
      mins: mins
    });
  }
  return slots;
};

// --- UTILIDADES DE COLOR Y ESTILO ---
const getDynamicMedalColor = (pct) => {
  if (pct === null || isNaN(pct)) return 'text-[#555]';
  if (pct === 0) return 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]';
  if (pct < 25) return 'text-orange-500';
  if (pct < 50) return 'text-amber-400';
  if (pct < 75) return 'text-teal-400';
  if (pct < 100) return 'text-cyan-400';
  return 'text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.9)]';
};

const getPerformanceBgColor = (pct) => {
  if (pct === null || isNaN(pct)) return 'bg-[#111]';
  if (pct === 0) return 'bg-red-900/20 border-b-2 border-red-600/50';
  if (pct < 25) return 'bg-orange-900/20 border-b-2 border-orange-500/50';
  if (pct < 50) return 'bg-amber-900/20 border-b-2 border-amber-400/50';
  if (pct < 75) return 'bg-teal-900/20 border-b-2 border-teal-400/50';
  if (pct < 100) return 'bg-cyan-900/20 border-b-2 border-cyan-400/50';
  return 'bg-blue-900/30 border-b-2 border-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.25)]';
};

const getCategoryColor = (cat) => {
  switch (cat) {
    case 'income': return 'text-emerald-400';
    case 'travel': return 'text-blue-400';
    case 'family': return 'text-yellow-400';
    case 'personal': return 'text-purple-400';
    default: return 'text-gray-400';
  }
};

const getCategoryBg = (cat) => {
  switch (cat) {
    case 'income': return 'bg-emerald-900/20 border-emerald-500/50';
    case 'travel': return 'bg-blue-900/20 border-blue-500/50';
    case 'family': return 'bg-yellow-900/20 border-yellow-500/50';
    case 'personal': return 'bg-purple-900/20 border-purple-500/50';
    default: return 'bg-gray-900/20 border-gray-500/50';
  }
};

// --- MOTOR ESTRATÉGICO DE FRASES DINÁMICAS (PORCENTAJE) ---
const progressPhrases = {
  income: { zero: "0% ACCIÓN. LA PEREZA NO FACTURA.", q1: "TRACCIÓN INICIAL. SUBE LA VELOCIDAD.", q2: "CONSTRUYENDO MOMENTUM. ESCALA LAS MÉTRICAS.", q3: "DOMINANDO EL CICLO. PUNTO DE NO RETORNO.", q4: "ÚLTIMO SPRINT. CIERRA LA VENTA YA." },
  travel: { zero: "0% AVANCE. SIGUES ATRAPADO EN LA RUTINA.", q1: "PREPARANDO TERRENO. VISUALIZA EL DESTINO.", q2: "A MITAD DE CAMINO HACIA TU LIBERTAD.", q3: "PREPARA LAS MALETAS. CASI LO TIENES.", q4: "ÚLTIMO ESFUERZO. EL MUNDO TE ESPERA." },
  family: { zero: "0% ACCIÓN. ELLOS DEPENDEN DE TI.", q1: "PRIMEROS PASOS. CONSTRUYENDO EL LEGADO.", q2: "PROTEGIENDO A LOS TUYOS. SIGUE AVANZANDO.", q3: "ASEGURANDO EL FUTURO. NO AFLOJES AHORA.", q4: "ÚLTIMO ESFUERZO POR TU SANGRE. CUMPLE." },
  personal: { zero: "0% AVANCE. TU CUERPO Y MENTE SE ESTANCAN.", q1: "DESPERTANDO A LA BESTIA. DISCIPLINA PURA.", q2: "MUTACIÓN EN PROCESO. NO TE RINDAS.", q3: "FORJANDO ACERO. ERES IMPARABLE.", q4: "ÚLTIMA REPETICIÓN. DESTRUYE TUS LÍMITES." }
};

const strategicCategoryQuotes = {
  income: {
    success: ["Facturación asegurada. El mercado premia a los que ejecutan, no a los que lloran. Sigue escalando.", "Un cierre más para el imperio. El dinero sigue fluyendo porque tú sigues operando.", "El ROI manda. Meta de ingresos cumplida. Ahora aumenta el nivel de juego."],
    early: ["Destrozaste la meta de ingresos antes de tiempo. El dinero sigue a la velocidad.", "Límite financiero roto. Has hackeado el sistema. Ahora multiplica el target por diez.", "Conquista anticipada. La competencia no estaba lista para tu nivel de acción."],
    fail: ["Cero ROI. Te ahogaste en excusas mientras tu competencia cerraba tus ventas.", "Un ciclo perdido en ingresos. Si no facturas, no existes. Ajusta la oferta hoy mismo.", "Los números no mienten, tú sí. Fracasaste en tu métrica principal de negocio."]
  },
  travel: {
    success: ["Libertad conquistada. Para esto trabajas como una bestia. Disfruta y recarga.", "El mundo es tuyo. Celebra tu victoria, te la ganaste operando en las sombras.", "Nuevo destino desbloqueado. El verdadero lujo es ser dueño absoluto de tu tiempo."],
    early: ["Boleto asegurado antes de tiempo. El mundo es de los que toman acción.", "Destino conquistado. Cuando ejecutas agresivo, vives tus sueños mucho antes.", "Rompiste la barrera del tiempo. Empaca tus cosas, CEO. El viaje te espera."],
    fail: ["Te quedas en casa. Tu falta de ejecución te costó tu libertad este ciclo.", "Sin viaje por mediocridad. Que te duela en el orgullo no poder salir de tu rutina.", "El mundo sigue girando, pero tú no lo verás. Fallaste la misión de vida."]
  },
  family: {
    success: ["El legado crece. Ellos son tu motor y cumpliste tu palabra como líder.", "Has asegurado la victoria para tu imperio familiar. Tu sangre te respalda.", "Proveyendo como se debe. Cumpliste el objetivo más sagrado de tu agenda."],
    early: ["Les diste la victoria antes de tiempo. Para esto te sacrificas a diario.", "Promesa familiar cumplida y superada en tiempo récord. Eres su escudo.", "Rompiste los límites por tu sangre. El mayor premio que tienes es su respeto."],
    fail: ["Le fallaste a tu familia. Esa meta era para ellos y decidiste procrastinar.", "El legado se mancha con promesas rotas. Míralos y asume tu maldita culpa.", "Diles por qué preferiste la pereza barata a darles los resultados que prometiste."]
  },
  personal: {
    success: ["Mente de hierro, cuerpo de acero. Si dominas tu ser, dominas tu cuenta bancaria.", "Evolución completada. Mantén este estándar inquebrantable.", "El espejo no miente, hoy refleja a un ganador absoluto. Excelente trabajo."],
    early: ["Evolución acelerada. Tu disciplina está en el 1% del mundo. Eres imparable.", "Rompiendo tus propios límites biológicos y mentales. Máquina perfecta.", "Target personal destrozado antes del plazo. Disciplina de élite en su máximo nivel."],
    fail: ["Te rendiste contigo mismo. Si no puedes controlar lo que haces, jamás serás CEO.", "Fracaso evolutivo. Elegiste la comodidad barata sobre el crecimiento real.", "Perdiste contra tu mente débil. Tienes que ser mucho más duro contigo mismo."]
  }
};

const getProgressPhrase = (pct, status, category = 'income') => {
  if (status === 'failed') return strategicCategoryQuotes[category]?.fail[0] || "FRACASO TÁCTICO.";
  if (status === 'achieved_early') return strategicCategoryQuotes[category]?.early[0] || "RÉCORD ABSOLUTO.";
  if (pct === 100 || status === 'achieved') return strategicCategoryQuotes[category]?.success[0] || "CONQUISTA ABSOLUTA.";

  const p = progressPhrases[category] || progressPhrases.income;
  if (pct === 0) return p.zero;
  if (pct < 25) return p.q1;
  if (pct < 50) return p.q2;
  if (pct < 75) return p.q3;
  return p.q4;
};

// --- ARSENAL DE MOTIVACIÓN ALTO IMPACTO ---
const workQuotes = [
  { q: "El dinero sigue a la velocidad. Ejecuta o muere.", a: "Ley del Mercado" },
  { q: "Los perdedores tienen excusas, los ganadores tienen facturación.", a: "Regla Zafiro" },
  { q: "No te pagan por intenciones, te pagan por resultados implacables.", a: "Códice Directivo" },
  { q: "Mientras tu competencia duerme, tú estás construyendo un imperio.", a: "Mentalidad Elite" }
];

const habitQuotes = [
  { q: "Tu cuerpo es tu vehículo. No lo trates como un basurero. Entrena.", a: "Ley de Hierro" },
  { q: "La motivación te hace empezar, la disciplina te mantiene en el juego.", a: "Código de Hábitos" },
  { q: "Si no puedes controlar tu mente y tu cuerpo, no podrás controlar tu cuenta.", a: "Cimiento de Élite" }
];

const monthlyQuotes = [
  "El mes se gana en la primera semana. Ejecuta agresivo o prepárate para perder.",
  "Treinta días son suficientes para cambiar tu realidad financiera si dejas de procrastinar.",
  "Las metas mensuales no son sugerencias, son obligaciones con tu libertad."
];

const yearlyQuotes = [
  "Tus metas anuales son promesas a tu sangre. Romperlas es traición.",
  "Un año de enfoque obsesivo te pondrá 5 años por delante de tu competencia.",
  "Construir un imperio toma tiempo. Fija la meta, bloquea el ruido y ejecuta el plan."
];

const goalPsychoQuotes = {
  monthly: {
    income: ["¿Vas a renunciar a facturar esto este mes? Tu competencia te lo agradece.", "Bajar tus metas de ingresos a mitad de mes es firmar tu mediocridad."],
    travel: ["¿Vas a cancelar tu libertad de este mes? Sigue trabajando para los sueños de otro entonces.", "Ese viaje era tu respiro. Si lo borras, te asfixias en la rutina y el conformismo."],
    family: ["¿Le vas a fallar a tu familia este mes? Prometiste esto para ellos.", "Borrar una meta familiar mensual es demostrar que no son tu verdadera prioridad."],
    personal: ["¿Te rindes con tu propio cuerpo y mente este mes? Eres tu activo más valioso.", "Si no puedes mantener una promesa personal por 30 días, no podrás liderar un imperio."]
  },
  yearly: {
    income: ["Renunciar a tu gran facturación anual es el primer paso a la quiebra. ¿Te asustó el número?", "Un año entero para lograrlo y te rindes ahora. El mercado no perdona a los débiles."],
    travel: ["Ese gran viaje del año era el premio a tu sacrificio. ¿Vas a conformarte con quedarte en casa?", "Borrar la libertad anual es aceptar que eres esclavo del sistema. Despierta."],
    family: ["Esta era la gran promesa del año para tu sangre. ¿Los vas a decepcionar?", "El legado no se construye borrando metas anuales. Te necesitan fuerte y resolutivo."],
    personal: ["¿Vas a tirar a la basura tu evolución de este año? Mírate al espejo y dime si estás orgulloso de rendirte.", "Un año perdido no se recupera. Si borras esto, matas al CEO en el que te querías convertir."]
  }
};

const goalExamplesByCategory = {
  income: ["Ej: Cerrar 5 clientes High-Ticket...", "Ej: Facturar $10,000 netos...", "Ej: Lanzar nueva oferta irresistible...", "Ej: Escalar ROAS a 4.5x..."],
  travel: ["Ej: Viaje de 3 días a la playa...", "Ej: Trabajar 1 semana desde Cancún...", "Ej: Retiro de mastermind en Dubai...", "Ej: Viaje familiar a Disney..."],
  family: ["Ej: Pagar las deudas de mis padres...", "Ej: Fin de semana desconectado con mis hijos...", "Ej: Comprar la casa para mi madre...", "Ej: Cena en el mejor restaurante..."],
  personal: ["Ej: Leer 4 libros de psicología oscura...", "Ej: Llegar a 12% de grasa corporal...", "Ej: Meditar 30 días seguidos sin fallar...", "Ej: Ganar 5kg de masa muscular..."]
};

const PERFECT_TIERS = [
  { icon: Crown, color: 'text-cyan-300', baseColor: 'text-cyan-300', hex: '#67E8F9', glow: 'rgba(103,232,249,1)', bg: 'bg-cyan-900/20 border border-cyan-500/50 shadow-[inset_0_0_20px_rgba(103,232,249,0.2)]', name: "LEYENDA DIAMANTE" },
  { icon: Flame, color: 'text-orange-500', baseColor: 'text-orange-500', hex: '#f97316', glow: 'rgba(249,115,22,1)', bg: 'bg-orange-900/20 border border-orange-500/50 shadow-[inset_0_0_20px_rgba(249,115,22,0.2)]', name: "FUEGO INFERNAL" },
  { icon: Diamond, color: 'text-purple-400', baseColor: 'text-purple-400', hex: '#c084fc', glow: 'rgba(192,132,252,1)', bg: 'bg-purple-900/20 border border-purple-500/50 shadow-[inset_0_0_20px_rgba(192,132,252,0.2)]', name: "IMPERIO ONIX" },
  { icon: Shield, color: 'text-emerald-400', baseColor: 'text-emerald-400', hex: '#34d399', glow: 'rgba(52,211,153,1)', bg: 'bg-emerald-900/20 border border-emerald-500/50 shadow-[inset_0_0_20px_rgba(52,211,153,0.2)]', name: "BLINDAJE TOTAL" },
  { icon: Zap, color: 'text-yellow-400', baseColor: 'text-yellow-400', hex: '#facc15', glow: 'rgba(250,204,21,1)', bg: 'bg-yellow-900/20 border border-yellow-500/50 shadow-[inset_0_0_20px_rgba(250,204,21,0.2)]', name: "ALTO VOLTAJE" },
  { icon: Target, color: 'text-rose-500', baseColor: 'text-rose-500', hex: '#f43f5e', glow: 'rgba(244,63,94,1)', bg: 'bg-rose-900/20 border border-rose-500/50 shadow-[inset_0_0_20px_rgba(244,63,94,0.2)]', name: "RANGO ÉLITE" },
  { icon: Gem, color: 'text-pink-400', baseColor: 'text-pink-400', hex: '#f472b6', glow: 'rgba(244,114,182,1)', bg: 'bg-pink-900/20 border border-pink-500/50 shadow-[inset_0_0_20px_rgba(244,114,182,0.2)]', name: "MAESTRO RUBÍ" },
  { icon: Star, color: 'text-amber-300', baseColor: 'text-amber-300', hex: '#fcd34d', glow: 'rgba(252,211,77,1)', bg: 'bg-amber-900/20 border border-amber-500/50 shadow-[inset_0_0_20px_rgba(252,211,77,0.2)]', name: "ESTRELLA NOVA" },
  { icon: Octagon, color: 'text-red-600', baseColor: 'text-red-600', hex: '#dc2626', glow: 'rgba(220,38,38,1)', bg: 'bg-red-900/20 border border-red-600/50 shadow-[inset_0_0_20px_rgba(220,38,38,0.2)]', name: "MÁQUINA BÉLICA" },
  { icon: Sparkles, color: 'text-indigo-400', baseColor: 'text-indigo-400', hex: '#818cf8', glow: 'rgba(129,140,248,1)', bg: 'bg-indigo-900/20 border border-indigo-500/50 shadow-[inset_0_0_20px_rgba(129,140,248,0.2)]', name: "SUPREMACÍA TOTAL" }
];

const weeklyWorkQuotes = ["El mercado recompensa la ejecución brutal. Acelera."];
const weeklyHabitQuotes = ["Tu cuerpo y mente son tu activo más caro. Semana inquebrantable."];
const bottomWorkQuotes = [
  "«NO TE PAGAN POR TRABAJAR DURO, TE PAGAN POR DAR RESULTADOS.»",
  "«LA EJECUCIÓN ES EL JUEGO. LAS IDEAS SIN ACCIÓN SON ALUCINACIONES.»",
  "«EL MERCADO NO PERDONA LA MEDIOCRIDAD. SUBE EL ESTÁNDAR O QUEDA FUERA.»",
  "«DISCIPLINA ES HACER LO QUE HAY QUE HACER CUANDO NO TIENES GANAS.»",
  "«TU COMPETENCIA ESTÁ DURMIENDO. TÚ ESTÁS CONSTRUYENDO.»",
  "«EL DOLOR DE LA DISCIPLINA ES INFINITAMENTE MENOR QUE EL DOLOR DEL ARREPENTIMIENTO.»",
  "«LAS EXCUSAS NO PAGAN FACTURAS. LA EJECUCIÓN SÍ.»",
  "«EL ÉXITO NO SE PLANIFICA EN LA COMODIDAD, SE CONSTRUYE EN EL ESFUERZO.»",
  "«TRABAJA MIENTRAS EL MUNDO DUERME. COBRA CUANDO EL MUNDO DESPIERTA.»",
  "«NO ESPERES EL MOMENTO PERFECTO. HAZLO PERFECTO EN EL CAMINO.»",
  "«LOS GANADORES NO SE QUEJAN DEL CAMPO. CAMBIAN DE ESTRATEGIA Y ATACAN.»",
  "«SI CADA DÍA ES UNA BATALLA, ASEGÚRATE DE GANAR LA TUYA HOY.»",
  "«UNA SOLA HORA DE EJECUCIÓN INTENSA VALE MÁS QUE DIEZ HORAS DE DISTRACCIONESACEPTABLES.»",
  "«CONSTRUYE HOY LO QUE MAÑANA TE PAGARÁ LA LIBERTAD.»",
  "«EL MEJOR MOMENTO PARA ACTUAR FUE AYER. EL SEGUNDO MEJOR MOMENTO ES AHORA.»",
  "«QUIEN CONTROLA SU TIEMPO, CONTROLA SU DESTINO. ¿QUIÉN CONTROLA EL TUYO?»",
  "«FACTURA PRIMERO, DESCANSA DESPUÉS. EL ORDEN IMPORTA.»",
  "«LA DIFERENCIA ENTRE ORDINARIOy EXTRAORDINARIO ES UN PEQUEÑO EXTRA. DÁLO HOY.»",
  "«NO VENDES TIEMPO, VENDES RESULTADOS. HAZ QUE CADA MINUTO CUENTE.»",
  "«LOS MEDIOCRES ESPERAN INSPIRACIÓN. LOS GANADORES LA CREAN CON ACCIÓN.»",
  "«HAZ HOY LO QUE OTROS NO QUIEREN HACER Y MAÑANA TENDRÁS LO QUE ELLOS NO PUEDEN TENER.»",
  "«EL FRACASO NO ES EL FINAL. ES INFORMACIÓN. AJÚSTATE Y ATACA DE NUEVO.»",
  "«UNA SEMANA DE EJECUCIÓN PERFECTA CAMBIA TRAYECTORIAS ENTERAS.»",
  "«TU NIVEL DE HAMBRE DETERMINA TU NIVEL DE ÉXITO. ¿CUÁNTA HAMBRE TIENES HOY?»",
  "«LOS MILLONES SON EL RESULTADO DE MILES DE DECISIONES CORRECTAS CONSECUTIVAS.»",
  "«NO TE QUEJES DEL PROCESO. EL PROCESO ES EL PRECIO DEL RESULTADO.»",
  "«CONSISTENCIA + INTENSIDAD = RESULTADOS EXTRAORDINARIOS.»",
  "«CADA TAREA COMPLETADA HOY ES UNA DEUDA MENOS MAÑANA.»",
  "«EL NEGOCIO NO ESPERA. EL MERCADO NO ESPERA. TÚ TAMPOCO DEBES ESPERAR.»",
  "«UN CEO EJECUTA. UN EMPLEADO ESPERA. DECIDE QUIÉN SER CADA MAÑANA.»",
];
const bottomHabitQuotes = [
  "«CONQUISTA TU MENTE O TU MENTE TE CONQUISTARÁ A TI.»",
  "«LOS HÁBITOS SON EL INTERÉS COMPUESTO DE LA AUTOSUPERACIÓN.»",
  "«No eres la persona que quieres ser. Eres los hábitos que practicas cada día.»",
  "«DISCIPLINA ES RECORDARLE A TU FUTURO YO LO QUE REALMENTE IMPORTA.»",
  "«EL CUERPO QUE TIENES ES EL RESULTADO DE TUS DECISIONES DIARIAS. CAMBIAlas.»",
  "«UNA MENTE DISCIPLINADA ES EL ARMA MÁS PODEROSA DEL PLANETA.»",
  "«EL QUE DOMINA SUS HÁBITOS, DOMINA SU VIDA.»",
  "«CADA VEZ QUE DICES NO A UN HÁBITO NEGATIVO, DICES SÍ A TU MEJOR VERSIÓN.»",
  "«NO BUSQUES MOTIVACIÓN. CONSTRÚYETE EN SISTEMA DE HÁBITOS IRRESISTIBLES.»",
  "«LA CONSTANCIA ES MÁS VALIOSA QUE LA INTENSIDAD ESPORÁDICA.»",
  "«TU RUTINA MATUTINA ES TU DECLARACIÓN DE INTENCIONES AL UNIVERSO.»",
  "«EL QUE NO PUEDE CONTROLAR SU CUERPO NO PUEDE CONTROLAR SU MENTE NI SU NEGOCIO.»",
  "«LOS CAMPEONES NO SON CREADOS EN LOS GINES DE EXHIBICIÓN. SON CREADOS EN SILENCIO.»",
  "«UNA MALA SEMANA SOLO ROMPE TU RACHA SI TÚ SE LO PERMITES.»",
  "«HAZ HOY LO QUE TU YO DEL FUTURO TE AGRADECERÁ.»",
  "«LA DEBILIDAD ES UNA DECISIÓN. TAMBIÉN LO ES LA FORTALEZA.»",
  "«EL CRECIMIENTO NO ES ACCIDENTAL. ES EL RESULTADO DE HÁBITOS INQUEBRANTABLES.»",
  "«DORMIR BIEN, COMER BIEN, MOVERSE BIEN — LA TRINIDAD DEL ALTO RENDIMIENTO.»",
  "«UN DÍA MALO NO DESTRUYE UNA SEMANA. UNA SEMANA MALA NO DESTRUYE UN MES.»",
  "«EL HÁBITO FORMA AL GUERRERO. EL GUERRERO GANA BATALLAS. EL QUE NO TIENE HÁBITOS, PIERDE.»",
  "«CONTROLA TUS MADRUGADAS Y CONTROLARÁS TUS RESULTADOS.»",
  "«LO QUE SE REPITE, SE MULTIPLICA. REPITE SOLO LO QUE QUIERES QUE CREZCA.»",
  "«SU DISCIPLINA HOY ES SU LIBERTAD MAÑANA.»",
  "«EL CANSANCIO ES TEMPORAL. EL ORGULLO DE HABERLO HECHO DURA PARA SIEMPRE.»",
  "«EL PROGRESO ES LA SUMA DE PEQUEÑOS ACTOS DIARIOS INQUEBRANTABLES.»",
  "«LAS PERSONAS EXITOSAS HACEN LO QUE LAS PERSONAS PROMEDIO NO ESTÁN DISPUESTAS A HACER.»",
  "«TU PEOR DÍA ENTRENADO SIGUE SIENDO MEJOR QUE TU MEJOR DÍA SIN ENTRENAR.»",
  "«FORJA TU MENTE EN EL FUEGO DE LA DISCIPLINA Y NADA PODRÁ QUEBRARTE.»",
  "«LOS HÁBITOS DEFINEN EL CARÁCTER. EL CARÁCTER DEFINE EL DESTINO.»",
  "«NO HAY ATAjO PARA LA EXCELENCIA. SOLO EL CAMINO DE LOS HÁBITOS DIARIOS.»",
];

const visionSubQuotes = [
  "EL CEREBRO EJECUTA LO QUE LOS OJOS LE RECUERDAN A DIARIO.",
  "LA VISUALIZACIÓN ES EL PRIMER PASO DE LA FACTURACIÓN.",
  "SI NO LO PUEDES VER EN TU MENTE, NO LO VERÁS EN TU CUENTA.",
  "EL ENFOQUE OBSESIVO VENCE AL TALENTO NATURAL.",
  "TUS METAS DEBEN ASUSTARTE UN POCO Y EMOCIONARTE MUCHO."
];

const visionMainQuotes = [
  "MÍRALOS BIEN. ESTA ES LA LIBERTAD POR LA QUE ESTÁS PELEANDO.",
  "ESTOS SON TUS MOTORES. EL CANSANCIO ES SOLO UNA ILUSIÓN.",
  "ESTE ES TU FUTURO. LA PEREZA NO VA A PAGAR TUS CUENTAS.",
  "TU IMPERIO DEPENDE DE QUE HAGAS ESTO REALIDAD HOY.",
  "NO TE ATREVAS A RENDIRTE. ELLOS CONFÍAN EN TU EJECUCIÓN."
];

const loginMasterQuotes = [
  "ESTÁS ENTRANDO AL MUNDO DE LOS QUE PLANIFICAN A GANAR. EL QUE NO, PLANIFICA PERDER.",
  "TU COMPETENCIA ESTÁ EJECUTANDO MIENTRAS TÚ SIGUES PENSANDO.",
  "EL ROI NO MIENTE. LAS EXCUSAS NO PAGAN LAS FACTURAS.",
  "NO BAJES TUS METAS, AUMENTA TU NIVEL DE EJECUCIÓN.",
  "SI FUERA FÁCIL, TODOS SERÍAN MILLONARIOS. RESISTE Y ESCALA.",
  "LA DISCIPLINA PESA ONZAS, EL ARREPENTIMIENTO PESA TONELADAS.",
  "EL ÉXITO EN LOS NEGOCIOS ES 80% PSICOLOGÍA Y 20% MECÁNICA.",
  "TESTEAR RÁPIDO, FALLAR BARATO, ESCALAR AGRESIVO.",
  "NO TE PAGAN POR CALENTAR LA SILLA, TE PAGAN POR RESOLVER PROBLEMAS.",
  "TU CUENTA BANCARIA ES EL REFLEJO DE TU NIVEL DE INCOMODIDAD.",
  "ABRAZA EL ABURRIMIENTO DE LA CONSISTENCIA. AHÍ ESTÁ EL ORO.",
  "CADA DÍA DE PEREZA LE ROBA DINERO A TU YO DEL FUTURO.",
  "LA MOTIVACIÓN TE HACE EMPEZAR, EL SISTEMA TE HACE MILLONARIO.",
  "OBSESIÓN ES LA PALABRA QUE LOS PEREZOSOS USAN PARA LOS DEDICADOS.",
  "EL DINERO SIGUE A LA VELOCIDAD. ENTRA Y EJECUTA AHORA.",
  "TU MENTE SE RINDE 100 VECES ANTES QUE TU CUERPO. DOMÍNALA.",
  "MENOS CONSUMO, MÁS CREACIÓN. MENOS QUEJAS, MÁS FACTURACIÓN."
];

const tickerQuotes = [
  "EL RIESGO MÁS GRANDE ES NO TOMAR NINGUNO (MARK ZUCKERBERG)",
  "REGLA N°1: NUNCA PIERDAS DINERO. REGLA N°2: NUNCA OLVIDES LA REGLA N°1 (WARREN BUFFETT)",
  "SI NO ENCUENTRAS UNA FORMA DE HACER DINERO MIENTRAS DUERMES, TRABAJARÁS HASTA QUE MUERAS (WARREN BUFFETT)",
  "TU TIEMPO ES LIMITADO, NO LO DESPERDICIES VIVIENDO LA VIDA DE ALGUIEN MÁS (STEVE JOBS)",
  "EL ÉXITO ES UN PÉSIMO MAESTRO. SEDUCE A LAS PERSONAS INTELIGENTES A PENSAR QUE NO PUEDEN PERDER (BILL GATES)",
  "LA EJECUCIÓN ES EL JUEGO. LAS IDEAS NO VALEN NADA SIN EJECUCIÓN (GARY VAYNERCHUK)",
  "SI NO ESTÁS DISPUESTO A ARRIESGAR LO INUSUAL, TENDRÁS QUE CONFORMARTE CON LO ORDINARIO (JIM ROHN)",
  "OBSESIÓN ES LA PALABRA QUE USAN LOS PEREZOSOS PARA DESCRIBIR A LOS DEDICADOS (GRANT CARDONE)",
  "EL MERCADO NO PAGA POR INTENCIONES, PAGA POR RESULTADOS IMPLACABLES",
  "NO BAJES TUS METAS, AUMENTA TU NIVEL DE EJECUCIÓN",
  "EL DINERO SIGUE A LA VELOCIDAD. EJECUTA RÁPIDO, FALLA BARATO, ESCALA AGRESIVO",
  "SI DUELE INVERTIR EN TU NEGOCIO, MÁS DOLERÁ LA QUIEBRA",
  "LAS EXCUSAS SON EL CLAVO EN EL ATAÚD DE TU FACTURACIÓN",
  "EL ÉXITO DEJA PISTAS. ESTUDIA, MODELA Y DOMINA TU MERCADO",
  "EL ÚNICO LUGAR DONDE EL ÉXITO VIENE ANTES QUE EL TRABAJO ES EN EL DICCIONARIO"
];
const tickerContent = tickerQuotes.join(" ✦ ") + " ✦ ";

const imagePsychoQuotes = [
  "Borrar lo que una vez juraste lograr es debilidad pura. ¿Te quedó grande la meta?",
  "Esa imagen representa tu libertad y a tu familia. ¿Estás seguro de que quieres volver a la mediocridad?",
  "Si te duele mirar esa foto, es porque sabes que hoy no diste el 100%. Úsala de gasolina, no huyas.",
  "¿Vas a rendirte con esa casa, ese auto o esa vida que prometiste? El mercado no perdona cobardes.",
  "Borrar esta foto es aceptar que te conformas con el promedio. Tu competencia agradece que te rindas hoy.",
  "El cerebro domina lo que ve. Si borras este sueño, lo matas en tu mente. Piénsalo dos veces."
];

const psychoQuotes = [
  "¿Estás seguro que quieres cambiar tus sueños, o es solo una excusa para abandonar porque se puso difícil?",
  "Los perdedores bajan la meta. Los ganadores aumentan el esfuerzo. ¿Qué eres tú?",
  "Borrar tus motivos hoy es firmar tu contrato de mediocridad mañana. Piénsalo bien.",
  "El mercado no tiene piedad de los débiles. Si no tienes una razón fuerte, el sistema te va a tragar.",
  "Solo un mediocre borra sus grandes sueños para sentirse cómodo con sus pequeños resultados."
];

const q1Examples = [
  "Ej: Facturar $10,000 USD al mes...",
  "Ej: Escalar mi agencia a 6 cifras...",
  "Ej: Vivir 100% del internet y mis embudos...",
  "Ej: Lanzar mi producto High-Ticket este mes..."
];

const q2Examples = [
  "Ej: Sacar a mi familia de las deudas...",
  "Ej: Jubilar a mis padres este año...",
  "Ej: Darle la mejor educación a mis hijos...",
  "Ej: Demostrarle a todos los que dudaron que sí se puede..."
];

const q3Examples = [
  "Ej: No ser esclavo de un horario de 9 a 5...",
  "Ej: Romper la maldición de la pobreza en mi familia...",
  "Ej: El miedo profundo a ser un empleado promedio...",
  "Ej: Trabajar 8 horas por un sueldo mínimo me aterra..."
];

const workExamples = [
  "Ej: Lanzamiento VSL High-Ticket...",
  "Ej: Escalar Campañas Meta a $500/día...",
  "Ej: Optimizar Embudo de Ventas...",
  "Ej: Grabar Creativos Agresivos..."
];

const habitExamples = [
  "Ej: Entrenamiento de Fuerza (Fallo Muscular)...",
  "Ej: Leer 10 págs. de Psicología de Ventas...",
  "Ej: Meditación de Enfoque Láser...",
  "Ej: Cero Dopamina Barata (Bloqueo RRSS)..."
];

// Custom Hook: Typewriter Effect
const useTypewriter = (words, speed = 80, delay = 2000) => {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;
    const currentWord = words[wordIndex];
    let timeout;

    if (isDeleting) {
      timeout = setTimeout(() => {
        setText(currentWord.substring(0, text.length - 1));
        if (text === '') {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }, speed / 2);
    } else {
      timeout = setTimeout(() => {
        setText(currentWord.substring(0, text.length + 1));
        if (text === currentWord) {
          timeout = setTimeout(() => setIsDeleting(true), delay);
        }
      }, speed);
    }
    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, speed, delay]);

  return text;
};

// --- COMPONENTE LOGO UNIVERSAL (EXTERIOR E INTERIOR) ---
const SystemLogo = ({ size = 'large' }) => {
  if (size === 'small') {
    return (
      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
        <div className="absolute inset-0 rounded-xl border border-blue-500/30 border-t-blue-500 animate-[spin_4s_linear_infinite]"></div>
        <div className="absolute inset-1 rounded-lg border border-cyan-400/20 border-b-cyan-400 animate-[spin_3s_linear_infinite_reverse]"></div>
        <Diamond className="w-5 h-5 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center shrink-0">
      <div className="absolute inset-0 rounded-3xl border-2 border-blue-500/20 border-t-blue-500 animate-[spin_6s_linear_infinite]"></div>
      <div className="absolute inset-2 rounded-2xl border border-cyan-400/20 border-b-cyan-400 animate-[spin_4s_linear_infinite_reverse]"></div>
      <div className="absolute inset-4 rounded-xl border border-purple-500/20 border-r-purple-500 animate-[spin_5s_linear_infinite]"></div>
      <div className="w-16 h-16 bg-[#02040A] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] premium-pulse z-10">
        <Diamond className="w-8 h-8 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.9)] animate-pulse" strokeWidth={2.5} />
      </div>
    </div>
  );
};

const getRewardTier = (pct, hash = 0, mode = 'workTasks') => {
  if (pct === null || isNaN(pct)) return { icon: Hexagon, color: 'text-[#2a2a2a]', bg: '', name: "SIN DATA", hex: '#333', glow: 'rgba(0,0,0,0)' };
  if (mode === 'habits') {
    // Tiers orientados a disciplina corporal/mental
    if (pct === 0) return { icon: Hexagon, color: 'text-gray-600', bg: '', name: "SIN RACHA", hex: '#4b5563', glow: 'rgba(0,0,0,0)' };
    if (pct < 20) return { icon: Dumbbell, color: 'text-stone-500', bg: '', name: "SEMILLA", hex: '#78716c', glow: 'rgba(120,113,108,0.8)' };
    if (pct < 35) return { icon: Shield, color: 'text-amber-700', bg: '', name: "HIERRO", hex: '#b45309', glow: 'rgba(180,83,9,0.8)' };
    if (pct < 50) return { icon: ShieldAlert, color: 'text-slate-400', bg: '', name: "ACERO", hex: '#94a3b8', glow: 'rgba(148,163,184,0.8)' };
    if (pct < 65) return { icon: Zap, color: 'text-cyan-400', bg: '', name: "TITANIO", hex: '#22d3ee', glow: 'rgba(34,211,238,0.8)' };
    if (pct < 80) return { icon: Flame, color: 'text-orange-500', bg: '', name: "FUERZA ÉLITE", hex: '#f97316', glow: 'rgba(249,115,22,0.8)' };
    if (pct < 90) return { icon: Star, color: 'text-purple-400', bg: '', name: "MAESTRO", hex: '#a855f7', glow: 'rgba(168,85,247,0.8)' };
    if (pct < 100) return { icon: Sparkles, color: 'text-emerald-400', bg: '', name: "GUERRERO", hex: '#10b981', glow: 'rgba(16,185,129,0.8)' };
    return { ...PERFECT_TIERS[hash], name: 'GUERRERO TOTAL' };
  }
  // Tiers orientados a negocios/ejecución (workTasks)
  if (pct === 0) return { icon: Hexagon, color: 'text-gray-600', bg: '', name: "SIN DATOS", hex: '#4b5563', glow: 'rgba(0,0,0,0)' };
  if (pct < 20) return { icon: Shield, color: 'text-amber-800', bg: '', name: "MADERA", hex: '#92400e', glow: 'rgba(146,64,14,0.8)' };
  if (pct < 35) return { icon: ShieldAlert, color: 'text-orange-600', bg: '', name: "BRONCE", hex: '#ea580c', glow: 'rgba(234,88,12,0.8)' };
  if (pct < 50) return { icon: Medal, color: 'text-zinc-300', bg: '', name: "PLATA", hex: '#d4d4d8', glow: 'rgba(212,212,216,0.8)' };
  if (pct < 65) return { icon: Award, color: 'text-yellow-400', bg: '', name: "ORO", hex: '#facc15', glow: 'rgba(250,204,21,0.8)' };
  if (pct < 80) return { icon: Gem, color: 'text-blue-400', bg: '', name: "ZAFIRO", hex: '#60a5fa', glow: 'rgba(96,165,250,0.8)' };
  if (pct < 90) return { icon: Star, color: 'text-green-400', bg: '', name: "ESMERALDA", hex: '#4ade80', glow: 'rgba(74,222,128,0.8)' };
  if (pct < 100) return { icon: Sparkles, color: 'text-purple-400', bg: '', name: "AMATISTA", hex: '#c084fc', glow: 'rgba(192,132,252,0.8)' };
  return PERFECT_TIERS[hash];
};

const WeeklyRewardCard = ({ percentage, label, weekDays, mode, isCurrentWeek, isClosed, saturdayDate }) => {
  const startDayStr = weekDays[0]?.dateStr || '2024-01-01';
  const hash = useMemo(() => {
    let h = 0;
    for (let i = 0; i < startDayStr.length; i++) h = startDayStr.charCodeAt(i) + ((h << 5) - h);
    return Math.abs(h) % 10;
  }, [startDayStr]);

  const tier = getRewardTier(percentage, hash, mode);
  const Icon = tier.icon;
  // Show Mon-Sat range (exclude Sunday)
  const workDays = weekDays.filter(d => d.dayIndex !== 0);
  const startDay = workDays[0]?.date ?? weekDays[0]?.date;
  const endDay = workDays[workDays.length - 1]?.date ?? weekDays[weekDays.length - 1]?.date;

  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const validPct = isNaN(percentage) || percentage === null ? 0 : percentage;
  const strokeDashoffset = circumference - (validPct / 100) * circumference;

  const isPerfect = validPct === 100;
  const noData = percentage === null || isNaN(percentage) || workDays.length === 0;

  // Stroke color based on progress
  const strokeColor = isPerfect ? (tier.hex || '#10B981')
    : validPct >= 80 ? '#a855f7'
      : validPct >= 60 ? '#3b82f6'
        : validPct >= 40 ? '#facc15'
          : validPct >= 20 ? '#f97316'
            : '#374151';

  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500 group select-none ${isCurrentWeek
        ? 'ring-2 ring-blue-500/70 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
        : ''
        }`}
      style={{ background: 'linear-gradient(160deg, #0d1117 0%, #0f172a 100%)', border: `1px solid ${isCurrentWeek ? 'rgba(59,130,246,0.4)' : '#1e293b'}` }}
    >
      {/* Top accent line for current week */}
      {isCurrentWeek && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
      )}

      {/* Lock icon top-right */}
      {isClosed && !noData && (
        <div className="absolute top-2 right-2 z-20">
          <Lock className="w-2.5 h-2.5 text-[#444]" />
        </div>
      )}

      <div className="p-3 flex flex-col gap-2">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className={`text-[8px] uppercase font-black tracking-widest leading-none ${isCurrentWeek ? 'text-blue-400' : 'text-[#444]'}`}>
            {label}
          </span>
          <span className="text-[7px] text-[#333] font-bold">{startDay}–{endDay}</span>
        </div>

        {/* Main content: ring LEFT + medal RIGHT */}
        <div className="flex items-center justify-between gap-2">
          {/* Progress ring */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg
              className="transform -rotate-90 transition-all duration-1000"
              style={{ filter: isPerfect ? `drop-shadow(0 0 8px ${tier.hex})` : 'none' }}
              width={radius * 2 + strokeWidth * 2}
              height={radius * 2 + strokeWidth * 2}
            >
              <circle cx={radius + strokeWidth} cy={radius + strokeWidth} r={radius}
                stroke="#1a2235" strokeWidth={strokeWidth} fill="transparent" />
              <circle cx={radius + strokeWidth} cy={radius + strokeWidth} r={radius}
                stroke={noData ? '#1a2235' : strokeColor}
                strokeWidth={strokeWidth} fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={noData ? circumference : strokeDashoffset}
                className="transition-all duration-1000 ease-out" strokeLinecap="round" />
            </svg>
            <div className="absolute flex items-center justify-center">
              <span className={`font-black text-sm leading-none ${isPerfect ? 'text-white' : noData ? 'text-[#2a2a2a]' : 'text-white'}`}>
                {noData ? '—' : `${Math.round(validPct)}%`}
              </span>
            </div>
          </div>

          {/* Medal + name */}
          <div className="flex flex-col items-center gap-1 transform transition-transform duration-300 group-hover:scale-110 flex-1">
            <Icon
              className={`w-6 h-6 ${noData ? 'text-[#1e293b]' : tier.color} ${isPerfect ? 'drop-shadow-[0_0_6px_currentColor]' : ''}`}
              strokeWidth={1.5}
            />
            <span className={`text-[6px] font-black tracking-widest uppercase text-center leading-tight ${noData ? 'text-[#2a2a2a]' : tier.color}`}>
              {noData ? 'SIN DATA' : tier.name}
            </span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center justify-center">
          {isCurrentWeek && (
            <span className="text-[6px] font-black uppercase tracking-widest text-blue-400 animate-pulse">● EN CURSO</span>
          )}
          {isClosed && isPerfect && (
            <span className="text-[6px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-0.5">
              <Trophy className="w-2.5 h-2.5" /> SELLADA
            </span>
          )}
          {isClosed && !isPerfect && !noData && (
            <span className="text-[6px] font-black uppercase tracking-widest text-[#333]">CERRADA</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [session, setSession] = useState(() => {
    try {
      const cached = localStorage.getItem('eliteSession');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.lastLogin && Date.now() - parsed.lastLogin < 7 * 24 * 60 * 60 * 1000) {
          return { ...parsed, isLoggedIn: true };
        }
      }
    } catch (e) { }
    return { isLoggedIn: false, role: '', email: '', name: '', uid: '' };
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  const [loginMode, setLoginMode] = useState('guest');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginQuoteIdx, setLoginQuoteIdx] = useState(0);

  const [allowedUsers, setAllowedUsers] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [addGuestForm, setAddGuestForm] = useState({ name: '', email: '' });
  const [guestAddedMsg, setGuestAddedMsg] = useState('');
  const [guestToDelete, setGuestToDelete] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | saving | success

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileAliasInput, setProfileAliasInput] = useState('');

  // --- ESTADO PRINCIPAL DE NAVEGACIÓN ---
  const [appMode, setAppMode] = useState('execution');

  const currentDate = new Date();
  const actualYear = currentDate.getFullYear();
  const actualMonthIndex = currentDate.getMonth();
  const todayDate = currentDate.getDate();
  const actualTodayStr = formatDateStr(actualYear, actualMonthIndex, todayDate);

  const [selectedYear, setSelectedYear] = useState(actualYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(actualMonthIndex);
  const [viewScope, setViewScope] = useState('month');
  const [currentWeekIdx, setCurrentWeekIdx] = useState(0);
  const [currentDayIdx, setCurrentDayIdx] = useState(todayDate - 1);
  const [customSelectedDates, setCustomSelectedDates] = useState([]);

  const [modalDate, setModalDate] = useState({ month: actualMonthIndex, year: actualYear });

  const [matrixMode, setMatrixMode] = useState('workTasks');
  const [taskStatusFilter, setTaskStatusFilter] = useState('active');

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const baseColWidth = isMobile ? 160 : 250;
  const [colWidth, setColWidth] = useState(baseColWidth);
  const [isLeftColCollapsed, setIsLeftColCollapsed] = useState(false);
  const physicalColWidth = isLeftColCollapsed ? 65 : baseColWidth;
  const visualColWidth = isLeftColCollapsed ? 65 : colWidth;

  const [bottomQuoteTick, setBottomQuoteTick] = useState(0);

  const [onboardingData, setOnboardingData] = useState({ q1: '', q2: '', q3: '' });
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showPsychologicalModal, setShowPsychologicalModal] = useState(false);
  const [psychoQuoteIdx, setPsychoQuoteIdx] = useState(0);

  const [imageActionModal, setImageActionModal] = useState({ show: false, index: null });

  const [imgPsychoQuoteIdx, setImgPsychoQuoteIdx] = useState(0);

  const [visionQuoteIdx, setVisionQuoteIdx] = useState(0);
  const [subQuoteIdx, setSubQuoteIdx] = useState(0);

  // --- ESTADO PARA EL MODAL DE METAS A LARGO PLAZO ---
  const [longTermGoalModal, setLongTermGoalModal] = useState({ show: false, goal: null, type: 'monthly' });

  // --- NUEVO: ESTADO PARA EL GUARDIÁN PSICOLÓGICO DE METAS (ELIMINACIÓN) ---
  const [goalPsychoModal, setGoalPsychoModal] = useState({ show: false, goalId: null, type: 'monthly', category: 'income', title: '' });
  const [goalPsychoQuoteIdx, setGoalPsychoQuoteIdx] = useState(0);

  const [singleDayCancelModal, setSingleDayCancelModal] = useState({ show: false, task: null, dayData: null, category: '' });

  const twQ1 = useTypewriter(q1Examples, 60, 2500);
  const twQ2 = useTypewriter(q2Examples, 60, 2500);
  const twQ3 = useTypewriter(q3Examples, 60, 2500);
  const twCorreo = useTypewriter(["ejemplo@correo.com", "tucorreo@empresa.com"], 80, 3000);
  const twClave = useTypewriter(["123456", "tu_clave_secreta"], 80, 3000);
  const twWorkTask = useTypewriter(workExamples, 50, 2000);
  const twHabitTask = useTypewriter(habitExamples, 50, 2000);

  // --- NUEVO: TYPEWRITER DINÁMICO PARA METAS BASADO EN CATEGORÍA ---
  const activeGoalExamples = goalExamplesByCategory[longTermGoalModal.goal?.category || 'income'];
  const twGoalPlaceholder = useTypewriter(activeGoalExamples, 60, 2500);

  // --- NUEVO: ESTADO MODAL PARA AGREGAR/ELIMINAR CATEGORÍA ---
  const [addCatModal, setAddCatModal] = useState({ show: false, context: 'monthly', editCat: null });
  const [addCatName, setAddCatName] = useState('');
  const [addCatEmoji, setAddCatEmoji] = useState('🎯');
  const [addCatColor, setAddCatColor] = useState('#10b981');
  const [goalFilter, setGoalFilter] = useState('all'); // 'all' | 'achieved' | 'failed' | 'active'
  const [deleteCatModal, setDeleteCatModal] = useState({ show: false, catId: null, catTitle: '', isDefault: false, context: 'monthly' });
  const [goalImageModal, setGoalImageModal] = useState({ show: false, goalId: null, goalType: 'monthly' });
  const [goalImgViewer, setGoalImgViewer] = useState({ show: false, src: '' });

  useEffect(() => {
    const loginInterval = setInterval(() => {
      setLoginQuoteIdx(prev => (prev + 1) % loginMasterQuotes.length);
    }, 25000);

    const bottomInterval = setInterval(() => {
      setBottomQuoteTick(prev => prev + 1);
    }, 45000); // 45 segundos

    const visionInterval = setInterval(() => {
      setVisionQuoteIdx(prev => (prev + 1) % visionMainQuotes.length);
      setSubQuoteIdx(prev => (prev + 1) % visionSubQuotes.length);
    }, 30000);

    return () => {
      clearInterval(loginInterval);
      clearInterval(bottomInterval);
      clearInterval(visionInterval);
    };
  }, []);

  useEffect(() => {
    if (showPsychologicalModal) {
      setPsychoQuoteIdx(Math.floor(Math.random() * psychoQuotes.length));
    }
  }, [showPsychologicalModal]);

  // Disparador de frases aleatorias cuando se abre el modal de eliminación de metas
  useEffect(() => {
    if (goalPsychoModal.show) {
      setGoalPsychoQuoteIdx(Math.floor(Math.random() * 2)); // Hay 2 frases por categoría
    }
  }, [goalPsychoModal.show]);

  // Auto-click de input de archivo cuando se solicita agregar imagen a meta
  useEffect(() => {
    if (goalImageModal.show && goalFileInputRef.current) {
      goalFileInputRef.current.value = '';
      goalFileInputRef.current.click();
    }
  }, [goalImageModal.show]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidth;
    const doDrag = (dragEvent) => setColWidth(Math.max(200, Math.min(800, startWidth + dragEvent.clientX - startX)));
    const stopDrag = () => { document.removeEventListener('mousemove', doDrag); document.removeEventListener('mouseup', stopDrag); };
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  // --- DRAG-TO-SCROLL en la tabla (global document) ---
  const tableScrollRef = useRef(null);
  const tableScrollLeft = useRef(0);
  const tableDragStartX = useRef(0);
  const tableDragging = useRef(false);

  // El scrollLeft automático ya no es necesario porque usamos physicalColWidth fijo

  const handleTableMouseDown = (e) => {
    // Disable drag-to-scroll over the checklist rows so it doesn't conflict with sortable drag-and-drop
    if (e.target.closest('tbody')) return;

    const el = tableScrollRef.current;
    if (!el) return;
    // Only left-click
    if (e.button !== 0) return;
    tableDragStartX.current = e.clientX;
    tableScrollLeft.current = el.scrollLeft;
    tableDragging.current = false; // will be set true once we move >4px

    const onMove = (moveEvt) => {
      const delta = moveEvt.clientX - tableDragStartX.current;
      if (!tableDragging.current && Math.abs(delta) < 4) return;
      tableDragging.current = true;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
      el.scrollLeft = tableScrollLeft.current - delta * 2;
    };

    const onUp = () => {
      el.style.cursor = 'grab';
      el.style.userSelect = '';
      // Delay resetting dragging state so onClickCapture can prevent click
      setTimeout(() => { tableDragging.current = false; }, 50);
      document.removeEventListener('mousemove', onMove, { capture: true });
      document.removeEventListener('mouseup', onUp, { capture: true });
    };

    // Usar { capture: true } asegura que escuchemos el evento incluso si un hijo (como un checkbox) llama a stopPropagation
    document.addEventListener('mousemove', onMove, { capture: true });
    document.addEventListener('mouseup', onUp, { capture: true });
  };

  const handleTableClickCapture = (e) => {
    // Si estamos arrastrando, bloquear el click para que no presione checkboxes por error
    if (tableDragging.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // Touch drag for mobile
  const handleTableTouchStart = (e) => {
    // Disable drag-to-scroll over the checklist rows so it doesn't conflict with sortable drag-and-drop
    if (e.target.closest('tbody')) return;

    const el = tableScrollRef.current;
    if (!el || e.touches.length !== 1) return;
    tableDragStartX.current = e.touches[0].clientX;
    tableScrollLeft.current = el.scrollLeft;

    const onTouchMove = (te) => {
      if (te.touches.length !== 1) return;
      const delta = te.touches[0].clientX - tableDragStartX.current;
      el.scrollLeft = tableScrollLeft.current - delta * 2;
    };
    const onTouchEnd = () => {
      el.removeEventListener('touchmove', onTouchMove, { capture: true });
      el.removeEventListener('touchend', onTouchEnd, { capture: true });
      el.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
    el.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
    el.addEventListener('touchend', onTouchEnd, { capture: true });
    el.addEventListener('touchcancel', onTouchEnd, { capture: true });
  };

  const activeBottomQuotes = matrixMode === 'workTasks' ? bottomWorkQuotes : bottomHabitQuotes;
  const currentBottomQuote = activeBottomQuotes[bottomQuoteTick % activeBottomQuotes.length];

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const monthShort = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const daysOfWeekStr = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

  const paddedMonthDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonthIndex, 1);
    const lastDay = new Date(selectedYear, selectedMonthIndex + 1, 0);
    const startDate = new Date(firstDay);
    const startDayOfWeek = startDate.getDay();
    const daysToPrepend = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToPrepend);
    const endDate = new Date(lastDay);
    const endDayOfWeek = endDate.getDay();
    const daysToAppend = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endDate.setDate(endDate.getDate() + daysToAppend);

    const days = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      days.push({
        date: current.getDate(),
        monthIndex: current.getMonth(),
        year: current.getFullYear(),
        dayIndex: current.getDay(),
        dayName: daysOfWeekStr[current.getDay()],
        isToday: current.getDate() === todayDate && current.getMonth() === actualMonthIndex && current.getFullYear() === actualYear,
        dateStr: formatDateStr(current.getFullYear(), current.getMonth(), current.getDate()),
        isCurrentMonth: current.getMonth() === selectedMonthIndex
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [selectedYear, selectedMonthIndex, todayDate, actualMonthIndex, actualYear]);

  const modalDaysArray = useMemo(() => {
    const dim = new Date(modalDate.year, modalDate.month + 1, 0).getDate();
    const arr = [];
    for (let d = 1; d <= dim; d++) { arr.push({ date: d, dateStr: formatDateStr(modalDate.year, modalDate.month, d), dayIndex: new Date(modalDate.year, modalDate.month, d).getDay() }); }
    return arr;
  }, [modalDate]);

  const calendarWeeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < paddedMonthDays.length; i += 7) weeks.push(paddedMonthDays.slice(i, i + 7));
    return weeks;
  }, [paddedMonthDays]);

  const yearDaysArray = useMemo(() => {
    const days = [];
    let current = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);
    while (current <= end) {
      days.push({
        date: current.getDate(), monthIndex: current.getMonth(), year: current.getFullYear(), dayIndex: current.getDay(),
        dayName: daysOfWeekStr[current.getDay()], isToday: current.getDate() === todayDate && current.getMonth() === actualMonthIndex && current.getFullYear() === actualYear,
        dateStr: formatDateStr(current.getFullYear(), current.getMonth(), current.getDate()), isCurrentMonth: true
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [selectedYear, todayDate, actualMonthIndex, actualYear]);

  const daysArrayMonth = useMemo(() => paddedMonthDays.filter(d => d.isCurrentMonth), [paddedMonthDays]);

  const [config, setConfig] = useState({
    profile: { alias: '', theme: 'dark' },
    profilePic: '', motives: { q1: '', q2: '', q3: '' }, motivesLocked: false, images: [], habits: [], workTasks: [], tutorialSeen: false,
    monthlyGoals: [], yearlyGoals: [], customCategories: []
  });
  const [monthlyChecks, setMonthlyChecks] = useState({});
  const [monthlyExceptions, setMonthlyExceptions] = useState({});

  const [celebration, setCelebration] = useState({ show: false, quote: '', author: '', type: 'workTasks', isEarly: false, category: 'income' });
  const [weeklyCelebration, setWeeklyCelebration] = useState({ show: false, type: 'workTasks', tier: null, quote: '' });
  const [failureModal, setFailureModal] = useState({ show: false, quote: '', title: '', category: 'income' });

  const [editingTask, setEditingTask] = useState(() => {
    try {
      const savedDraft = localStorage.getItem('ceo_masterplan_task_draft');
      return savedDraft ? JSON.parse(savedDraft) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (editingTask) {
      localStorage.setItem('ceo_masterplan_task_draft', JSON.stringify(editingTask));
    } else {
      localStorage.removeItem('ceo_masterplan_task_draft');
    }
  }, [editingTask]);
  const [activeTimeTab, setActiveTimeTab] = useState(null);

  const [taskDeleteModal, setTaskDeleteModal] = useState({ show: false, task: null, category: '' });
  const [advancedDeleteModal, setAdvancedDeleteModal] = useState({ show: false, task: null, dates: [], category: '' });
  const [multiDateModal, setMultiDateModal] = useState({ show: false, dates: [] });

  const fileInputRef = useRef(null);
  const goalFileInputRef = useRef(null);
  const [activeImageSlot, setActiveImageSlot] = useState(null);

  const displayImages = useMemo(() => {
    const validImages = (config.images || []).filter(img => typeof img === 'string' || !img.deleted);
    if (validImages.length === 0) return [];
    const repetitions = Math.ceil(15 / validImages.length);
    return Array(repetitions).fill(validImages).flat();
  }, [config.images]);

  // INICIO DE AUTENTICACIÓN Y PERSISTENCIA AUTOMÁTICA
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
            console.warn("Desajuste de token (configuración personalizada detectada). Usando login anónimo:", tokenError);
            await signInAnonymously(auth);
          }
        }
        else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth Error", e); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, u => setFirebaseUser(u));
    return () => unsub();
  }, []);

  // RECUPERAR LA SESIÓN PARA EVITAR RE-LOGINS
  useEffect(() => {
    if (firebaseUser) {
      const authLinkRef = doc(db, 'artifacts', appId, 'users', firebaseUser.uid, 'settings', 'auth_link');
      const unsub = onSnapshot(authLinkRef, (snap) => {
        if (snap.exists() && snap.data().isLoggedIn) {
          setSession(snap.data());
        }
        setIsAuthChecking(false);
      }, (error) => {
        console.error("Error validando sesión:", error);
        setIsAuthChecking(false);
      });
      return () => unsub();
    }
  }, [firebaseUser]);

  // LECTURA DE USUARIOS PERMITIDOS
  useEffect(() => {
    if (!firebaseUser) return;
    const allowedRef = doc(db, 'artifacts', appId, 'public', 'data', 'allowed_users', 'list');
    onSnapshot(allowedRef, snap => { if (snap.exists()) setAllowedUsers(snap.data().users || []); }, (error) => console.error("Error validando accesos:", error));
  }, [firebaseUser]);

  // LECTURA DE CONFIGURACIÓN COMPARTIDA POR USUARIO (CROSS-DEVICE)
  useEffect(() => {
    if (config.profile?.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [config.profile?.theme]);

  useEffect(() => {
    if (!firebaseUser || !session.isLoggedIn) return;

    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_configs', `${session.uid}_year_${selectedYear}`);
    const unsubConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(data);
        if (!data.motives) setConfig(prev => ({ ...prev, motives: { q1: '', q2: '', q3: '' } }));
        if (data.tutorialSeen === undefined) setConfig(prev => ({ ...prev, tutorialSeen: false }));
        if (!data.images) setConfig(prev => ({ ...prev, images: [] }));
        if (!data.monthlyGoals) setConfig(prev => ({ ...prev, monthlyGoals: [] }));
        if (!data.yearlyGoals) setConfig(prev => ({ ...prev, yearlyGoals: [] }));
      } else {
        setDoc(configRef, config, { merge: true });
      }
      setIsConfigLoaded(true);
    }, (error) => {
      console.error("Error sincronizando config:", error);
      setIsConfigLoaded(true);
    });

    // Cargar imágenes desde documentos separados para evitar el límite de 1MB
    const loadImages = async () => {
      try {
        const imgDoc = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_images', session.uid));
        if (imgDoc.exists()) {
          const data = imgDoc.data();
          setConfig(prev => ({ ...prev, profilePic: data.profilePic || '', images: data.images || [] }));
        }
      } catch (e) {
        console.error("Error cargando imágenes", e);
      }
    };
    loadImages();

    const checksRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_checks', `${session.uid}_year_${selectedYear}`);
    const unsubChecks = onSnapshot(checksRef, (docSnap) => {
      if (docSnap.exists()) {
        setMonthlyChecks(docSnap.data().checks || {});
        setMonthlyExceptions(docSnap.data().exceptions || {});
      } else {
        setMonthlyChecks({}); setMonthlyExceptions({});
      }
    }, (error) => console.error("Error sincronizando progreso:", error));

    return () => { unsubConfig(); unsubChecks(); };
  }, [firebaseUser, session.isLoggedIn, selectedYear, session.uid]);

  const saveConfig = async (newConfig) => { if (firebaseUser && session.isLoggedIn) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_configs', `${session.uid}_year_${selectedYear}`), newConfig, { merge: true }); };
  const saveChecksAndExceptions = async (newChecks, newExceptions) => { if (firebaseUser && session.isLoggedIn) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_checks', `${session.uid}_year_${selectedYear}`), { checks: newChecks, exceptions: newExceptions }, { merge: true }); };

  const handleForceSync = async () => {
    if (!session.isLoggedIn || !firebaseUser) return;
    setSyncStatus('saving');
    try {
      await saveConfig(config);
      await saveChecksAndExceptions(monthlyChecks, monthlyExceptions);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error("Error forzando respaldo:", error);
      setSyncStatus('idle');
    }
  };

  // --- NUEVO: AUTO-ACTUALIZADOR DE TIEMPO PARA METAS ---
  useEffect(() => {
    if (!isConfigLoaded || !session.isLoggedIn) return;

    let needsUpdate = false;
    const currentMs = new Date(actualTodayStr + "T00:00:00").getTime();

    const processGoals = (goals) => {
      return goals.map(g => {
        if (g.status === 'active') {
          const startMs = new Date(g.startDate + "T00:00:00").getTime();
          const targetMs = new Date(g.targetDate + "T00:00:00").getTime();

          let timeProg = 0;
          if (targetMs <= startMs) {
            timeProg = currentMs >= targetMs ? 100 : 0;
          } else {
            if (currentMs >= targetMs) timeProg = 100;
            else if (currentMs <= startMs) timeProg = 0;
            else timeProg = Math.floor(((currentMs - startMs) / (targetMs - startMs)) * 100);
          }

          if (g.progress !== timeProg || (timeProg === 100 && g.status === 'active')) {
            needsUpdate = true;
            return {
              ...g,
              progress: timeProg,
              status: timeProg === 100 ? 'pending_validation' : 'active'
            };
          }
        }
        return g;
      });
    };

    const updatedMonthly = processGoals(config.monthlyGoals);
    const updatedYearly = processGoals(config.yearlyGoals);

    if (needsUpdate) {
      const newConf = { ...config, monthlyGoals: updatedMonthly, yearlyGoals: updatedYearly };
      setConfig(newConf);
      saveConfig(newConf);
    }
  }, [config.monthlyGoals, config.yearlyGoals, isConfigLoaded, session.isLoggedIn, actualTodayStr]);
  // ----------------------------------------------------

  const isPendingOnboarding = session.isLoggedIn && isConfigLoaded && (!config.motivesLocked || (session.role === 'guest' && !config.tutorialSeen));

  const handleNextOnboardingStep = () => {
    if (onboardingStep < 6) setOnboardingStep(prev => prev + 1);
  };
  const handleSkipOnboardingStep = () => {
    if (onboardingStep < 6) setOnboardingStep(6);
  };

  const handleSaveOnboarding = () => {
    if (!onboardingData.q1.trim() || !onboardingData.q2.trim() || !onboardingData.q3.trim()) return;
    const newConfig = { ...config, motives: onboardingData, motivesLocked: true, tutorialSeen: true };
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const handleConfirmPsychoDelete = () => {
    const newConfig = { ...config, motives: { q1: '', q2: '', q3: '' }, motivesLocked: true };
    saveConfig(newConfig);
    setConfig(newConfig);
    setShowPsychologicalModal(false);
  };

  const handlePsychoEvolve = () => {
    setOnboardingStep(6);
    setOnboardingData(config.motives && config.motives.q1 ? config.motives : { q1: '', q2: '', q3: '' });
    const newConfig = { ...config, motivesLocked: false };
    saveConfig(newConfig);
    setConfig(newConfig);
    setShowPsychologicalModal(false);
  };
  // --- PALETA DE COLORES PARA CATEGORÍAS ---
  const CAT_COLORS = [
    '#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6',
    '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#a78bfa', '#fb923c',
    '#38bdf8', '#facc15', '#4ade80', '#e879f9'
  ];
  const CAT_EMOJIS = [
    '🎯', '💰', '✈️', '🏠', '⚡', '🚀', '💪', '🧠', '❤️', '🌍', '📈', '🎓',
    '🏋️', '🎨', '🎵', '💡', '🔥', '💎', '👑', '🌟', '🏆', '⚔️', '🛡️', '🌙',
    '☀️', '🌊', '🌿', '🦅', '🦁', '🐉', '💻', '📱', '🎯', '🎪', '🏄', '🎭',
    '📚', '🔬', '🏗️', '🚗', '⛵', '🎸', '🥊', '🧘', '🌺', '🍀', '💫', '🎉'
  ];

  const getColorStyle = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return {
      bg: `rgba(${r},${g},${b},0.1)`,
      border: `rgba(${r},${g},${b},0.3)`,
      text: hex,
      accent: hex,
      glow: `rgba(${r},${g},${b},0.15)`,
    };
  };

  const getActiveCategoriesForModal = (type) => {
    const isYearly = type === 'yearly';
    const overrides = config[isYearly ? 'yearlyDefaultOverrides' : 'monthlyDefaultOverrides'] || {};
    const customKey = isYearly ? 'yearlyCustomCategories' : 'monthlyCustomCategories';

    const buildCat = (id, title, icon, accent) => {
      const ov = overrides[id] || {};
      if (ov.deleted) return null;
      const color = ov.color || accent;
      const cs = getColorStyle(color);
      return { id, title: ov.title || title, emoji: ov.emoji || null, icon: ov.emoji ? null : icon, bg: cs.bg, border: cs.border, text: cs.text };
    };

    const defaults = [
      buildCat('income', 'Ingresos', TrendingUp, '#10b981'),
      buildCat('travel', 'Viajes', Plane, '#0ea5e9'),
      buildCat('family', 'Familia', Home, '#f59e0b'),
      buildCat('personal', 'Personal', Dumbbell, '#8b5cf6'),
    ].filter(Boolean);

    const customs = (config[customKey] || []).map(c => {
      const cs = getColorStyle(c.color || '#10b981');
      return { id: c.id, title: c.title, emoji: c.emoji || '🎯', icon: null, bg: cs.bg, border: cs.border, text: cs.text };
    });

    return [...defaults, ...customs];
  };

  const handleSaveCategory = () => {
    if (!addCatName.trim()) return;
    const cs = getColorStyle(addCatColor);
    const ctx = addCatModal.context; // 'monthly' | 'yearly'
    const customKey = ctx === 'monthly' ? 'monthlyCustomCategories' : 'yearlyCustomCategories';
    const overridesKey = ctx === 'monthly' ? 'monthlyDefaultOverrides' : 'yearlyDefaultOverrides';

    if (addCatModal.editCat) {
      const isDefault = ['income', 'travel', 'family', 'personal'].includes(addCatModal.editCat.id);
      if (isDefault) {
        const overrides = { ...(config[overridesKey] || {}) };
        overrides[addCatModal.editCat.id] = { title: addCatName.trim(), emoji: addCatEmoji, color: addCatColor };
        const nc = { ...config, [overridesKey]: overrides };
        setConfig(nc); saveConfig(nc);
      } else {
        const updated = (config[customKey] || []).map(c =>
          c.id === addCatModal.editCat.id ? { ...c, title: addCatName.trim(), emoji: addCatEmoji, color: addCatColor } : c
        );
        const nc = { ...config, [customKey]: updated };
        setConfig(nc); saveConfig(nc);
      }
    } else {
      const newId = `custom_${ctx}_${Date.now()}`;
      const newCategory = { id: newId, title: addCatName.trim(), emoji: addCatEmoji, color: addCatColor, ...cs };
      const nc = { ...config, [customKey]: [...(config[customKey] || []), newCategory] };
      setConfig(nc); saveConfig(nc);
    }
    setAddCatModal({ show: false, context: 'monthly', editCat: null });
    setAddCatName(''); setAddCatEmoji('🎯'); setAddCatColor('#10b981');
  };

  const handleDeleteCategory = () => {
    const { catId, isDefault, context } = deleteCatModal;
    const ctx = context || 'monthly';
    const customKey = ctx === 'monthly' ? 'monthlyCustomCategories' : 'yearlyCustomCategories';
    const overridesKey = ctx === 'monthly' ? 'monthlyDefaultOverrides' : 'yearlyDefaultOverrides';
    const goalsKey = ctx === 'monthly' ? 'monthlyGoals' : 'yearlyGoals';

    if (isDefault) {
      const overrides = { ...(config[overridesKey] || {}) };
      overrides[catId] = { ...overrides[catId], deleted: true };
      const nc = { ...config, [overridesKey]: overrides, [goalsKey]: config[goalsKey].filter(g => g.category !== catId) };
      setConfig(nc); saveConfig(nc);
    } else {
      const nc = {
        ...config,
        [customKey]: (config[customKey] || []).filter(c => c.id !== catId),
        [goalsKey]: config[goalsKey].filter(g => g.category !== catId),
      };
      setConfig(nc); saveConfig(nc);
    }
    setDeleteCatModal({ show: false, catId: null, catTitle: '', isDefault: false, context: 'monthly' });
  };

  // --- LÓGICA PARA METAS A LARGO PLAZO ---
  const handleSaveLongTermGoal = () => {
    const targetArray = longTermGoalModal.type === 'monthly' ? 'monthlyGoals' : 'yearlyGoals';
    const isNew = !config[targetArray].some(g => g.id === longTermGoalModal.goal.id);

    if (!longTermGoalModal.goal.title.trim()) return;

    const updatedArray = isNew
      ? [...config[targetArray], longTermGoalModal.goal]
      : config[targetArray].map(g => g.id === longTermGoalModal.goal.id ? longTermGoalModal.goal : g);

    const newConfig = { ...config, [targetArray]: updatedArray };
    setConfig(newConfig);
    saveConfig(newConfig);
    setLongTermGoalModal({ show: false, goal: null, type: 'monthly' });
  };

  // --- NUEVO: FUNCIONES DEL GUARDIÁN PSICOLÓGICO PARA METAS ---
  const openGoalPsychoModal = (goal, type) => {
    setGoalPsychoModal({ show: true, goalId: goal.id, type: type, category: goal.category, title: goal.title });
  };

  const handleEvolveGoal = () => {
    // Cierra modal de eliminación y abre el de edición para que lo "mejore"
    const targetArray = goalPsychoModal.type === 'monthly' ? 'monthlyGoals' : 'yearlyGoals';
    const goalToEdit = config[targetArray].find(g => g.id === goalPsychoModal.goalId);

    setGoalPsychoModal({ show: false, goalId: null, type: 'monthly', category: 'income', title: '' });
    if (goalToEdit) {
      setLongTermGoalModal({ show: true, type: goalPsychoModal.type, goal: goalToEdit });
    }
  };

  const handleConfirmKillGoal = () => {
    const targetArray = goalPsychoModal.type === 'monthly' ? 'monthlyGoals' : 'yearlyGoals';
    const updatedArray = config[targetArray].filter(g => g.id !== goalPsychoModal.goalId);
    const newConfig = { ...config, [targetArray]: updatedArray };
    setConfig(newConfig);
    saveConfig(newConfig);
    setGoalPsychoModal({ show: false, goalId: null, type: 'monthly', category: 'income', title: '' });
  };

  // --- NUEVA LÓGICA: ROMPER LÍMITES Y GUARDAR RÉCORDS ---
  const handleBreakLimit = (id, type, currentPct) => {
    const targetArray = type === 'monthly' ? 'monthlyGoals' : 'yearlyGoals';

    // Obtenemos la categoría para lanzar la frase exacta
    const goalToUpdate = config[targetArray].find(g => g.id === id);
    const cat = goalToUpdate.category;

    const updatedArray = config[targetArray].map(g => {
      if (g.id === id) {
        return { ...g, status: 'achieved_early', progress: currentPct, earlyPercentage: currentPct, earlyDate: actualTodayStr };
      }
      return g;
    });
    const newConfig = { ...config, [targetArray]: updatedArray };
    setConfig(newConfig);
    saveConfig(newConfig);

    // Celebración absoluta con frase específica de la categoría
    const catQuotes = strategicCategoryQuotes[cat] || strategicCategoryQuotes.income;
    const quote = catQuotes.early[Math.floor(Math.random() * catQuotes.early.length)];
    setCelebration({ show: true, quote: quote, author: "Sistema Élite", type: 'longTerm', isEarly: true, category: cat });
    setTimeout(() => setCelebration({ show: false, quote: '', author: '', type: 'workTasks', isEarly: false, category: 'income' }), 6000);
  };

  const handleConfirmGoal = (id, type, isSuccess) => {
    const targetArray = type === 'monthly' ? 'monthlyGoals' : 'yearlyGoals';

    const goalToUpdate = config[targetArray].find(g => g.id === id);
    if (!goalToUpdate) return;
    const cat = goalToUpdate.category;

    const updatedArray = config[targetArray].map(g => {
      if (g.id === id) {
        return { ...g, status: isSuccess ? 'achieved' : 'failed' };
      }
      return g;
    });
    // Actualización INSTANTÁNEA del estado local para evitar congelamiento de UI
    const newConfig = { ...config, [targetArray]: updatedArray };
    setConfig(newConfig);
    saveConfig(newConfig);

    if (isSuccess) {
      const catQuotes = strategicCategoryQuotes[cat] || strategicCategoryQuotes.income;
      const quote = catQuotes.success[Math.floor(Math.random() * catQuotes.success.length)];
      setCelebration({ show: true, quote: quote, author: "Sistema Élite", type: 'longTerm', isEarly: false, category: cat });
      setTimeout(() => setCelebration({ show: false, quote: '', author: '', type: 'workTasks', isEarly: false, category: 'income' }), 5000);
    } else {
      const catQuotes = strategicCategoryQuotes[cat] || strategicCategoryQuotes.income;
      const failQuote = catQuotes.fail[Math.floor(Math.random() * catQuotes.fail.length)];
      setFailureModal({ show: true, quote: failQuote, title: "FRACASO ESTRATÉGICO", category: cat });
    }
  };

  // --- NUEVA FUNCIÓN: DETECTAR COLOR INTELIGENTE POR NOMBRE DE CATEGORÍA ---
  const smartCategoryColor = (name) => {
    const n = name.toLowerCase();
    if (/salud|fitness|deporte|cuerpo|gym|ejercicio|yoga/.test(n)) return { bg: 'bg-rose-900/10', border: 'border-rose-500/30', text: 'text-rose-400', accent: '#f43f5e', glow: 'rgba(244,63,94,0.15)', icon: Dumbbell };
    if (/din|ingres|negoc|venta|factura|finanz|plata|diner|invers/.test(n)) return { bg: 'bg-emerald-900/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: '#10b981', glow: 'rgba(16,185,129,0.15)', icon: TrendingUp };
    if (/viaj|libertad|aventur|trip|vuelo|país|mundo|destino/.test(n)) return { bg: 'bg-sky-900/10', border: 'border-sky-500/30', text: 'text-sky-400', accent: '#0ea5e9', glow: 'rgba(14,165,233,0.15)', icon: Plane };
    if (/famil|hijo|pareja|casa|hogar|legado|amor/.test(n)) return { bg: 'bg-amber-900/10', border: 'border-amber-500/30', text: 'text-amber-400', accent: '#f59e0b', glow: 'rgba(245,158,11,0.15)', icon: Home };
    if (/mente|personal|crecer|hábito|medit|libr|aprender|leer|estudi/.test(n)) return { bg: 'bg-violet-900/10', border: 'border-violet-500/30', text: 'text-violet-400', accent: '#8b5cf6', glow: 'rgba(139,92,246,0.15)', icon: Star };
    if (/tec|innov|digit|web|app|software|cod/.test(n)) return { bg: 'bg-cyan-900/10', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: '#06b6d4', glow: 'rgba(6,182,212,0.15)', icon: Radar };
    if (/social|red|comunid|marca|influenc|content/.test(n)) return { bg: 'bg-pink-900/10', border: 'border-pink-500/30', text: 'text-pink-400', accent: '#ec4899', glow: 'rgba(236,72,153,0.15)', icon: Heart };
    if (/espiritualid|paz|zen|alma|espiritu|dios|fe/.test(n)) return { bg: 'bg-teal-900/10', border: 'border-teal-500/30', text: 'text-teal-400', accent: '#14b8a6', glow: 'rgba(20,184,166,0.15)', icon: Compass };
    if (/arte|música|cine|crear|diseñ|creativid/.test(n)) return { bg: 'bg-orange-900/10', border: 'border-orange-500/30', text: 'text-orange-400', accent: '#f97316', glow: 'rgba(249,115,22,0.15)', icon: Rocket };
    // Color por defecto basado en hash del nombre
    const palettes = [
      { bg: 'bg-rose-900/10', border: 'border-rose-500/30', text: 'text-rose-400', accent: '#f43f5e', glow: 'rgba(244,63,94,0.15)', icon: Star },
      { bg: 'bg-teal-900/10', border: 'border-teal-500/30', text: 'text-teal-400', accent: '#14b8a6', glow: 'rgba(20,184,166,0.15)', icon: Compass },
      { bg: 'bg-orange-900/10', border: 'border-orange-500/30', text: 'text-orange-400', accent: '#f97316', glow: 'rgba(249,115,22,0.15)', icon: Rocket },
    ];
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return palettes[hash % palettes.length];
  };

  // --- NUEVA FUNCIÓN: SUBIR IMAGEN A META ---
  const handleGoalImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;

    // Solo permitimos carga dentro del modal de configuración (longTermGoalModal)
    if (longTermGoalModal.show && longTermGoalModal.goal) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX = 900; const scale = Math.min(MAX / img.width, 1);
          canvas.width = img.width * scale; canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.75);

          setLongTermGoalModal(prev => {
            const imgs = prev.goal.images || [];
            if (imgs.length >= 3) return prev;
            return { ...prev, goal: { ...prev.goal, images: [...imgs, base64] } };
          });

          if (goalFileInputRef.current) goalFileInputRef.current.value = '';
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const getModalTheme = () => {
    if (celebration.type === 'longTerm') {
      switch (celebration.category) {
        case 'income': return { color: 'text-emerald-400', glow: 'rgba(16,185,129,0.8)', bg: 'bg-emerald-500', hex: '#10b981', spark: 'spark-emerald', sunburst: 'sunburst-emerald', trophy: 'trophy-emerald' };
        case 'travel': return { color: 'text-blue-400', glow: 'rgba(59,130,246,0.8)', bg: 'bg-blue-500', hex: '#3b82f6', spark: 'spark-blue', sunburst: 'sunburst-blue', trophy: 'trophy-blue' };
        case 'family': return { color: 'text-yellow-400', glow: 'rgba(250,204,21,0.8)', bg: 'bg-yellow-500', hex: '#facc15', spark: 'spark-yellow', sunburst: 'sunburst-yellow', trophy: 'trophy-yellow' };
        case 'personal': return { color: 'text-purple-400', glow: 'rgba(168,85,247,0.8)', bg: 'bg-purple-500', hex: '#a855f7', spark: 'spark-purple', sunburst: 'sunburst-purple', trophy: 'trophy-purple' };
        default: return { color: 'text-blue-400', glow: 'rgba(59,130,246,0.8)', bg: 'bg-blue-500', hex: '#3b82f6', spark: 'spark-blue', sunburst: 'sunburst-blue', trophy: 'trophy-blue' };
      }
    } else {
      return celebration.type === 'workTasks'
        ? { color: 'text-blue-400', glow: 'rgba(59,130,246,0.8)', bg: 'bg-blue-500', hex: '#3b82f6', spark: 'spark-blue', sunburst: 'sunburst-blue', trophy: 'trophy-blue' }
        : { color: 'text-purple-400', glow: 'rgba(168,85,247,0.8)', bg: 'bg-purple-500', hex: '#a855f7', spark: 'spark-purple', sunburst: 'sunburst-purple', trophy: 'trophy-purple' };
    }
  };

  // --- FUNCIÓN: RENDERIZAR MINI CALENDARIO EN MODAL DE META ---
  const renderMiniCalendarSimulator = () => {
    if (!longTermGoalModal.goal?.targetDate || !longTermGoalModal.goal?.startDate) return null;
    const startParts = longTermGoalModal.goal.startDate.split('-');
    const targetParts = longTermGoalModal.goal.targetDate.split('-');
    const tYear = parseInt(targetParts[0], 10);
    const tMonth = parseInt(targetParts[1], 10) - 1;
    const daysInTargetMonth = new Date(tYear, tMonth + 1, 0).getDate();
    const firstDayIndex = new Date(tYear, tMonth, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const calendarGrid = [];
    for (let i = 0; i < startOffset; i++) calendarGrid.push(<div key={`empty-${i}`} className="h-8"></div>);
    for (let d = 1; d <= daysInTargetMonth; d++) {
      const currentDateStr = `${tYear}-${String(tMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isStart = currentDateStr === longTermGoalModal.goal.startDate;
      const isTarget = currentDateStr === longTermGoalModal.goal.targetDate;
      const isInRange = currentDateStr >= longTermGoalModal.goal.startDate && currentDateStr <= longTermGoalModal.goal.targetDate;
      let dayClass = "h-8 md:h-10 flex items-center justify-center rounded-lg text-[10px] md:text-xs font-black transition-all border ";
      if (isStart && isTarget) dayClass += "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.8)] scale-110 z-10 animate-pulse";
      else if (isTarget) dayClass += "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.8)] scale-110 z-10 animate-pulse";
      else if (isStart) dayClass += "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.8)] z-10";
      else if (isInRange) dayClass += "bg-blue-900/40 border-blue-500/50 text-blue-300";
      else dayClass += "bg-[#111] border-[#222] text-[#444]";
      calendarGrid.push(<div key={d} className={dayClass}>{d}</div>);
    }
    return (
      <div className="bg-[#050505] p-5 rounded-2xl border border-[#1E293B] shadow-inner mt-4 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-blue-400 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
            <Radar className="w-4 h-4" /> El Camino a la Conquista ({['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][tMonth]})
          </h4>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2 text-center mb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => <div key={day} className="text-[#666] text-[9px] font-black uppercase">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">{calendarGrid}</div>
      </div>
    );
  };

  const handleAddGuestLocal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const duration = selectedDuration;
      const expiresAt = duration > 0 ? Date.now() + (duration * 24 * 60 * 60 * 1000) : null;
      const newGuest = { email: addGuestForm.email.trim().toLowerCase(), name: addGuestForm.name.trim(), expiresAt };

      if (!newGuest.email || !newGuest.name) {
        setGuestAddedMsg('⚠️ Faltan datos.');
        setTimeout(() => setGuestAddedMsg(''), 3000);
        return;
      }

      const updated = [...allowedUsers.filter(u => u.email !== newGuest.email), newGuest];
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'allowed_users', 'list'), { users: updated }, { merge: true });

      setAddGuestForm({ name: '', email: '' });
      setGuestAddedMsg(`✓ Socio ${newGuest.name} agregado con éxito.`);
      setTimeout(() => setGuestAddedMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setGuestAddedMsg(`❌ Error: ${err.message}`);
      setTimeout(() => setGuestAddedMsg(''), 5000);
    }
  };

  const isTaskScheduledOnDay = (task, dayData, exceptions) => {
    if (!task.activeMonths.includes(dayData.monthIndex)) return false;
    if (!task.isFlexible && (!task.startTime || !task.endTime)) return false;
    if (exceptions[`${dayData.monthIndex}_${task.id}_${dayData.date}`]) return false;
    if (task.taskType === 'specific') return (task.specificDates || []).includes(dayData.dateStr);
    return (task.days || []).includes(dayData.dayIndex) && dayData.dateStr >= task.startDate && (!task.endDate || dayData.dateStr <= task.endDate);
  };

  const checkDayOverlap = (t1, t2) => {
    if (!t1 || !t2) return false;

    // Función táctica para verificar si una tarea realmente está operando en un día exacto, respetando si fue liberada
    const isTaskActiveOnDate = (task, dateStr) => {
      if (task.status === 'archived') return false;
      if (task.cancelledDays && task.cancelledDays.includes(dateStr)) return false; // Si el CEO liberó este día, NO ESTÁ ACTIVA.

      if (task.taskType === 'specific') {
        return (task.specificDates || []).includes(dateStr);
      } else {
        if (dateStr < task.startDate) return false;
        if (task.endDate && dateStr > task.endDate) return false;
        const dayIndex = new Date(dateStr + "T00:00:00").getDay();
        return (task.days || []).includes(dayIndex);
      }
    };

    if (t1.taskType === 'specific' && t2.taskType === 'specific') {
      return (t1.specificDates || []).some(d => isTaskActiveOnDate(t2, d));
    }
    if (t1.taskType === 'specific' && t2.taskType === 'weekly') {
      return (t1.specificDates || []).some(d => isTaskActiveOnDate(t2, d));
    }
    if (t2.taskType === 'specific' && t1.taskType === 'weekly') {
      return (t2.specificDates || []).some(d => isTaskActiveOnDate(t1, d));
    }

    // Si ambas son semanales, chocan si comparten un día de la semana en su patrón base
    const days1 = t1.days || [];
    const days2 = t2.days || [];
    return days1.some(d => days2.includes(d));
  };

  const getTaskOverlaps = (currentTask, allTasks) => {
    if (currentTask.isFlexible) return [];
    const overlaps = [];
    const start1 = timeToMinutes(currentTask.startTime);
    const end1 = timeToMinutes(currentTask.endTime);
    if (start1 >= end1) return [];
    allTasks.forEach(t => {
      if (t.id === currentTask.id || t.status === 'archived' || t.isFlexible) return;
      const start2 = timeToMinutes(t.startTime);
      const end2 = timeToMinutes(t.endTime);
      if (start1 < end2 && end1 > start2 && checkDayOverlap(currentTask, t)) overlaps.push(t);
    });
    return overlaps;
  };

  // Función legada (usada en getTaskOverlaps)
  const checkSlotOverlap = (slotMins, currentTask, allTasks) => {
    if (currentTask.isFlexible) return false;
    return allTasks.some(t => {
      if (t.id === currentTask.id || t.status === 'archived' || t.isFlexible) return false;
      const start2 = timeToMinutes(t.startTime);
      const end2 = timeToMinutes(t.endTime);
      if (!(slotMins < end2 && (slotMins + 30) > start2)) return false;
      return checkDayOverlap(currentTask, t);
    });
  };

  // NUEVA función: detecta colisión cruzada entre tareas Y hábitos
  // Retorna: { isOccupied: bool, type: 'task'|'habit'|null, name: string|null }
  const checkSlotOverlapFull = (slotMins, currentTask, allWorkTasks, allHabits) => {
    if (currentTask.isFlexible) return { isOccupied: false, type: null, name: null };
    const currentCat = editingTask?.category;

    // Revisar colisión en la misma categoría (excluyendo la tarea actual)
    const sameCatTasks = currentCat === 'workTasks' ? allWorkTasks : allHabits;
    const sameHit = sameCatTasks.find(t => {
      if (t.id === currentTask.id || t.status === 'archived' || t.isFlexible) return false;
      const s = timeToMinutes(t.startTime), e = timeToMinutes(t.endTime);
      if (!(slotMins < e && (slotMins + 30) > s)) return false;
      return checkDayOverlap(currentTask, t);
    });
    if (sameHit) {
      return { isOccupied: true, type: currentCat === 'workTasks' ? 'task' : 'habit', name: sameHit.name };
    }

    // Revisar colisión en la categoría opuesta
    const crossCatTasks = currentCat === 'workTasks' ? allHabits : allWorkTasks;
    const crossHit = crossCatTasks.find(t => {
      if (t.status === 'archived' || t.isFlexible) return false;
      const s = timeToMinutes(t.startTime), e = timeToMinutes(t.endTime);
      if (!(slotMins < e && (slotMins + 30) > s)) return false;
      return checkDayOverlap(currentTask, t);
    });
    if (crossHit) {
      return { isOccupied: true, type: currentCat === 'workTasks' ? 'habit' : 'task', name: crossHit.name };
    }

    return { isOccupied: false, type: null, name: null };
  };

  const isDayInBaseSchedule = (task, dayData) => {
    if (!task || !dayData) return false;
    if (!task.activeMonths?.includes(dayData.monthIndex)) return false;
    if (!task.isFlexible && (!task.startTime || !task.endTime)) return false;
    if (task.taskType === 'specific') return (task.specificDates || []).includes(dayData.dateStr);
    return (task.days || []).includes(dayData.dayIndex) && dayData.dateStr >= task.startDate && (!task.endDate || dayData.dateStr <= task.endDate);
  };

  const calculateProgress = (tasksArr, daysDataArr, checksObj = monthlyChecks) => {
    let possible = 0, completed = 0;
    daysDataArr.forEach(dayData => {
      const scheduled = tasksArr.filter(item => isTaskScheduledOnDay(item, dayData, monthlyExceptions));
      possible += scheduled.length;
      completed += scheduled.filter(item => checksObj[`${dayData.monthIndex}_${item.id}_${dayData.date}`]).length;
    });
    return possible === 0 ? null : (completed / possible) * 100;
  };

  const getDayCompletion = (mIdx, dayData, type) => calculateProgress(config[type] || [], [dayData]);

  const getWeeklyWorkProgress = (weekDaysArray, type, checksObj = monthlyChecks) => {
    const workDays = weekDaysArray.filter(d => d.dayIndex !== 0);
    return calculateProgress(config[type] || [], workDays, checksObj);
  };

  const handleTaskPowerToggle = (task) => {
    const isAct = task.status !== 'archived';
    const newItems = config[matrixMode].map(t => t.id === task.id ? { ...t, status: isAct ? 'archived' : 'active', endDate: isAct ? actualTodayStr : null } : t);
    setConfig({ ...config, [matrixMode]: newItems }); // Sincronización instantánea
    saveConfig({ ...config, [matrixMode]: newItems });
  };

  const toggleCheck = (itemId, dayData) => {
    const key = `${dayData.monthIndex}_${itemId}_${dayData.date}`;

    // Bloquear edición en semanas ya cerradas (sábado ya pasó)
    const weekOfDay = calendarWeeks.find(week => week.some(d => d.dateStr === dayData.dateStr));
    if (weekOfDay) {
      const saturday = weekOfDay.find(d => d.dayIndex === 6);
      if (saturday && saturday.dateStr < actualTodayStr) {
        // Semana cerrada: no permitir cambios
        return;
      }
    }

    const isChecking = !monthlyChecks[key];
    const newChecks = { ...monthlyChecks, [key]: isChecking };

    // Actualización inmediata para UX fluida
    setMonthlyChecks(newChecks);
    saveChecksAndExceptions(newChecks, monthlyExceptions);

    if (isChecking) {
      const currentDayPct = calculateProgress(config[matrixMode] || [], [dayData], newChecks);
      let dayPerfect = false;

      if (currentDayPct === 100) {
        dayPerfect = true;
        const isWork = matrixMode === 'workTasks';
        const quotesArray = isWork ? workQuotes : habitQuotes;
        const randomQuote = quotesArray[Math.floor(Math.random() * quotesArray.length)];
        setCelebration({ show: true, quote: randomQuote.q, author: randomQuote.a, type: matrixMode, isEarly: false, category: isWork ? 'income' : 'personal' });
        setTimeout(() => setCelebration({ show: false, quote: '', author: '', type: 'workTasks', isEarly: false, category: 'income' }), 4000);
      }

      const currentWeek = calendarWeeks.find(week => week.some(d => d.dateStr === dayData.dateStr));
      if (currentWeek) {
        const newWeekPct = getWeeklyWorkProgress(currentWeek, matrixMode, newChecks);
        const oldWeekPct = getWeeklyWorkProgress(currentWeek, matrixMode, monthlyChecks);
        if (newWeekPct === 100 && oldWeekPct < 100) {
          const startDayStr = currentWeek[0].dateStr;
          let hash = 0;
          for (let i = 0; i < startDayStr.length; i++) hash = startDayStr.charCodeAt(i) + ((hash << 5) - hash);
          hash = Math.abs(hash) % 10;
          const perfectTier = PERFECT_TIERS[hash];
          const isWork = matrixMode === 'workTasks';
          const quotesArr = isWork ? weeklyWorkQuotes : weeklyHabitQuotes;
          const randomQuote = quotesArr[Math.floor(Math.random() * quotesArr.length)];
          setTimeout(() => {
            setWeeklyCelebration({ show: true, type: matrixMode, tier: perfectTier, quote: randomQuote });
            setTimeout(() => setWeeklyCelebration(prev => ({ ...prev, show: false })), 10000);
          }, dayPerfect ? 4500 : 500);
        }
      }
    }
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("draggedIndex", index);
    // Set a global variable to know what we are holding, avoiding React state latency
    window.__draggedIndex = index;
    setTimeout(() => { e.target.style.opacity = '0.4'; }, 0);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    // Si estamos arrastrando el mismo elemento, no hacer nada
    if (window.__draggedIndex === index || window.__draggedIndex === undefined) return;

    const bounding = e.currentTarget.getBoundingClientRect();
    const offset = bounding.y + (bounding.height / 2);
    // Si el cursor está en la mitad superior de la fila, mostramos el glow arriba, sino abajo
    const direction = e.clientY < offset ? 'up' : 'down';

    // Limpiar a los demás
    document.querySelectorAll('.drag-magnetic-up, .drag-magnetic-down').forEach(el => {
      if (el !== e.currentTarget) {
        el.classList.remove('drag-magnetic-up', 'drag-magnetic-down');
      }
    });

    e.currentTarget.classList.add(direction === 'up' ? 'drag-magnetic-up' : 'drag-magnetic-down');
    e.currentTarget.classList.remove(direction === 'up' ? 'drag-magnetic-down' : 'drag-magnetic-up');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-magnetic-up', 'drag-magnetic-down');
  };

  const handleDrop = (e, targetIndex) => {
    e.currentTarget.classList.remove('drag-magnetic-up', 'drag-magnetic-down');
    const draggedIndex = parseInt(e.dataTransfer.getData("draggedIndex"), 10);
    if (draggedIndex === targetIndex || isNaN(draggedIndex)) return;
    const newArray = [...config[matrixMode]];
    const [draggedItem] = newArray.splice(draggedIndex, 1);
    newArray.splice(targetIndex, 0, draggedItem);
    saveConfig({ ...config, [matrixMode]: newArray });
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    window.__draggedIndex = undefined;
    document.querySelectorAll('.drag-magnetic-up, .drag-magnetic-down').forEach(el => {
      el.classList.remove('drag-magnetic-up', 'drag-magnetic-down');
    });
  };

  const confirmDeleteTask = () => {
    if (!taskDeleteModal.task) return;
    const newArray = config[taskDeleteModal.category].map(t => t.id === taskDeleteModal.task.id ? { ...t, status: 'archived', deletedAt: Date.now() } : t);
    setConfig({ ...config, [taskDeleteModal.category]: newArray }); // Actualización instantánea
    saveConfig({ ...config, [taskDeleteModal.category]: newArray });
    setTaskDeleteModal({ show: false, task: null, category: '' });
  };

  const confirmAdvancedDelete = () => {
    const { task, category, dates } = advancedDeleteModal;
    const newArray = config[category].map(t => t.id === task.id ? { ...t, cancelledDays: dates } : t);
    setConfig({ ...config, [category]: newArray }); // Actualización instantánea
    saveConfig({ ...config, [category]: newArray });
    setAdvancedDeleteModal({ show: false, task: null, category: '', dates: [] });
  };

  const confirmSingleDayCancel = () => {
    const { task, dayData, category } = singleDayCancelModal;
    if (!task || !dayData) return;
    const newArray = config[category].map(t => t.id === task.id ? { ...t, cancelledDays: [...(t.cancelledDays || []), dayData.dateStr] } : t);
    setConfig({ ...config, [category]: newArray }); // Actualización instantánea
    saveConfig({ ...config, [category]: newArray });
    setSingleDayCancelModal({ show: false, task: null, dayData: null, category: '' });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;

    setSyncStatus('saving');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        // Usaremos una resolución alta pero segura para evitar límites de Firestore
        const MAX_WIDTH = 1000;
        const scale = Math.min(MAX_WIDTH / img.width, 1);
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

        // Calidad 0.7 garantiza fotos nítidas pero de bajo peso (Aprox 80-150kb)
        const base64 = canvas.toDataURL('image/jpeg', 0.7);

        let newProfilePic = config.profilePic;
        let newImages = [...(config.images || [])];

        if (activeImageSlot === 'profile') {
          newProfilePic = base64;
        } else if (activeImageSlot === 'new') {
          newImages.push(base64);
        } else if (activeImageSlot !== null) {
          newImages[activeImageSlot] = base64;
        }

        setConfig(prev => ({ ...prev, profilePic: newProfilePic, images: newImages }));

        // Guardamos las fotos en un documento SEPARADO para no colapsar el archivo de config de 1MB
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_images', session.uid), {
            profilePic: newProfilePic,
            images: newImages
          }, { merge: true });

          setActiveImageSlot(null);
          setSyncStatus('success');
          setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (error) {
          console.error("Error guardando imagen en base de datos", error);
          setSyncStatus('idle');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const openImageModal = (index) => {
    setImgPsychoQuoteIdx(Math.floor(Math.random() * imagePsychoQuotes.length));
    setImageActionModal({ show: true, index });
  };

  const handleConfirmImageEvolve = () => {
    const realIndex = imageActionModal.index % config.images.length;
    setActiveImageSlot(realIndex);
    setImageActionModal({ show: false, index: null });
    setTimeout(() => fileInputRef.current.click(), 100);
  };

  const handleConfirmImageKill = async () => {
    const realIndex = imageActionModal.index % config.images.length;
    const newImages = [...config.images];
    newImages.splice(realIndex, 1);

    setConfig(prev => ({ ...prev, images: newImages }));
    setImageActionModal({ show: false, index: null });

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_images', session.uid), {
        images: newImages
      }, { merge: true });
    } catch (error) {
      console.error("Error eliminando imagen en base de datos", error);
    }
  };

  const handleTimeChange = (field, type, value) => {
    if (!editingTask) return;
    const parsed = to12h(editingTask.task[field] || '12:00');
    if (type === 'h12') { let n = parseInt(value, 10); parsed.h12 = isNaN(n) ? '' : Math.min(n, 12).toString(); }
    else if (type === 'm') { let n = parseInt(value, 10); parsed.m = isNaN(n) ? '' : Math.min(n, 59).toString().padStart(2, '0'); }
    else parsed.ampm = value;
    const n24 = to24h(parsed.h12 || '12', parsed.m || '00', parsed.ampm);
    setEditingTask({ ...editingTask, task: { ...editingTask.task, [field]: n24 } });
  };

  const setExactTime = (field, h12, m, ampm) => {
    const n24 = to24h(h12, m, ampm);
    setEditingTask(prev => ({ ...prev, task: { ...prev.task, [field]: n24 } }));
  };

  const saveConfiguredTask = () => {
    const { task, category } = editingTask;
    const overlaps = getTaskOverlaps(task, config[category]);
    if (!task.name.trim() || overlaps.length > 0) return;
    if (!task.isFlexible && timeToMinutes(task.startTime) >= timeToMinutes(task.endTime)) return;
    const isNew = !config[category].some(t => t.id === task.id);
    const newItems = isNew ? [...config[category], task] : config[category].map(t => t.id === task.id ? task : t);
    setConfig({ ...config, [category]: newItems }); // Sincronización instantánea
    saveConfig({ ...config, [category]: newItems });
    setEditingTask(null);
    setActiveTimeTab(null);
  };

  const handlePrevTime = () => {
    if (viewScope === 'day') { if (currentDayIdx > 0) setCurrentDayIdx(p => p - 1); }
    else if (viewScope === 'week') { if (currentWeekIdx > 0) setCurrentWeekIdx(p => p - 1); }
    else if (viewScope === 'year') { setSelectedYear(y => y - 1); }
    else { if (selectedMonthIndex === 0) { setSelectedMonthIndex(11); setSelectedYear(y => y - 1); } else setSelectedMonthIndex(m => m - 1); }
  };

  const handleNextTime = () => {
    if (viewScope === 'day') { if (currentDayIdx < daysArrayMonth.length - 1) setCurrentDayIdx(p => p + 1); }
    else if (viewScope === 'week') { if (currentWeekIdx < calendarWeeks.length - 1) setCurrentWeekIdx(p => p + 1); }
    else if (viewScope === 'year') { setSelectedYear(y => y + 1); }
    else { if (selectedMonthIndex === 11) { setSelectedMonthIndex(0); setSelectedYear(y => y + 1); } else setSelectedMonthIndex(m => m + 1); }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email.toLowerCase();
      const userName = result.user.displayName || 'Socio Élite';

      let sessionData = null;

      // Verificamos si es ADMIN (El CEO)
      if (userEmail === 'cliverdair25@gmail.com' || userEmail === 'cliverdair@gmail.com') {
        sessionData = { isLoggedIn: true, role: 'admin', email: userEmail, name: userName, uid: 'admin_dair' };
      } else {
        // Si no es admin, verificamos en allowedUsers
        const allowedUser = allowedUsers.find(u => u.email.trim().toLowerCase() === userEmail);
        if (allowedUser) {
          if (allowedUser.expiresAt && allowedUser.expiresAt < Date.now()) {
            setLoginError('ACCESO DENEGADO. Tu tiempo en la red Élite ha expirado.');
            return;
          }
          sessionData = { isLoggedIn: true, role: 'guest', email: userEmail, name: allowedUser.name || userName, uid: userEmail.replace(/\./g, '_') };
        } else {
          setLoginError('⚠️ ALERTA DE SEGURIDAD. Sistema vigilado. Este correo de Google no tiene autorización de ingreso.');
          return;
        }
      }

      sessionData.lastLogin = Date.now();
      setSession(sessionData);
      localStorage.setItem('eliteSession', JSON.stringify(sessionData));

      if (sessionData.role === 'admin') {
        setLoginSuccessMsg('BIENVENIDO DE VUELTA, CEO.');
      } else {
        setLoginSuccessMsg(`ACCESO CONCEDIDO, ${sessionData.name.toUpperCase()}.`);
      }
      setTimeout(() => setLoginSuccessMsg(''), 4000);

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('Autenticación cancelada. Debes acceder con Google para entrar.');
      } else {
        setLoginError('Error al conectar con Google. Verifica tu conexión e intenta de nuevo.');
      }
    }
  };

  const getVisibleDays = () => {
    if (viewScope === 'day') return [paddedMonthDays[currentDayIdx] || paddedMonthDays[0]];
    if (viewScope === 'week') return calendarWeeks[currentWeekIdx] || calendarWeeks[0];
    if (viewScope === 'year') return yearDaysArray;
    if (viewScope === 'custom') return yearDaysArray.filter(d => customSelectedDates.includes(d.dateStr));
    return paddedMonthDays;
  };

  const visibleDaysArray = getVisibleDays();
  const globalProgress = calculateProgress(config[matrixMode] || [], visibleDaysArray);
  const visibleTasksFinal = (config[matrixMode] || []).filter(t => taskStatusFilter === 'all' || (taskStatusFilter === 'active' ? t.status !== 'archived' : t.status === 'archived'));

  const navTitleText = useMemo(() => {
    if (viewScope === 'day') return `${visibleDaysArray[0]?.date} ${monthNames[selectedMonthIndex]}`;
    if (viewScope === 'week') return `SEM. ${currentWeekIdx + 1} - ${monthShort[selectedMonthIndex]}`;
    if (viewScope === 'year') return `AÑO ${selectedYear}`;
    return monthNames[selectedMonthIndex];
  }, [viewScope, selectedMonthIndex, selectedYear, currentWeekIdx, visibleDaysArray]);

  const chartData = useMemo(() => {
    return visibleDaysArray.map(dayData => {
      const pct = calculateProgress(config[matrixMode] || [], [dayData]);
      return { dia: dayData.date, valor: Math.round(pct || 0) };
    });
  }, [visibleDaysArray, config, monthlyChecks, monthlyExceptions, matrixMode]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#02040A] flex flex-col items-center justify-center font-sans">
        <SystemLogo size="large" />
        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mt-6 animate-pulse">Desencriptando Acceso Élite...</p>
      </div>
    );
  }

  if (!session.isLoggedIn) {

    return (
      <div className="min-h-screen bg-[#02040A] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(15,23,42,0.8)_0%,_rgba(2,4,10,1)_80%)]"></div>

        <div className="bg-[#0A0F1C]/80 backdrop-blur-md border border-[#1E293B] rounded-[2rem] p-10 md:p-14 w-full max-w-[440px] z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center animate-in zoom-in duration-500 relative">

          <SystemLogo size="large" />

          <h1 className="text-[32px] font-black text-white uppercase tracking-tighter leading-none mb-2">CEO</h1>
          <h2 className="text-[32px] font-black text-blue-500 uppercase tracking-tighter leading-none premium-glow mb-2">MASTERPLAN</h2>
          <p className="text-[#64748B] text-[9px] font-black uppercase tracking-[0.2em] mb-8">Planificador Táctico & Tracker</p>

          <div className="mb-8 min-h-[60px] flex items-center justify-center">
            <p key={loginQuoteIdx} className="text-[#94A3B8] text-[10px] uppercase font-bold tracking-widest leading-relaxed animate-in fade-in zoom-in duration-700">
              "{loginMasterQuotes[loginQuoteIdx]}"
            </p>
          </div>

          <div className="flex flex-col gap-4 relative z-20">
            {loginError && <p className="text-red-400 text-xs font-bold bg-red-900/20 p-3 rounded-lg border border-red-500/30 text-center uppercase tracking-widest">{loginError}</p>}

            <button onClick={handleGoogleLogin} className="w-full py-4 mt-2 font-black uppercase text-xs tracking-widest rounded-xl transition-all duration-500 flex items-center justify-center gap-3 bg-white text-[#111] shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-gray-100 hover:scale-105 active:scale-95 border border-white/50 group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C12 5.38 12.25 12.25 12 5.38z" />
              </svg>
              Validar Identidad con Google
            </button>

            <p className="text-center text-[10px] text-[#64748B] font-bold uppercase tracking-widest mt-2">
              Sistema restringido. Ingreso exclusivo mediante whitelist.
            </p>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes border-pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); border-color: rgba(59,130,246,0.5); }
            70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); border-color: rgba(30,41,59,1); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); border-color: rgba(30,41,59,1); }
          }
          .premium-pulse { animation: border-pulse 3s infinite; }
          .premium-glow { filter: drop-shadow(0 0 15px rgba(59,130,246,0.8)); }
        `}} />
      </div>
    );
  }

  if (session.isLoggedIn && !isConfigLoaded) {
    return (
      <div className="min-h-screen bg-[#02040A] flex flex-col items-center justify-center font-sans">
        <SystemLogo size="large" />
        <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mt-6 animate-pulse">Sincronizando Arsenal Táctico...</p>
      </div>
    );
  }

  // --- 2. PANTALLA ONBOARDING MULTI-PASO (TUTORIAL OFICIAL) ---
  if (isPendingOnboarding) {
    const isOnboardingReady = onboardingData.q1.trim() && onboardingData.q2.trim() && onboardingData.q3.trim();

    return (
      <div className="min-h-screen bg-[#02040A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(15,23,42,1)_0%,_rgba(2,4,10,1)_100%)]"></div>

        <div className="bg-[#0A0F1C]/95 border border-blue-500/30 rounded-[2rem] p-6 md:p-14 w-full max-w-5xl z-10 shadow-[0_0_100px_rgba(59,130,246,0.15)] relative animate-in fade-in slide-in-from-bottom-10 duration-700 max-h-[95vh] overflow-y-auto custom-scrollbar">

          {onboardingStep === 0 && (
            <div className="text-center animate-in zoom-in-95 duration-500">
              <SystemLogo size="large" />
              <h2 className="text-blue-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Iniciación Élite</h2>
              <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6 leading-tight">
                BIENVENIDO A TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">NUEVA VIDA</span>
              </h1>
              <p className="text-[#888] text-sm md:text-lg max-w-3xl mx-auto leading-relaxed font-bold uppercase tracking-widest mb-6">
                "Olvida las hojas de Excel aburridas y las agendas inútiles. Esta es tu central de mando definitiva."
              </p>
              <p className="text-[#64748B] text-sm md:text-base max-w-4xl mx-auto leading-relaxed font-medium mb-12">
                Aquí no vienes a "anotar cositas". Vienes a blindar tus hábitos, estructurar tu imperio, y medir tu facturación con precisión táctica. Tus sueños, tus ingresos, y tus sacrificios quedarán registrados y protegidos en este ecosistema. ¿Estás listo para dejar de ser un amateur?
              </p>

              <div className="flex gap-4 max-w-md mx-auto">
                <button onClick={handleSkipOnboardingStep} className="flex-1 py-4 border border-[#1E293B] text-[#64748B] font-black uppercase text-xs rounded-xl hover:text-white transition-colors">Omitir Todo</button>
                <button onClick={handleNextOnboardingStep} className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-xs rounded-xl hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)]">Entendido, Avanzar</button>
              </div>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="text-center animate-in slide-in-from-right-10 duration-500">
              <h2 className="text-amber-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Paso 1: Tus Metas de Vida</h2>
              <div className="w-16 h-16 bg-amber-900/20 mx-auto rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30">
                <ImagePlus className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
                VISIÓN GLOBAL Y PLANIFICACIÓN
              </h1>
              <p className="text-[#64748B] text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium mb-10">
                La plataforma cuenta con un panel "Visión Global" donde podrás cargar las imágenes de aquello que te inspira: la casa de tus sueños, el viaje de tu vida, o el auto que quieres. Esto anclará visualmente por qué trabajas tan duro todos los días. Además, podrás planificar metas mensuales y anuales con barras de progreso automáticas.
              </p>

              <div className="flex gap-4 max-w-md mx-auto">
                <button onClick={handleSkipOnboardingStep} className="flex-1 py-4 border border-[#1E293B] text-[#64748B] font-black uppercase text-xs rounded-xl hover:text-white transition-colors">Omitir</button>
                <button onClick={handleNextOnboardingStep} className="flex-1 py-4 bg-amber-600 text-white font-black uppercase text-xs rounded-xl hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)]">Siguiente</button>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="text-center animate-in slide-in-from-right-10 duration-500">
              <h2 className="text-blue-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Paso 2: Operaciones Tácticas</h2>
              <div className="w-16 h-16 bg-blue-900/20 mx-auto rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
                <Activity className="w-8 h-8 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
                TAREAS DE IMPACTO VS HÁBITOS
              </h1>
              <p className="text-[#64748B] text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium mb-10">
                Separamos el ruido de la ejecución pura. Las <strong>Tareas de Impacto</strong> son acciones únicas o recurrentes (como "Grabar embudo de ventas"). Los <strong>Hábitos de Hierro</strong> son rutinas inflexibles (como "Gimnasio 6AM"). Podrás asignarles un valor económico ($) si generan dinero, midiendo tu facturación mensual automáticamente.
              </p>

              <div className="flex gap-4 max-w-md mx-auto">
                <button onClick={handleSkipOnboardingStep} className="flex-1 py-4 border border-[#1E293B] text-[#64748B] font-black uppercase text-xs rounded-xl hover:text-white transition-colors">Omitir</button>
                <button onClick={handleNextOnboardingStep} className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-xs rounded-xl hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)]">Siguiente</button>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="text-center animate-in slide-in-from-right-10 duration-500">
              <h2 className="text-rose-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Paso 3: El Látigo Mental</h2>
              <div className="w-16 h-16 bg-rose-900/20 mx-auto rounded-2xl flex items-center justify-center mb-6 border border-rose-500/30">
                <ShieldAlert className="w-8 h-8 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
                MOTOR PSICOLÓGICO
              </h1>
              <p className="text-[#64748B] text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium mb-10">
                El cerebro es perezoso y buscará excusas. Cuando canceles un hábito o una tarea sin un buen motivo, el sistema te castigará recordándote tus miedos más profundos. Y cuando cumplas como una máquina, te celebrará. Esto forjará una disciplina inquebrantable a base de recompensas y dolor psicológico.
              </p>

              <div className="flex gap-4 max-w-md mx-auto">
                <button onClick={handleSkipOnboardingStep} className="flex-1 py-4 border border-[#1E293B] text-[#64748B] font-black uppercase text-xs rounded-xl hover:text-white transition-colors">Omitir</button>
                <button onClick={handleNextOnboardingStep} className="flex-1 py-4 bg-rose-600 text-white font-black uppercase text-xs rounded-xl hover:bg-rose-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)]">Siguiente</button>
              </div>
            </div>
          )}

          {onboardingStep === 4 && (
            <div className="text-center animate-in slide-in-from-right-10 duration-500">
              <h2 className="text-emerald-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Paso 4: Hackeando el Sistema</h2>
              <div className="w-16 h-16 bg-emerald-900/20 mx-auto rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
                <Trophy className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
                RÉCORDS TEMPRANOS
              </h1>
              <p className="text-[#64748B] text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium mb-10">
                Si tienes una meta de leer 12 libros en el año, y logras leer 12 libros en Febrero... ¡Has destrozado los límites! El sistema detectará tu Récord Temprano, te coronará con una medalla dorada, y dejará grabada la fecha de tu victoria prematura. El objetivo siempre es vencer al tiempo.
              </p>

              <div className="flex gap-4 max-w-md mx-auto">
                <button onClick={handleSkipOnboardingStep} className="flex-1 py-4 border border-[#1E293B] text-[#64748B] font-black uppercase text-xs rounded-xl hover:text-white transition-colors">Omitir</button>
                <button onClick={handleNextOnboardingStep} className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase text-xs rounded-xl hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]">Siguiente</button>
              </div>
            </div>
          )}

          {onboardingStep === 5 && (
            <div className="text-center animate-in slide-in-from-right-10 duration-500">
              <h2 className="text-purple-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Paso 5: Jerarquía de Rangos</h2>
              <div className="w-16 h-16 bg-purple-900/20 mx-auto rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30">
                <Crown className="w-8 h-8 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
                ESCALA HACIA LA CIMA
              </h1>
              <p className="text-[#64748B] text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium mb-10">
                Cada semana el algoritmo analizará tu porcentaje de disciplina. Si alcanzas más del 80%, empezarás a subir de rango: desde Rango F (Mediocre) hasta Rango S+ (Emperador). Tu rango determinará tu nivel de ejecución.
              </p>

              <div className="flex gap-4 max-w-md mx-auto">
                <button onClick={handleSkipOnboardingStep} className="flex-1 py-4 border border-[#1E293B] text-[#64748B] font-black uppercase text-xs rounded-xl hover:text-white transition-colors">Omitir</button>
                <button onClick={handleNextOnboardingStep} className="flex-1 py-4 bg-purple-600 text-white font-black uppercase text-xs rounded-xl hover:bg-purple-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]">Comenzar Ritual Final</button>
              </div>
            </div>
          )}

          {onboardingStep === 6 && (
            <div className="animate-in zoom-in-95 duration-500">
              <div className="text-center mb-8">
                <SystemLogo size="small" />
                <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 mt-4">
                  DEFINE TUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-rose-500">MOTORES INICIALES</span>
                </h1>
                <p className="text-[#64748B] text-sm uppercase tracking-widest font-black mb-2">Responde con la verdad cruda.</p>
              </div>

              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-[#02040A] border border-[#1E293B] focus-within:border-yellow-500/50 p-6 rounded-2xl transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] focus-within:shadow-[0_0_20px_rgba(234,179,8,0.15)] relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
                  <label className="text-[10px] text-yellow-400 uppercase font-black tracking-widest mb-3 flex items-center gap-2 drop-shadow-md">
                    <Crown className="w-5 h-5" /> 1. Tu Meta Principal (El gran número o logro)
                  </label>
                  <textarea
                    value={onboardingData.q1} onChange={e => setOnboardingData({ ...onboardingData, q1: e.target.value })}
                    placeholder={onboardingData.q1 ? '' : twQ1}
                    className="w-full bg-transparent border-none text-white outline-none text-sm placeholder:text-[#334155] resize-none h-16 font-bold"
                  />
                </div>

                <div className="bg-[#02040A] border border-[#1E293B] focus-within:border-emerald-500/50 p-6 rounded-2xl transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] focus-within:shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden group mt-6">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                  <label className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-3 flex items-center gap-2 drop-shadow-md">
                    <Heart className="w-5 h-5" /> 2. ¿Por quién o qué te vas a sacrificar?
                  </label>
                  <textarea
                    value={onboardingData.q2} onChange={e => setOnboardingData({ ...onboardingData, q2: e.target.value })}
                    placeholder={onboardingData.q2 ? '' : twQ2}
                    className="w-full bg-transparent border-none text-white outline-none text-sm placeholder:text-[#334155] resize-none h-16 font-bold"
                  />
                </div>

                <div className="bg-[#02040A] border border-[#1E293B] focus-within:border-rose-500/50 p-6 rounded-2xl transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] focus-within:shadow-[0_0_20px_rgba(244,63,94,0.15)] relative overflow-hidden group mt-6">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-400 to-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
                  <label className="text-[10px] text-rose-500 uppercase font-black tracking-widest mb-3 flex items-center gap-2 drop-shadow-md">
                    <Flame className="w-5 h-5" /> 3. Tu razón para NO rendirte (Tu miedo más grande)
                  </label>
                  <textarea
                    value={onboardingData.q3} onChange={e => setOnboardingData({ ...onboardingData, q3: e.target.value })}
                    placeholder={onboardingData.q3 ? '' : twQ3}
                    className="w-full bg-transparent border-none text-white outline-none text-sm placeholder:text-[#334155] resize-none h-16 font-bold"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveOnboarding}
                disabled={!isOnboardingReady}
                className={`w-full max-w-3xl mx-auto py-5 mt-10 font-black uppercase text-sm tracking-widest rounded-xl transition-all duration-500 flex items-center justify-center gap-2 ${isOnboardingReady ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:bg-blue-500 active:scale-95' : 'bg-[#1E293B] text-[#64748B] cursor-not-allowed'}`}
              >
                <Lock className="w-5 h-5" /> Sellar Pacto de Sangre e Ingresar
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }


  // --- 4. APLICACIÓN PRINCIPAL ---
  // Variables derivadas necesarias para el modal de edición de tareas
  const isEditingNameEmpty = editingTask ? !editingTask.task.name.trim() : false;
  const placeholderText = editingTask?.category === 'workTasks' ? twWorkTask : twHabitTask;
  const allActiveUniversalTasks = editingTask ? (config[editingTask.category] || []) : [];
  // Para colisión cruzada entre negocios y hábitos
  const allWorkTasksForCollision = config.workTasks || [];
  const allHabitsForCollision = config.habits || [];
  const currentEditingOverlaps = editingTask && !editingTask.task.isFlexible ? getTaskOverlaps(editingTask.task, allActiveUniversalTasks) : [];
  const isEditingValid = editingTask && !isEditingNameEmpty && currentEditingOverlaps.length === 0 && (editingTask.task.isFlexible || timeToMinutes(editingTask.task.startTime) < timeToMinutes(editingTask.task.endTime));
  const startMinsGlobal = editingTask && !editingTask.task.isFlexible ? timeToMinutes(editingTask.task.startTime) : 0;
  const endMinsGlobal = editingTask && !editingTask.task.isFlexible ? timeToMinutes(editingTask.task.endTime) : 0;
  const radarTasks = editingTask && !editingTask.task.isFlexible
    ? allActiveUniversalTasks.filter(t => t.id !== editingTask.task.id && !t.isFlexible && checkDayOverlap(editingTask.task, t))
    : [];
  // --- VISTA: PAPELERA MAESTRA ---
  const renderPapelera = () => {
    const deletedWorkTasks = (config.workTasks || []).filter(t => t.status === 'archived').map(t => ({ ...t, _type: 'workTasks' }));
    const deletedHabits = (config.habits || []).filter(t => t.status === 'archived').map(t => ({ ...t, _type: 'habits' }));
    const deletedMaintenance = (config.maintenanceTasks || []).filter(t => t.status === 'archived').map(t => ({ ...t, _type: 'maintenanceTasks' }));
    const deletedMonthlyGoals = (config.monthlyGoals || []).filter(g => g.status === 'deleted').map(g => ({ ...g, _type: 'monthlyGoals' }));
    const deletedYearlyGoals = (config.yearlyGoals || []).filter(g => g.status === 'deleted').map(g => ({ ...g, _type: 'yearlyGoals' }));
    const deletedImages = (config.images || []).filter(i => typeof i === 'object' && i.deleted).map(i => ({ ...i, _type: 'images' }));

    const dMonthlyOverrides = Object.entries(config.monthlyDefaultOverrides || {}).filter(([k, v]) => v.deleted).map(([k, v]) => ({ ...v, id: k, _type: 'monthlyDefaultOverrides' }));
    const dYearlyOverrides = Object.entries(config.yearlyDefaultOverrides || {}).filter(([k, v]) => v.deleted).map(([k, v]) => ({ ...v, id: k, _type: 'yearlyDefaultOverrides' }));
    const dMonthlyCustom = (config.monthlyCustomCategories || []).filter(c => c.deleted).map(c => ({ ...c, _type: 'monthlyCustomCategories' }));
    const dYearlyCustom = (config.yearlyCustomCategories || []).filter(c => c.deleted).map(c => ({ ...c, _type: 'yearlyCustomCategories' }));

    const dMotives = (config.deletedMotives || []).map(m => ({ ...m, _type: 'motives' }));

    const allDeleted = [...deletedWorkTasks, ...deletedHabits, ...deletedMaintenance, ...deletedMonthlyGoals, ...deletedYearlyGoals, ...deletedImages, ...dMonthlyOverrides, ...dYearlyOverrides, ...dMonthlyCustom, ...dYearlyCustom, ...dMotives];
    allDeleted.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

    const handleRestore = (item) => {
      if (['workTasks', 'habits', 'maintenanceTasks', 'monthlyGoals', 'yearlyGoals', 'monthlyCustomCategories', 'yearlyCustomCategories'].includes(item._type)) {
        const arr = config[item._type].map(x => {
          if (x.id === item.id) {
            const { _type, deleted, deletedAt, ...rest } = x;
            if (item._type.includes('Goals')) rest.status = 'active';
            else if (item._type.includes('CustomCategories')) {
              // remove deleted property completely
            }
            else rest.status = 'active';
            return rest;
          }
          return x;
        });
        if (item._type.includes('CustomCategories')) {
          const fix = config[item._type].map(x => x.id === item.id ? { ...x, deleted: false, deletedAt: null } : x);
          setConfig({ ...config, [item._type]: fix }); saveConfig({ ...config, [item._type]: fix });
        } else {
          setConfig({ ...config, [item._type]: arr }); saveConfig({ ...config, [item._type]: arr });
        }
      } else if (item._type === 'images') {
        const arr = config.images.map(i => typeof i === 'object' && i.id === item.id ? i.src : i);
        setConfig({ ...config, images: arr }); saveConfig({ ...config, images: arr });
      } else if (['monthlyDefaultOverrides', 'yearlyDefaultOverrides'].includes(item._type)) {
        const overrides = { ...config[item._type] };
        if (overrides[item.id]) overrides[item.id].deleted = false;
        setConfig({ ...config, [item._type]: overrides }); saveConfig({ ...config, [item._type]: overrides });
      } else if (item._type === 'motives') {
        // Restaurar un motor es complejo si ya hay uno activo, pero podemos simplemente ponerlo en el activo y quitarlo de eliminados
        const newArr = config.deletedMotives.filter(m => m.id !== item.id);
        setConfig({ ...config, deletedMotives: newArr, motives: { q1: item.q1, q2: item.q2, q3: item.q3 }, motivesLocked: true });
        saveConfig({ ...config, deletedMotives: newArr, motives: { q1: item.q1, q2: item.q2, q3: item.q3 }, motivesLocked: true });
      }
    };

    const handleDestroy = (item) => {
      if (['workTasks', 'habits', 'maintenanceTasks', 'monthlyGoals', 'yearlyGoals', 'monthlyCustomCategories', 'yearlyCustomCategories'].includes(item._type)) {
        const arr = config[item._type].filter(x => x.id !== item.id);
        setConfig({ ...config, [item._type]: arr }); saveConfig({ ...config, [item._type]: arr });
      } else if (item._type === 'images') {
        const arr = config.images.filter(i => !(typeof i === 'object' && i.id === item.id));
        setConfig({ ...config, images: arr }); saveConfig({ ...config, images: arr });
      } else if (['monthlyDefaultOverrides', 'yearlyDefaultOverrides'].includes(item._type)) {
        const overrides = { ...config[item._type] };
        delete overrides[item.id];
        setConfig({ ...config, [item._type]: overrides }); saveConfig({ ...config, [item._type]: overrides });
      } else if (item._type === 'motives') {
        const arr = config.deletedMotives.filter(m => m.id !== item.id);
        setConfig({ ...config, deletedMotives: arr }); saveConfig({ ...config, deletedMotives: arr });
      }
    };

    const formatItemName = (item) => {
      if (item._type === 'motives') return "Motor: " + item.q1;
      if (item._type === 'images') return "Imagen del Vision Board";
      return item.name || item.title || item.goal || "Elemento Sin Nombre";
    };

    const getTypeLabel = (type) => {
      if (type === 'workTasks') return 'Negocios';
      if (type === 'habits') return 'Hábitos';
      if (type === 'maintenanceTasks') return 'Mantenimiento';
      if (type === 'monthlyGoals') return 'Meta Mensual';
      if (type === 'yearlyGoals') return 'Meta Anual';
      if (type.includes('Categories') || type.includes('Overrides')) return 'Pilar / Categoría';
      if (type === 'images') return 'Imagen Vision Board';
      if (type === 'motives') return 'Motor Psicológico';
      return type;
    };

    return (
      <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-500">
        <div className="text-center mb-10 mt-6">
          <h2 className="text-4xl md:text-6xl font-black text-red-500 uppercase tracking-tighter drop-shadow-md flex items-center justify-center gap-4">
            <Trash2 className="w-12 h-12" /> Papelera de Operaciones
          </h2>
          <p className="text-red-400 text-xs md:text-sm font-black uppercase tracking-widest mt-4 bg-red-900/10 inline-block px-5 py-2 rounded-full border border-red-500/20 shadow-inner">
            "Todo lo que se elimina aquí desaparece permanentemente después de 30 días."
          </p>
        </div>

        <div className="bg-[#050505] p-6 rounded-3xl border border-[#222] shadow-2xl min-h-[50vh]">
          {allDeleted.length === 0 ? (
            <div className="py-20 text-center text-[#555] font-black uppercase tracking-widest">
              La papelera está completamente vacía
            </div>
          ) : (
            <div className="space-y-4">
              {allDeleted.map(t => (
                <div key={t.id || Math.random()} className="bg-[#0a0a0a] border border-[#222] p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
                  <div className="flex items-center gap-4 overflow-hidden w-full">
                    {t._type === 'images' && (
                      <img src={t.src} alt="Eliminada" className="w-16 h-16 object-cover rounded-xl grayscale opacity-70" />
                    )}
                    <div className="overflow-hidden">
                      <h4 className="text-white font-black text-lg md:text-xl truncate">{formatItemName(t)}</h4>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[#666] text-[10px] uppercase font-bold bg-[#111] px-2 py-1 rounded-md">{getTypeLabel(t._type)}</span>
                        <span className="text-[#444] text-[9px] uppercase font-bold">Eliminado: {t.deletedAt ? new Date(t.deletedAt).toLocaleDateString() : 'Desconocido'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                    <button onClick={() => handleRestore(t)} className="flex-1 md:flex-none px-6 py-3 bg-[#111] hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 border border-[#222] hover:border-emerald-500 shadow-lg"><RefreshCcw className="w-4 h-4" /> Restaurar</button>
                    <button onClick={() => handleDestroy(t)} className="flex-1 md:flex-none px-6 py-3 bg-red-900/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 border border-red-900/30 hover:border-red-500 shadow-lg"><X className="w-4 h-4" /> Destruir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  const themeModal = getModalTheme();

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans p-4 relative overflow-x-hidden">

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
      <input type="file" accept="image/*" ref={goalFileInputRef} onChange={handleGoalImageUpload} className="hidden" />

      {/* HEADER SUPREMO */}
      <header className="max-w-[1800px] mx-auto mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111] border border-[#222] p-6 pt-14 md:pt-6 rounded-3xl shadow-xl relative z-50 overflow-visible">

        {/* CENTER LOGO (Order 1 on mobile) */}
        <div className="order-1 md:order-none md:absolute md:left-1/2 md:-translate-x-1/2 flex flex-col items-center pointer-events-none z-10 text-center w-full mb-2 md:mb-0">
          <div className="flex items-center gap-2 md:gap-3">
            <SystemLogo size="small" />
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg">CEO<span className="text-blue-500 premium-glow">MasterPlan</span></h1>
          </div>
          <p className="text-blue-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1 drop-shadow-md">Planificador Táctico & Tracker</p>
        </div>

        {/* PROFILE AND BUTTONS ROW (Order 2 on mobile) */}
        <div className="order-2 md:order-none w-full md:w-auto relative flex items-center justify-between md:justify-start mt-4 md:mt-0 z-20">

          {/* MOBILE LEFT BUTTON (Sync) */}
          <div className="md:hidden flex items-center z-50">
            <button
              onClick={handleForceSync}
              disabled={syncStatus === 'saving'}
              className={`flex items-center justify-center p-2.5 rounded-xl transition-all shadow-lg border ${syncStatus === 'success' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50' :
                syncStatus === 'saving' ? 'bg-blue-900/40 text-blue-400 border-blue-500/50 cursor-wait' :
                  'bg-[#111] text-[#888] border-[#333] hover:border-blue-500 hover:text-blue-400 active:scale-95'
                }`}
            >
              {syncStatus === 'saving' ? <CloudUpload className="w-5 h-5 animate-pulse" /> :
                syncStatus === 'success' ? <Check className="w-5 h-5 text-emerald-400" /> :
                  <CloudUpload className="w-5 h-5" />}
            </button>
          </div>

          {/* PROFILE CENTER */}
          <div className="flex flex-col md:flex-row items-center gap-4 mx-auto md:mx-0">
            <div className="relative w-16 h-16 md:w-20 md:h-20 group shrink-0">
              <div className="absolute -inset-1.5 rounded-2xl md:rounded-3xl border border-blue-500/30 border-t-blue-400 border-b-cyan-300 animate-[spin_8s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute -inset-2.5 rounded-3xl md:rounded-[2rem] border border-transparent border-r-purple-500/40 border-l-blue-500/40 animate-[spin_12s_linear_infinite_reverse] opacity-40 group-hover:opacity-80 transition-opacity"></div>

              <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-black border border-[#333] overflow-hidden flex items-center justify-center">
                {config.profilePic ? (
                  <img src={config.profilePic} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <User className="w-8 h-8 text-[#444] group-hover:text-blue-500 transition-colors" />
                )}
              </div>
            </div>

            <div className="relative flex flex-col items-center md:items-start text-center md:text-left min-w-0 flex-1">
              <p className="text-[9px] md:text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] mb-1 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">
                {session.role === 'admin' ? 'CEO FUNDADOR' : 'SOCIO ÉLITE'}
              </p>

              <div className="relative group/username">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter truncate text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-md leading-none mb-1 cursor-default pb-1">
                  {config.profile?.alias || session.name}
                </h2>

                {/* TOOLTIP FLOTANTE DEL NOMBRE */}
                <div className="absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-[-12px] top-full mt-2 md:mt-0 md:top-1/2 md:-translate-y-1/2 opacity-0 invisible group-hover/username:opacity-100 group-hover/username:visible transition-all duration-300 transform scale-95 group-hover/username:scale-100 z-[9999] pointer-events-none">
                  <div className="bg-gradient-to-br from-[#0A0F1C] to-[#02040A] border border-blue-500/50 text-white text-lg md:text-xl font-black py-2.5 px-6 rounded-xl shadow-[0_15px_35px_rgba(59,130,246,0.5)] whitespace-nowrap flex items-center gap-3">
                    <Crown className="w-5 h-5 text-blue-400" />
                    {config.profile?.alias || session.name}
                  </div>
                </div>
              </div>

              <div className="group/motives mt-2 w-max" tabIndex="0">
                <div className="flex items-center justify-center md:justify-start gap-2 bg-black border border-[#333] rounded-lg px-3 py-1.5 cursor-pointer group-hover/motives:border-blue-500 transition-colors">
                  <Lock className="w-3.5 h-3.5 text-green-500" />
                  <p className="text-gray-300 text-[10px] font-black tracking-widest uppercase">Tus Motores Intocables</p>
                  <ChevronDown className="w-3 h-3 text-[#555] group-hover/motives:text-blue-400" />
                </div>

                <div className="absolute top-full left-1/2 -translate-x-1/2 md:translate-x-0 md:left-0 mt-2 w-80 md:w-96 bg-[#0A0F1C] border border-[#1E293B] rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] opacity-0 invisible group-hover/motives:opacity-100 group-hover/motives:visible group-focus/motives:opacity-100 group-focus/motives:visible transition-all duration-300 z-[999] focus-within:opacity-100 focus-within:visible">
                  <h4 className="text-blue-500 text-xs font-black uppercase tracking-widest mb-5 border-b border-[#1E293B] pb-3 flex items-center justify-center md:justify-start gap-2">
                    <Shield className="w-4 h-4" /> Configuración Blindada
                  </h4>
                  <div className="space-y-4 text-left">
                    {!config.motives?.q1 ? (
                      <div className="text-center py-4">
                        <h4 className="text-red-500 font-black text-xl mb-2 tracking-tighter">¡COBARDE!</h4>
                        <p className="text-[#888] text-[10px] font-bold leading-relaxed mb-4 uppercase">¿Eliminaste tus sueños? ¿Así de fácil te vas a rendir? Toca el botón y vuelve a crear tu motor.</p>
                        <button onClick={() => handlePsychoEvolve()} className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-3 rounded-xl text-[10px] shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-500 transition-all">CREAR MOTOR</button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-[#64748B] text-[9px] uppercase font-black tracking-widest mb-1">Meta Principal:</p>
                          <p className="text-white text-sm font-bold leading-snug">"{config.motives?.q1}"</p>
                        </div>
                        <div>
                          <p className="text-[#64748B] text-[9px] uppercase font-black tracking-widest mb-1">Sacrificio por:</p>
                          <p className="text-white text-sm font-bold leading-snug">"{config.motives?.q2}"</p>
                        </div>
                        <div>
                          <p className="text-[#64748B] text-[9px] uppercase font-black tracking-widest mb-1">Razón para no rendirse:</p>
                          <p className="text-white text-sm font-bold leading-snug">"{config.motives?.q3}"</p>
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={() => setShowPsychologicalModal(true)} className="w-full mt-6 bg-transparent text-[#64748B] border border-[#1E293B] py-3 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-red-900/20 hover:text-red-500 hover:border-red-500/50 transition-all flex items-center justify-center gap-2">
                    <Settings className="w-3 h-3" /> Modificar Motores
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE RIGHT BUTTONS (Settings & Admin) */}
          <div className="md:hidden flex flex-col items-center gap-2 z-50">
            <button
              onClick={() => { setProfileAliasInput(config.profile?.alias || ''); setShowProfileModal(true); }}
              className="flex items-center justify-center p-2.5 bg-[#111] text-[#888] border border-[#333] hover:border-blue-500 hover:text-blue-400 rounded-xl transition-all shadow-lg active:scale-95"
            >
              <Settings className="w-5 h-5" />
            </button>

            {session.role === 'admin' && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center justify-center p-2.5 bg-blue-600/20 text-blue-500 border border-blue-500/50 rounded-xl hover:bg-blue-600 hover:text-white transition-colors shadow-lg active:scale-95"
              >
                <Users className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* DESKTOP RIGHT BUTTONS */}
        <div className="hidden md:flex relative top-0 right-0 z-50 items-center gap-3">
          <button
            onClick={handleForceSync}
            disabled={syncStatus === 'saving'}
            className={`flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-black uppercase text-xs transition-all shadow-lg border ${syncStatus === 'success' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50' :
              syncStatus === 'saving' ? 'bg-blue-900/40 text-blue-400 border-blue-500/50 cursor-wait' :
                'bg-[#111] text-[#888] border-[#333] hover:border-blue-500 hover:text-blue-400 hover:bg-[#1a1a1a] active:scale-95'
              }`}
            title="Forzar Guardado Criptográfico"
          >
            {syncStatus === 'saving' ? <CloudUpload className="w-5 h-5 animate-pulse" /> :
              syncStatus === 'success' ? <Check className="w-5 h-5 text-emerald-400" /> :
                <CloudUpload className="w-5 h-5" />}
            <span>{syncStatus === 'saving' ? 'Sincronizando...' : syncStatus === 'success' ? 'Respaldado' : 'Respaldar'}</span>
          </button>

          <button onClick={() => { setProfileAliasInput(config.profile?.alias || ''); setShowProfileModal(true); }} className="flex items-center justify-center gap-2 bg-[#111] text-[#888] border border-[#333] hover:border-blue-500 hover:text-blue-400 px-5 py-4 rounded-xl font-black uppercase text-xs transition-all shadow-lg active:scale-95">
            <Settings className="w-5 h-5" /> <span>PERFIL</span>
          </button>

          {session.role === 'admin' && (
            <button onClick={() => setShowAdminPanel(true)} className="flex items-center justify-center gap-2 bg-blue-600/20 text-blue-500 border border-blue-500/50 px-6 py-4 rounded-xl font-black uppercase text-xs hover:bg-blue-600 hover:text-white transition-colors shadow-lg active:scale-95">
              <Users className="w-5 h-5" /> <span>VIP</span>
            </button>
          )}
        </div>
      </header>

      {/* TICKER DE ALTO IMPACTO */}
      <div className="max-w-[1800px] mx-auto mb-6 bg-gradient-to-r from-[#02040A] via-blue-800/80 to-[#02040A] text-white py-3 overflow-hidden flex border-y border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.4)] rounded-lg relative">
        <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-md"></div>
        <div className="flex w-max animate-marquee relative z-10">
          <span className="font-black uppercase text-sm tracking-[0.15em] text-white whitespace-nowrap" style={{ textShadow: '1px 1px 0 #111, 2px 2px 0 #000, 3px 3px 5px rgba(0,0,0,0.9)' }}>
            {tickerContent}{tickerContent}
          </span>
        </div>
      </div>

      {/* GALERÍA DE MOTORES */}
      <section className="max-w-[1800px] mx-auto bg-gradient-to-br from-[#0A0F1C] to-[#02040A] border border-[#1E293B] rounded-[2rem] p-8 mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">

        <div className="flex flex-col md:flex-row md:justify-between items-center mb-8 relative z-10 gap-4 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs md:text-sm flex items-center justify-center md:justify-start gap-3">
              <ImagePlus className="w-5 h-5" /> ARSENAL VISUAL (MOTORES DE ESCALA)
            </h2>
            <p key={subQuoteIdx} className="text-[#64748B] text-[10px] font-bold uppercase tracking-widest mt-2 md:mt-1 md:ml-8 animate-in fade-in duration-1000">
              "{visionSubQuotes[subQuoteIdx]}"
            </p>
          </div>

          <button onClick={() => { setActiveImageSlot('new'); fileInputRef.current.click(); }} className="flex items-center justify-center w-full md:w-auto gap-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/50 px-5 md:px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] active:scale-95">
            <Plus className="w-4 h-4" /> Integrar Nueva Visión
          </button>
        </div>

        <div className="flex relative z-10 w-full overflow-hidden mask-edges-horizontal">
          {config.images.length > 0 ? (
            <div className="flex w-max animate-marquee-images hover:[animation-play-state:paused]">
              <div className="flex gap-6 pr-6">
                {displayImages.map((img, index) => (
                  <div key={`img1-${index}`} tabIndex="0" className="h-64 md:h-80 w-max shrink-0 relative bg-[#02040A] border border-[#1E293B] rounded-2xl overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.8)] focus:outline-none">
                    <div className="absolute inset-0 border border-white/5 rounded-2xl z-10 pointer-events-none"></div>
                    <img src={img} className="h-full w-auto min-w-[250px] object-contain transition-all duration-1000 group-hover:scale-105 group-focus:scale-105 group-hover:blur-[4px] group-focus:blur-[4px] opacity-90 group-hover:opacity-30 group-focus:opacity-30" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 bg-black/50 transition-all duration-300 z-20 p-6 gap-3">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openImageModal(index); }} className="w-full bg-blue-600/80 hover:bg-blue-500 text-white border border-blue-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.6)] transform translate-y-4 group-hover:translate-y-0 transition-all">
                        Modificar Visión
                      </button>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openImageModal(index); }} className="w-full bg-red-900/60 hover:bg-red-600/80 text-red-100 border border-red-500/50 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest backdrop-blur-md transform translate-y-4 group-hover:translate-y-0 transition-all delay-75">
                        Eliminar Visión
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-6 pr-6">
                {displayImages.map((img, index) => (
                  <div key={`img2-${index}`} tabIndex="0" className="h-64 md:h-80 w-max shrink-0 relative bg-[#02040A] border border-[#1E293B] rounded-2xl overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.8)] focus:outline-none">
                    <div className="absolute inset-0 border border-white/5 rounded-2xl z-10 pointer-events-none"></div>
                    <img src={img} className="h-full w-auto min-w-[250px] object-contain transition-all duration-1000 group-hover:scale-105 group-focus:scale-105 group-hover:blur-[4px] group-focus:blur-[4px] opacity-90 group-hover:opacity-30 group-focus:opacity-30" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 bg-black/50 transition-all duration-300 z-20 p-6 gap-3">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openImageModal(index); }} className="w-full bg-blue-600/80 hover:bg-blue-500 text-white border border-blue-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.6)] transform translate-y-4 group-hover:translate-y-0 transition-all">
                        Modificar Visión
                      </button>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openImageModal(index); }} className="w-full bg-red-900/60 hover:bg-red-600/80 text-red-100 border border-red-500/50 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest backdrop-blur-md transform translate-y-4 group-hover:translate-y-0 transition-all delay-75">
                        Eliminar Visión
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              onClick={() => { setActiveImageSlot('new'); fileInputRef.current.click(); }}
              className="w-full h-48 md:h-64 flex flex-col items-center justify-center border-2 border-dashed border-[#1E293B] rounded-2xl cursor-pointer group hover:bg-[#0A0F1C] hover:border-blue-500/50 transition-all"
            >
              <div className="w-16 h-16 bg-[#02040A] rounded-full flex items-center justify-center mb-4 border border-[#1E293B] group-hover:scale-110 group-hover:border-blue-500 transition-all">
                <ImagePlus className="w-8 h-8 text-[#334155] group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-[#64748B] text-xs font-black uppercase tracking-widest text-center group-hover:text-white transition-colors">Tu arsenal visual está vacío.</p>
              <p className="text-blue-500/0 group-hover:text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-2 transition-colors drop-shadow-md">HAZ CLIC AQUÍ PARA INTEGRAR TU PRIMERA VISIÓN</p>
            </div>
          )}
        </div>

        <div className="text-center mt-10 relative z-10 min-h-[40px] flex items-center justify-center">
          <h2 key={visionQuoteIdx} className="text-[#10B981] font-black uppercase text-base md:text-lg tracking-widest animate-in fade-in zoom-in-95 duration-1000" style={{ textShadow: '1px 1px 0 #02040A, 2px 2px 0 #050505, 4px 4px 5px rgba(0,0,0,0.8)' }}>
            "{visionMainQuotes[visionQuoteIdx]}"
          </h2>
        </div>
      </section>

      {/* SELECTOR CENTRAL DE MODO DE APLICACIÓN (DIARIO vs MENSUAL vs ANUAL) */}
      <div className="max-w-[1800px] mx-auto mt-10 mb-8 flex flex-col md:flex-row items-center justify-center gap-4 bg-gradient-to-b from-[#111] to-[#050505] p-4 rounded-3xl border border-[#333] shadow-2xl">
        <button onClick={() => setAppMode('execution')} className={`flex-1 w-full md:w-auto py-5 px-6 rounded-2xl font-black uppercase text-sm tracking-widest transition-all duration-500 flex items-center justify-center gap-3 border-2 ${appMode === 'execution' ? 'bg-blue-600/20 text-blue-400 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105' : 'bg-[#0a0a0a] text-[#555] border-[#222] hover:bg-[#111] hover:text-white'}`}>
          <Crosshair className="w-5 h-5" /> Matriz Táctica (Diario)
        </button>
        <button onClick={() => setAppMode('monthly_plan')} className={`flex-1 w-full md:w-auto py-5 px-6 rounded-2xl font-black uppercase text-sm tracking-widest transition-all duration-500 flex items-center justify-center gap-3 border-2 ${appMode === 'monthly_plan' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105' : 'bg-[#0a0a0a] text-[#555] border-[#222] hover:bg-[#111] hover:text-white'}`}>
          <Map className="w-5 h-5" /> Visión Mensual
        </button>
        <button onClick={() => setAppMode('yearly_plan')} className={`flex-1 w-full md:w-auto py-5 px-6 rounded-2xl font-black uppercase text-sm tracking-widest transition-all duration-500 flex items-center justify-center gap-3 border-2 ${appMode === 'yearly_plan' ? 'bg-purple-600/20 text-purple-400 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] scale-105' : 'bg-[#0a0a0a] text-[#555] border-[#222] hover:bg-[#111] hover:text-white'}`}>
          <Compass className="w-5 h-5" /> Imperio Anual
        </button>
      </div>

      {/* --- VISTA: MATRIZ DIARIA --- */}

      {appMode === 'execution' && (
        <div className="max-w-[1800px] mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8 mt-6">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-md">
              MATRIZ DE EJECUCIÓN <span className="text-blue-500">{selectedYear}</span>
            </h2>
            <p className="text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-widest mt-3 bg-blue-900/10 inline-block px-5 py-2 rounded-full border border-blue-500/20 shadow-inner">
              "El que planifica, planifica a ganar. El que no planifica, planifica a perder. asi de simple. "
            </p>
          </div>

          <div className="flex justify-center gap-1 bg-[#020617] p-1.5 rounded-2xl w-max mx-auto border border-[#1E293B] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            {[
              { id: 'day', label: 'Día' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mes' },
              { id: 'year', label: 'Año' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setViewScope(s.id)}
                className={`px-8 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all duration-300 ${viewScope === s.id ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105 relative z-10' : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#0F172A]'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between md:justify-center w-full max-w-full gap-2 md:gap-8 mt-6">
            <button onClick={handlePrevTime} className="p-3 md:p-4 shrink-0 bg-black border border-[#333] rounded-2xl hover:border-blue-500 transition-colors shadow-xl"><ChevronLeft /></button>
            <h2 className="text-2xl md:text-6xl font-black text-white uppercase text-center min-w-0 md:min-w-[300px] tracking-tighter drop-shadow-md truncate">{navTitleText}</h2>
            <button onClick={handleNextTime} className="p-3 md:p-4 shrink-0 bg-black border border-[#333] rounded-2xl hover:border-blue-500 transition-colors shadow-xl"><ChevronRight /></button>
            <button onClick={() => setMultiDateModal({ show: true, dates: [] })} className="p-3 md:p-4 shrink-0 bg-blue-900/20 border border-blue-500/50 rounded-2xl text-blue-400 hover:bg-blue-600 transition-all hidden md:flex" title="Aislar Fechas"><CalendarDays /></button>
          </div>

          <div className="w-full bg-[#050505] p-2 md:p-6 rounded-3xl border border-[#222] shadow-2xl mt-8">
            <div className="bg-gradient-to-b from-[#1a1a1a] to-[#111] border-b border-[#222] p-6 flex flex-col md:flex-row gap-4 justify-between items-center rounded-t-2xl">
              <div className="flex bg-black border border-[#333] rounded-xl p-1 shadow-inner gap-2">
                <button onClick={() => setTaskStatusFilter('all')} className={`px-5 py-2 rounded-lg font-black uppercase text-[10px] transition-all ${taskStatusFilter === 'all' ? 'bg-blue-500 text-white shadow-lg' : 'text-[#64748B] hover:text-white'}`}>Todas</button>
                <button onClick={() => setTaskStatusFilter('active')} className={`px-5 py-2 rounded-lg font-black uppercase text-[10px] transition-all ${taskStatusFilter === 'active' ? 'bg-green-500 text-black shadow-lg' : 'text-[#64748B] hover:text-white'}`}>Activas</button>
                <button onClick={() => setTaskStatusFilter('archived')} className={`px-5 py-2 rounded-lg font-black uppercase text-[10px] transition-all ${taskStatusFilter === 'archived' ? 'bg-red-500 text-white shadow-lg' : 'text-[#64748B] hover:text-white'}`}>Apagadas</button>
              </div>
              <div className="flex bg-black border border-[#333] rounded-xl p-1 shadow-inner">
                <button onClick={() => setMatrixMode('workTasks')} className={`px-8 py-3 rounded-lg font-black uppercase text-xs transition-all ${matrixMode === 'workTasks' ? 'bg-blue-600 text-white shadow-lg' : 'text-[#666] hover:text-white'}`}>Negocios</button>
                <button onClick={() => setMatrixMode('habits')} className={`px-8 py-3 rounded-lg font-black uppercase text-xs transition-all ${matrixMode === 'habits' ? 'bg-yellow-500 text-black shadow-lg' : 'text-[#666] hover:text-white'}`}>Hábitos</button>
              </div>
            </div>

            <div
              ref={tableScrollRef}
              className="overflow-x-auto custom-scrollbar bg-black/50 pb-32"
              style={{ cursor: 'grab' }}
              onMouseDown={handleTableMouseDown}
              onTouchStart={handleTableTouchStart}
              onClickCapture={handleTableClickCapture}
            >
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-[#0a0a0a] border-b-2 border-[#222]">
                    <th style={{ width: physicalColWidth, minWidth: physicalColWidth, maxWidth: physicalColWidth }} className="p-0 sticky left-0 z-30 transition-all duration-300">
                      <div style={{ width: physicalColWidth }} className="h-full relative">
                        <div style={{ width: visualColWidth }} className="bg-[#0a0a0a] border-r border-[#222] absolute top-0 left-0 bottom-0 z-30 shadow-[5px_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden">
                          <div className={`p-3 md:p-5 font-black uppercase text-xs text-[#888] w-full h-full flex items-center ${isLeftColCollapsed ? 'justify-center' : 'justify-between'}`}>
                            {!isLeftColCollapsed && <span className="truncate pr-2">Estrategia</span>}
                            {!isLeftColCollapsed && (
                              <div className="flex items-center gap-1.5 shrink-0 relative z-50">
                                <button onClick={(e) => { e.stopPropagation(); setColWidth(w => w > baseColWidth ? baseColWidth : Math.min(window.innerWidth - 60, 400)); }} className="p-1.5 md:hidden bg-[#1a1a1a] hover:bg-blue-600 hover:text-white transition-colors rounded-lg border border-[#333] flex items-center gap-1 text-[10px]">
                                  {colWidth > baseColWidth ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                                </button>
                                <button onClick={() => setIsLeftColCollapsed(!isLeftColCollapsed)} className="p-1.5 md:p-2 bg-[#1a1a1a] hover:bg-blue-600 hover:text-white transition-colors rounded-lg border border-[#333]">
                                  <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                              </div>
                            )}
                            {isLeftColCollapsed && (
                              <button onClick={() => setIsLeftColCollapsed(!isLeftColCollapsed)} className="p-1.5 md:p-2 bg-[#1a1a1a] hover:bg-blue-600 hover:text-white transition-colors rounded-lg border border-[#333] relative z-50">
                                <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                              </button>
                            )}
                          </div>
                          {!isLeftColCollapsed && <div onMouseDown={handleResizeStart} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 z-50 transition-colors"></div>}
                        </div>
                      </div>
                    </th>
                    {visibleDaysArray.map(d => {
                      const isSun = d.dayIndex === 0;
                      const isPastDay = d.dateStr < actualTodayStr;
                      const isOtherMonth = !d.isCurrentMonth;
                      const opacityClass = isOtherMonth ? 'opacity-30 grayscale saturate-0' : (isPastDay ? 'opacity-60 grayscale-[0.5]' : '');

                      return (
                        <th key={d.dateStr} className={`p-3 text-center w-[70px] min-w-[70px] max-w-[70px] border-r border-[#222] ${isSun ? 'bg-purple-900/10 border-r-purple-900/30' : (d.isToday ? 'bg-blue-900/20' : '')} ${opacityClass}`}>
                          <div className="flex flex-col items-center gap-1 group">
                            <span className={`text-[10px] font-black uppercase transition-colors ${isSun ? 'text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'text-[#555] group-hover:text-blue-400'}`}>{d.dayName}</span>
                            <div className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full font-black text-white text-base md:text-lg transition-all duration-300 cursor-pointer border-2 
                            ${d.isToday ? 'bg-blue-600 border-white shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-110' :
                                isSun ? 'bg-[#111] border-purple-500/50 text-purple-400 hover:bg-purple-600 hover:text-white hover:border-white hover:shadow-[0_0_15px_rgba(168,85,247,0.8)] hover:scale-110' :
                                  'bg-[#111] border-[#333] group-hover:bg-blue-600 group-hover:border-white group-hover:shadow-[0_0_15px_rgba(59,130,246,0.8)] group-hover:scale-110'}
                          `}>
                              {d.date}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {visibleTasksFinal.map((item, index) => (
                    <tr key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)} onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      tabIndex="0"
                      className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors group cursor-grab active:cursor-grabbing focus:outline-none">

                      <td style={{ width: physicalColWidth, minWidth: physicalColWidth, maxWidth: physicalColWidth }} className="p-0 sticky left-0 z-20 transition-all duration-300 relative group">
                        <div style={{ width: physicalColWidth }} className="h-full relative">
                          <div style={{ width: visualColWidth }} className="bg-[#111] group-hover:bg-[#1a1a1a] transition-all duration-300 absolute top-0 left-0 bottom-0 border-r border-[#222] shadow-[5px_0_15px_rgba(0,0,0,0.5)] overflow-hidden">
                            <div className={`flex items-center gap-2 md:gap-3 p-2 md:p-4 w-full h-full relative ${isLeftColCollapsed ? 'justify-center' : ''}`}>
                          <GripVertical className="w-4 h-4 md:w-5 md:h-5 text-[#444] group-hover:text-blue-500 cursor-grab shrink-0" />
                          <span className="text-[10px] font-black text-blue-400 bg-blue-950/80 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border border-blue-800/50 shadow-[0_0_8px_rgba(59,130,246,0.2)] shrink-0">
                            {index + 1}
                          </span>

                          {!isLeftColCollapsed && (
                            <>
                              <div onClick={() => handleTaskPowerToggle(item)} className={`cursor-pointer rounded-full p-1.5 border transition-all shrink-0 ${item.status === 'archived' ? 'bg-[#222] text-[#666]' : 'bg-green-900/30 text-green-500 hover:text-red-500'}`}><Power className="w-3 h-3 md:w-4 md:h-4" /></div>

                              <div className="flex flex-col min-w-0 flex-1 relative justify-center pr-2 md:pr-24">
                                <div className="relative group/name w-full flex-1 min-w-0">
                                  <span className={`text-xs md:text-sm font-black truncate cursor-help w-full block ${item.status === 'archived' ? 'line-through opacity-40 italic' : 'text-white'}`}>
                                    {item.name}
                                  </span>
                                  <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 opacity-0 invisible group-hover/name:opacity-100 group-hover/name:visible transition-all duration-300 transform scale-95 group-hover/name:scale-100 z-[9999] pointer-events-none">
                                    <div className="bg-gradient-to-br from-[#0A0F1C] to-[#02040A] border border-blue-500/50 text-white text-sm md:text-base font-black py-2.5 px-5 rounded-xl shadow-[0_15px_30px_rgba(59,130,246,0.5)] w-max max-w-[300px] md:max-w-[400px] whitespace-normal leading-relaxed flex items-center gap-3">
                                      <Activity className="w-5 h-5 text-blue-400 shrink-0" />
                                      <span>{item.name}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="relative group/time mt-1 md:mt-1.5 w-max shrink-0">
                                  {item.isFlexible ? (
                                    <>
                                      <span className="bg-gradient-to-r from-violet-900/50 to-purple-900/30 border border-violet-600/40 text-violet-300 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[9px] md:text-[10px] font-black tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(139,92,246,0.25)] shrink-0">
                                        <Zap className="w-3 h-3 text-violet-400 shrink-0" /> <span className="whitespace-nowrap truncate max-w-[80px] md:max-w-none">HÁBITO</span>
                                      </span>
                                      <div className="absolute top-1/2 -translate-y-1/2 -left-1 opacity-0 invisible group-hover/time:opacity-100 group-hover/time:visible transition-all duration-200 z-[9999]">
                                        <span className="bg-[#111] border border-purple-500 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-black tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.6)] whitespace-nowrap">
                                          <Zap className="w-4 h-4 text-purple-400 shrink-0" /> HÁBITO FLEXIBLE TODO EL DÍA
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <span className="bg-[#0a0f1a] border border-blue-900/60 text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[9px] md:text-[11px] font-black tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.15)] shrink-0 min-w-max hover:border-blue-500/60 transition-colors">
                                        <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                                        <span className="whitespace-nowrap">{formatAMPM(item.startTime)} <span className="text-blue-900">|</span> {formatAMPM(item.endTime)}</span>
                                      </span>
                                      <div className="absolute top-1/2 -translate-y-1/2 -left-1 opacity-0 invisible group-hover/time:opacity-100 group-hover/time:visible transition-all duration-200 z-[9999]">
                                        <span className="bg-[#111] border border-blue-500 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-black tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.6)] whitespace-nowrap">
                                          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                                          {formatAMPM(item.startTime)} <span className="text-[#555]">|</span> {formatAMPM(item.endTime)}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus:opacity-100 group-focus:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto transition-opacity bg-[#111] p-1 rounded-lg border border-[#333] absolute right-2 top-1/2 -translate-y-1/2 shadow-lg z-50">
                                <button onClick={() => {
                                  setModalDate({ month: selectedMonthIndex, year: selectedYear });
                                  setEditingTask({ category: matrixMode, task: item });
                                  setActiveTimeTab(null);
                                }} className="p-1 md:p-2 text-[#888] hover:text-blue-500 transition-all rounded" title="Configurar"><Settings className="w-3 h-3 md:w-4 md:h-4" /></button>
                                <button onClick={() => setAdvancedDeleteModal({ show: true, task: item, category: matrixMode, dates: item.cancelledDays || [] })} className="p-1 md:p-2 text-[#888] hover:text-orange-500 transition-all rounded" title="Suspender Días"><CalendarX className="w-3 h-3 md:w-4 md:h-4" /></button>
                                <button onClick={() => setTaskDeleteModal({ show: true, task: item, category: matrixMode })} className="p-1 md:p-2 text-[#888] hover:text-red-500 transition-all rounded" title="Eliminar Todo"><Trash2 className="w-3 h-3 md:w-4 md:h-4" /></button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {visibleDaysArray.map(d => {
                        const isSch = isTaskScheduledOnDay(item, d, monthlyExceptions);
                        const isCancelled = item.cancelledDays?.includes(d.dateStr);
                        const isChk = monthlyChecks[`${d.monthIndex}_${item.id}_${d.date}`];
                        const isSun = d.dayIndex === 0;
                        const isPastDay = d.dateStr < actualTodayStr;
                        const isOtherMonth = !d.isCurrentMonth;
                        const opacityClass = isOtherMonth ? 'opacity-30 grayscale saturate-0' : (isPastDay ? 'opacity-60 grayscale-[0.5]' : '');
                        const currentDayPct = getDayCompletion(d.monthIndex, d, matrixMode);
                        const isPerfectDay = currentDayPct === 100;

                        return (
                          <td key={d.dateStr} className={`text-center p-0 border-r border-[#222] w-[70px] min-w-[70px] max-w-[70px] relative group/cell ${isSun ? 'bg-purple-900/5 border-r-purple-900/20' : ''} ${opacityClass}`}>
                            {isSch ? (
                              isCancelled ? (
                                <div className="w-full h-14 md:h-16 flex items-center justify-center bg-zinc-900/80 cursor-not-allowed">
                                  <span className="text-[9px] font-black tracking-widest text-[#555] rotate-[-45deg] select-none">SUSPENDIDO</span>
                                </div>
                              ) : (
                                <>
                                  <button onClick={() => toggleCheck(item.id, d)} className="w-full h-14 md:h-16 flex items-center justify-center group/btn">
                                    {isChk ? (
                                      <div className="relative flex items-center justify-center">
                                        <CheckSquare className={`w-7 h-7 md:w-8 md:h-8 transition-all duration-500 group-hover/btn:scale-110 ${isPerfectDay ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(10,185,129,1)] scale-110' : 'text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]'}`} />
                                        {isPerfectDay && <div className="absolute -inset-2 rounded-lg border border-amber-400/40 animate-pulse" />}
                                      </div>
                                    ) : (
                                      <Square className="w-7 h-7 md:w-8 md:h-8 text-[#1e2d3a] group-hover/btn:text-blue-500/50 transition-colors" />
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSingleDayCancelModal({ show: true, task: item, dayData: d, category: matrixMode }); }}
                                    className="absolute top-1 right-1 p-1 bg-red-900/90 text-red-400 rounded-md hover:bg-red-500 hover:text-white opacity-0 group-hover/cell:opacity-100 transition-all shadow-md z-10"
                                    title="Liberar este espacio"
                                  >
                                    <Trash2 className="w-3 h-3" strokeWidth={2.5} />
                                  </button>
                                </>
                              )
                            ) : (
                              <div className="h-14 md:h-16 opacity-10 bg-[repeating-linear-gradient(45deg,#000,#000_4px,#0a0a14_4px,#0a0a14_8px)]"></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-black border-t-2 border-[#333]">
                    <td style={{ width: physicalColWidth, minWidth: physicalColWidth, maxWidth: physicalColWidth }} className="p-0 sticky left-0 z-20 transition-all duration-300">
                      <div style={{ width: physicalColWidth }} className="h-full relative">
                        <div style={{ width: visualColWidth }} className="p-4 bg-black absolute top-0 left-0 bottom-0 font-black uppercase text-xs text-right tracking-widest text-blue-500 shadow-[5px_0_15px_rgba(0,0,0,0.5)] border-r border-[#222] overflow-hidden transition-all duration-300">
                          Indicador de Victoria
                        </div>
                      </div>
                    </td>
                    {visibleDaysArray.map(d => {
                      const isSun = d.dayIndex === 0;
                      const isPastDay = d.dateStr < actualTodayStr;
                      const isOtherMonth = !d.isCurrentMonth;
                      const opacityClass = isOtherMonth ? 'opacity-30 grayscale saturate-0' : (isPastDay ? 'opacity-60 grayscale-[0.5]' : '');

                      if (isSun) {
                        return (
                          <td key={d.dateStr} className={`bg-purple-900/10 text-center border-r border-purple-900/30 p-1 md:p-2 w-[70px] min-w-[70px] max-w-[70px] ${opacityClass}`}>
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className="font-black text-[9px] md:text-[11px] tracking-widest text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">LIBRE</span>
                              <Award className="w-5 h-5 md:w-7 md:h-7 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] hover:scale-110 transition-transform cursor-pointer" />
                            </div>
                          </td>
                        );
                      }

                      const pct = getDayCompletion(d.monthIndex, d, matrixMode);
                      if (pct === null) return <td key={d.dateStr} className={`bg-[#050505] text-center border-r border-[#222] w-[70px] min-w-[70px] max-w-[70px] ${opacityClass}`}><div className="w-full h-14 md:h-16 flex flex-col items-center justify-center gap-1 opacity-20"><Medal className="w-5 h-5 md:w-6 md:h-6 text-[#222]" /><span className="text-[9px] md:text-[10px] font-black">LIBRE</span></div></td>;

                      const isPerfect = pct === 100;
                      return (
                        <td key={d.dateStr} className={`text-center border-r border-[#222] p-1 md:p-2 transition-all duration-500 w-[70px] min-w-[70px] max-w-[70px] ${getPerformanceBgColor(pct)} ${opacityClass}`}>
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={`font-black text-xs md:text-sm transition-colors duration-500 ${getDynamicMedalColor(pct)}`}>{Math.round(pct)}%</span>
                            {isPerfect ? (
                              <div className="relative">
                                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-blue-500 animate-sapphire" />
                                <div className="absolute -inset-1 rounded-full bg-blue-500/10 animate-pulse" />
                              </div>
                            ) : (
                              <Medal className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-500 ${getDynamicMedalColor(pct)} opacity-80`} />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-black border-t border-[#333] rounded-b-2xl">
              <button onClick={() => {
                const n = { id: `id_${Date.now()}`, name: '', startTime: '09:00', endTime: '10:00', isFlexible: false, taskType: 'weekly', days: [1, 2, 3, 4, 5, 6], specificDates: [], startDate: actualTodayStr, activeMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], status: 'active' };
                setModalDate({ month: selectedMonthIndex, year: selectedYear });
                setEditingTask({ category: matrixMode, task: n });
                setActiveTimeTab(null);
              }} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black uppercase text-sm shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                <Plus className="w-6 h-6" /> Añadir Bloque al Ecosistema
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-12 mb-12">
            <div className="xl:col-span-1 bg-[#111] border border-[#222] rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
              <h3 className="text-white text-xs font-black uppercase tracking-widest mb-8 border-b border-[#333] pb-4 flex items-center gap-2"><Target className="text-yellow-500 w-5 h-5" /> RECOMPENSAS SEMANALES</h3>

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto custom-scrollbar pr-2">
                {calendarWeeks.map((weekDays, idx) => {
                  const workDays = weekDays.filter(d => d.dayIndex !== 0);
                  const percentage = workDays.length > 0 ? calculateProgress(config[matrixMode] || [], workDays, monthlyChecks) : null;
                  const saturdayOfWeek = weekDays.find(d => d.dayIndex === 6);
                  const isCurrentWeek = weekDays.some(d => d.dateStr === actualTodayStr);
                  const isClosed = saturdayOfWeek ? saturdayOfWeek.dateStr < actualTodayStr : false;
                  return <WeeklyRewardCard
                    key={idx}
                    label={`SEM. ${idx + 1}`}
                    percentage={percentage}
                    weekDays={weekDays}
                    mode={matrixMode}
                    isCurrentWeek={isCurrentWeek}
                    isClosed={isClosed}
                  />
                })}
              </div>

              <div className={`mt-6 p-5 rounded-2xl border text-center relative overflow-hidden min-h-[72px] flex items-center justify-center ${matrixMode === 'workTasks' ? 'border-blue-900/40 bg-gradient-to-b from-blue-950/20 to-black' : 'border-violet-900/40 bg-gradient-to-b from-violet-950/20 to-black'}`}>
                <div className={`absolute inset-0 opacity-5 ${matrixMode === 'workTasks' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                <p key={bottomQuoteTick} className={`font-black uppercase text-[11px] tracking-widest leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-700 relative ${matrixMode === 'workTasks' ? 'text-blue-300' : 'text-violet-300'}`}>
                  {currentBottomQuote}
                </p>
              </div>
            </div>

            <div className="xl:col-span-2 bg-[#111] border border-[#222] rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-white mb-8 border-b border-[#333] pb-4 flex items-center gap-2"><BarChart2 className="text-blue-500 w-5 h-5" /> {matrixMode === 'workTasks' ? 'TENDENCIA DE EJECUCIÓN DIARIA' : 'TENDENCIA DE HÁBITOS DE HIERRO'}</h3>
              <div className="h-[200px] md:h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBiz" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={matrixMode === 'workTasks' ? "#3b82f6" : "#a855f7"} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={matrixMode === 'workTasks' ? "#3b82f6" : "#a855f7"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="dia" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} domain={[0, 100]} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                    <Area type="monotone" dataKey="valor" name={matrixMode === 'workTasks' ? 'ROI Operativo' : 'Fuerza de Hábito'} stroke={matrixMode === 'workTasks' ? "#3b82f6" : "#a855f7"} strokeWidth={4} fillOpacity={1} fill="url(#colorBiz)" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- VISTA: PLANIFICACIÓN MENSUAL --- */}
      {appMode === 'monthly_plan' && (
        <div className="max-w-[1800px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="text-center mb-8 mt-6">
            <h2 className="text-3xl md:text-5xl font-black text-emerald-400 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              EL IMPACTO DE <span className="text-white">{monthNames[selectedMonthIndex]}</span>
            </h2>
            <p className="text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-widest mt-3 bg-emerald-900/10 inline-block px-5 py-2 rounded-full border border-emerald-500/20 shadow-inner">
              "Colapsa el tiempo: haz en 30 días lo que a otros les toma un año."
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-center gap-4 md:gap-8 mt-6 mb-10 px-2 md:px-0">
            <button onClick={() => { if (selectedMonthIndex === 0) { setSelectedMonthIndex(11); setSelectedYear(y => y - 1); } else setSelectedMonthIndex(m => m - 1); }} className="p-3 md:p-4 bg-black border border-[#333] rounded-2xl hover:border-emerald-500 transition-colors shadow-xl shrink-0"><ChevronLeft /></button>
            <h2 className="text-2xl md:text-5xl font-black text-white uppercase text-center flex-1 md:flex-none tracking-tighter drop-shadow-md truncate">{monthNames[selectedMonthIndex]} {selectedYear}</h2>
            <button onClick={() => { if (selectedMonthIndex === 11) { setSelectedMonthIndex(0); setSelectedYear(y => y + 1); } else setSelectedMonthIndex(m => m + 1); }} className="p-3 md:p-4 bg-black border border-[#333] rounded-2xl hover:border-emerald-500 transition-colors shadow-xl shrink-0"><ChevronRight /></button>
          </div>

          {/* 4 PILARES MENSUALES + CATEGORÍAS PERSONALIZADAS */}
          {(() => {
            const overrides = config.monthlyDefaultOverrides || {};

            const buildCat = (id, title, icon, accent, glow) => {
              const ov = overrides[id] || {};
              if (ov.deleted) return null;
              const color = ov.color || accent;
              const r = parseInt(color.slice(1, 3), 16), g2 = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
              return {
                id, isDefault: true,
                title: ov.title || title,
                emoji: ov.emoji || null,
                icon: ov.emoji ? null : icon,
                bg: `rgba(${r},${g2},${b},0.1)`,
                border: `rgba(${r},${g2},${b},0.3)`,
                text: color,
                accent: color,
                glow: `rgba(${r},${g2},${b},0.15)`,
              };
            };
            const defaultCats = [
              buildCat('income', 'Ingresos & Expansión', TrendingUp, '#10b981', 'rgba(16,185,129,0.15)'),
              buildCat('travel', 'Viajes & Libertad', Plane, '#0ea5e9', 'rgba(14,165,233,0.15)'),
              buildCat('family', 'Legado & Familia', Home, '#f59e0b', 'rgba(245,158,11,0.15)'),
              buildCat('personal', 'Evolución Suprema', Dumbbell, '#8b5cf6', 'rgba(139,92,246,0.15)'),
            ].filter(Boolean);
            const customCats = (config.monthlyCustomCategories || []).filter(c => !c.deleted).map(c => {
              const cs = getColorStyle(c.color || '#10b981');
              return { ...c, isDefault: false, ...cs, emoji: c.emoji || '🎯', icon: null };
            });
            const allCats = [...defaultCats, ...customCats];
            const cols = allCats.length <= 4 ? 'xl:grid-cols-4' : allCats.length === 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-3';

            return (
              <>
                <div className={`grid grid-cols-1 md:grid-cols-2 ${cols} gap-5`}>
                  {allCats.map(cat => (
                    <div key={cat.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ boxShadow: `0 0 30px ${cat.glow}` }}>
                      {/* HEADER CATEGORÍA */}
                      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1e1e1e]" style={{ background: `linear-gradient(135deg, ${cat.glow.replace('0.15', '0.3')} 0%, transparent 100%)` }}>
                        <div className="p-2.5 rounded-xl border shadow-lg flex items-center justify-center" style={{ background: cat.bg, borderColor: cat.border }}>
                          {cat.emoji ? <span style={{ fontSize: '16px' }}>{cat.emoji}</span> : cat.icon ? <cat.icon className="w-4 h-4" style={{ color: cat.text }} /> : <span style={{ fontSize: '16px' }}>🎯</span>}
                        </div>
                        <h3 className="font-black uppercase text-xs tracking-widest flex-1" style={{ color: cat.text }}>{cat.title}</h3>
                        {/* Botones Editar + Eliminar para TODAS */}
                        <div className="flex items-center gap-1">
                          <button onClick={() => {
                            setAddCatEmoji(cat.emoji || '🎯');
                            setAddCatColor(cat.accent || '#10b981');
                            setAddCatName(cat.title);
                            setAddCatModal({ show: true, context: 'monthly', editCat: cat });
                          }} className="p-1.5 rounded-lg text-[#555] hover:text-blue-400 border border-[#222] hover:border-blue-900/50 transition-all" title="Editar categoría">
                            <SlidersHorizontal className="w-3 h-3" />
                          </button>
                          <button onClick={() => setDeleteCatModal({ show: true, catId: cat.id, catTitle: cat.title, isDefault: !!cat.isDefault, context: 'monthly' })}
                            className="p-1.5 rounded-lg text-[#333] hover:text-red-500 border border-[#222] hover:border-red-900/50 transition-all" title="Eliminar categoría">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>


                      {/* FILTROS MENSUALES + CONTADORES */}
                      {(() => {
                        const allGoalsInMonth = config.monthlyGoals.filter(g => g.category === cat.id && g.monthIndex === selectedMonthIndex && g.status !== 'deleted');
                        const achievedCount = allGoalsInMonth.filter(g => g.status === 'achieved' || g.status === 'achieved_early').length;
                        const failedCount = allGoalsInMonth.filter(g => g.status === 'failed').length;
                        const activeCount = allGoalsInMonth.filter(g => g.status === 'active' || g.status === 'pending_validation').length;
                        return (
                          <div className="px-3 pb-2 flex items-center gap-1.5 flex-wrap border-b border-[#1e1e1e] py-2">
                            {[{ k: 'all', label: 'Todas', count: allGoalsInMonth.length, color: 'text-[#888]' }, { k: 'active', label: 'Activas', count: activeCount, color: cat.text }, { k: 'achieved', label: 'Logradas', count: achievedCount, color: 'text-emerald-400' }, { k: 'failed', label: 'Fallidas', count: failedCount, color: 'text-red-400' }].map(f => (
                              <button key={f.k} onClick={() => setGoalFilter(f.k)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${goalFilter === f.k ? `bg-[#222] ${f.color} border border-[#444]` : 'text-[#444] hover:text-[#666]'
                                  }`}>
                                {f.label} <span className={`ml-0.5 ${f.color} font-black`}>{f.count}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()}

                      {/* LISTA DE METAS */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 p-4 min-h-[180px] max-h-[380px]">
                        {config.monthlyGoals.filter(g => g.category === cat.id && g.monthIndex === selectedMonthIndex && (goalFilter === 'all' || g.status === goalFilter)).length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full opacity-30 mt-8">
                            <Target className={`w-8 h-8 ${cat.text} mb-2`} />
                            <p className="text-[#555] text-[10px] font-black uppercase tracking-widest text-center">{goalFilter === 'all' ? 'Sin objetivos fijados.' : 'Sin metas en este filtro.'}</p>
                          </div>
                        ) : (
                          config.monthlyGoals.filter(g => g.category === cat.id && g.monthIndex === selectedMonthIndex && (goalFilter === 'all' || g.status === goalFilter)).map(goal => (
                            <div key={goal.id} tabIndex="0" className={`p-4 rounded-xl relative group border transition-all duration-300 focus:outline-none ${goal.status === 'failed' ? 'bg-red-950/30 border-red-900/50' :
                              goal.status === 'achieved' ? `border-[${cat.accent}]/30 bg-[${cat.accent}]/5` :
                                goal.status === 'achieved_early' ? 'bg-yellow-950/30 border-yellow-900/50' :
                                  'bg-[#111] border-[#222] hover:border-[#333]'
                              }`}>
                              {/* TÍTULO + ELIMINAR */}
                              <div className="flex justify-between items-start mb-2">
                                <span className={`font-bold text-sm pr-4 leading-snug ${goal.status === 'failed' ? 'text-red-400/70 line-through' :
                                  'text-white'
                                  }`}>{goal.title}</span>
                                <div className="flex items-center gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus:opacity-100 group-focus:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto transition-all">
                                  <button onClick={() => setLongTermGoalModal({ show: true, type: 'monthly', goal: { ...goal } })} className="text-[#333] hover:text-blue-400 transition-all mt-0.5">
                                    <Settings className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => openGoalPsychoModal(goal, 'monthly')} className="text-[#333] hover:text-red-500 transition-all mt-0.5">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {/* IMÁGENES DE LA META (SOLO LECTURA EXTERNA) */}
                              {goal.images && goal.images.length > 0 && (
                                <div className="flex gap-1.5 mb-3 flex-wrap">
                                  {goal.images.map((img, i) => (
                                    <div key={i} className="relative">
                                      <img src={img} alt={`meta-img-${i}`} onClick={() => setGoalImgViewer({ show: true, src: img })} className="w-16 h-12 object-cover rounded-lg border border-[#333] cursor-zoom-in hover:scale-105 hover:border-blue-500/50 transition-all" />
                                    </div>
                                  ))}

                                </div>
                              )}

                              {/* FECHA */}
                              <p className="text-[#555] text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 mb-3">
                                <CalendarIcon className="w-2.5 h-2.5" /> {goal.startDate} → {goal.targetDate}
                              </p>

                              {/* FRASE + % */}
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest leading-tight ${goal.status === 'failed' ? 'text-red-500' :
                                  goal.status === 'achieved' || goal.status === 'achieved_early' ? cat.text :
                                    'text-[#666]'
                                  }`} style={{ maxWidth: '75%' }}>
                                  {getProgressPhrase(goal.progress, goal.status, cat.id)}
                                </span>
                                <span className={`text-base font-black tabular-nums ${goal.status === 'failed' ? 'text-red-500' :
                                  goal.status === 'achieved_early' ? 'text-yellow-400' :
                                    cat.text
                                  }`}>{goal.progress}%</span>
                              </div>

                              {/* BARRA DE PROGRESO */}
                              <div className="relative w-full h-3 bg-[#0a0a0a] rounded-full border border-[#1e1e1e] shadow-inner mb-3">
                                <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 overflow-hidden ${goal.status === 'achieved_early' ? 'bg-gradient-to-r from-yellow-600 to-yellow-300' :
                                  goal.status === 'failed' ? 'bg-gradient-to-r from-red-800 to-red-600' : ''
                                  }`} style={{
                                    width: `${goal.progress}%`,
                                    backgroundColor: (goal.status !== 'achieved_early' && goal.status !== 'failed') ? cat.accent : undefined,
                                    boxShadow: `0 0 10px ${cat.accent}80`
                                  }}>
                                  {/* Highlight pulse en la barra activa */}
                                  {goal.status === 'active' && goal.progress > 0 && (
                                    <div className="absolute top-0 right-0 h-full w-4 bg-white/20 rounded-full blur-sm animate-pulse" />
                                  )}
                                </div>

                                {/* TROFEO RÉCORD TEMPRANO (Absoluto al porcentaje exacto) */}
                                {goal.status === 'achieved_early' && (
                                  <div className="absolute top-1/2 -translate-y-1/2 -mt-0.5 flex flex-col items-center z-20" style={{ left: `max(5%, min(95%, ${goal.earlyPercentage}%))` }}>
                                    <div className="bg-[#0a0a0a] rounded-full p-1 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.6)] animate-pulse">
                                      <Trophy className="w-3.5 h-3.5 text-yellow-400 drop-shadow-md" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* RÉCORD TEMPRANO MENSAJE */}
                              {goal.status === 'achieved_early' && (
                                <div className="bg-yellow-950/40 border border-yellow-800/50 rounded-lg p-2.5 mb-2 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                    <div>
                                      <p className="text-yellow-400 text-[8px] font-black uppercase tracking-widest">Récord destrozado al {goal.earlyPercentage}%</p>
                                      <p className="text-yellow-700 text-[8px] font-bold">{goal.earlyDate}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* BOTÓN ROMPER LÍMITE — CERO LÍMITES */}
                              {goal.status === 'active' && goal.progress > 0 && goal.progress < 100 && (
                                <button onClick={() => handleBreakLimit(goal.id, 'monthly', goal.progress)}
                                  className="w-full py-2 mt-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300"
                                  style={{
                                    background: `linear-gradient(135deg, ${cat.accent}15, ${cat.accent}05)`,
                                    border: `1px solid ${cat.accent}40`,
                                    color: cat.accent,
                                    boxShadow: `0 0 12px ${cat.accent}10`
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = cat.accent; e.currentTarget.style.color = '#000'; e.currentTarget.style.boxShadow = `0 0 20px ${cat.accent}80`; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${cat.accent}15, ${cat.accent}05)`; e.currentTarget.style.color = cat.accent; e.currentTarget.style.boxShadow = `0 0 12px ${cat.accent}10`; }}>
                                  <Zap className="w-3 h-3" /> Derrumbé mi límite — Logrado antes del plazo
                                </button>
                              )}

                              {/* HONESTIDAD BRUTAL */}
                              {goal.status === 'pending_validation' && (
                                <div className="mt-2 bg-[#0a0a0a] border border-orange-900/50 p-3 rounded-xl">
                                  <p className="text-orange-400 text-[9px] font-black uppercase tracking-widest text-center mb-2.5">
                                    ⚠️ Honestidad Brutal — ¿Realmente lo conquistaste?
                                  </p>
                                  <div className="flex gap-2">
                                    <button onClick={() => handleConfirmGoal(goal.id, 'monthly', true)}
                                      className="flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                      ✔ Sí, lo conquisté
                                    </button>
                                    <button onClick={() => handleConfirmGoal(goal.id, 'monthly', false)}
                                      className="flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all bg-red-950/50 text-red-400 border border-red-900/50 hover:bg-red-700 hover:text-white hover:border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                      ✘ Fallé
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* ESTADOS FINALES */}
                              {goal.status === 'achieved' && (
                                <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest" style={{ background: `${cat.accent}10`, borderColor: `${cat.accent}40`, color: cat.accent }}>
                                  <Crown className="w-3 h-3" /> Objetivo Conquistado
                                </div>
                              )}
                              {goal.status === 'failed' && (
                                <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-950/40 border border-red-900/50 text-red-500 text-[9px] font-black uppercase tracking-widest">
                                  <AlertTriangle className="w-3 h-3" /> Misión Fallida
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* BOTÓN AÑADIR */}
                      <div className="p-3 pt-0">
                        <button onClick={() => setLongTermGoalModal({ show: true, type: 'monthly', goal: { id: `m_${Date.now()}`, title: '', category: cat.id, startDate: actualTodayStr, targetDate: actualTodayStr, progress: 0, status: 'active', monthIndex: selectedMonthIndex } })}
                          className={`w-full py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 border border-dashed ${cat.border} text-[#555] hover:${cat.text} hover:bg-[#1a1a1a]`}>
                          <Plus className="w-3.5 h-3.5" /> Añadir Objetivo
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* TARJETA: AGREGAR NUEVA CATEGORÍA (MENSUAL) */}
                  <div className="bg-[#0d0d0d] border-2 border-dashed border-[#222] rounded-2xl p-5 flex flex-col items-center justify-center min-h-[200px] hover:border-[#444] transition-all group cursor-pointer"
                    onClick={() => setAddCatModal({ show: true, context: 'monthly' })}>
                    <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-3 group-hover:border-[#555] transition-all">
                      <Plus className="w-5 h-5 text-[#555] group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-[#444] text-[9px] font-black uppercase tracking-widest text-center group-hover:text-[#666] transition-colors">Nueva Categoría</p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}


      {/* --- VISTA: PLANIFICACIÓN ANUAL --- */}
      {appMode === 'yearly_plan' && (
        <div className="max-w-[1800px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="text-center mb-8 mt-6">
            <h2 className="text-3xl md:text-5xl font-black text-purple-400 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              EL LEGADO <span className="text-white">{selectedYear}</span>
            </h2>
            <p className="text-purple-400 text-[10px] md:text-xs font-black uppercase tracking-widest mt-3 bg-purple-900/10 inline-block px-5 py-2 rounded-full border border-purple-500/20 shadow-inner">
              "Un año de enfoque absoluto para construir una vida de libertad."
            </p>
          </div>

          <div className="flex items-center justify-center gap-8 mt-6 mb-10">
            <button onClick={() => setSelectedYear(y => y - 1)} className="p-4 bg-black border border-[#333] rounded-2xl hover:border-purple-500 transition-colors shadow-xl"><ChevronLeft /></button>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase text-center min-w-[200px] tracking-tighter drop-shadow-md">{selectedYear}</h2>
            <button onClick={() => setSelectedYear(y => y + 1)} className="p-4 bg-black border border-[#333] rounded-2xl hover:border-purple-500 transition-colors shadow-xl"><ChevronRight /></button>
          </div>

          {/* 4 PILARES ANUALES + CATEGORÍAS PERSONALIZADAS */}
          {(() => {
            const overrides = config.yearlyDefaultOverrides || {};
            const buildCatY = (id, title, icon, accent) => {
              const ov = overrides[id] || {};
              if (ov.deleted) return null;
              const color = ov.color || accent;
              const r = parseInt(color.slice(1, 3), 16), g2 = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
              return {
                id, isDefault: true,
                title: ov.title || title,
                emoji: ov.emoji || null,
                icon: ov.emoji ? null : icon,
                bg: `rgba(${r},${g2},${b},0.1)`,
                border: `rgba(${r},${g2},${b},0.3)`,
                text: color,
                accent: color,
                glow: `rgba(${r},${g2},${b},0.15)`,
              };
            };
            const defaultYearlyCats = [
              buildCatY('income', 'Ingresos & Expansión', TrendingUp, '#10b981'),
              buildCatY('travel', 'Viajes & Libertad', Plane, '#0ea5e9'),
              buildCatY('family', 'Legado & Familia', Home, '#f59e0b'),
              buildCatY('personal', 'Evolución Suprema', Dumbbell, '#8b5cf6'),
            ].filter(Boolean);
            const customCatsYearly = (config.yearlyCustomCategories || []).map(c => {
              const cs = getColorStyle(c.color || '#10b981');
              return { ...c, isDefault: false, ...cs, emoji: c.emoji || '🎯', icon: null };
            });
            const allYearlyCats = [...defaultYearlyCats, ...customCatsYearly];
            const yCols = allYearlyCats.length <= 2 ? 'md:grid-cols-2' : allYearlyCats.length <= 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2 xl:grid-cols-3';

            return (
              <div className={`grid grid-cols-1 ${yCols} gap-5`}>
                {allYearlyCats.map(cat => {
                  const allGoalsInYear = config.yearlyGoals.filter(g => g.category === cat.id && g.yearIndex === selectedYear && g.status !== 'deleted');
                  const achievedYearCount = allGoalsInYear.filter(g => g.status === 'achieved' || g.status === 'achieved_early').length;
                  const failedYearCount = allGoalsInYear.filter(g => g.status === 'failed').length;
                  const activeYearCount = allGoalsInYear.filter(g => g.status === 'active' || g.status === 'pending_validation').length;
                  return (
                    <div key={cat.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ boxShadow: `0 0 30px ${cat.glow}` }}>
                      {/* HEADER */}
                      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1e1e1e]" style={{ background: `linear-gradient(135deg, ${cat.glow.replace('0.15', '0.3')} 0%, transparent 100%)` }}>
                        <div className="p-2.5 rounded-xl border shadow-lg flex items-center justify-center" style={{ background: cat.bg, borderColor: cat.border }}>
                          {cat.emoji ? <span style={{ fontSize: '16px' }}>{cat.emoji}</span> : cat.icon ? <cat.icon className="w-4 h-4" style={{ color: cat.text }} /> : <span style={{ fontSize: '16px' }}>🎯</span>}
                        </div>
                        <h3 className="font-black uppercase text-xs tracking-widest flex-1" style={{ color: cat.text }}>{cat.title}</h3>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setLongTermGoalModal({ show: true, type: 'yearly', goal: { id: `y_${Date.now()}`, title: '', category: cat.id, startDate: actualTodayStr, targetDate: `${selectedYear}-12-31`, progress: 0, status: 'active', yearIndex: selectedYear } })}
                            className="p-1.5 rounded-lg bg-[#1a1a1a] text-[#555] hover:text-white border border-[#333] hover:border-[#555] transition-all">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => {
                            setAddCatEmoji(cat.emoji || '🎯');
                            setAddCatColor(cat.accent || '#10b981');
                            setAddCatName(cat.title);
                            setAddCatModal({ show: true, context: 'yearly', editCat: cat });
                          }} className="p-1.5 rounded-lg text-[#555] hover:text-blue-400 border border-[#222] hover:border-blue-900/50 transition-all" title="Editar">
                            <SlidersHorizontal className="w-3 h-3" />
                          </button>
                          <button onClick={() => setDeleteCatModal({ show: true, catId: cat.id, catTitle: cat.title, isDefault: !!cat.isDefault, context: 'yearly' })}
                            className="p-1.5 rounded-lg text-[#333] hover:text-red-500 border border-[#222] hover:border-red-900/50 transition-all" title="Eliminar">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {/* FILTROS */}
                      <div className="px-3 py-2 flex items-center gap-1.5 flex-wrap border-b border-[#1a1a1a]">
                        {[{ k: 'all', label: 'Todas', count: allGoalsInYear.length, color: 'text-[#888]' }, { k: 'active', label: 'Activas', count: activeYearCount, color: cat.text }, { k: 'achieved', label: 'Logradas', count: achievedYearCount, color: 'text-emerald-400' }, { k: 'failed', label: 'Fallidas', count: failedYearCount, color: 'text-red-400' }].map(f => (
                          <button key={f.k} onClick={() => setGoalFilter(f.k)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${goalFilter === f.k ? `bg-[#222] ${f.color} border border-[#444]` : 'text-[#444] hover:text-[#666]'
                              }`}>
                            {f.label} <span className={`ml-0.5 ${f.color}`}>{f.count}</span>
                          </button>
                        ))}
                      </div>
                      {/* LISTA METAS */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 p-4 min-h-[250px] max-h-[500px]">
                        {config.yearlyGoals.filter(g => g.category === cat.id && g.yearIndex === selectedYear && (goalFilter === 'all' || g.status === goalFilter)).length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full opacity-30 mt-10">
                            <ShieldAlert className={`w-10 h-10 text-[#555] mb-3`} />
                            <p className="text-[#555] text-[10px] font-black uppercase tracking-widest text-center">{goalFilter === 'all' ? 'Fija tu visión anual.' : 'Sin metas en este filtro.'}</p>
                          </div>
                        ) : (
                          config.yearlyGoals.filter(g => g.category === cat.id && g.yearIndex === selectedYear && (goalFilter === 'all' || g.status === goalFilter)).map(goal => (
                            <div key={goal.id} tabIndex="0" className={`p-4 rounded-xl relative group border transition-all duration-300 focus:outline-none ${goal.status === 'failed' ? 'bg-red-950/30 border-red-900/50' :
                              goal.status === 'achieved' || goal.status === 'achieved_early' ? 'bg-[#0f1a12] border-emerald-900/40' :
                                'bg-[#111] border-[#222] hover:border-[#333]'
                              }`}>
                              {/* TÍTULO + ACCIONES */}
                              <div className="flex justify-between items-start mb-2">
                                <span className={`font-black text-base pr-4 leading-snug ${goal.status === 'failed' ? 'text-red-400/70 line-through' : 'text-white'
                                  }`}>{goal.title}</span>
                                <div className="flex items-center gap-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus:opacity-100 group-focus:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto transition-all">
                                  <button onClick={() => setLongTermGoalModal({ show: true, type: 'yearly', goal: { ...goal } })} className="text-[#333] hover:text-blue-400 transition-all">
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => openGoalPsychoModal(goal, 'yearly')} className="text-[#333] hover:text-red-500 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {/* IMÁGENES DE LA META (SOLO LECTURA EXTERNA) */}
                              {goal.images && goal.images.length > 0 && (
                                <div className="flex gap-1.5 mb-3 flex-wrap">
                                  {goal.images.map((img, i) => (
                                    <div key={i} className="relative">
                                      <img src={img} alt={`ygoal-img-${i}`} onClick={() => setGoalImgViewer({ show: true, src: img })} className="w-16 h-12 object-cover rounded-lg border border-[#333] hover:scale-105 transition-transform cursor-zoom-in" />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* FECHA */}
                              <p className="text-[#555] text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 mb-3">
                                <Target className="w-2.5 h-2.5" /> {goal.startDate} → {goal.targetDate}
                              </p>
                              {/* FRASE + % */}
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${goal.status === 'failed' ? 'text-red-500' : cat.text
                                  }`} style={{ maxWidth: '75%' }}>{getProgressPhrase(goal.progress, goal.status, cat.id)}</span>
                                <span className={`text-lg font-black ${goal.status === 'failed' ? 'text-red-500' : goal.status === 'achieved_early' ? 'text-yellow-400' : cat.text
                                  }`}>{goal.progress}%</span>
                              </div>
                              {/* BARRA */}
                              <div className="relative w-full h-4 bg-[#0a0a0a] rounded-full border border-[#1e1e1e] shadow-inner mb-3">
                                <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 overflow-hidden ${goal.status === 'achieved_early' ? 'bg-gradient-to-r from-yellow-600 to-yellow-300' :
                                  goal.status === 'failed' ? 'bg-gradient-to-r from-red-800 to-red-600' : ''
                                  }`} style={{ width: `${goal.progress}%`, backgroundColor: (goal.status !== 'achieved_early' && goal.status !== 'failed') ? cat.accent : undefined, boxShadow: `0 0 15px ${cat.accent}80` }}>
                                  {goal.status === 'active' && goal.progress > 0 && <div className="absolute top-0 right-0 h-full w-5 bg-white/10 rounded-full blur-sm animate-pulse" />}
                                </div>

                                {/* TROFEO RÉCORD TEMPRANO (Absoluto al porcentaje exacto) */}
                                {goal.status === 'achieved_early' && (
                                  <div className="absolute top-1/2 -translate-y-1/2 -mt-0.5 flex flex-col items-center z-20" style={{ left: `max(5%, min(95%, ${goal.earlyPercentage}%))` }}>
                                    <div className="bg-[#0a0a0a] rounded-full p-1.5 border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-pulse">
                                      <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-md" />
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* RÉCORD TEMPRANO MENSAJE */}
                              {goal.status === 'achieved_early' && (
                                <div className="bg-yellow-950/40 border border-yellow-800/50 rounded-lg p-3 mb-2 flex items-center gap-3">
                                  <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                                  <div>
                                    <p className="text-yellow-400 text-[9px] font-black uppercase tracking-widest">Récord destrozado al {goal.earlyPercentage}%</p>
                                    <p className="text-yellow-700 text-[8px] font-bold mt-0.5">{goal.earlyDate}</p>
                                  </div>
                                </div>
                              )}
                              {/* BOTÓN ROMPER */}
                              {goal.status === 'active' && goal.progress > 0 && goal.progress < 100 && (
                                <button onClick={() => handleBreakLimit(goal.id, 'yearly', goal.progress)}
                                  className="w-full py-2 mt-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300"
                                  style={{ background: `linear-gradient(135deg,${cat.accent}15,${cat.accent}05)`, border: `1px solid ${cat.accent}40`, color: cat.accent }}
                                  onMouseEnter={e => { e.currentTarget.style.background = cat.accent; e.currentTarget.style.color = '#000'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg,${cat.accent}15,${cat.accent}05)`; e.currentTarget.style.color = cat.accent; }}>
                                  <Zap className="w-3 h-3" /> Derrumbé mi límite — Logrado antes del plazo
                                </button>
                              )}
                              {/* HONESTIDAD BRUTAL */}
                              {goal.status === 'pending_validation' && (
                                <div className="mt-2 bg-[#0a0a0a] border border-orange-900/50 p-3 rounded-xl">
                                  <p className="text-orange-400 text-[9px] font-black uppercase tracking-widest text-center mb-2.5">⚠️ Honestidad Brutal — ¿Realmente conquistaste tu año?</p>
                                  <div className="flex gap-2">
                                    <button onClick={() => handleConfirmGoal(goal.id, 'yearly', true)} className="flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-600 hover:text-white transition-all">✔ Sí, lo conquisté</button>
                                    <button onClick={() => handleConfirmGoal(goal.id, 'yearly', false)} className="flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-950/50 text-red-400 border border-red-900/50 hover:bg-red-700 hover:text-white transition-all">✘ Fallé</button>
                                  </div>
                                </div>
                              )}
                              {/* ESTADOS FINALES */}
                              {goal.status === 'achieved' && (
                                <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest" style={{ background: `${cat.accent}10`, borderColor: `${cat.accent}40`, color: cat.accent }}>
                                  <Trophy className="w-3 h-3" /> Promesa Anual Cumplida
                                </div>
                              )}
                              {goal.status === 'failed' && (
                                <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-950/40 border border-red-900/50 text-red-500 text-[9px] font-black uppercase tracking-widest">
                                  <AlertTriangle className="w-3 h-3" /> Promesa Anual Rota
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* TARJETA: AGREGAR NUEVA CATEGORÍA ANUAL */}
                <div className="bg-[#0d0d0d] border-2 border-dashed border-[#1e1e1e] rounded-2xl p-5 flex flex-col items-center justify-center min-h-[250px] hover:border-[#333] transition-all group cursor-pointer"
                  onClick={() => setAddCatModal({ show: true, context: 'yearly' })}>
                  <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-3 group-hover:border-[#555] transition-all">
                    <Plus className="w-6 h-6 text-[#555] group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-[#444] text-[9px] font-black uppercase tracking-widest text-center group-hover:text-[#666] transition-colors">Nueva Categoría</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* --- MODAL CREAR / EDITAR CATEGORÍA (con Emoji + Color) --- */}
      {addCatModal.show && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/98 backdrop-blur-md p-4">
          <div className="bg-[#0A0F1C] border border-[#1E293B] rounded-[2rem] p-6 md:p-10 w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in zoom-in-95 relative overflow-y-auto max-h-[95vh] custom-scrollbar">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="flex justify-between items-center mb-6 border-b border-[#1E293B] pb-4">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-3 tracking-tighter">
                <SlidersHorizontal className="text-blue-400 w-5 h-5" />
                {addCatModal.editCat ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={() => { setAddCatModal({ show: false, context: 'monthly', editCat: null }); setAddCatName(''); setAddCatEmoji('🎯'); setAddCatColor('#10b981'); }} className="p-2 bg-[#02040A] border border-[#1E293B] hover:border-red-500 hover:text-red-500 text-[#64748B] rounded-xl transition-all"><X /></button>
            </div>
            <div className="space-y-5">
              {/* Preview */}
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#1E293B] bg-[#02040A]">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2" style={{ background: `${addCatColor}18`, borderColor: `${addCatColor}50` }}>
                  {addCatEmoji}
                </div>
                <div>
                  <p className="text-white font-black text-sm uppercase tracking-widest">{addCatName || 'NUEVA CATEGORÍA'}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: addCatColor }}>● Categoría activa</p>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="text-[10px] text-[#64748B] uppercase font-black tracking-widest mb-2 block ml-1">Nombre</label>
                <input type="text" placeholder="Ej. Salud, Tecnología, Arte..." value={addCatName} onChange={e => setAddCatName(e.target.value)}
                  className="w-full bg-[#02040A] border border-[#1E293B] p-4 rounded-xl text-sm font-bold text-white focus:border-blue-500 outline-none shadow-inner transition-colors" />
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="text-[10px] text-[#64748B] uppercase font-black tracking-widest mb-2 block ml-1">Emoji / Icono</label>
                <div className="grid grid-cols-10 gap-1.5 p-3 bg-[#02040A] rounded-xl border border-[#1E293B] max-h-40 overflow-y-auto custom-scrollbar">
                  {CAT_EMOJIS.map(e => (
                    <button key={e} onClick={() => setAddCatEmoji(e)}
                      className={`text-lg p-1 rounded-lg transition-all hover:scale-125 ${addCatEmoji === e ? 'bg-white/10 scale-110 ring-2 ring-blue-500' : ''}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="text-[10px] text-[#64748B] uppercase font-black tracking-widest mb-2 block ml-1">Color</label>
                <div className="flex gap-2 flex-wrap p-3 bg-[#02040A] rounded-xl border border-[#1E293B]">
                  {CAT_COLORS.map(c => (
                    <button key={c} onClick={() => setAddCatColor(c)}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${addCatColor === c ? 'ring-2 ring-white scale-110 ring-offset-2 ring-offset-black' : ''}`}
                      style={{ background: c, boxShadow: addCatColor === c ? `0 0 15px ${c}` : 'none' }} />
                  ))}
                </div>
              </div>

              <button onClick={handleSaveCategory} disabled={!addCatName.trim()}
                className={`w-full py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all ${addCatName.trim() ? 'text-black shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-[#1E293B] text-[#64748B] cursor-not-allowed'}`}
                style={addCatName.trim() ? { background: addCatColor, boxShadow: `0 0 20px ${addCatColor}60` } : {}}>
                {addCatModal.editCat ? '✔ Guardar Cambios' : '+ Crear Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN ELIMINAR SOCIO */}
      {guestToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/98 backdrop-blur-md p-4 text-center">
          <div className="bg-[#0A0F1C] border border-red-500/50 rounded-[2rem] p-6 md:p-12 w-full max-w-md shadow-[0_0_80px_rgba(239,68,68,0.2)] animate-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse premium-glow" />
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase mb-2 tracking-tighter">REVOCAR ACCESO</h3>
            <p className="text-[#64748B] text-[10px] font-black uppercase tracking-[0.2em] mb-6">¿Deseas expulsar a <span className="text-white">{guestToDelete.name}</span>?</p>

            <div className="flex flex-col gap-3 mt-8">
              <button onClick={() => setGuestToDelete(null)} className="w-full py-4 bg-[#111] hover:bg-[#222] text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all">
                MANTENER EN LA RED
              </button>
              <button onClick={async () => {
                try {
                  const updated = allowedUsers.filter(x => x.email !== guestToDelete.email);
                  await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'allowed_users', 'list'), { users: updated }, { merge: true });
                  setGuestToDelete(null);
                } catch (err) {
                  console.error(err);
                  alert("Error al eliminar: " + err.message);
                }
              }} className="w-full py-4 bg-transparent text-red-500 border border-red-500/30 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-900/20 transition-all opacity-80 hover:opacity-100 flex items-center justify-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> SÍ, ELIMINAR Y DENEGAR ACCESO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CONFIRMACIÓN ELIMINAR CATEGORÍA (AGRESIVO) --- */}
      {deleteCatModal.show && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/99 backdrop-blur-md p-4 text-center">
          <div className={`rounded-[2rem] p-6 md:p-12 w-full max-w-md shadow-[0_0_80px_rgba(239,68,68,0.4)] animate-in zoom-in-95 border-2 max-h-[95vh] overflow-y-auto custom-scrollbar ${deleteCatModal.isDefault ? 'bg-[#0A0000] border-red-500/80' : 'bg-[#0A0F1C] border-red-500/50'}`}>
            <div className="mb-2">{deleteCatModal.isDefault ? '☠️' : '⚠️'}</div>
            <h3 className="text-2xl md:text-3xl font-black text-red-500 uppercase tracking-tighter mb-2">
              {deleteCatModal.isDefault ? '¡ADVERTENCIA CRÍTICA!' : 'CONFIRMAR ELIMINACIÓN'}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#666] mb-6">
              {deleteCatModal.isDefault
                ? 'Estás a punto de destruir un pilar fundamental'
                : 'Esta acción es irreversible'}
            </p>

            <div className={`p-5 rounded-2xl mb-6 border ${deleteCatModal.isDefault ? 'bg-red-950/40 border-red-700/50' : 'bg-[#0d0d0d] border-red-900/30'}`}>
              {deleteCatModal.isDefault ? (
                <p className="text-white text-sm leading-relaxed font-bold">
                  Vas a eliminar <span className="text-red-400 font-black">"{deleteCatModal.catTitle}"</span>, uno de los <span className="text-red-400">4 Pilares Estratégicos</span> del sistema. <br /><br />
                  <span className="text-red-300">TODAS las metas dentro de esta categoría serán destruidas para siempre.</span> No hay papelera. No hay vuelta atrás. <br /><br />
                  <span className="text-yellow-400 text-xs uppercase tracking-widest font-black">¿Estás completamente seguro de esto?</span>
                </p>
              ) : (
                <p className="text-[#E2E8F0] text-sm leading-relaxed font-bold">
                  Se eliminará <span className="text-red-400 font-black">"{deleteCatModal.catTitle}"</span> y todas sus metas asociadas de forma permanente.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => setDeleteCatModal({ show: false, catId: null, catTitle: '', isDefault: false, context: 'monthly' })}
                className="w-full py-4 bg-[#1a1a1a] text-white border border-[#333] font-black uppercase text-xs tracking-widest rounded-xl hover:border-[#555] transition-all flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" /> Cancelar — Mantener categoría
              </button>
              <button onClick={handleDeleteCategory}
                className={`w-full py-4 font-black uppercase text-xs tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${deleteCatModal.isDefault ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-red-950/50 text-red-400 border border-red-800/50 hover:bg-red-600 hover:text-white'}`}>
                <Trash2 className="w-4 h-4" />
                {deleteCatModal.isDefault ? 'SÍ, DESTRUIR ESTE PILAR' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VISOR DE IMAGEN EN GRANDE --- */}
      {goalImgViewer.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/99 backdrop-blur-xl p-4" onClick={() => setGoalImgViewer({ show: false, src: '' })}>
          <img src={goalImgViewer.src} alt="Meta visual" className="max-w-full max-h-full rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] object-contain" />
        </div>
      )}

      {/* --- MODAL PARA CREAR/EDITAR METAS A LARGO PLAZO (CON SIMULADOR Y TYPEWRITER) --- */}
      {longTermGoalModal.show && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/98 backdrop-blur-md p-4">
          <div className="bg-[#0A0F1C] border border-[#1E293B] rounded-[2rem] p-6 md:p-12 w-full max-w-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in zoom-in-95 relative overflow-y-auto max-h-[95vh] custom-scrollbar">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${longTermGoalModal.type === 'monthly' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>

            <div className="flex justify-between items-center mb-6 border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="text-2xl font-black text-white uppercase flex items-center gap-3 tracking-tighter">
                  {longTermGoalModal.type === 'monthly' ? <Map className="text-emerald-500 w-6 h-6" /> : <Compass className="text-purple-500 w-6 h-6" />}
                  {longTermGoalModal.type === 'monthly' ? 'Nuevo Objetivo Mensual' : 'Nueva Promesa Anual'}
                </h3>
              </div>
              <button onClick={() => setLongTermGoalModal({ show: false, goal: null, type: 'monthly' })} className="p-2 bg-[#02040A] border border-[#1E293B] hover:border-red-500 hover:text-red-500 text-[#64748B] rounded-xl transition-all shadow-inner"><X /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-[#64748B] uppercase font-black tracking-widest mb-3 block ml-1">Pilar Estratégico</label>
                <div className="grid grid-cols-2 gap-3">
                  {getActiveCategoriesForModal(longTermGoalModal.type).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setLongTermGoalModal({ ...longTermGoalModal, goal: { ...longTermGoalModal.goal, category: cat.id } })}
                      className={`py-3 md:py-4 px-2 md:px-4 rounded-xl flex items-center justify-center gap-2 border-2 transition-all font-black uppercase text-[10px] md:text-xs tracking-widest ${longTermGoalModal.goal.category === cat.id ? `shadow-lg scale-105 relative z-10` : 'bg-[#02040A] border-[#1E293B] text-[#64748B] hover:border-[#333]'}`}
                      style={longTermGoalModal.goal.category === cat.id ? { background: cat.bg, borderColor: cat.border, color: cat.text } : {}}
                    >
                      {cat.emoji ? <span style={{ fontSize: '16px' }}>{cat.emoji}</span> : cat.icon ? <cat.icon className="w-4 h-4 shrink-0" style={{ color: cat.text }} /> : null}
                      <span className="truncate">{cat.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#64748B] uppercase font-black tracking-widest mb-2 block ml-1 flex items-center gap-2">
                  <Target className="w-3 h-3 text-blue-500" /> ¿Qué vas a conquistar?
                </label>
                <input
                  type="text"
                  value={longTermGoalModal.goal.title}
                  onChange={e => setLongTermGoalModal({ ...longTermGoalModal, goal: { ...longTermGoalModal.goal, title: e.target.value } })}
                  placeholder={longTermGoalModal.goal.title ? '' : twGoalPlaceholder}
                  className="w-full bg-[#02040A] border border-[#1E293B] p-4 md:p-5 rounded-xl text-base md:text-lg font-bold text-white focus:border-blue-500 outline-none shadow-inner transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#64748B] uppercase font-black tracking-widest mb-2 block ml-1">Día de Inicio</label>
                  <input
                    type="date"
                    value={longTermGoalModal.goal.startDate || actualTodayStr}
                    onChange={e => setLongTermGoalModal({ ...longTermGoalModal, goal: { ...longTermGoalModal.goal, startDate: e.target.value } })}
                    className="w-full bg-[#02040A] border border-[#1E293B] p-4 rounded-xl text-sm font-bold text-[#888] focus:text-white focus:border-blue-500 outline-none shadow-inner transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748B] uppercase font-black tracking-widest mb-2 block ml-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={longTermGoalModal.goal.targetDate}
                    onChange={e => setLongTermGoalModal({ ...longTermGoalModal, goal: { ...longTermGoalModal.goal, targetDate: e.target.value } })}
                    className="w-full bg-[#02040A] border border-[#1E293B] p-4 rounded-xl text-sm font-bold text-[#888] focus:text-white focus:border-blue-500 outline-none shadow-inner transition-colors"
                  />
                </div>
              </div>

              {/* IMÁGENES DENTRO DEL MODAL (CONFIGURACIÓN) */}
              <div className="bg-[#02040A] border border-[#1E293B] rounded-xl p-4">
                <label className="text-[10px] text-[#64748B] uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                  <ImagePlus className="w-3 h-3 text-blue-500" /> Referencias Visuales ({(longTermGoalModal.goal?.images || []).length}/3)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(longTermGoalModal.goal?.images || []).map((img, i) => (
                    <div key={i} className="relative group/img">
                      <img src={img} alt={`ref-img-${i}`} onClick={() => setGoalImgViewer({ show: true, src: img })} className="w-20 h-14 object-cover rounded-lg border border-[#1E293B] cursor-zoom-in hover:scale-105 transition-all" />
                      <button onClick={() => {
                        setLongTermGoalModal(prev => ({ ...prev, goal: { ...prev.goal, images: prev.goal.images.filter((_, idx) => idx !== i) } }));
                      }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 border-2 border-[#0A0F1C] rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10 shadow-lg hover:scale-110">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {(!longTermGoalModal.goal?.images || longTermGoalModal.goal.images.length < 3) && (
                    <button onClick={() => goalFileInputRef.current?.click()} className="w-20 h-14 rounded-lg border-2 border-dashed border-[#1E293B] flex flex-col items-center justify-center text-[#64748B] hover:text-blue-400 hover:border-blue-500/50 transition-all bg-[#02040A] group/btn">
                      <Plus className="w-4 h-4 mb-0.5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  )}
                </div>
              </div>

              {/* RENDERIZADO DEL MINI CALENDARIO SIMULADOR */}
              {renderMiniCalendarSimulator()}

            </div>

            <button
              onClick={handleSaveLongTermGoal}
              disabled={!longTermGoalModal.goal.title.trim()}
              className={`w-full mt-8 py-5 rounded-xl font-black uppercase text-sm tracking-widest transition-all shadow-[0_0_20px_rgba(0,0,0,0.4)] flex items-center justify-center gap-2 ${longTermGoalModal.goal.title.trim() ? (longTermGoalModal.type === 'monthly' ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]') : 'bg-[#1E293B] text-[#64748B] cursor-not-allowed'}`}
            >
              <Target className="w-5 h-5" /> Sellar Objetivo Estratégico
            </button>
          </div>
        </div>
      )}

      {/* --- NUEVO: MODAL PSICOLÓGICO PARA ELIMINACIÓN DE METAS (CON 3 BOTONES) --- */}
      {goalPsychoModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-md p-4 text-center">
          <div className="bg-[#0A0F1C] border border-red-500/50 rounded-[2rem] p-6 md:p-12 w-full max-w-xl shadow-[0_0_80px_rgba(239,68,68,0.2)] animate-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse premium-glow" />
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase mb-2 tracking-tighter">ALERTA TÁCTICA</h3>
            <p className="text-[#64748B] text-[10px] font-black uppercase tracking-[0.2em] mb-6">Intentas abandonar un objetivo {goalPsychoModal.type === 'monthly' ? 'mensual' : 'anual'}</p>

            <div className="bg-[#02040A] border border-red-900/30 p-5 rounded-xl mb-8 shadow-inner">
              <p className="text-[#E2E8F0] text-sm md:text-base leading-relaxed italic font-bold">
                "{goalPsychoQuotes[goalPsychoModal.type][goalPsychoModal.category]?.[goalPsychoQuoteIdx] || '¿Vas a rendirte? Borrar una meta es firmar tu mediocridad.'}"
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => setGoalPsychoModal({ show: false, goalId: null, type: 'monthly', category: 'income', title: '' })} className="w-full py-4 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" /> Me mantengo firme
              </button>

              <button onClick={handleEvolveGoal} className="w-full py-4 bg-[#02040A] text-[#E2E8F0] border border-[#1E293B] font-black uppercase text-xs tracking-widest rounded-xl hover:bg-[#111] hover:border-blue-500/50 transition-all flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Renovar por algo mejor
              </button>

              <button onClick={handleConfirmKillGoal} className="w-full mt-4 py-3 bg-transparent text-red-500 border border-red-500/30 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-900/20 transition-all opacity-80 hover:opacity-100 flex items-center justify-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> Me rindo. Eliminar definitivamente.
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL CONFIGURADOR PRECISION */}
      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#111] border border-[#333] rounded-3xl p-8 w-full max-w-3xl shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh] custom-scrollbar relative z-[110]">
            <div className="flex justify-between items-center mb-6 border-b border-[#222] pb-4 sticky top-0 bg-[#111] z-20">
              <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3"><Clock className="text-blue-500 w-6 h-6" /> Arquitectura de Operación</h3>
              <button onClick={() => { setEditingTask(null); setActiveTimeTab(null); }} className="p-2 hover:bg-red-500 rounded transition-colors"><X /></button>
            </div>

            {isEditingNameEmpty && (
              <div className="mb-4 bg-orange-900/20 border border-orange-500/50 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="text-orange-500 w-5 h-5 shrink-0" />
                <p className="text-orange-400 text-xs font-black uppercase tracking-widest">Debes asignar un nombre a la operación.</p>
              </div>
            )}

            {currentEditingOverlaps.length > 0 && !editingTask.task.isFlexible && (
              <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-2 text-red-500 font-black uppercase text-sm"><AlertTriangle className="w-5 h-5" /> ¡Choque de Agendas Detectado!</div>
                <p className="text-[#888] text-xs">No puedes clonarte. Cambia el horario o el día, porque choca con:</p>
                <ul className="mt-2 space-y-1">
                  {currentEditingOverlaps.map(o => (
                    <li key={o.id} className="text-red-400 text-xs font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {o.name} ({formatAMPM(o.startTime)} - {formatAMPM(o.endTime)})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-6 relative">
              <div>
                <label className={`text-[10px] uppercase font-black mb-2 flex items-center gap-2 ${editingTask.category === 'workTasks' ? 'text-blue-400' : 'text-purple-400'}`}>
                  {editingTask.category === 'workTasks' ? (
                    <><Briefcase className="w-4 h-4" /> Nombre de la Operación Estratégica (Negocio)</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Nombre de la Directriz de Hábito (Rendimiento)</>
                  )}
                </label>
                <input
                  type="text" placeholder={editingTask.task.name ? '' : placeholderText} value={editingTask.task.name}
                  onChange={e => setEditingTask({ ...editingTask, task: { ...editingTask.task, name: e.target.value } })}
                  className={`w-full bg-[#1a1a1a] border ${isEditingNameEmpty ? 'border-orange-500/50 focus:border-orange-500' : 'border-[#333] focus:border-blue-500'} text-white p-4 rounded-xl font-black text-lg outline-none transition-colors shadow-inner placeholder:text-[#444] placeholder:italic`}
                />
              </div>

              <div className="bg-[#050505] p-2 rounded-xl border border-[#222] flex gap-2">
                <button onClick={() => { setEditingTask({ ...editingTask, task: { ...editingTask.task, isFlexible: false } }); setActiveTimeTab(null); }} className={`flex-1 py-3 rounded-lg font-black uppercase text-xs transition-all flex items-center justify-center gap-2 ${!editingTask.task.isFlexible ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent text-[#666] hover:text-white'}`}>
                  <Clock className="w-4 h-4" /> Bloque Estricto
                </button>
                <button onClick={() => { setEditingTask({ ...editingTask, task: { ...editingTask.task, isFlexible: true } }); setActiveTimeTab(null); }} className={`flex-1 py-3 rounded-lg font-black uppercase text-xs transition-all flex items-center justify-center gap-2 ${editingTask.task.isFlexible ? 'bg-purple-600 text-white shadow-lg' : 'bg-transparent text-[#666] hover:text-white'}`}>
                  <Zap className="w-4 h-4" /> Hábito Flexible
                </button>
              </div>

              {!editingTask.task.isFlexible && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border-2 transition-all ${activeTimeTab === 'start-h' || activeTimeTab === 'start-m' ? 'border-blue-500 bg-blue-900/10' : 'border-[#222] bg-[#050505] hover:border-[#444]'}`}>
                      <div className="text-[10px] text-[#888] uppercase font-black mb-2 text-center md:text-left">Hora de Inicio</div>
                      <div className="flex flex-col md:flex-row items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input type="text" value={to12h(editingTask.task.startTime).h12} onClick={() => setActiveTimeTab('start-h')} onChange={e => { handleTimeChange('startTime', 'h12', e.target.value); setActiveTimeTab('start-h'); }} className="w-14 md:w-16 h-12 text-center bg-[#111] hover:bg-[#222] cursor-pointer text-white text-2xl font-black rounded-lg border border-[#333] focus:border-blue-500 outline-none transition-colors" />
                          <span className="text-xl text-[#666] font-black">:</span>
                          <input type="text" value={to12h(editingTask.task.startTime).m} onClick={() => setActiveTimeTab('start-m')} onChange={e => { handleTimeChange('startTime', 'm', e.target.value); setActiveTimeTab('start-m'); }} className="w-14 md:w-16 h-12 text-center bg-[#111] hover:bg-[#222] cursor-pointer text-white text-2xl font-black rounded-lg border border-[#333] focus:border-blue-500 outline-none transition-colors" />
                        </div>
                        <button onClick={() => handleTimeChange('startTime', 'ampm', to12h(editingTask.task.startTime).ampm === 'AM' ? 'PM' : 'AM')} className="md:ml-auto w-full md:w-auto bg-[#222] text-white font-black text-lg px-4 py-2 rounded-lg border border-[#444] hover:bg-blue-600 hover:border-blue-500 transition-colors shadow-md">{to12h(editingTask.task.startTime).ampm}</button>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border-2 transition-all ${activeTimeTab === 'end-h' || activeTimeTab === 'end-m' ? 'border-blue-500 bg-blue-900/10' : 'border-[#222] bg-[#050505] hover:border-[#444]'}`}>
                      <div className="text-[10px] text-[#888] uppercase font-black mb-2 text-center md:text-left">Hora de Fin</div>
                      <div className="flex flex-col md:flex-row items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input type="text" value={to12h(editingTask.task.endTime).h12} onClick={() => setActiveTimeTab('end-h')} onChange={e => { handleTimeChange('endTime', 'h12', e.target.value); setActiveTimeTab('end-h'); }} className="w-14 md:w-16 h-12 text-center bg-[#111] hover:bg-[#222] cursor-pointer text-white text-2xl font-black rounded-lg border border-[#333] focus:border-blue-500 outline-none transition-colors" />
                          <span className="text-xl text-[#666] font-black">:</span>
                          <input type="text" value={to12h(editingTask.task.endTime).m} onClick={() => setActiveTimeTab('end-m')} onChange={e => { handleTimeChange('endTime', 'm', e.target.value); setActiveTimeTab('end-m'); }} className="w-14 md:w-16 h-12 text-center bg-[#111] hover:bg-[#222] cursor-pointer text-white text-2xl font-black rounded-lg border border-[#333] focus:border-blue-500 outline-none transition-colors" />
                        </div>
                        <button onClick={() => handleTimeChange('endTime', 'ampm', to12h(editingTask.task.endTime).ampm === 'AM' ? 'PM' : 'AM')} className="md:ml-auto w-full md:w-auto bg-[#222] text-white font-black text-lg px-4 py-2 rounded-lg border border-[#444] hover:bg-blue-600 hover:border-blue-500 transition-colors shadow-md">{to12h(editingTask.task.endTime).ampm}</button>
                      </div>
                    </div>
                  </div>

                  {activeTimeTab && (
                    <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5 shadow-inner mt-2 animate-in slide-in-from-top-2 duration-300">
                      <div className="text-xs text-blue-500 font-black uppercase tracking-widest mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Radar Táctico - {activeTimeTab.includes('-h') ? 'SELECCIONAR HORA' : 'SELECCIONAR MINUTO'}
                          ({activeTimeTab.includes('start') ? to12h(editingTask.task.startTime).ampm : to12h(editingTask.task.endTime).ampm})
                        </div>
                        <button onClick={() => setActiveTimeTab(null)} className="text-[#666] hover:text-white"><X className="w-4 h-4" /></button>
                      </div>

                      {activeTimeTab.includes('-h') && (
                        <div key={activeTimeTab.includes('start') ? to12h(editingTask.task.startTime).ampm : to12h(editingTask.task.endTime).ampm} className="grid grid-cols-4 sm:grid-cols-6 gap-3 animate-in fade-in duration-300">
                          {getHalfHourSlots(activeTimeTab.includes('start') ? to12h(editingTask.task.startTime).ampm : to12h(editingTask.task.endTime).ampm).map(slot => {
                            const collision = checkSlotOverlapFull(slot.mins, editingTask.task, allWorkTasksForCollision, allHabitsForCollision);
                            const isOccupied = collision.isOccupied;
                            const isSelectedPreview = slot.mins >= startMinsGlobal && slot.mins < endMinsGlobal;
                            const targetTimeMins = timeToMinutes(activeTimeTab.includes('start') ? editingTask.task.startTime : editingTask.task.endTime);
                            const isExactSelection = targetTimeMins >= slot.mins && targetTimeMins < slot.mins + 30;

                            let btnClass = "bg-[#0d0d0d] text-[#aaa] border border-[#2a2a2a] hover:bg-blue-600 hover:text-white hover:border-blue-500 hover:scale-105 hover:shadow-[0_0_12px_rgba(59,130,246,0.4)]";
                            if (collision.type === 'task') btnClass = "bg-orange-950/60 text-orange-400/80 border border-orange-700/50 cursor-not-allowed";
                            else if (collision.type === 'habit') btnClass = "bg-violet-950/60 text-violet-400/80 border border-violet-700/50 cursor-not-allowed";
                            else if (isExactSelection) btnClass = "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.7)] scale-105 border-blue-400 z-10 relative";
                            else if (isSelectedPreview) btnClass = "bg-blue-900/40 text-blue-300 border-blue-800/50 relative z-0";

                            const shortName = collision.name ? (collision.name.length > 9 ? collision.name.slice(0, 9) + '…' : collision.name) : '';

                            return (
                              <button key={slot.label} disabled={isOccupied} onClick={() => setExactTime(activeTimeTab.includes('start') ? 'startTime' : 'endTime', slot.h12, slot.m, activeTimeTab.includes('start') ? to12h(editingTask.task.startTime).ampm : to12h(editingTask.task.endTime).ampm)}
                                className={`py-3 rounded-xl text-sm font-black transition-all flex flex-col items-center justify-center gap-0.5 ${btnClass}`}>
                                <span>{slot.label}</span>
                                {collision.type === 'task' && <span className="text-[7px] uppercase tracking-widest text-orange-400 font-black leading-tight text-center">⚡ {shortName || 'TAREA'}</span>}
                                {collision.type === 'habit' && <span className="text-[7px] uppercase tracking-widest text-violet-400 font-black leading-tight text-center">🔥 {shortName || 'HÁBITO'}</span>}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {activeTimeTab.includes('-m') && (
                        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in duration-300">
                          {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => {
                            const isSelected = activeTimeTab.includes('start') ? to12h(editingTask.task.startTime).m === m : to12h(editingTask.task.endTime).m === m;
                            return (
                              <button key={m} onClick={() => handleTimeChange(activeTimeTab.includes('start') ? 'startTime' : 'endTime', 'm', m)}
                                className={`py-3 rounded-lg text-xs md:text-sm font-black transition-all border ${isSelected ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.6)] scale-110 z-10' : 'bg-[#111] text-[#ccc] border-[#222] hover:bg-blue-600 hover:text-white hover:scale-105'}`}>
                                {m}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-[#050505] p-2 rounded-xl border border-[#222] flex gap-2 relative z-10 mt-6">
                <button onClick={() => setEditingTask({ ...editingTask, task: { ...editingTask.task, taskType: 'weekly' } })} className={`flex-1 py-3 rounded-lg font-black uppercase text-xs transition-all flex items-center justify-center gap-2 ${editingTask.task.taskType === 'weekly' ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent text-[#666] hover:text-white'}`}>
                  <CalendarIcon className="w-4 h-4" /> Operación Semanal
                </button>
                <button onClick={() => setEditingTask({ ...editingTask, task: { ...editingTask.task, taskType: 'specific', specificDates: editingTask.task.specificDates || [] } })} className={`flex-1 py-3 rounded-lg font-black uppercase text-xs transition-all flex items-center justify-center gap-2 ${editingTask.task.taskType === 'specific' ? 'bg-purple-600 text-white shadow-lg' : 'bg-transparent text-[#666] hover:text-white'}`}>
                  <Rocket className="w-4 h-4" /> Lanzamiento Específico
                </button>
              </div>

              {editingTask.task.taskType === 'weekly' ? (
                <div className="p-5 bg-black border border-[#333] rounded-2xl relative z-10">
                  <label className="text-[10px] text-[#888] uppercase font-black mb-4 block text-center">Días de la Semana</label>
                  <div className="flex justify-between px-2">
                    {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, idx) => (
                      <button key={idx} onClick={() => {
                        const isActive = editingTask.task.days?.includes(idx);
                        const newDays = isActive ? editingTask.task.days.filter(d => d !== idx) : [...(editingTask.task.days || []), idx];
                        setEditingTask({ ...editingTask, task: { ...editingTask.task, days: newDays } });
                      }} className={`w-10 h-10 md:w-12 md:h-12 rounded-full font-black text-sm transition-all ${editingTask.task.days?.includes(idx) ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110' : 'bg-[#222] text-[#555] hover:text-white border border-[#444]'}`}>{day}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-black border border-[#333] rounded-2xl relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setModalDate(p => p.month === 0 ? { month: 11, year: p.year - 1 } : { ...p, month: p.month - 1 })} className="p-2 bg-[#222] rounded hover:bg-blue-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="font-black text-white uppercase tracking-widest text-sm">{monthNames[modalDate.month]} {modalDate.year}</span>
                    <button onClick={() => setModalDate(p => p.month === 11 ? { month: 0, year: p.year + 1 } : { ...p, month: p.month + 1 })} className="p-2 bg-[#222] rounded hover:bg-blue-600 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {modalDaysArray.map(d => {
                      const isSelected = editingTask.task.specificDates?.includes(d.dateStr);
                      return (
                        <button key={d.dateStr} onClick={() => {
                          const currentDates = editingTask.task.specificDates || [];
                          const newDates = isSelected ? currentDates.filter(x => x !== d.dateStr) : [...currentDates, d.dateStr];
                          setEditingTask({ ...editingTask, task: { ...editingTask.task, specificDates: newDates } });
                        }} className={`h-10 rounded-xl font-black text-xs transition-all ${isSelected ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-110' : 'bg-[#111] text-[#555] hover:bg-[#222] hover:text-white border border-[#333]'}`}>
                          {d.date}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {!editingTask.task.isFlexible && radarTasks.length > 0 && (
              <div className="mt-8 p-6 bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-inner">
                <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> Radar de Agenda (Horas ya bloqueadas en estos días)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  {radarTasks.map(t => (
                    <div key={t.id} className="bg-[#111] border border-[#333] p-3 rounded-lg flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-white text-xs font-bold truncate max-w-[150px]">{t.name}</span>
                        <span className="text-[#888] text-[10px] uppercase font-black">{config.workTasks.some(x => x.id === t.id) ? 'Negocio' : 'Hábito'}</span>
                      </div>
                      <span className="bg-blue-900/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-[10px] font-black">
                        {formatAMPM(t.startTime)} - {formatAMPM(t.endTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={saveConfiguredTask}
              disabled={!isEditingValid}
              className={`w-full py-5 mt-8 text-white font-black uppercase rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 relative z-10 ${isEditingValid ? 'bg-blue-600 hover:bg-blue-500 active:scale-95' : 'bg-[#222] text-[#555] cursor-not-allowed'}`}
            >
              <Target className="w-5 h-5" /> Sellar Precisión Operativa
            </button>
          </div>
        </div>
      )}

      {/* MODAL ADMIN PANEL */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-md p-4">
          <div className="bg-[#0A0F1C] border border-blue-500/50 rounded-[2rem] p-6 md:p-12 w-full max-w-4xl shadow-[0_0_80px_rgba(59,130,246,0.15)] animate-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 border-b border-[#1E293B] pb-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase flex items-center gap-3 tracking-tighter">
                  <Users className="text-blue-500 w-8 h-8" /> Panel de Control CEO
                </h3>
                <p className="text-[#64748B] text-[10px] uppercase font-black tracking-widest mt-1 ml-11">Gestión de Socios y Accesos Élite</p>
              </div>
              <button onClick={() => setShowAdminPanel(false)} className="p-3 bg-[#02040A] border border-[#1E293B] hover:border-red-500 hover:text-red-500 text-[#64748B] rounded-xl transition-all shadow-inner"><X /></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LADO IZQUIERDO: FORMULARIO */}
              <div>
                <h4 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Otorgar Nuevo Acceso
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] text-[#64748B] uppercase font-black tracking-widest mb-1.5 block ml-1">Nombre del Socio</label>
                    <input name="name" placeholder="Ej: Marcos Silva"
                      value={addGuestForm.name} onChange={e => setAddGuestForm({ ...addGuestForm, name: e.target.value })}
                      className="w-full bg-[#02040A] border border-[#1E293B] p-4 rounded-xl text-sm text-white focus:border-blue-500 outline-none shadow-inner transition-colors" required />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#64748B] uppercase font-black tracking-widest mb-1.5 block ml-1">Correo Electrónico</label>
                    <input name="email" type="email" placeholder="correo@agencia.com"
                      value={addGuestForm.email} onChange={e => setAddGuestForm({ ...addGuestForm, email: e.target.value })}
                      className="w-full bg-[#02040A] border border-[#1E293B] p-4 rounded-xl text-sm text-white focus:border-blue-500 outline-none shadow-inner transition-colors" required />
                  </div>

                  {guestAddedMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs font-black uppercase text-center animate-in fade-in slide-in-from-top-2">
                      ✓ {guestAddedMsg}
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="text-[9px] text-[#64748B] uppercase font-black tracking-widest mb-2.5 block ml-1">Nivel de Acceso (Duración)</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { v: 1, l: '24H' }, { v: 3, l: '3 DÍAS' }, { v: 7, l: '7 DÍAS' }, { v: 30, l: '30 DÍAS' }, { v: 0, l: 'VIP' }
                      ].map(opt => (
                        <button type="button" key={opt.v} onClick={() => setSelectedDuration(opt.v)}
                          className={`py-3 rounded-lg flex flex-col items-center justify-center transition-all border ${selectedDuration === opt.v ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105 z-10 relative' : 'bg-[#02040A] border-[#1E293B] text-[#64748B] hover:border-[#334155] hover:text-[#94A3B8]'}`}>
                          <span className="font-black text-[10px] md:text-xs text-center leading-tight">{opt.l}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="button" onClick={handleAddGuestLocal} className="w-full mt-6 bg-blue-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest text-white hover:bg-blue-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 group">
                    <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" /> Generar Permiso Criptográfico
                  </button>
                </div>
              </div>

              {/* LADO DERECHO: LISTA DE USUARIOS */}
              <div className="bg-[#02040A] border border-[#1E293B] rounded-2xl p-5 md:p-6 shadow-inner flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-4 border-b border-[#1E293B] pb-3">
                  <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" /> Red de Socios Activos
                  </h4>
                  <span className="bg-[#1E293B] text-white text-[10px] font-black px-2 py-1 rounded-md">{allowedUsers.length}</span>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Buscar socio por nombre o correo..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-[#050505] border border-[#1E293B] pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:border-blue-500 outline-none shadow-inner transition-colors placeholder:text-[#334155] font-bold"
                  />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                  {allowedUsers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <Users className="w-10 h-10 text-[#64748B] mb-2" />
                      <p className="text-[#64748B] text-xs font-bold italic">La base de datos está vacía.<br />Otorga el primer acceso.</p>
                    </div>
                  ) : allowedUsers.filter(u => (u.name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase())).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                      <Search className="w-10 h-10 text-[#64748B] mb-2" />
                      <p className="text-[#64748B] text-xs font-bold italic">No se encontró ningún socio<br />con ese nombre o correo.</p>
                    </div>
                  ) : allowedUsers.filter(u => (u.name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase())).map((u, i) => {
                    const isVIP = !u.expiresAt;
                    const isExpired = !isVIP && u.expiresAt < Date.now();
                    const daysLeft = isVIP ? 0 : Math.max(0, (u.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

                    return (
                      <div key={i} onClick={() => {
                        setAddGuestForm({ name: u.name || '', email: u.email || '' });
                        const isVIP = !u.expiresAt;
                        if (isVIP) {
                          setSelectedDuration(0);
                        } else {
                          const daysLeft = Math.max(0, (u.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
                          if (daysLeft > 7) setSelectedDuration(30);
                          else if (daysLeft > 3) setSelectedDuration(7);
                          else if (daysLeft > 1) setSelectedDuration(3);
                          else setSelectedDuration(1);
                        }
                      }} className={"p-4 rounded-xl border  flex justify-between items-center transition-colors cursor-pointer group"}>
                        <div className="overflow-hidden pr-2">
                          <p className="text-white text-xs md:text-sm font-black truncate leading-tight mb-0.5">{u.name}</p>
                          <p className="text-[#64748B] text-[9px] md:text-[10px] truncate">{u.email}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {isVIP ? (
                            <span className="text-yellow-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-md">VITALICIO</span>
                          ) : isExpired ? (
                            <span className="text-red-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">EXPIRADO</span>
                          ) : (
                            <span className="text-blue-400 text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md">{daysLeft.toFixed(1)} DÍAS</span>
                          )}
                          <button onClick={() => setGuestToDelete(u)} className="text-[#64748B] hover:text-red-500 transition-colors p-1 bg-[#02040A] rounded-md opacity-0 group-hover:opacity-100" title="Revocar Acceso">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MULTI-DÍA */}
      {multiDateModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#111] border border-blue-500/50 rounded-3xl p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-3 tracking-widest"><CalendarDays className="text-blue-500 w-8 h-8" /> Salto Cuántico</h3>
              <button onClick={() => setMultiDateModal({ show: false, dates: [] })} className="p-2 hover:bg-red-500 rounded-full transition-colors"><X /></button>
            </div>
            <div className="grid grid-cols-7 gap-3 bg-black p-5 rounded-2xl border border-[#222] mb-10 shadow-inner">
              {daysArrayMonth.map(d => (
                <button key={d.dateStr} onClick={() => {
                  const n = multiDateModal.dates.includes(d.dateStr) ? multiDateModal.dates.filter(x => x !== d.dateStr) : [...multiDateModal.dates, d.dateStr];
                  setMultiDateModal({ ...multiDateModal, dates: n });
                }} className={`h-11 rounded-xl font-black text-xs transition-all ${multiDateModal.dates.includes(d.dateStr) ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110' : 'bg-[#111] border border-[#333] text-[#444] hover:text-white'}`}>{d.date}</button>
              ))}
            </div>
            <button onClick={() => { setCustomSelectedDates(multiDateModal.dates); setViewScope('custom'); setMultiDateModal({ show: false, dates: [] }); }} className="w-full py-5 bg-blue-600 text-white font-black uppercase rounded-xl shadow-xl hover:bg-blue-500 transition-all">Aislar Fechas Seleccionadas</button>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR TAREA */}
      {taskDeleteModal.show && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/98 backdrop-blur-md p-4 text-center">
          <div className="bg-[#111] border border-red-500/50 rounded-3xl p-10 w-full max-w-lg shadow-[0_0_50px_rgba(239,68,68,0.1)] animate-in zoom-in-95">
            <Archive className="w-20 h-20 text-red-500 mx-auto mb-8 animate-pulse" />
            <h3 className="text-3xl font-black text-white uppercase mb-4 tracking-tighter">¿ELIMINAR OPERACIÓN?</h3>
            <p className="text-[#888] text-sm mb-6 leading-relaxed">Estás a punto de borrar <span className="text-white font-bold">"{taskDeleteModal.task?.name}"</span>. Esta acción no tiene vuelta atrás.</p>
            <p className="text-red-500 text-xs mb-10 font-black uppercase tracking-widest bg-red-900/10 p-3 rounded-lg border border-red-500/20">"Si no da ROI, se corta de raíz."</p>
            <div className="flex flex-col gap-4">
              <button onClick={confirmDeleteTask} className="w-full py-5 bg-red-600 text-white font-black uppercase rounded-2xl hover:bg-red-500 transition-all active:scale-95 shadow-lg">Sí, Eliminar Permanentemente</button>
              <button onClick={() => setTaskDeleteModal({ show: false, task: null, category: '' })} className="w-full py-4 bg-transparent border border-[#333] text-[#888] font-bold uppercase rounded-2xl text-xs hover:bg-[#222] transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUSPENDER DÍAS ESPECÍFICOS */}
      {advancedDeleteModal.show && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#111] border border-orange-500/50 rounded-3xl p-10 w-full max-w-lg shadow-[0_0_40px_rgba(249,115,22,0.15)] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-3 tracking-widest"><CalendarX className="text-orange-500 w-8 h-8" /> Suspensión Táctica</h3>
              <button onClick={() => setAdvancedDeleteModal({ show: false, task: null, category: '', dates: [] })} className="p-2 hover:bg-red-500 rounded-full transition-colors"><X /></button>
            </div>

            <div className="bg-[#050505] border border-[#333] rounded-xl p-4 mb-6 shadow-inner flex flex-col gap-2">
              <p className="text-[#888] text-xs font-black uppercase tracking-widest">Operación:</p>
              <span className="text-white font-bold text-lg">{advancedDeleteModal.task?.name}</span>
              <div className="flex mt-2">
                {advancedDeleteModal.task?.isFlexible ? (
                  <span className="bg-purple-900/20 border border-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-black tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4" /> HÁBITO FLEXIBLE
                  </span>
                ) : (
                  <span className="bg-blue-900/20 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-black tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatAMPM(advancedDeleteModal.task?.startTime)} <span className="text-[#555]">|</span> {formatAMPM(advancedDeleteModal.task?.endTime)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[#888] text-sm mb-6 leading-relaxed">Selecciona <span className="text-blue-500 font-bold">sólo los días resaltados en azul</span> (donde la tarea existe) para cancelarla esta semana. Las áreas grises están fuera de horario.</p>

            <div className="grid grid-cols-7 gap-3 bg-black p-5 rounded-2xl border border-[#222] mb-10 shadow-inner">
              {daysArrayMonth.map(d => {
                const isBaseScheduled = isDayInBaseSchedule(advancedDeleteModal.task, d);
                const isBlocked = advancedDeleteModal.dates.includes(d.dateStr);

                if (!isBaseScheduled) {
                  return (
                    <div key={d.dateStr} className="h-11 rounded-xl flex items-center justify-center bg-[#050505] border border-[#1a1a1a] text-[#333] cursor-not-allowed opacity-50 text-xs font-black">
                      {d.date}
                    </div>
                  );
                }

                return (
                  <button key={d.dateStr} onClick={() => {
                    const newDates = isBlocked ? advancedDeleteModal.dates.filter(x => x !== d.dateStr) : [...advancedDeleteModal.dates, d.dateStr];
                    setAdvancedDeleteModal({ ...advancedDeleteModal, dates: newDates });
                  }} className={`h-11 rounded-xl font-black text-xs transition-all flex items-center justify-center border ${isBlocked ? 'bg-orange-600 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-110 z-10 relative' : 'bg-blue-900/20 border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white'}`}>
                    {d.date}
                  </button>
                );
              })}
            </div>
            <button onClick={confirmAdvancedDelete} className="w-full py-5 bg-orange-600 text-white font-black uppercase rounded-xl shadow-xl hover:bg-orange-500 transition-all active:scale-95">Aplicar Suspensión Táctica</button>
          </div>
        </div>
      )}

      {/* MODAL SUSPENDER DÍA ÚNICO */}
      {singleDayCancelModal.show && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/98 backdrop-blur-md p-4 text-center">
          <div className="bg-[#111] border border-orange-500/50 rounded-3xl p-10 w-full max-w-lg shadow-[0_0_50px_rgba(249,115,22,0.1)] animate-in zoom-in-95">
            <CalendarX className="w-20 h-20 text-orange-500 mx-auto mb-8 animate-pulse" />
            <h3 className="text-3xl font-black text-white uppercase mb-4 tracking-tighter">¿LIBERAR ESTE DÍA?</h3>
            <p className="text-[#888] text-sm mb-6 leading-relaxed">Estás a punto de cancelar <span className="text-white font-bold">"{singleDayCancelModal.task?.name}"</span> únicamente para el día <span className="text-blue-400 font-bold">{singleDayCancelModal.dayData?.dateStr}</span>.</p>
            <div className="flex flex-col gap-4">
              <button onClick={confirmSingleDayCancel} className="w-full py-5 bg-orange-600 text-white font-black uppercase rounded-2xl hover:bg-orange-500 transition-all active:scale-95 shadow-lg">Sí, Liberar Espacio y Hora</button>
              <button onClick={() => setSingleDayCancelModal({ show: false, task: null, dayData: null, category: '' })} className="w-full py-4 bg-transparent border border-[#333] text-[#888] font-bold uppercase rounded-2xl text-xs hover:bg-[#222] transition-all">Mantener Operación</button>
            </div>
          </div>
        </div>
      )}

      {/* CELEBRACIÓN DE SEMANA PERFECTA */}
      {weeklyCelebration.show && weeklyCelebration.tier && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-40">
            <div className={`w-[150vw] h-[150vw] sunburst-rays ${weeklyCelebration.type === 'workTasks' ? 'sunburst-blue' : 'sunburst-purple'}`}></div>
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {[...Array(60)].map((_, i) => (
              <div key={i} className="absolute w-3 h-3 rounded-full animate-spark"
                style={{
                  backgroundColor: weeklyCelebration.tier.hex,
                  boxShadow: `0 0 15px #fff, 0 0 30px ${weeklyCelebration.tier.hex}`,
                  left: '50%', top: '50%',
                  '--tx': `${(Math.random() - 0.5) * 1200}px`,
                  '--ty': `${(Math.random() - 0.5) * 1200}px`,
                  animationDelay: `${Math.random() * 0.6}s`
                }}>
              </div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-5xl animate-in zoom-in duration-700 fade-in">
            <div className="perspective-1000 mb-12 relative">
              <weeklyCelebration.tier.icon className={`w-64 h-64 trophy-3d ${weeklyCelebration.tier.baseColor}`} style={{ filter: `drop-shadow(0 0 80px ${weeklyCelebration.tier.glow})` }} />
              <Diamond className={`w-16 h-16 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse ${weeklyCelebration.tier.baseColor}`} style={{ filter: `drop-shadow(0 0 30px ${weeklyCelebration.tier.glow})` }} />
            </div>

            <h2 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter mb-6 drop-shadow-2xl">
              {weeklyCelebration.tier.name.split(' ')[0]} <span className={weeklyCelebration.tier.baseColor}>{weeklyCelebration.tier.name.split(' ').slice(1).join(' ')}</span>!
            </h2>
            <div className="h-2 w-64 mx-auto mb-10 rounded-full shadow-lg" style={{ backgroundColor: weeklyCelebration.tier.hex, boxShadow: `0 0 30px ${weeklyCelebration.tier.glow}` }}></div>

            <div className="bg-[#0a0a0a] border p-10 rounded-3xl cursor-pointer transition-colors" style={{ borderColor: weeklyCelebration.tier.hex, boxShadow: `0 0 50px ${weeklyCelebration.tier.glow.replace('1)', '0.15)')}` }} onClick={() => setWeeklyCelebration(prev => ({ ...prev, show: false }))}>
              <p className="text-3xl md:text-4xl text-[#E2E8F0] font-black italic leading-relaxed mb-6 drop-shadow-lg">
                "{weeklyCelebration.quote}"
              </p>
              <p className="text-[#666] text-xs uppercase font-black tracking-widest mt-8">Toca para seguir facturando</p>
            </div>
          </div>
        </div>
      )}

      {/* CELEBRACIÓN DE 100% DIARIA */}
      {celebration.show && !weeklyCelebration.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className={`w-[150vw] h-[150vw] sunburst-rays ${celebration.type === 'workTasks' ? 'sunburst-blue' : (celebration.isEarly ? 'sunburst-yellow' : 'sunburst-purple')}`}></div>
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {[...Array(40)].map((_, i) => (
              <div key={i} className={`absolute w-2 h-2 rounded-full animate-spark ${celebration.type === 'workTasks' ? 'bg-blue-300 spark-blue' : (celebration.isEarly ? 'bg-yellow-300 spark-yellow' : 'bg-purple-300 spark-purple')}`}
                style={{
                  left: '50%', top: '50%',
                  '--tx': `${(Math.random() - 0.5) * 1000}px`,
                  '--ty': `${(Math.random() - 0.5) * 1000}px`,
                  animationDelay: `${Math.random() * 0.4}s`
                }}>
              </div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl animate-in zoom-in duration-500 fade-in">
            <div className="perspective-1000 mb-10">
              {celebration.isEarly ? (
                <Rocket className="w-56 h-56 trophy-3d text-yellow-400 trophy-yellow" />
              ) : (
                <Trophy className={`w-56 h-56 trophy-3d ${celebration.type === 'workTasks' ? 'text-blue-400 trophy-blue' : 'text-purple-400 trophy-purple'}`} />
              )}
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-2xl">
              {celebration.isEarly ? (
                <>¡LÍMITE <span className="text-yellow-500">DESTROZADO</span>!</>
              ) : (
                <>¡EJECUCIÓN <span className={celebration.type === 'workTasks' ? 'text-blue-500' : 'text-purple-500'}>PERFECTA</span>!</>
              )}
            </h2>
            <div className={`h-1.5 w-40 mx-auto mb-8 rounded-full ${celebration.isEarly ? 'bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.8)]' : (celebration.type === 'workTasks' ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]')}`}></div>

            <div className={`bg-[#050505]/80 border p-8 rounded-3xl shadow-2xl backdrop-blur-md cursor-pointer transition-colors ${celebration.isEarly ? 'border-[#333] hover:border-yellow-500/50' : (celebration.type === 'workTasks' ? 'border-[#333] hover:border-blue-500/50' : 'border-[#333] hover:border-purple-500/50')}`} onClick={() => setCelebration({ show: false, quote: '', author: '', type: 'workTasks', isEarly: false, category: 'income' })}>
              <p className="text-2xl md:text-3xl text-[#E2E8F0] font-bold italic leading-relaxed mb-6 drop-shadow-lg">
                "{celebration.quote}"
              </p>
              <p className={`uppercase tracking-widest font-black text-sm ${celebration.isEarly ? 'text-yellow-400' : (celebration.type === 'workTasks' ? 'text-blue-400' : 'text-purple-400')}`}>
                — {celebration.author}
              </p>
              <p className="text-[#444] text-[10px] uppercase font-black tracking-widest mt-8">Toca para continuar ejecutando</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FRACASO ESTRATÉGICO */}
      {failureModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-[150vw] h-[150vw] sunburst-rays bg-[repeating-conic-gradient(from_0deg,rgba(239,68,68,0.15)_0deg_10deg,transparent_10deg_20deg)]"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl animate-in zoom-in duration-500 fade-in">
            <div className="perspective-1000 mb-10">
              <Octagon className="w-40 h-40 md:w-56 md:h-56 text-red-600 trophy-3d filter drop-shadow-[0_0_50px_rgba(220,38,38,0.8)]" />
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-2xl">
              <span className="text-red-600">{failureModal.title}</span>
            </h2>
            <div className="h-1.5 w-40 mx-auto mb-8 rounded-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]"></div>

            <div className="bg-[#050505]/80 border border-red-900/50 p-8 rounded-3xl shadow-2xl backdrop-blur-md cursor-pointer transition-colors hover:border-red-600" onClick={() => setFailureModal({ show: false, quote: '', title: '', category: 'income' })}>
              <p className="text-2xl md:text-3xl text-[#E2E8F0] font-bold italic leading-relaxed mb-6 drop-shadow-lg">
                "{failureModal.quote}"
              </p>
              <p className="text-[#444] text-[10px] uppercase font-black tracking-widest mt-8">Toca para asumir la derrota y seguir adelante</p>
            </div>
          </div>
        </div>
      )}

      {/* --- NUEVO: MODAL PSICOLÓGICO PARA MOTORES INTOCABLES --- */}
      {showPsychologicalModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/98 backdrop-blur-md p-4 text-center">
          <div className="bg-[#0A0F1C] border border-red-500/50 rounded-[2rem] p-6 md:p-12 w-full max-w-xl shadow-[0_0_80px_rgba(239,68,68,0.2)] animate-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse premium-glow" />
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase mb-2 tracking-tighter">ALERTA CRÍTICA</h3>
            <p className="text-[#64748B] text-[10px] font-black uppercase tracking-[0.2em] mb-6">ESTÁS A PUNTO DE ALTERAR TU ADN OPERATIVO</p>

            <div className="bg-[#02040A] border border-red-900/30 p-5 rounded-xl mb-8 shadow-inner">
              <p className="text-[#E2E8F0] text-sm md:text-base leading-relaxed italic font-bold">
                "{psychoQuotes[psychoQuoteIdx] || 'Solo un mediocre borra sus grandes sueños para sentirse cómodo con pequeños resultados.'}"
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => setShowPsychologicalModal(false)} className="w-full py-4 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" /> ME MANTENGO FIRME. A FACTURAR.
              </button>

              <button onClick={handlePsychoEvolve} className="w-full py-4 bg-[#02040A] text-[#E2E8F0] border border-[#1E293B] font-black uppercase text-xs tracking-widest rounded-xl hover:bg-[#111] hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> RENOVAR POR ALGO MUCHO MEJOR
              </button>

              <button onClick={handleConfirmPsychoDelete} className="w-full mt-4 py-3 bg-transparent text-red-500 border border-red-500/30 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-900/20 transition-all opacity-80 hover:opacity-100 flex items-center justify-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> ME RINDO. ELIMINAR MIS SUEÑOS.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NUEVO: MODAL PSICOLÓGICO PARA ARSENAL VISUAL --- */}
      {imageActionModal.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/98 backdrop-blur-md p-4 text-center">
          <div className="bg-[#0A0F1C] border border-red-500/50 rounded-[2rem] p-6 md:p-12 w-full max-w-xl shadow-[0_0_80px_rgba(239,68,68,0.2)] animate-in zoom-in-95 flex flex-col items-center max-h-[95vh] overflow-y-auto custom-scrollbar">

            <div className="flex items-center justify-center gap-3 mb-2">
              <ImagePlus className="w-8 h-8 text-red-500 animate-pulse premium-glow" />
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">ALERTA VISUAL</h3>
            </div>
            <p className="text-[#64748B] text-[10px] font-black uppercase tracking-[0.2em] mb-6">ESTÁS A PUNTO DE BORRAR UNA PARTE DE TU FUTURO</p>

            {/* EL OBJETO DE PÉRDIDA (CUADRO EN BLANCO Y NEGRO) */}
            {imageActionModal.index !== null && config.images.length > 0 && (
              <div className="relative w-full max-w-xs md:max-w-sm h-40 md:h-48 mb-6 rounded-2xl overflow-hidden border-2 border-[#1E293B] shadow-[0_0_30px_rgba(0,0,0,0.8)] group">
                {/* Overlay oscuro y filtro de escala de grises para impacto psicológico */}
                <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none"></div>
                <img
                  src={config.images[imageActionModal.index % config.images.length]}
                  alt="Visión en peligro"
                  className="w-full h-full object-cover grayscale contrast-125 brightness-75 transition-all duration-700 group-hover:scale-105"
                />
                {/* Marca de agua de cancelación sutil */}
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <X className="w-20 h-20 text-red-500/30 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" strokeWidth={1.5} />
                </div>
              </div>
            )}

            <div className="bg-[#02040A] border border-red-900/30 p-5 rounded-xl mb-8 shadow-inner w-full">
              <p className="text-[#E2E8F0] text-sm md:text-base leading-relaxed italic font-bold">
                "{imagePsychoQuotes[imgPsychoQuoteIdx] || 'Solo un mediocre borra sus grandes sueños para sentirse cómodo con pequeños resultados.'}"
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button onClick={() => setImageActionModal({ show: false, index: null })} className="w-full py-4 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" /> ME MANTENGO FIRME. A FACTURAR.
              </button>

              <button onClick={handleConfirmImageEvolve} className="w-full py-4 bg-[#02040A] text-[#E2E8F0] border border-[#1E293B] font-black uppercase text-xs tracking-widest rounded-xl hover:bg-[#111] hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> RENOVAR VISIÓN POR ALGO MÁS GRANDE
              </button>

              <button onClick={handleConfirmImageKill} className="w-full mt-4 py-3 bg-transparent text-red-500 border border-red-500/30 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-900/20 transition-all opacity-80 hover:opacity-100 flex items-center justify-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> ME RINDO. ELIMINAR MI SUEÑO.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERFIL Y TEMAS */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#0A0F1C] border border-blue-500/30 rounded-[2rem] p-6 md:p-10 w-full max-w-lg shadow-[0_0_80px_rgba(59,130,246,0.15)] animate-in zoom-in-95 relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-[#111] hover:bg-blue-600/20 text-[#666] hover:text-blue-400 transition-colors border border-[#333] hover:border-blue-500/50">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div
                className="w-24 h-24 mx-auto bg-blue-600/20 border-2 border-blue-500/50 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.3)] relative group cursor-pointer"
                onClick={() => { setActiveImageSlot('profile'); fileInputRef.current.click(); }}
                title="Cambiar foto de perfil"
              >
                {config.profilePic ? (
                  <img src={config.profilePic} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <User className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform" />
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <ImagePlus className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Mi Perfil Élite</h2>
              <p className="text-[#64748B] text-[10px] uppercase font-black tracking-widest mt-1">{session.email}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[9px] text-[#64748B] uppercase font-black tracking-widest mb-1.5 block ml-1 flex items-center gap-2"><Crown className="w-3 h-3 text-blue-500" /> Alias / Nombre Clave</label>
                <input type="text" value={profileAliasInput} onChange={e => setProfileAliasInput(e.target.value)} placeholder="Ej: Fénix, Alpha, etc." className="w-full bg-black border border-[#1E293B] p-4 rounded-xl text-sm text-white focus:border-blue-500 outline-none shadow-inner transition-colors" />
                <p className="text-[#555] text-[9px] font-bold italic mt-2 ml-1">Reemplaza tu nombre de Google por este alias en toda la plataforma.</p>
              </div>

              <div>
                <label className="text-[9px] text-[#64748B] uppercase font-black tracking-widest mb-3 block ml-1 flex items-center gap-2"><Moon className="w-3 h-3 text-purple-400" /> Entorno Visual</label>
                <div className="flex gap-3">
                  <button onClick={() => saveConfig({ ...config, profile: { ...config.profile, theme: 'dark' } })} className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${(!config.profile?.theme || config.profile?.theme === 'dark') ? 'bg-[#111] text-blue-400 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-transparent text-[#64748B] border-[#1E293B] hover:border-[#333]'}`}>
                    <Moon className="w-4 h-4" /> Noche (Defecto)
                  </button>
                  <button onClick={() => saveConfig({ ...config, profile: { ...config.profile, theme: 'light' } })} className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${config.profile?.theme === 'light' ? 'bg-[#111] text-amber-400 border-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'bg-transparent text-[#64748B] border-[#1E293B] hover:border-[#333]'}`}>
                    <Sun className="w-4 h-4" /> Día (Protección)
                  </button>
                </div>
              </div>

              <button onClick={() => {
                saveConfig({ ...config, profile: { ...config.profile, alias: profileAliasInput.trim() } });
                setShowProfileModal(false);
              }} className="w-full mt-4 bg-blue-600 py-4 rounded-xl font-black uppercase text-xs tracking-widest text-white hover:bg-blue-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 group">
                <CheckSquare className="w-4 h-4 group-hover:scale-110 transition-transform" /> GUARDAR PERFIL
              </button>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
        .mask-edges-horizontal {
           -webkit-mask-image: linear-gradient(to right, transparent, black 2%, black 98%, transparent);
           mask-image: linear-gradient(to right, transparent, black 2%, black 98%, transparent);
        }

        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 600s linear infinite; display: flex; width: max-content; }
        
        .animate-marquee-images { animation: marquee-images 240s linear infinite; display: flex; width: max-content; }
        @keyframes marquee-images { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-100% / 2)); } }
        
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
        .premium-glow { filter: drop-shadow(0 0 15px rgba(59,130,246,0.8)); }
      `}} />

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-time-input::-webkit-calendar-picker-indicator { display: none !important; }
        
        @keyframes smooth-bounce {
          0%, 100% { transform: translateY(-15%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
          50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
        @keyframes sapphire-sparkle {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8)) brightness(1); }
          50% { filter: drop-shadow(0 0 25px rgba(96, 165, 250, 1)) brightness(1.4); }
        }
        .animate-sapphire { animation: smooth-bounce 2.5s infinite, sapphire-sparkle 2s infinite; }
        
        .perspective-1000 { perspective: 1000px; }
        .trophy-3d {
            animation: float-3d 3s ease-in-out infinite;
        }
        .trophy-blue {
            filter: drop-shadow(-4px 4px 0px rgba(15, 23, 42, 0.8)) drop-shadow(0 0 50px rgba(59, 130, 246, 0.8));
        }
        .trophy-purple {
            filter: drop-shadow(-4px 4px 0px rgba(15, 23, 42, 0.8)) drop-shadow(0 0 50px rgba(168, 85, 247, 0.8));
        }
        .trophy-yellow {
            filter: drop-shadow(-4px 4px 0px rgba(15, 23, 42, 0.8)) drop-shadow(0 0 50px rgba(250, 204, 21, 0.8));
        }
        @keyframes float-3d {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-20px) scale(1.05); }
        }
        
        @keyframes spark-explode {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        .spark-blue { box-shadow: 0 0 15px #fff, 0 0 30px #3b82f6; }
        .spark-purple { box-shadow: 0 0 15px #fff, 0 0 30px #a855f7; }
        .spark-yellow { box-shadow: 0 0 15px #fff, 0 0 30px #facc15; }
        .animate-spark { animation: spark-explode 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
        
        .sunburst-rays {
            border-radius: 50%;
            animation: spin-slow 25s linear infinite;
        }
        .sunburst-blue { background: repeating-conic-gradient(from 0deg, rgba(59, 130, 246, 0.15) 0deg 10deg, transparent 10deg 20deg); }
        .sunburst-purple { background: repeating-conic-gradient(from 0deg, rgba(168, 85, 247, 0.15) 0deg 10deg, transparent 10deg 20deg); }
        .sunburst-yellow { background: repeating-conic-gradient(from 0deg, rgba(250, 204, 21, 0.15) 0deg 10deg, transparent 10deg 20deg); }
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        
        @keyframes slow-blink {
          0%, 100% { opacity: 1; text-shadow: 0 0 15px rgba(255,255,255,1); }
          50% { opacity: 0.5; text-shadow: 0 0 2px rgba(255,255,255,0.3); }
        }
        .animate-slow-blink { animation: slow-blink 3.5s ease-in-out infinite; }
      `}} />
    </div>
  );
}
















































