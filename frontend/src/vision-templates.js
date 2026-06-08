export const VISION_TEMPLATES = {
  'vision-board': {
    id: 'vision-board',
    name: 'Vision Board',
    author: 'Roman Pichler',
    emoji: '🎯',
    description: 'Le classique en 5 axes : vision, cible, besoins, produit, objectifs business.',
    color: '#a78bfa',
    colorDim: 'rgba(167,139,250,0.1)',
    colorB: 'rgba(167,139,250,0.3)',
    sections: [
      { key: 'vision',  label: 'Vision',          question: 'Quelle est l\'ambition à long terme ?',          color: '#a78bfa', dim: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
      { key: 'target',  label: 'Cible',            question: 'Qui sont nos utilisateurs et clients cibles ?',  color: '#60a5fa', dim: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
      { key: 'needs',   label: 'Besoins',          question: 'Quels problèmes ou besoins résolvons-nous ?',    color: '#f87171', dim: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
      { key: 'product', label: 'Produit',           question: 'Quelles fonctionnalités ou capacités clés ?',   color: '#4ade80', dim: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)' },
      { key: 'goals',   label: 'Objectifs biz',    question: 'Quels bénéfices pour l\'organisation ?',        color: '#facc15', dim: 'rgba(250,204,21,0.1)',   border: 'rgba(250,204,21,0.25)' },
    ],
  },

  'elevator-pitch': {
    id: 'elevator-pitch',
    name: 'Elevator Pitch',
    author: 'Geoffrey Moore',
    emoji: '🎤',
    description: '6 blocs pour synthétiser votre valeur unique en une phrase percutante.',
    color: '#fb923c',
    colorDim: 'rgba(251,146,60,0.1)',
    colorB: 'rgba(251,146,60,0.3)',
    sections: [
      { key: 'for',        label: 'Pour',            question: 'Pour qui est ce produit ? (segment cible)',               color: '#60a5fa', dim: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
      { key: 'who',        label: 'Qui',             question: 'Quel besoin ou problème urgent ont-ils ?',                color: '#a78bfa', dim: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
      { key: 'is',         label: 'Est un',          question: 'Quelle catégorie de produit sommes-nous ?',              color: '#4ade80', dim: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)' },
      { key: 'that',       label: 'Qui permet de',   question: 'Quel est le bénéfice clé et différenciateur ?',          color: '#fb923c', dim: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.25)' },
      { key: 'unlike',     label: 'Contrairement à', question: 'Quelle est l\'alternative principale (concurrents) ?',  color: '#f87171', dim: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
      { key: 'difference', label: 'Notre différence', question: 'Qu\'est-ce qui nous rend vraiment supérieurs ?',       color: '#facc15', dim: 'rgba(250,204,21,0.1)',   border: 'rgba(250,204,21,0.25)' },
    ],
    outputTemplate: (s) =>
      `Pour ${s.for || '…'}, qui ${s.who || '…'}, notre produit est ${s.is || '…'} qui permet de ${s.that || '…'}. Contrairement à ${s.unlike || '…'}, notre solution ${s.difference || '…'}.`,
  },

  'golden-circle': {
    id: 'golden-circle',
    name: 'Golden Circle',
    author: 'Simon Sinek',
    emoji: '⭕',
    description: 'Partez du POURQUOI pour inspirer — la vision naît du sens, pas du produit.',
    color: '#facc15',
    colorDim: 'rgba(250,204,21,0.1)',
    colorB: 'rgba(250,204,21,0.3)',
    sections: [
      { key: 'why',  label: 'POURQUOI',  question: 'Pourquoi ce produit existe-t-il ? Quelle croyance défendons-nous ?', color: '#facc15', dim: 'rgba(250,204,21,0.12)',   border: 'rgba(250,204,21,0.35)' },
      { key: 'how',  label: 'COMMENT',   question: 'Comment réalisons-nous notre mission ? Nos principes ?',             color: '#fb923c', dim: 'rgba(251,146,60,0.1)',    border: 'rgba(251,146,60,0.28)' },
      { key: 'what', label: 'QUOI',      question: 'Qu\'est-ce que nous faisons concrètement ?',                         color: '#4ade80', dim: 'rgba(74,222,128,0.1)',    border: 'rgba(74,222,128,0.25)' },
    ],
  },

  'nabc': {
    id: 'nabc',
    name: 'NABC',
    author: 'SRI International',
    emoji: '🔬',
    description: 'Besoin, Approche, Bénéfices, Compétition — ancre la vision dans la valeur réelle.',
    color: '#4ade80',
    colorDim: 'rgba(74,222,128,0.08)',
    colorB: 'rgba(74,222,128,0.3)',
    sections: [
      { key: 'need',        label: 'Besoin (N)',      question: 'Quel problème critique et urgent existe ?',            color: '#f87171', dim: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
      { key: 'approach',    label: 'Approche (A)',    question: 'Quelle est notre solution unique à ce problème ?',     color: '#60a5fa', dim: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
      { key: 'benefits',    label: 'Bénéfices (B)',   question: 'Quelle valeur créons-nous pour les utilisateurs ?',   color: '#4ade80', dim: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)' },
      { key: 'competition', label: 'Compétition (C)', question: 'Pourquoi notre approche est-elle supérieure ?',       color: '#a78bfa', dim: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
    ],
  },

  'press-release': {
    id: 'press-release',
    name: 'Future Press Release',
    author: 'Méthode Amazon',
    emoji: '📰',
    description: 'Rédigez le communiqué de votre lancement réussi — travaillez à rebours depuis le succès.',
    color: '#e879f9',
    colorDim: 'rgba(232,121,249,0.08)',
    colorB: 'rgba(232,121,249,0.3)',
    sections: [
      { key: 'headline',   label: 'Titre accrocheur',   question: 'Quel titre pour votre succès dans 3 ans ?',           color: '#e879f9', dim: 'rgba(232,121,249,0.1)', border: 'rgba(232,121,249,0.28)' },
      { key: 'subheadline',label: 'Sous-titre',         question: 'En une ligne, quel impact avez-vous eu ?',            color: '#a78bfa', dim: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
      { key: 'problem',    label: 'Problème passé',     question: 'Quel problème existait avant votre produit ?',        color: '#f87171', dim: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
      { key: 'solution',   label: 'Notre solution',     question: 'Comment avez-vous résolu ce problème brillamment ?',  color: '#4ade80', dim: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)' },
      { key: 'quote',      label: 'Citation client',    question: 'Que dirait un client enchanté de vous ?',             color: '#facc15', dim: 'rgba(250,204,21,0.1)',   border: 'rgba(250,204,21,0.25)' },
      { key: 'impact',     label: 'Impact & chiffres',  question: 'Quel impact mesurable avez-vous eu sur le monde ?',  color: '#60a5fa', dim: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
    ],
  },
}

export const TEMPLATE_LIST = Object.values(VISION_TEMPLATES)
