/**
 * Fully local hair quiz rebuild.
 * Results page is driven by localStorage key `octane_answers`
 * (same shape the official results HTML expects) — no live Octane/API calls.
 */

import { HAIR_TYPE_LOOKUP } from './hair-type-lookup.js';

export const PROGRESS = {
  q1: 7,
  q2_dry: 14,
  q2_frizzy: 21,
  q2_growth: 29,
  q2_oily: 36,
  q2_volume: 43,
  q2_damage: 50,
  q3_wash: 57,
  q4_airdry: 64,
  q5_strand: 71,
  q6_volume_pref: 79,
  q7_heat: 86,
  q8_damage: 93,
  q9_email: 100,
  q10_calculating: 100,
  results: 100,
};

export const QUESTIONS = {
  q1: {
    id: 'q1',
    title: "What's your biggest hair frustration right now?",
    type: 'multiple_choice',
    buttonText: 'CONTINUE',
    showBack: false,
    autoAdvance: false,
    options: [
      { id: 'dry', text: 'My hair is always dry', next: 'q2_dry', pain: 'dry' },
      { id: 'frizzy', text: 'My hair is frizzy', next: 'q2_frizzy', pain: 'frizzy' },
      { id: 'growth', text: "My hair won't grow", next: 'q2_growth', pain: 'growth' },
      { id: 'greasy', text: 'My scalp is greasy', next: 'q2_oily', pain: 'oily' },
      { id: 'volume', text: 'My hair has zero volume', next: 'q2_volume', pain: 'volume' },
      { id: 'damaged', text: 'My hair is damaged', next: 'q2_damage', pain: 'damage' },
    ],
  },

  q2_dry: {
    id: 'q2_dry',
    title: 'When you run your fingers through your dry hair, it feels...',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: 'slightly_dry', text: 'A little dry sometimes', next: 'q3_wash', severity: 'Mild' },
      { id: 'consistently_dry', text: 'Consistently dry and rough', next: 'q3_wash', severity: 'Moderate' },
      { id: 'straw', text: 'Like straw, nothing absorbs', next: 'q3_wash', severity: 'Severe' },
    ],
  },

  q2_frizzy: {
    id: 'q2_frizzy',
    title: 'How bad does the frizz get on a typical day?',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: 'flyaways', text: 'Mostly just flyaways', next: 'q3_wash', severity: 'Mild' },
      { id: 'poofy', text: 'Poofy and hard to control', next: 'q3_wash', severity: 'Moderate' },
      { id: 'total_frizz', text: 'Takes over within an hour of styling', next: 'q3_wash', severity: 'Severe' },
    ],
  },

  q2_growth: {
    id: 'q2_growth',
    title: 'How much breakage do you notice when brushing or styling?',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: 'split_ends', text: 'A little, mostly split ends', next: 'q3_wash', severity: 'Mild' },
      { id: 'some_breakage', text: 'Some breakage every time I style', next: 'q3_wash', severity: 'Moderate' },
      { id: 'lots_breakage', text: 'Constantly every time I brush', next: 'q3_wash', severity: 'Severe' },
    ],
  },

  q2_oily: {
    id: 'q2_oily',
    title: 'How quickly does your hair get greasy after washing?',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: 'same_day', text: 'The same day', next: 'q3_wash', severity: 'Mild' },
      { id: 'next_day', text: 'By the next morning', next: 'q3_wash', severity: 'Moderate' },
      { id: 'two_days', text: 'Within two days', next: 'q3_wash', severity: 'Severe' },
    ],
  },

  q2_volume: {
    id: 'q2_volume',
    title: "How would you describe your hair's natural body?",
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: 'falls_fast', text: 'Some body, it just falls fast', next: 'q3_wash', severity: 'Mild' },
      { id: 'very_little', text: 'Very little natural body', next: 'q3_wash', severity: 'Moderate' },
      { id: 'completely_flat', text: 'Completely flat, always has been', next: 'q3_wash', severity: 'Severe' },
    ],
  },

  // Damage path: Q2 sets damage_level AND severity; skips later Q8 damage check
  q2_damage: {
    id: 'q2_damage',
    title: 'How would you describe your hair right now?',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: 'dull', text: 'Looks dull but feels okay', next: 'q3_wash', severity: 'Mild', damage: 'Mild' },
      { id: 'brittle', text: 'Brittle, weak and breaking off', next: 'q3_wash', severity: 'Moderate', damage: 'Moderate' },
      { id: 'straw_snaps', text: 'Feels like straw and snaps off constantly', next: 'q3_wash', severity: 'Severe', damage: 'Severe' },
    ],
  },

  q3_wash: {
    id: 'q3_wash',
    title: 'How long does your hair stay clean after washing?',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: '1_2_days', text: '1 to 2 days', next: 'q4_airdry', wash: '1_2_days' },
      { id: '3_4_days', text: '3 to 4 days', next: 'q4_airdry', wash: '3_4_days' },
      { id: '5_plus', text: '5 or more days', next: 'q4_airdry', wash: '5_plus_days' },
    ],
  },

  q4_airdry: {
    id: 'q4_airdry',
    title: 'If you let your hair air dry without any products, what does it look like?',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: 'flat_smooth', text: 'Flat and smooth, not much volume or frizz', next: 'q5_strand', airdry: 'Flat' },
      { id: 'in_between', text: 'Somewhere in between, a little frizz or wave', next: 'q5_strand', airdry: 'in_between' },
      { id: 'frizzy_poofy', text: 'Frizzy and poofy, lots of volume and texture', next: 'q5_strand', airdry: 'Frizzy' },
    ],
  },

  q5_strand: {
    id: 'q5_strand',
    title: 'If you had to describe the shape of your individual hair strands, which is closest?',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: 'straight', text: 'Straight, no wave at all', next: 'q6_volume_pref', pattern: 'Straight' },
      { id: 'wavy', text: 'Wavy, forms an S shape', next: 'q6_volume_pref', pattern: 'Wavy' },
      { id: 'curly', text: 'Curly, forms spirals or ringlets', next: 'q6_volume_pref', pattern: 'Curly' },
    ],
  },

  q6_volume_pref: {
    id: 'q6_volume_pref',
    title: 'How much volume do you want in your hair?',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: 'big_hair', text: 'I want big hair', next: 'q7_heat', volume: 'Max' },
      { id: 'some_volume', text: 'Some, but not too much', next: 'q7_heat', volume: 'Moderate' },
      { id: 'sleek', text: 'None, I want it sleek and smooth', next: 'q7_heat', volume: 'None' },
    ],
  },

  q7_heat: {
    id: 'q7_heat',
    title: 'Which hot tools do you use regularly?',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    // next is resolved dynamically: skip q8 if damage path
    options: [
      { id: 'blow_dryer', text: 'Blow dryer or blow dryer brush', next: 'q8_damage', heat: 'blow_dryer' },
      { id: 'iron', text: 'Flat iron, curling iron or wand', next: 'q8_damage', heat: 'iron' },
      { id: 'both', text: 'I use a blow dryer and an iron', next: 'q8_damage', heat: 'both' },
      { id: 'none', text: "I don't use heat tools", next: 'q8_damage', heat: 'none' },
    ],
  },

  q8_damage: {
    id: 'q8_damage',
    title: 'How damaged is your hair right now?',
    type: 'multiple_choice',
    buttonText: 'SUBMIT',
    showBack: true,
    autoAdvance: true,
    options: [
      { id: 'healthy', text: 'Not damaged, my hair feels healthy', next: 'q9_email', damage: 'None' },
      { id: 'dull', text: 'Looks dull but feels okay', next: 'q9_email', damage: 'Mild' },
      { id: 'brittle', text: 'Brittle, weak and breaking off', next: 'q9_email', damage: 'Moderate' },
      { id: 'straw_snaps', text: 'Feels like straw and snaps off constantly', next: 'q9_email', damage: 'Severe' },
    ],
  },

  q9_email: {
    id: 'q9_email',
    title: 'Where should we send your personalized product list?',
    type: 'email',
    placeholder: 'Enter email',
    buttonText: 'Show Me My Product List',
    showBack: true,
    next: 'q10_calculating',
  },

  q10_calculating: {
    id: 'q10_calculating',
    title: 'Building your personalized product list',
    type: 'calculating',
    next: 'results',
  },
};

