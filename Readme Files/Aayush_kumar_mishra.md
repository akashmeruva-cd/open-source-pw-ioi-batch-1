<svg viewBox="0 0 1000 1900" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', system-ui, -apple-system, sans-serif">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0d0820"><animate attributeName="stop-color" values="#0d0820;#1a1035;#0d0820" dur="12s" repeatCount="indefinite"/></stop>
      <stop offset="50%" stop-color="#3d2870"><animate attributeName="stop-color" values="#3d2870;#5a3d9e;#3d2870" dur="12s" repeatCount="indefinite"/></stop>
      <stop offset="100%" stop-color="#c96a30"><animate attributeName="stop-color" values="#c96a30;#e8894a;#c96a30" dur="12s" repeatCount="indefinite"/></stop>
    </linearGradient>
    <linearGradient id="mtnBack" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a3880"/><stop offset="100%" stop-color="#2a1e55"/>
    </linearGradient>
    <linearGradient id="mtnMid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2e2250"/><stop offset="100%" stop-color="#1a1235"/>
    </linearGradient>
    <linearGradient id="mtnFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e1640"/><stop offset="100%" stop-color="#100c28"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2e7a48"/><stop offset="100%" stop-color="#1a5030"/>
    </linearGradient>
    <radialGradient id="flame" cx="50%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="30%" stop-color="#ffe566"/>
      <stop offset="70%" stop-color="#ff7820"/><stop offset="100%" stop-color="#ff3300"/>
    </radialGradient>
    <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff8e8"/><stop offset="60%" stop-color="#ffedb0"/>
      <stop offset="100%" stop-color="#ffd06030"/>
    </radialGradient>
    <linearGradient id="contentBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0d0d14"/><stop offset="100%" stop-color="#0a0a10"/>
    </linearGradient>

    <!-- ── TYPING ANIMATION CLIP PATHS ── -->
    <!-- 14s cycle, 4 lines × 3.5s each -->
    <!-- Per line: 1.2s type-in | 1.4s hold | 0.6s type-out | 0.3s gap -->
    <!-- L1: 0-3.5s  → keyTimes fractions of 14s -->
    <clipPath id="tc1">
      <rect x="0" y="416" width="0" height="36">
        <animate attributeName="width"
          values="0;1000;1000;0;0;0"
          keyTimes="0;0.086;0.186;0.229;0.25;1"
          dur="14s" repeatCount="indefinite" calcMode="spline"
          keySplines="0.2 0 0.6 1;0 0 1 1;0.4 0 0.8 1;0 0 1 1;0 0 1 1"/>
      </rect>
    </clipPath>
    <!-- L2: 3.5-7s -->
    <clipPath id="tc2">
      <rect x="0" y="416" width="0" height="36">
        <animate attributeName="width"
          values="0;0;1000;1000;0;0"
          keyTimes="0;0.25;0.336;0.436;0.479;1"
          dur="14s" repeatCount="indefinite" calcMode="spline"
          keySplines="0 0 1 1;0.2 0 0.6 1;0 0 1 1;0.4 0 0.8 1;0 0 1 1"/>
      </rect>
    </clipPath>
    <!-- L3: 7-10.5s -->
    <clipPath id="tc3">
      <rect x="0" y="416" width="0" height="36">
        <animate attributeName="width"
          values="0;0;1000;1000;0;0"
          keyTimes="0;0.5;0.586;0.686;0.729;1"
          dur="14s" repeatCount="indefinite" calcMode="spline"
          keySplines="0 0 1 1;0.2 0 0.6 1;0 0 1 1;0.4 0 0.8 1;0 0 1 1"/>
      </rect>
    </clipPath>
    <!-- L4: 10.5-14s -->
    <clipPath id="tc4">
      <rect x="0" y="416" width="0" height="36">
        <animate attributeName="width"
          values="0;0;1000;1000;0;0"
          keyTimes="0;0.75;0.836;0.936;0.979;1"
          dur="14s" repeatCount="indefinite" calcMode="spline"
          keySplines="0 0 1 1;0.2 0 0.6 1;0 0 1 1;0.4 0 0.8 1;0 0 1 1"/>
      </rect>
    </clipPath>

    <filter id="softglow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- ===== HERO SCENE ===== -->
  <rect width="1000" height="330" fill="url(#sky)"/>

  <!-- Stars -->
  <g fill="#ffffff">
    <circle cx="45"  cy="22" r="0.8" opacity="0.6"><animate attributeName="opacity" values="0.6;1;0.3;1;0.6" dur="3.2s" repeatCount="indefinite"/></circle>
    <circle cx="88"  cy="48" r="1.3" opacity="0.9"><animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.8s" repeatCount="indefinite"/></circle>
    <circle cx="160" cy="18" r="0.9" opacity="0.7"><animate attributeName="opacity" values="0.4;1;0.4" dur="4.1s" repeatCount="indefinite"/></circle>
    <circle cx="230" cy="55" r="1.1" opacity="0.8"><animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite"/></circle>
    <circle cx="290" cy="28" r="0.7" opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="3.7s" repeatCount="indefinite"/></circle>
    <circle cx="370" cy="40" r="1.4" opacity="0.9"><animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite"/></circle>
    <circle cx="440" cy="15" r="0.8" opacity="0.6"><animate attributeName="opacity" values="1;0.4;1" dur="3.4s" repeatCount="indefinite"/></circle>
    <circle cx="520" cy="32" r="1.0" opacity="0.7"><animate attributeName="opacity" values="0.4;1;0.4" dur="2.9s" repeatCount="indefinite"/></circle>
    <circle cx="610" cy="20" r="1.2" opacity="0.8"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="3.6s" repeatCount="indefinite"/></circle>
    <circle cx="680" cy="44" r="0.9" opacity="0.6"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.7s" repeatCount="indefinite"/></circle>
    <circle cx="750" cy="25" r="1.5" opacity="0.9"><animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite"/></circle>
    <circle cx="820" cy="50" r="0.8" opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="3.9s" repeatCount="indefinite"/></circle>
    <circle cx="890" cy="30" r="1.1" opacity="0.7"><animate attributeName="opacity" values="0.3;0.9;0.3" dur="3.1s" repeatCount="indefinite"/></circle>
    <circle cx="955" cy="18" r="0.9" opacity="0.8"><animate attributeName="opacity" values="1;0.4;1" dur="2.6s" repeatCount="indefinite"/></circle>
    <circle cx="135" cy="72" r="1.0" opacity="0.6"><animate attributeName="opacity" values="0.6;1;0.6" dur="4.3s" repeatCount="indefinite"/></circle>
    <circle cx="480" cy="60" r="0.7" opacity="0.5"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.5s" repeatCount="indefinite"/></circle>
  </g>

  <!-- Moon -->
  <circle cx="500" cy="68" r="50" fill="url(#moonGlow)" opacity="0.9">
    <animate attributeName="r" values="48;53;48" dur="5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="500" cy="68" r="32" fill="#fff9e8"/>
  <circle cx="490" cy="60" r="4" fill="#ffe9aa" opacity="0.5"/>
  <circle cx="512" cy="74" r="3" fill="#ffe9aa" opacity="0.4"/>
  <circle cx="496" cy="78" r="2" fill="#ffe9aa" opacity="0.3"/>

  <!-- Clouds -->
  <g fill="#c8c0e8" opacity="0.45">
    <g><ellipse cx="160" cy="95" rx="42" ry="16"/><ellipse cx="195" cy="88" rx="28" ry="12"/><ellipse cx="125" cy="89" rx="24" ry="11"/>
      <animateTransform attributeName="transform" type="translate" from="-200 0" to="1200 0" dur="26s" repeatCount="indefinite"/>
    </g>
  </g>
  <g fill="#b0a8cc" opacity="0.3">
    <g><ellipse cx="750" cy="72" rx="48" ry="17"/><ellipse cx="790" cy="65" rx="30" ry="13"/><ellipse cx="710" cy="65" rx="26" ry="12"/>
      <animateTransform attributeName="transform" type="translate" from="-600 0" to="1400 0" dur="34s" repeatCount="indefinite"/>
    </g>
  </g>

  <!-- Mountains back -->
  <polygon points="-10,275 90,155 200,275"  fill="url(#mtnBack)" opacity="0.7"/>
  <polygon points="160,275 295,120 420,275" fill="url(#mtnBack)" opacity="0.7"/>
  <polygon points="530,275 670,140 800,275" fill="url(#mtnBack)" opacity="0.7"/>
  <polygon points="760,275 880,158 1010,275" fill="url(#mtnBack)" opacity="0.7"/>
  <polygon points="90,155  73,182 107,182" fill="#e8e0ff" opacity="0.8"/>
  <polygon points="295,120 274,150 316,150" fill="#e8e0ff" opacity="0.8"/>
  <polygon points="670,140 651,166 689,166" fill="#e8e0ff" opacity="0.8"/>
  <polygon points="880,158 863,182 897,182" fill="#e8e0ff" opacity="0.7"/>

  <!-- Mountains mid -->
  <polygon points="-10,278 115,188 265,278" fill="url(#mtnMid)"/>
  <polygon points="370,278 465,205 600,278" fill="url(#mtnMid)"/>
  <polygon points="800,278 910,195 1010,278" fill="url(#mtnMid)"/>

  <!-- Mountains front -->
  <polygon points="-20,282 80,215 200,282" fill="url(#mtnFront)"/>
  <polygon points="780,282 900,218 1020,282" fill="url(#mtnFront)"/>

  <!-- Ground -->
  <rect x="0" y="278" width="1000" height="52" fill="url(#ground)"/>
  <path d="M0,278 Q150,268 300,280 Q450,292 600,276 Q750,262 900,278 Q950,282 1000,276 L1000,330 L0,330 Z" fill="#256b3a"/>
  <path d="M0,285 Q200,278 400,286 Q600,294 800,282 Q900,278 1000,284" stroke="#3a9e58" stroke-width="1.5" fill="none" opacity="0.6"/>

  <!-- Trees left -->
  <g transform="translate(48,246)">
    <rect x="-4" y="22" width="7" height="22" fill="#4a2e18" rx="1"/>
    <polygon points="0,-2 -18,22 18,22"  fill="#1e6b38"/>
    <polygon points="0,-14 -14,10 14,10" fill="#248844"/>
    <polygon points="0,-24 -10,0 10,0"   fill="#2da050"/>
    <animateTransform attributeName="transform" type="rotate" values="-1.5 0 268;1.5 0 268;-1.5 0 268" dur="4s" repeatCount="indefinite" additive="sum"/>
  </g>
  <g transform="translate(82,252)">
    <rect x="-3" y="18" width="6" height="18" fill="#4a2e18" rx="1"/>
    <polygon points="0,-2 -14,18 14,18"  fill="#1a5e30"/>
    <polygon points="0,-12 -10,8 10,8"   fill="#207a3e"/>
    <polygon points="0,-20 -7,-2 7,-2"   fill="#289048"/>
    <animateTransform attributeName="transform" type="rotate" values="1.5 0 270;-1.5 0 270;1.5 0 270" dur="3.5s" repeatCount="indefinite" additive="sum"/>
  </g>
  <g transform="translate(218,250)">
    <rect x="-4" y="20" width="7" height="20" fill="#4a2e18" rx="1"/>
    <polygon points="0,-2 -16,20 16,20"  fill="#1e6b38"/>
    <polygon points="0,-13 -12,9 12,9"   fill="#248844"/>
    <polygon points="0,-22 -8,0 8,0"     fill="#2da050"/>
    <animateTransform attributeName="transform" type="rotate" values="-1.5 0 270;1.5 0 270;-1.5 0 270" dur="3.8s" repeatCount="indefinite" additive="sum"/>
  </g>

  <!-- Trees right -->
  <g transform="translate(885,248)">
    <rect x="-4" y="20" width="7" height="20" fill="#4a2e18" rx="1"/>
    <polygon points="0,-2 -17,20 17,20"  fill="#1e6b38"/>
    <polygon points="0,-13 -12,8 12,8"   fill="#248844"/>
    <polygon points="0,-22 -8,0 8,0"     fill="#2da050"/>
    <animateTransform attributeName="transform" type="rotate" values="-1.5 0 268;1.5 0 268;-1.5 0 268" dur="3.6s" repeatCount="indefinite" additive="sum"/>
  </g>
  <g transform="translate(922,253)">
    <rect x="-3" y="16" width="6" height="16" fill="#4a2e18" rx="1"/>
    <polygon points="0,-2 -13,16 13,16"  fill="#1a5e30"/>
    <polygon points="0,-11 -9,6 9,6"     fill="#207a3e"/>
    <polygon points="0,-19 -6,-1 6,-1"   fill="#289048"/>
    <animateTransform attributeName="transform" type="rotate" values="1.5 0 269;-1.5 0 269;1.5 0 269" dur="4.2s" repeatCount="indefinite" additive="sum"/>
  </g>
  <g transform="translate(958,256)">
    <rect x="-3" y="14" width="5" height="14" fill="#4a2e18" rx="1"/>
    <polygon points="0,-2 -11,14 11,14"  fill="#1e6b38"/>
    <polygon points="0,-10 -8,5 8,5"     fill="#248844"/>
    <animateTransform attributeName="transform" type="rotate" values="-1 0 270;1 0 270;-1 0 270" dur="3.3s" repeatCount="indefinite" additive="sum"/>
  </g>

  <!-- Birds -->
  <g fill="none" stroke="#1a1030" stroke-width="1.5" stroke-linecap="round" opacity="0.5">
    <path d="M0,56 q5,-6 10,0 q5,-6 10,0">
      <animateTransform attributeName="transform" type="translate" from="-30 0" to="1030 0" dur="16s" repeatCount="indefinite"/>
    </path>
    <path d="M0,80 q4,-5 8,0 q4,-5 8,0">
      <animateTransform attributeName="transform" type="translate" from="-60 0" to="1060 0" dur="22s" begin="4s" repeatCount="indefinite"/>
    </path>
  </g>

  <!-- ===== ROCKET ===== -->
  <rect x="92" y="292" width="68" height="7" rx="2" fill="#3a3a4a"/>
  <rect x="108" y="278" width="5" height="16" fill="#4a4a5a"/>
  <rect x="139" y="278" width="5" height="16" fill="#4a4a5a"/>
  <line x1="108" y1="282" x2="118" y2="282" stroke="#5a5a6a" stroke-width="2"/>
  <line x1="135" y1="285" x2="144" y2="285" stroke="#5a5a6a" stroke-width="2"/>

  <!-- Smoke -->
  <g>
    <circle cx="126" cy="292" r="5" fill="#8a8a9a" opacity="0.5">
      <animate attributeName="cy" values="292;308;328" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="r" values="5;14;24" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.5;0.25;0" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="114" cy="294" r="4" fill="#7a7a8a" opacity="0.4">
      <animate attributeName="cy" values="294;310;330" dur="2s" begin="0.5s" repeatCount="indefinite"/>
      <animate attributeName="r" values="4;12;20" dur="2s" begin="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0.2;0" dur="2s" begin="0.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="142" cy="294" r="4" fill="#7a7a8a" opacity="0.4">
      <animate attributeName="cy" values="294;312;332" dur="2s" begin="1s" repeatCount="indefinite"/>
      <animate attributeName="r" values="4;12;20" dur="2s" begin="1s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0.2;0" dur="2s" begin="1s" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- Rocket body -->
  <g>
    <animateTransform attributeName="transform" type="translate"
      values="0,0; 0,-18; 0,-270; 0,-270; 0,0"
      keyTimes="0;0.08;0.55;0.62;1"
      dur="6s" repeatCount="indefinite"/>
    <ellipse cx="126" cy="290" rx="8" ry="20" fill="url(#flame)" opacity="0.95">
      <animate attributeName="ry" values="20;28;16;26;20" dur="0.18s" repeatCount="indefinite"/>
      <animate attributeName="rx" values="8;5;9;5;8" dur="0.18s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="126" cy="286" rx="4" ry="10" fill="#ffffff" opacity="0.9">
      <animate attributeName="ry" values="10;16;8;14;10" dur="0.14s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="126" cy="202" rx="15" ry="58" fill="#f0f2f5"/>
    <ellipse cx="118" cy="202" rx="6" ry="56" fill="#dde0e8" opacity="0.6"/>
    <ellipse cx="134" cy="202" rx="4" ry="56" fill="#ffffff" opacity="0.5"/>
    <path d="M126,136 L112,172 Q119,165 126,163 Q133,165 140,172 Z" fill="#e8404a"/>
    <path d="M126,136 L112,172 Q116,160 126,158 Z" fill="#c82030" opacity="0.5"/>
    <circle cx="126" cy="184" r="11" fill="#2a3a5a" stroke="#8ab0d8" stroke-width="2"/>
    <circle cx="126" cy="184" r="7" fill="#3a5888"/>
    <circle cx="126" cy="184" r="5" fill="#4a78c0" opacity="0.8"/>
    <ellipse cx="122" cy="180" rx="3" ry="2" fill="#a0c8f0" opacity="0.6"/>
    <line x1="126" y1="168" x2="126" y2="200" stroke="#d0d4dc" stroke-width="0.8" opacity="0.6"/>
    <line x1="112" y1="195" x2="140" y2="195" stroke="#d0d4dc" stroke-width="0.8" opacity="0.5"/>
    <line x1="112" y1="210" x2="140" y2="210" stroke="#d0d4dc" stroke-width="0.8" opacity="0.4"/>
    <path d="M111,224 L90,258 L111,252 Z" fill="#e8404a"/>
    <path d="M141,224 L162,258 L141,252 Z" fill="#e8404a"/>
    <path d="M111,224 L90,258 L111,252 Z" fill="#c02030" opacity="0.3"/>
    <rect x="113" y="248" width="26" height="8" rx="2" fill="#c82030"/>
    <rect x="117" y="252" width="18" height="4" rx="1" fill="#a01a20"/>
    <rect x="110" y="220" width="32" height="5" rx="1" fill="#c8ccd8"/>
  </g>

  <!-- ===== WAVING BOY ===== -->
  <g>
    <animateTransform attributeName="transform" type="translate" values="856,216; 856,212; 856,216" dur="1.8s" repeatCount="indefinite"/>
    <ellipse cx="0" cy="90" rx="36" ry="6" fill="#000" opacity="0.1"/>
    <ellipse cx="-11" cy="93" rx="11" ry="4" fill="#2a2a2a"/>
    <ellipse cx="11"  cy="93" rx="11" ry="4" fill="#2a2a2a"/>
    <rect x="-18" y="56" width="14" height="38" rx="5" fill="#3d5280"/>
    <rect x="4"   y="56" width="14" height="38" rx="5" fill="#3d5280"/>
    <rect x="-14" y="60" width="5" height="30" rx="2" fill="#4a6298" opacity="0.5"/>
    <rect x="8"   y="60" width="5" height="30" rx="2" fill="#4a6298" opacity="0.5"/>
    <rect x="-21" y="14" width="42" height="46" rx="13" fill="#e84040"/>
    <path d="M-8,14 Q0,8 8,14" stroke="#c02828" stroke-width="2" fill="none"/>
    <line x1="-10" y1="30" x2="-16" y2="58" stroke="#c82828" stroke-width="1" opacity="0.5"/>
    <line x1="10"  y1="30" x2="16"  y2="58" stroke="#c82828" stroke-width="1" opacity="0.5"/>
    <rect x="-33" y="18" width="12" height="34" rx="5" fill="#e8b488" transform="rotate(10 -27 18)"/>
    <ellipse cx="-27" cy="52" rx="6" ry="5" fill="#e0a878"/>
    <g transform="translate(22,18)">
      <rect x="-6" y="0" width="12" height="34" rx="5" fill="#e8b488">
        <animateTransform attributeName="transform" type="rotate"
          values="0 0 0;-50 0 0;-5 0 0;-50 0 0;0 0 0"
          keyTimes="0;0.3;0.5;0.7;1" dur="1.8s" repeatCount="indefinite"/>
      </rect>
    </g>
    <rect x="-6" y="7" width="12" height="10" rx="4" fill="#e8b488"/>
    <circle cx="0" cy="-4" r="20" fill="#f0c090"/>
    <path d="M-20,-8 a20,18 0 0 1 40,0 Q18,-20 0,-22 Q-18,-20 -20,-8 Z" fill="#2a1a08"/>
    <path d="M-20,-8 Q-22,-4 -18,0" stroke="#2a1a08" stroke-width="3" fill="none"/>
    <circle cx="-7" cy="-5" r="2.5" fill="#1a1a1a"/>
    <circle cx="7"  cy="-5" r="2.5" fill="#1a1a1a"/>
    <circle cx="-6" cy="-6" r="0.8" fill="#ffffff"/>
    <circle cx="8"  cy="-6" r="0.8" fill="#ffffff"/>
    <path d="M-10,-10 Q-7,-12 -4,-10" stroke="#2a1a08" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M4,-10 Q7,-12 10,-10" stroke="#2a1a08" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M-7,2 Q0,8 7,2" stroke="#1a1a1a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <circle cx="-12" cy="0" r="4" fill="#e89090" opacity="0.4"/>
    <circle cx="12"  cy="0" r="4" fill="#e89090" opacity="0.4"/>
  </g>

  <!-- ===== CONTENT SECTION ===== -->
  <rect x="0" y="330" width="1000" height="1570" fill="url(#contentBg)"/>
  <line x1="0" y1="330" x2="1000" y2="330" stroke="#2a2040" stroke-width="2"/>

  <!-- Faint grid -->
  <g stroke="#ffffff" opacity="0.018" stroke-width="1">
    <line x1="0" y1="620" x2="1000" y2="620"/>
    <line x1="0" y1="810" x2="1000" y2="810"/>
    <line x1="0" y1="1000" x2="1000" y2="1000"/>
    <line x1="0" y1="1190" x2="1000" y2="1190"/>
    <line x1="0" y1="1380" x2="1000" y2="1380"/>
  </g>

  <!-- ── NAME (static, bold) ── -->
  <text x="500" y="394" text-anchor="middle" font-size="34" font-weight="700" fill="#f0f0f8" letter-spacing="-0.5">Hi, I'm Aayush</text>

  <!-- ── TYPING LINES (one at a time, left-to-right reveal) ── -->
  <text x="500" y="440" text-anchor="middle"
    font-family="'JetBrains Mono','Fira Code','Consolas','Courier New',monospace"
    font-size="16" fill="#8b9aff" letter-spacing="0.5"
    clip-path="url(#tc1)">Space Enthusiast · Builder · Dreamer</text>

  <text x="500" y="440" text-anchor="middle"
    font-family="'JetBrains Mono','Fira Code','Consolas','Courier New',monospace"
    font-size="16" fill="#8b9aff" letter-spacing="0.5"
    clip-path="url(#tc2)">Let's Dream Beyond Earth</text>

  <text x="500" y="440" text-anchor="middle"
    font-family="'JetBrains Mono','Fira Code','Consolas','Courier New',monospace"
    font-size="16" fill="#8b9aff" letter-spacing="0.5"
    clip-path="url(#tc3)">Let's Build for Space</text>

  <text x="500" y="440" text-anchor="middle"
    font-family="'JetBrains Mono','Fira Code','Consolas','Courier New',monospace"
    font-size="16" fill="#8b9aff" letter-spacing="0.5"
    clip-path="url(#tc4)">Let's Innovate for Humanity</text>

  <!-- Blinking cursor — appears only when a line is visible -->
  <rect y="421" width="2" height="22" rx="1" fill="#8b9aff">
    <!-- x tracks the right edge of the active text roughly -->
    <animate attributeName="x"
      values="668;668;668;668;668;  606;606;606;606;606;  592;592;592;592;592;  620;620;620;620;620"
      keyTimes="0;0.086;0.186;0.229;0.25;  0.25;0.336;0.436;0.479;0.5;  0.5;0.586;0.686;0.729;0.75;  0.75;0.836;0.936;0.979;1"
      dur="14s" repeatCount="indefinite" calcMode="discrete"/>
    <!-- blink -->
    <animate attributeName="opacity"
      values="0;1;1;0;0"
      keyTimes="0;0.4;0.6;0.9;1"
      dur="0.9s" repeatCount="indefinite"/>
  </rect>

  <!-- Thin rule -->
  <line x1="60" y1="462" x2="940" y2="462" stroke="#2a2040" stroke-width="1"/>

  <!-- ── MISSION FOCUS ── -->
  <text x="60" y="500" font-size="11" fill="#5a5a78" letter-spacing="3" font-weight="600">MISSION FOCUS</text>
  <text x="60" y="528" font-size="16" fill="#c8c0e0">Turning bold ideas into real products, exploring space-tech concepts, and building</text>
  <text x="60" y="550" font-size="16" fill="#c8c0e0">tools that help people discover the right opportunities to build together.</text>

  <line x1="60" y1="572" x2="940" y2="572" stroke="#1e1e30" stroke-width="1"/>

  <!-- ── CURRENTLY WORKING ON ── -->
  <text x="60" y="608" font-size="11" fill="#5a5a78" letter-spacing="3" font-weight="600">CURRENTLY WORKING ON</text>
  <rect x="60" y="620" width="2" height="86" rx="1" fill="#3a8a5a"/>
  <text x="78" y="642" font-size="15.5" fill="#b0c8b8">Space-tech &amp; rocket-related concepts</text>
  <text x="78" y="670" font-size="15.5" fill="#b0c8b8">Product-driven startups and experiments</text>
  <text x="78" y="698" font-size="15.5" fill="#b0c8b8">Tools that empower builders and developers</text>

  <line x1="60" y1="724" x2="940" y2="724" stroke="#1e1e30" stroke-width="1"/>

  <!-- ── OPEN TO COLLABORATE ── -->
  <text x="60" y="760" font-size="11" fill="#5a5a78" letter-spacing="3" font-weight="600">OPEN TO COLLABORATE ON</text>
  <rect x="60" y="772" width="2" height="86" rx="1" fill="#5a78c8"/>
  <text x="78" y="794" font-size="15.5" fill="#a8b8d8">Open-source projects</text>
  <text x="78" y="822" font-size="15.5" fill="#a8b8d8">Developer tools &amp; automation</text>
  <text x="78" y="850" font-size="15.5" fill="#a8b8d8">Space engineering, aerospace software, and simulation ideas</text>

  <line x1="60" y1="876" x2="940" y2="876" stroke="#1e1e30" stroke-width="1"/>

  <!-- ── CURRENTLY LEARNING ── -->
  <text x="60" y="912" font-size="11" fill="#5a5a78" letter-spacing="3" font-weight="600">CURRENTLY LEARNING</text>
  <rect x="60" y="924" width="2" height="86" rx="1" fill="#8a60c0"/>
  <text x="78" y="946" font-size="15.5" fill="#c0b0d8">Advanced software engineering</text>
  <text x="78" y="974" font-size="15.5" fill="#c0b0d8">Systems thinking &amp; engineering design</text>
  <text x="78" y="1002" font-size="15.5" fill="#c0b0d8">Fundamentals of rockets, orbits, and space missions</text>

  <line x1="60" y1="1028" x2="940" y2="1028" stroke="#1e1e30" stroke-width="1"/>

  <!-- ── LOOKING FOR HELP WITH ── -->
  <text x="60" y="1064" font-size="11" fill="#5a5a78" letter-spacing="3" font-weight="600">LOOKING FOR HELP WITH</text>
  <rect x="60" y="1076" width="2" height="86" rx="1" fill="#c06840"/>
  <text x="78" y="1098" font-size="15.5" fill="#d8b8a0">Scaling ambitious ideas</text>
  <text x="78" y="1126" font-size="15.5" fill="#d8b8a0">Connecting with space-tech builders &amp; mentors</text>
  <text x="78" y="1154" font-size="15.5" fill="#d8b8a0">Learning from experienced open-source contributors</text>

  <line x1="60" y1="1180" x2="940" y2="1180" stroke="#1e1e30" stroke-width="1"/>

  <!-- ── ASK ME ABOUT ── -->
  <text x="60" y="1216" font-size="11" fill="#5a5a78" letter-spacing="3" font-weight="600">ASK ME ABOUT</text>
  <text x="60" y="1242" font-size="15.5" fill="#c8c0e0">Open source, startups, space-tech, rockets, or building something from zero.</text>

  <line x1="60" y1="1268" x2="940" y2="1268" stroke="#1e1e30" stroke-width="1"/>

  <!-- ── FUN FACT ── -->
  <text x="60" y="1304" font-size="11" fill="#5a5a78" letter-spacing="3" font-weight="600">FUN FACT</text>
  <text x="60" y="1330" font-size="15.5" fill="#c8c0e0">I genuinely believe open source is humanity's launchpad to becoming a</text>
  <text x="60" y="1354" font-size="15.5" fill="#c8c0e0">multi-planetary species.</text>

  <line x1="60" y1="1380" x2="940" y2="1380" stroke="#2a2040" stroke-width="1"/>

  <!-- ── LONG-TERM VISION ── -->
  <text x="60" y="1424" font-size="22" font-weight="700" fill="#f0f0f8">&#x1F9ED;  My Long-Term Vision</text>
  <line x1="60" y1="1440" x2="940" y2="1440" stroke="#2a2040" stroke-width="1"/>

  <!-- Code block (matches GitHub rendering) -->
  <rect x="60" y="1464" width="880" height="140" rx="8" fill="#161622" stroke="#2e2e48" stroke-width="1.5"/>
  <!-- Copy icon -->
  <rect x="896" y="1474" width="30" height="24" rx="4" fill="#1e1e2e" stroke="#2e2e48" stroke-width="1"/>
  <rect x="901" y="1479" width="14" height="12" rx="2" fill="none" stroke="#505070" stroke-width="1.2"/>
  <rect x="905" y="1475" width="14" height="12" rx="2" fill="none" stroke="#505070" stroke-width="1.2"/>
  <!-- Code text -->
  <text x="88" y="1504" font-family="'Courier New','Consolas','Lucida Console',monospace" font-size="14.5" fill="#8888a8" letter-spacing="0.3">GOAL:</text>
  <text x="88" y="1530" font-family="'Courier New','Consolas','Lucida Console',monospace" font-size="14.5" fill="#c8c8d8" letter-spacing="0.3">In the next 10 years, I want every rocket launch</text>
  <text x="88" y="1556" font-family="'Courier New','Consolas','Lucida Console',monospace" font-size="14.5" fill="#c8c8d8" letter-spacing="0.3">to use something I build.</text>
  <!-- Blinking cursor inside code block -->
  <rect x="294" y="1542" width="9" height="17" rx="1" fill="#8888a8" opacity="0.7">
    <animate attributeName="opacity" values="0.7;0;0.7" dur="1s" repeatCount="indefinite"/>
  </rect>

  <!-- ── FOOTER ── -->
  <line x1="0" y1="1858" x2="1000" y2="1858" stroke="#1e1e30" stroke-width="1"/>
  <text x="500" y="1888" text-anchor="middle" font-size="13" fill="#3a3a58">Building from zero, aiming for orbit</text>
  <text x="500" y="1908" text-anchor="middle" font-size="12" fill="#2e2e48">devfox.in · Bengaluru, India</text>
</svg>