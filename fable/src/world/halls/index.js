// Registry of per-hall content builders. HALLS[roomId](ctx) fills a room;
// PRE[roomId](room, {addWindows}) runs before shells are generated (windows, floor holes).
import { akeley } from './akeley.js';
import { rotunda, rotundaPre, memorial } from './rotunda.js';
import { ocean } from './ocean.js';
import { fossilPre, orientation, saurischian, ornithischian, vertorigins, primmammals, advmammals, landing4 } from './fossils.js';
import { rose, planetearth, roselink2 } from './rose.js';
import { meteorites } from './meteorites.js';
import { gilder } from './gilder.js';
import * as D from './dioramahalls.js';
import * as C from './culturehalls.js';
import * as G from './gilderrooms.js';

export const HALLS = {
  akeley, rotunda, memorial, ocean, orientation, saurischian, ornithischian, vertorigins, primmammals, advmammals, landing4,
  rose, planetearth, roselink2, meteorites, gilder,
  namammals: D.namammals, smallmammals: D.smallmammals, crossing3: D.crossing3, nycbirds: D.nycbirds, asianmammals: D.asianmammals,
  reptiles: D.reptiles, nabirds: D.nabirds, birdsworld: D.birdsworld, forests: D.forests, warburg: D.warburg,
  nwcoast: C.nwcoast, grand: C.grand, africanpeoples: C.africanpeoples, asianpeoples: C.asianpeoples, asianpeoples2: C.asianpeoples2,
  mexico: C.mexico, southamerica: C.southamerica, southamerica2: C.southamerica2, pacific: C.pacific, pacific2: C.pacific2,
  woodlands: C.woodlands, primates: C.primates, humanorigins: C.humanorigins, gems: C.gems, biodiversity: C.biodiversity,
  gallery3: C.gallery3, secorner3: C.secorner3, roselink3: C.roselink3, akeleygallery: C.akeleygallery,
  crossing1: C.crossing1, crossing2: C.crossing2, crossing4: C.crossing4, shop4: C.shop4,
  insectarium: G.insectarium, butterfly: G.butterfly, invisible: G.invisible, library: G.library,
  collections1: G.collections1, collections2: G.collections2, collections3: G.collections3, alcove4: G.alcove4,
  gildershop1: G.gildershop1, gildereast2: G.gildereast2, gildereast3: G.gildereast3, gildereast4: G.gildereast4,
};
export const PRE = { rotunda: rotundaPre, ...fossilPre };
