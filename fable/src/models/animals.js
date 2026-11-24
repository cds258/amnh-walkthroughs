// Procedural taxidermy animals for the habitat dioramas (Akeley Hall of African Mammals, North American
// Mammals, Asian Mammals, ...). Convention: metres at life size, y up, feet on y = 0, head towards +X,
// symmetric about z = 0 apart from pose. build(name, opts) returns a Geo using only the materials
// 'skin', 'flat', 'flat_ds', 'gloss' and 'bone', coloured entirely through vertex colours.
//
// opts: pose (species specific, see POSES), seed (integer: varies head turn, stance and proportions), scale.
// Unknown opts / unsupported poses are ignored (the species default pose is used).
import { quadruped, STD_POSES } from './animals/core.js';
import { Q } from './animals/species.js';
import './animals/species2.js';
import { APES, APE_POSES } from './animals/apes.js';
import { SPECIAL } from './animals/special.js';

const BUILDERS = {};
/** name -> supported pose names (first = default) */
export const POSES = {};
for (const name of Object.keys(Q)) {
  const sp = Q[name];
  BUILDERS[name] = (opts) => quadruped(typeof sp === 'function' ? sp(opts) : sp, opts);
  const s0 = typeof sp === 'function' ? sp({}) : sp;
  const list = s0.poses || STD_POSES, def = s0.pose || 'stand';
  POSES[name] = [def, ...list.filter((p) => p !== def)];
}
for (const name of Object.keys(APES)) { BUILDERS[name] = APES[name]; POSES[name] = APE_POSES[name]; }
for (const name of Object.keys(SPECIAL)) { BUILDERS[name] = SPECIAL[name]; POSES[name] = ['stand']; }

/** Every model name, in museum order (Akeley Hall centrepieces, rest of Akeley Hall, North America / Asia / others). */
export const NAMES = [
  'elephant', 'lion', 'lioness', 'giraffe', 'zebra', 'gorilla', 'gorilla_female', 'blackrhino', 'whiterhino', 'buffalo', 'gemsbok', 'kudu', 'eland', 'okapi', 'bongo',
  'sable', 'nyala', 'impala', 'wildebeest', 'gazelle', 'klipspringer', 'hippo', 'cheetah', 'leopard', 'hyena', 'wilddog', 'jackal', 'warthog', 'bushpig', 'ostrich', 'vulture', 'chimpanzee', 'mandrill', 'colobus',
  'brownbear', 'bison', 'moose', 'wolf', 'elk', 'caribou', 'deer', 'mountaingoat', 'bighorn', 'muskox', 'jaguar', 'cougar', 'indianelephant', 'tiger', 'panda', 'indianrhino', 'waterbuffalo', 'polarbear',
  'walrus', 'sealion', 'elephantseal', 'komodo', 'alligator', 'tortoise', 'penguin', 'flamingo', 'eagle', 'heron',
];
for (const n of NAMES) if (!BUILDERS[n]) throw new Error('animals: missing builder for ' + n);

export function build(name, opts = {}) {
  const f = BUILDERS[name];
  if (!f) throw new Error('unknown animal model ' + name);
  return f(opts || {});
}