export function getProgress(questionId) {
  return PROGRESS[questionId] ?? 7;
}

/**
 * Local hair_type for every pain × wash × airdry × pattern combo (162).
 * Built from captured live outcomes + deterministic fill — offline only.
 */
export function deriveHairType(airdry, pattern, pain, wash = '1_2_days') {
  const key = `${pain || 'dry'}|${wash || '1_2_days'}|${airdry || 'Flat'}|${pattern || 'Straight'}`;
  return HAIR_TYPE_LOOKUP[key] || 'Fine';
}

/**
 * Build the exact `octane_answers` object the official results HTML expects.
 */
export function buildOctaneAnswers(answers, email) {
  const q1 = QUESTIONS.q1.options.find((o) => o.id === answers.q1);
  const pain = q1?.pain || 'dry';

  const q2KeyByPain = {
    dry: 'q2_dry',
    frizzy: 'q2_frizzy',
    growth: 'q2_growth',
    oily: 'q2_oily',
    volume: 'q2_volume',
    damage: 'q2_damage',
  };
  const q2id = q2KeyByPain[pain] || Object.keys(answers).find((k) => k.startsWith('q2_'));
  const q2opt = q2id ? QUESTIONS[q2id]?.options.find((o) => o.id === answers[q2id]) : null;

  const wash = QUESTIONS.q3_wash.options.find((o) => o.id === answers.q3_wash);
  const airdry = QUESTIONS.q4_airdry.options.find((o) => o.id === answers.q4_airdry);
  const pattern = QUESTIONS.q5_strand.options.find((o) => o.id === answers.q5_strand);
  const volume = QUESTIONS.q6_volume_pref.options.find((o) => o.id === answers.q6_volume_pref);
  const heat = QUESTIONS.q7_heat.options.find((o) => o.id === answers.q7_heat);
  const damageOpt = QUESTIONS.q8_damage.options.find((o) => o.id === answers.q8_damage);

  const severity = q2opt?.severity || 'Mild';
  const damageLevel = q2opt?.damage || damageOpt?.damage || 'None';
  const washVal = wash?.wash || '1_2_days';
  const hairType = deriveHairType(
    airdry?.airdry,
    pattern?.pattern,
    pain,
    washVal
  );

  return {
    'Octane: Personalized Product Quiz Full Onboarding': 'Results',
    hair_pain_point: pain,
    pain_severity: severity,
    damage_level: damageLevel,
    hair_air_dry: airdry?.airdry || 'Flat',
    hair_pattern: pattern?.pattern || 'Straight',
    hair_wash_frequency: washVal,
    heat_tools: heat?.heat || 'none',
    wants_volume: volume?.volume || 'None',
    smart_properties_outputs: { hair_type: hairType },
    klaviyo_email_sync_list_id: null,
    klaviyo_sms_sync_list_id: null,
    email: email || '',
  };
}

/** Resolve next step (damage path skips Q8) */
export function resolveNext(questionId, option, answers) {
  if (questionId === 'q7_heat') {
    return answers.q1 === 'damaged' ? 'q9_email' : 'q8_damage';
  }
  return option?.next || QUESTIONS[questionId]?.next;
}
