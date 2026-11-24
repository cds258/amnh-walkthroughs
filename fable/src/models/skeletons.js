// Mounted fossil skeletons for the Rotunda and the 4th-floor fossil halls.
// Convention (all model libraries): metres at life size, y up, lowest point on y = 0, head towards +X,
// hips near x = 0, symmetric about z = 0 apart from pose.
// build(name, opts) returns a Geo using materials 'bone' / 'bone_ds' (vertex-coloured) and 'metal' (mount armature).
// opts: pose (species-specific), tone ('fossil' | 'cast'), scale.
import * as D from './skeletons/dinos.js';
import * as M from './skeletons/mammals.js';
import * as X from './skeletons/misc.js';

const BUILDERS = {
  barosaurus: D.barosaurus,
  barosaurus_juvenile: D.barosaurus_juvenile,
  allosaurus: D.allosaurus,
  tyrannosaurus: D.tyrannosaurus,
  apatosaurus: D.apatosaurus,
  titanosaur: D.titanosaur,
  stegosaurus: D.stegosaurus,
  triceratops: D.triceratops,
  anatotitan: D.anatotitan,
  corythosaurus: D.corythosaurus,
  mammoth: M.mammoth,
  mastodon: M.mastodon,
  deinonychus: D.deinonychus,
  velociraptor: D.velociraptor,
  coelophysis: D.coelophysis,
  oviraptor: D.oviraptor,
  pteranodon: X.pteranodon,
  dunkleosteus: X.dunkleosteus,
  megalodon_jaw: X.megalodon_jaw,
  dimetrodon: M.dimetrodon,
  glyptodon: M.glyptodon,
  megatherium: M.megatherium,
  smilodon: M.smilodon,
  brontops: M.brontops,
  megaloceros: M.megaloceros,
  andrewsarchus_skull: M.andrewsarchus_skull,
  human: M.human,
  lucy: M.lucy,
  gorilla_skeleton: M.gorilla_skeleton,
};

export const NAMES = Object.keys(BUILDERS);
export function build(name, opts = {}) {
  const f = BUILDERS[name];
  if (!f) throw new Error('unknown skeleton model ' + name);
  return f(opts || {});
}
