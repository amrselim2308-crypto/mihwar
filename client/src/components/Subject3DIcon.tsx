import React from "react";

type Subject3DIconProps = {
  name: string;
  size?: number;
};

export function Subject3DIcon({ name, size = 38 }: Subject3DIconProps) {
  switch (name) {
    case "اللغة العربية":
    case "Arabic":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="bookCover" x1="6" y1="12" x2="42" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9a6e2e" />
              <stop offset="0.5" stopColor="#d4af37" />
              <stop offset="1" stopColor="#634515" />
            </linearGradient>
            <linearGradient id="quillGold" x1="28" y1="4" x2="42" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff2a8" />
              <stop offset="0.6" stopColor="#d4af37" />
              <stop offset="1" stopColor="#996e1b" />
            </linearGradient>
            <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#d4af37" floodOpacity="0.6" />
            </filter>
          </defs>
          {/* Open Book Base */}
          <path d="M8 32C14 30 20 31 24 34C28 31 34 30 40 32V18C34 16 28 17 24 20C20 17 14 16 8 18V32Z" fill="url(#bookCover)" />
          {/* Pages */}
          <path d="M10 30C15 28.5 20 29.5 24 32C28 29.5 33 28.5 38 30V17C33 15.5 28 16.5 24 19C20 16.5 15 15.5 10 17V30Z" fill="#fffcf0" />
          {/* Golden Quill */}
          <path d="M41 5C38 8 32 15 30 22C29.5 24 31 25.5 33 25C35 24 40 18 42 12C43 9 43 6 41 5Z" fill="url(#quillGold)" filter="url(#glowGold)" />
          <path d="M30 22L27 27L32 25" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          {/* Sparkles */}
          <circle cx="20" cy="12" r="1.5" fill="#fff" opacity="0.9" />
          <circle cx="15" cy="8" r="1" fill="#ffd700" />
        </svg>
      );

    case "الرياضيات":
    case "Mathematics":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="calcGrad" x1="10" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="0.7" stopColor="#1d4ed8" />
              <stop offset="1" stopColor="#172554" />
            </linearGradient>
            <linearGradient id="calcScreen" x1="14" y1="12" x2="34" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#67e8f9" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="btnGlow">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.4" />
            </filter>
          </defs>
          {/* Calculator Body with 3D bevel */}
          <rect x="11" y="8" width="26" height="32" rx="5" fill="url(#calcGrad)" stroke="#60a5fa" strokeWidth="1.2" />
          {/* Luminous Screen */}
          <rect x="15" y="12" width="18" height="7" rx="2" fill="url(#calcScreen)" />
          <path d="M17 15.5H23M26 15.5H27M29 15.5H31" stroke="#083344" strokeWidth="1.2" strokeLinecap="round" />
          {/* Buttons Matrix */}
          <rect x="15" y="22" width="4" height="3.5" rx="1" fill="#f59e0b" filter="url(#btnGlow)" />
          <rect x="22" y="22" width="4" height="3.5" rx="1" fill="#e0e7ff" filter="url(#btnGlow)" />
          <rect x="29" y="22" width="4" height="3.5" rx="1" fill="#ef4444" filter="url(#btnGlow)" />
          <rect x="15" y="28" width="4" height="3.5" rx="1" fill="#e0e7ff" filter="url(#btnGlow)" />
          <rect x="22" y="28" width="4" height="3.5" rx="1" fill="#e0e7ff" filter="url(#btnGlow)" />
          <rect x="29" y="28" width="4" height="3.5" rx="1" fill="#10b981" filter="url(#btnGlow)" />
          <rect x="15" y="34" width="4" height="3" rx="1" fill="#e0e7ff" filter="url(#btnGlow)" />
          <rect x="22" y="34" width="11" height="3" rx="1" fill="#38bdf8" filter="url(#btnGlow)" />
        </svg>
      );

    case "الفيزياء":
    case "Physics":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <radialGradient id="atomCore" cx="24" cy="24" r="5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="0.4" stopColor="#38bdf8" />
              <stop offset="1" stopColor="#0284c7" />
            </radialGradient>
            <filter id="atomGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.8" />
            </filter>
          </defs>
          {/* Orbit 1 */}
          <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(30 24 24)" stroke="#38bdf8" strokeWidth="1.8" opacity="0.9" />
          {/* Orbit 2 */}
          <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(-30 24 24)" stroke="#22d3ee" strokeWidth="1.8" opacity="0.9" />
          {/* Orbit 3 */}
          <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(90 24 24)" stroke="#818cf8" strokeWidth="1.8" opacity="0.85" />
          {/* Nucleus Core */}
          <circle cx="24" cy="24" r="5" fill="url(#atomCore)" filter="url(#atomGlow)" />
          {/* Electrons */}
          <circle cx="38" cy="16" r="2.2" fill="#ffffff" filter="url(#atomGlow)" />
          <circle cx="10" cy="32" r="2" fill="#22d3ee" filter="url(#atomGlow)" />
          <circle cx="24" cy="6" r="2" fill="#a78bfa" filter="url(#atomGlow)" />
        </svg>
      );

    case "الكيمياء":
    case "Chemistry":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="flaskGlass" x1="16" y1="8" x2="32" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(255,255,255,0.7)" />
              <stop offset="0.5" stopColor="rgba(45,212,191,0.3)" />
              <stop offset="1" stopColor="rgba(13,148,136,0.6)" />
            </linearGradient>
            <linearGradient id="neonLiquid" x1="12" y1="24" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4ade80" />
              <stop offset="0.5" stopColor="#22c55e" />
              <stop offset="1" stopColor="#15803d" />
            </linearGradient>
            <filter id="liquidGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#4ade80" floodOpacity="0.75" />
            </filter>
          </defs>
          {/* Flask Outline */}
          <path d="M21 8H27V18L37 36C38.5 38.5 36.8 41 34 41H14C11.2 41 9.5 38.5 11 36L21 18V8Z" fill="url(#flaskGlass)" stroke="#a7f3d0" strokeWidth="1.5" />
          {/* Glowing Liquid */}
          <path d="M13.2 36L18 26C22 25 26 27 30 26L34.8 36C35.5 37.5 34.2 39 32.5 39H15.5C13.8 39 12.5 37.5 13.2 36Z" fill="url(#neonLiquid)" filter="url(#liquidGlow)" />
          {/* Bubbles */}
          <circle cx="24" cy="32" r="1.8" fill="#ffffff" opacity="0.9" />
          <circle cx="28" cy="35" r="1.2" fill="#ffffff" opacity="0.8" />
          <circle cx="19" cy="34" r="1.4" fill="#ffffff" opacity="0.8" />
          {/* Rim */}
          <rect x="19" y="6" width="10" height="2.5" rx="1.2" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.8" />
        </svg>
      );

    case "الأحياء":
    case "Biology":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="microscopeMetal" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.6" stopColor="#0284c7" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
            <filter id="scopeGlow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0284c7" floodOpacity="0.5" />
            </filter>
          </defs>
          {/* Base */}
          <rect x="13" y="38" width="22" height="4" rx="2" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
          <path d="M22 38V30C22 27 24 25 27 25" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          {/* Stage */}
          <rect x="15" y="27" width="16" height="2.5" rx="1" fill="#e2e8f0" />
          {/* Objective Tube */}
          <rect x="25" y="10" width="6" height="15" rx="2" transform="rotate(20 25 10)" fill="url(#microscopeMetal)" stroke="#7dd3fc" strokeWidth="1" filter="url(#scopeGlow)" />
          {/* Eyepiece */}
          <rect x="26" y="6" width="8" height="4" rx="1.5" transform="rotate(20 26 6)" fill="#f8fafc" />
          {/* Light reflector mirror */}
          <ellipse cx="20" cy="34" rx="3.5" ry="2" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
        </svg>
      );

    case "الجغرافيا":
    case "Geography":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <radialGradient id="globeSphere" cx="30%" cy="30%" r="70%">
              <stop stopColor="#67e8f9" />
              <stop offset="0.5" stopColor="#0284c7" />
              <stop offset="1" stopColor="#0c4a6e" />
            </radialGradient>
            <linearGradient id="brassStand" x1="12" y1="36" x2="36" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.5" stopColor="#ca8a04" />
              <stop offset="1" stopColor="#854d0e" />
            </linearGradient>
            <filter id="globeGlow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284c7" floodOpacity="0.6" />
            </filter>
          </defs>
          {/* Stand Arc */}
          <path d="M12 22C12 30 18 36 24 36C28 36 32 34 34 31" stroke="url(#brassStand)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M24 36V41M18 41H30" stroke="url(#brassStand)" strokeWidth="3" strokeLinecap="round" />
          {/* Globe Ball */}
          <circle cx="23" cy="20" r="13" fill="url(#globeSphere)" filter="url(#globeGlow)" />
          {/* Continents */}
          <path d="M17 14C19 13 22 15 20 18C18 20 15 19 14 16C15 15 16 14 17 14Z" fill="#86efac" />
          <path d="M26 12C28 12 30 14 29 17C27 20 24 21 23 23C22 25 24 27 27 26C30 25 32 28 31 30C29 32 26 31 24 29" fill="#4ade80" />
          {/* Highlight sheen */}
          <ellipse cx="19" cy="15" rx="3.5" ry="2" fill="#fff" opacity="0.4" transform="rotate(-30 19 15)" />
        </svg>
      );

    case "التاريخ":
    case "History":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="glassHour" x1="14" y1="10" x2="34" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.5" stopColor="#d97706" />
              <stop offset="1" stopColor="#78350f" />
            </linearGradient>
            <filter id="amberGlow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.6" />
            </filter>
          </defs>
          {/* Scroll in background */}
          <path d="M26 12H38C39.5 12 40 13 40 15V33C40 35 39 36 37 36H28" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <path d="M30 18H36M30 23H35M30 28H34" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
          {/* Hourglass */}
          <path d="M12 10H26M12 38H26" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 11C14 20 24 22 24 24C24 26 14 28 14 37M24 11C24 20 14 22 14 24C14 26 24 28 24 37" stroke="#fef3c7" strokeWidth="1.5" />
          {/* Golden Sand */}
          <path d="M16 14C17 18 21 19 22 19C22 19 17 19 16 14Z" fill="url(#glassHour)" filter="url(#amberGlow)" />
          <path d="M16 35C17 31 21 30 22 30C22 30 17 30 16 35Z" fill="url(#glassHour)" filter="url(#amberGlow)" />
          <circle cx="19" cy="24" r="0.8" fill="#fff" />
        </svg>
      );

    case "الفلسفة والمنطق":
    case "Philosophy & Logic":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="marbleBust" x1="16" y1="8" x2="32" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="0.6" stopColor="#cbd5e1" />
              <stop offset="1" stopColor="#64748b" />
            </linearGradient>
            <filter id="bustGlow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.4" />
            </filter>
          </defs>
          {/* Pedestal Base */}
          <rect x="14" y="38" width="20" height="4" rx="1.5" fill="#94a3b8" />
          {/* Marble Bust Head and Shoulders */}
          <path d="M24 8C20 8 18 11 18 15C18 19 20 22 24 22C28 22 30 19 30 15C30 11 28 8 24 8Z" fill="url(#marbleBust)" filter="url(#bustGlow)" />
          {/* Hair Curls */}
          <path d="M17 13C17 9 20 7 24 7C28 7 31 9 31 13C30 11 28 10 24 10C20 10 18 11 17 13Z" fill="#e2e8f0" />
          {/* Torso Drape */}
          <path d="M16 27C14 29 12 34 14 38H34C36 34 34 29 32 27L28 25C26 27 22 27 20 25L16 27Z" fill="url(#marbleBust)" />
          {/* Golden thinking spark above */}
          <circle cx="33" cy="8" r="2.5" fill="#fbbf24" />
          <path d="M33 3V5M33 11V13M28 8H30M36 8H38" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case "اللغة الإنجليزية":
    case "English":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="bubbleBlue" x1="8" y1="10" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60a5fa" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="bubbleCyan" x1="18" y1="18" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#67e8f9" />
              <stop offset="1" stopColor="#0891b2" />
            </linearGradient>
            <filter id="chatGlow">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.5" />
            </filter>
          </defs>
          {/* Back Bubble */}
          <path d="M10 18C10 13.5 14.5 10 20 10H24C29.5 10 34 13.5 34 18C34 22.5 29.5 26 24 26H21L15 30V25.5C12 24 10 21.2 10 18Z" fill="url(#bubbleBlue)" filter="url(#chatGlow)" />
          <text x="22" y="19" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">EN</text>
          {/* Front Bubble */}
          <path d="M16 27C16 22.5 20.5 19 26 19H30C35.5 19 40 22.5 40 27C40 31.5 35.5 35 30 35H27L21 39V34.5C18 33 16 30.2 16 27Z" fill="url(#bubbleCyan)" filter="url(#chatGlow)" />
          <circle cx="24" cy="27" r="1.5" fill="#fff" />
          <circle cx="28" cy="27" r="1.5" fill="#fff" />
          <circle cx="32" cy="27" r="1.5" fill="#fff" />
        </svg>
      );

    case "الدراسات الاجتماعية":
    case "Social Studies":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="mapFold1" x1="8" y1="12" x2="18" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fed7aa" />
              <stop offset="1" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="mapFold2" x1="18" y1="12" x2="30" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffedd5" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id="mapFold3" x1="30" y1="12" x2="40" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fdba74" />
              <stop offset="1" stopColor="#c2410c" />
            </linearGradient>
          </defs>
          {/* Fold 1 */}
          <path d="M8 14L18 10V34L8 38V14Z" fill="url(#mapFold1)" />
          {/* Fold 2 */}
          <path d="M18 10L30 14V38L18 34V10Z" fill="url(#mapFold2)" />
          {/* Fold 3 */}
          <path d="M30 14L40 10V34L30 38V14Z" fill="url(#mapFold3)" />
          {/* Map paths and terrain */}
          <path d="M11 20C14 22 15 25 18 22C22 18 26 26 30 23C33 21 36 24 38 22" stroke="#047857" strokeWidth="1.8" strokeLinecap="round" />
          {/* Pin */}
          <circle cx="24" cy="18" r="3" fill="#ef4444" stroke="#fff" strokeWidth="1" />
          <path d="M24 21V26" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case "العلوم":
    case "General Science":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="beakerGrad" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a7f3d0" />
              <stop offset="0.6" stopColor="#10b981" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>
          </defs>
          <path d="M15 10H33V16L37 36C37.5 38 36 40 33 40H15C12 40 10.5 38 11 36L15 16V10Z" fill="rgba(255,255,255,0.2)" stroke="#34d399" strokeWidth="1.5" />
          <path d="M12.5 36L15.5 24C19 25 29 23 32.5 24L35.5 36C36 38 34.5 39 32 39H16C13.5 39 12 38 12.5 36Z" fill="url(#beakerGrad)" />
          <circle cx="20" cy="30" r="1.5" fill="#fff" opacity="0.9" />
          <circle cx="26" cy="27" r="2" fill="#fff" opacity="0.8" />
          <circle cx="29" cy="33" r="1.2" fill="#fff" opacity="0.9" />
          <path d="M13 8H35" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "المهارات":
    case "Skills":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="goldGear" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.5" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="bronzeGear" x1="20" y1="20" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fed7aa" />
              <stop offset="0.6" stopColor="#ea580c" />
              <stop offset="1" stopColor="#7c2d12" />
            </linearGradient>
            <filter id="gearGlow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.5" />
            </filter>
          </defs>
          {/* Main Gear */}
          <g filter="url(#gearGlow)">
            <circle cx="20" cy="20" r="9" fill="url(#goldGear)" stroke="#fde047" strokeWidth="1" />
            <circle cx="20" cy="20" r="3.5" fill="#1e293b" />
            {/* Teeth */}
            <path d="M20 9V7M20 33V31M9 20H7M33 20H31M12.5 12.5L11 11M29 29L27.5 27.5M12.5 27.5L11 29M29 11L27.5 12.5" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          </g>
          {/* Interlocking Secondary Gear */}
          <g>
            <circle cx="32" cy="32" r="7" fill="url(#bronzeGear)" stroke="#fdba74" strokeWidth="1" />
            <circle cx="32" cy="32" r="2.5" fill="#1e293b" />
            <path d="M32 23V21M32 43V41M23 32H21M43 32H41M26 26L24.5 24.5M39.5 39.5L38 38M26 38L24.5 39.5M39.5 24.5L38 26" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>
      );

    case "الجيولوجيا":
    case "Geology":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="crystal1" x1="16" y1="8" x2="32" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f472b6" />
              <stop offset="0.5" stopColor="#c084fc" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
            <filter id="gemGlow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#c084fc" floodOpacity="0.7" />
            </filter>
          </defs>
          {/* Mountain Layer Base */}
          <path d="M8 38L18 24L26 32L34 20L42 38H8Z" fill="#78350f" opacity="0.6" />
          <path d="M8 38L17 28L25 35L33 25L42 38H8Z" fill="#b45309" opacity="0.8" />
          {/* Glowing Crystal Gem */}
          <polygon points="24,8 31,18 28,34 20,34 17,18" fill="url(#crystal1)" filter="url(#gemGlow)" stroke="#fbcfe8" strokeWidth="1" />
          <polygon points="24,8 28,34 24,34" fill="#ffffff" opacity="0.4" />
        </svg>
      );

    case "علم النفس والاجتماع":
    case "Psychology & Sociology":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="brainHeart" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fb7185" />
              <stop offset="0.6" stopColor="#e11d48" />
              <stop offset="1" stopColor="#9f1239" />
            </linearGradient>
            <filter id="heartGlow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f43f5e" floodOpacity="0.6" />
            </filter>
          </defs>
          {/* Brain curves left */}
          <path d="M22 14C19 12 15 14 15 18C13 19 12 22 13 25C12 28 14 31 17 31C18 33 21 34 23 33" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
          {/* Heart shape right */}
          <path d="M25 14C28 11 34 12 36 17C38 23 30 30 25 34C20 30 18 26 18 24" fill="url(#brainHeart)" filter="url(#heartGlow)" opacity="0.9" />
          <circle cx="25" cy="23" r="2" fill="#fff" />
          <path d="M21 23H29M25 19V27" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </svg>
      );

    case "الحاسب والذكاء الاصطناعي":
    case "Computer Science & AI":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="chipGrad" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22d3ee" />
              <stop offset="0.5" stopColor="#0891b2" />
              <stop offset="1" stopColor="#164e63" />
            </linearGradient>
            <filter id="chipGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22d3ee" floodOpacity="0.8" />
            </filter>
          </defs>
          {/* CPU Socket */}
          <rect x="13" y="13" width="22" height="22" rx="4" fill="url(#chipGrad)" stroke="#67e8f9" strokeWidth="1.5" filter="url(#chipGlow)" />
          {/* Core AI brain / circuit */}
          <circle cx="24" cy="24" r="5" fill="#083344" stroke="#a5f3fc" strokeWidth="1" />
          <circle cx="24" cy="24" r="2.5" fill="#22d3ee" />
          {/* Pins */}
          <path d="M18 10V13M24 10V13M30 10V13M18 35V38M24 35V38M30 35V38M10 18H13M10 24H13M10 30H13M35 18H38M35 24H38M35 30H38" stroke="#a5f3fc" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case "التربية الإسلامية":
    case "Islamic Education":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="islamicGold" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.5" stopColor="#d4af37" />
              <stop offset="1" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="islamicEmerald" x1="14" y1="12" x2="34" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" />
              <stop offset="0.6" stopColor="#065f46" />
              <stop offset="1" stopColor="#022c22" />
            </linearGradient>
            <filter id="crescentGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#d4af37" floodOpacity="0.75" />
            </filter>
          </defs>
          {/* Islamic Mihrab Arch */}
          <path d="M12 40V22C12 14 18 10 24 6C30 10 36 14 36 22V40H12Z" fill="url(#islamicEmerald)" stroke="url(#islamicGold)" strokeWidth="1.5" />
          {/* Glowing Crescent */}
          <path d="M26 15C21 16 18 20 19 25C20 30 25 33 29 31C24 33 19 29 19 24C19 19 23 16 26 15Z" fill="url(#islamicGold)" filter="url(#crescentGlow)" />
          {/* 8-pointed Islamic Star */}
          <circle cx="28" cy="20" r="2.2" fill="#fff" />
          <path d="M28 16V24M24 20H32" stroke="#fef08a" strokeWidth="1" strokeLinecap="round" />
          {/* Base border */}
          <rect x="10" y="38" width="28" height="4" rx="1.5" fill="url(#islamicGold)" />
        </svg>
      );

    case "اللغات الأجنبية":
    case "Foreign Languages":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="langGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a855f7" />
              <stop offset="0.6" stopColor="#7c3aed" />
              <stop offset="1" stopColor="#4c1d95" />
            </linearGradient>
            <filter id="langGlow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#a855f7" floodOpacity="0.6" />
            </filter>
          </defs>
          <circle cx="24" cy="24" r="14" fill="url(#langGrad)" filter="url(#langGlow)" stroke="#d8b4fe" strokeWidth="1.2" />
          <ellipse cx="24" cy="24" rx="7" ry="14" stroke="#e9d5ff" strokeWidth="1.2" />
          <path d="M10 24H38M13 17H35M13 31H35" stroke="#f3e8ff" strokeWidth="1.2" />
          <circle cx="32" cy="16" r="2" fill="#38bdf8" />
        </svg>
      );
  }
}
