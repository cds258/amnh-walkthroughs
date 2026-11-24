// The five public levels follow the 2026 AMNH English visitor map (pages 2–6).
// https://www.amnh.org/plan-your-visit/museum-map
// https://www.amnh.org/content/download/385996/5752508/file/english-map.pdf
// The map is a visitor diagram. These meter-scale rectangular envelopes, doorway
// widths and circulation links are interpretive; it does not give surveyed dimensions.
// x grows toward 81st Street, z toward Central Park West. The entrance rotunda is (0,0).
// The same coordinate frame is used on all levels. The LL garage/entrance and
// school wings represent visitor arrival spaces. Staff, mechanical, and storage
// areas and public restrooms are outside this walk-through.
const floors = (() => {
  const level = {};
  let rooms;
  const story = n => { rooms = level[n] = []; };
  function hall(id, name, x0, z0, x1, z1, links = [], flags = {}) {
    rooms.push({id, name, x:(x1+x0)/2, z:(z1+z0)/2, w:x1-x0, d:z1-z0, links, ...flags});
  }
  // LL. Rose Center, parking approach and subway entrance share the eastern
  // public passage; the food court and school dining occupy its 77th Street arm.
  story(0);
  hall('subway','Subway entrance',-14,-2,14,16,['lowerLobby']);
  hall('lowerLobby','Lower level elevator lobby',-14,-18,14,-2,['lowerPassage','diningPassage'],{lift:true});
  hall('diningPassage','Dining concourse',-76,-18,-14,-6,['schoolLunch','foodCourt']);
  hall('schoolLunch','School lunchrooms',-100,-18,-76,10);
  hall('foodCourt','Museum Food Court',-58,-52,-22,-18);
  hall('lowerPassage','Rose Center concourse',14,-18,40,-6,['universe']);
  hall('universe','Dorothy and Lewis B. Cullman Hall of the Universe',40,-61,94,-6,['garageLobby']);
  hall('garageLobby','Parking garage elevator lobby',40,-75,58,-61,['parkingLL'],{core:'rose'});
  hall('parkingLL','81st Street parking entrance',40,-117,100,-75);

  // Floor 1. The Columbus Avenue atrium connects the geological halls to the
  // central museum. Ocean Life is in the 77th Street half; the Rose Center is
  // across the north side of the museum, toward 81st Street.
  story(1);
  hall('memorial','Theodore Roosevelt Memorial Hall',-15,-13,15,13,['biodiversity','northMammals','eastLobby'],{lift:true});
  hall('biodiversity','Hall of Biodiversity',-65,-13,-15,13,['forests','ocean']);
  hall('forests','Hall of North American Forests',-99,-13,-65,13,['nyEnvironment']);
  hall('nyEnvironment','Warburg Hall of New York State Environment',-99,-54,-72,-13,['ocean','discovery']);
  hall('ocean','Milstein Hall of Ocean Life',-72,-57,-28,-13,['sensory','northwest','shop1']);
  hall('sensory','Sensory Room',-72,-69,-59,-57,['northwest']);
  hall('discovery','Discovery Room',-99,-70,-72,-54,['futter']);
  hall('futter','Ellen V. Futter Gallery',-99,-94,-72,-70,['coastFoyer','cafe1']);
  hall('coastFoyer','77th Street gallery foyer',-72,-94,-59,-70,['northwest']);
  hall('northwest','Northwest Coast Hall',-59,-94,-28,-57,['theaterLobby']);
  hall('theaterLobby','Museum theater foyer',-28,-94,-16,-57,['giantScreen','giftShop']);
  hall('shop1','The Museum Shop',-28,-57,-15,-13,['northMammals']);
  hall('northMammals','Bernard Family Hall of North American Mammals',-15,-57,15,-13,['smallMammals']);
  hall('smallMammals','Hall of Small Mammals',-16,-69,15,-57,['giantScreen']);
  hall('giantScreen','LeFrak Theater',-16,-94,15,-69,['groupCheck'],{ticketed:true});
  hall('groupCheck','School group check-in',15,-94,26,-68,['garage1']);
  hall('garage1','81st Street parking entrance',26,-118,99,-68);
  hall('eastLobby','Rose Center connecting hall',15,-17,41,4,['planetEarth']);
  hall('planetEarth','David S. and Ruth L. Gottesman Hall of Planet Earth',41,-29,99,4,['rose']);
  hall('rose','Hayden Planetarium',41,-65,82,-29,['grandFoyer'],{ticketed:true,core:'rose'});
  hall('grandFoyer','Rose Center Grand Foyer',82,-68,99,-29,['garage1']);
  hall('cafe1','Cafe on 1',-99,-109,-72,-94,['humanOrigins']);
  hall('humanOrigins','Anne and Bernard Spitzer Hall of Human Origins',-99,-146,-72,-109,['learnOrigins','programs']);
  hall('learnOrigins','Human Origins Learning Lab',-99,-158,-72,-146,['meteorites']);
  hall('meteorites','Arthur Ross Hall of Meteorites',-99,-182,-72,-158,['gems']);
  hall('gems','Allison and Roberto Mignone Halls of Gems and Minerals',-72,-182,-36,-145,['gemsGallery','gilder']);
  hall('gemsGallery','Melissa and Keith Meister Gallery',-72,-145,-53,-133,['programs']);
  hall('programs','Program theaters',-72,-133,-36,-109,['collections1']);
  hall('giftShop','Gilder Gift Shop',-36,-109,-10,-94,['collections1']);
  hall('collections1','Louis V. Gerstner, Jr. Collections Core',-36,-133,-10,-109,['gilder'],{core:'gilder'});
  hall('gilder','Kenneth C. Griffin Exploration Atrium',-36,-174,-10,-133,['insectarium']);
  hall('insectarium','Susan and Peter J. Solomon Family Insectarium',-10,-174,32,-133);

  // Floor 2. The rotunda opens directly into Akeley Hall; Hall of Asian
  // Mammals follows the Central Park West frontage to the south.
  story(2);
  hall('rotunda','Theodore Roosevelt Rotunda',-15,-13,15,13,['akeley','asianMammals','eastGalleria'],{lift:true});
  hall('forecourt','Central Park West entrance',-46,13,46,57,['rotunda']);
  hall('akeley','Akeley Hall of African Mammals',-15,-57,15,-13,['akeleyGallery','shop2']);
  hall('asianMammals','Hall of Asian Mammals',-69,-13,-15,13,['asianPeoples']);
  hall('asianPeoples','Gardner D. Stout Hall of Asian Peoples',-99,-57,-69,13,['worldBirds']);
  hall('worldBirds','Hall of Birds of the World',-99,-103,-69,-57,['mexico','africanPeoples']);
  hall('mexico','Hall of Mexico and Central America',-99,-149,-69,-103,['southAmerican','collections2']);
  hall('southAmerican','Hall of South American Peoples',-99,-182,-42,-149,['gilder2']);
  hall('collections2','Collections Core',-69,-149,-36,-118,['gilder2','africanPeoples'],{core:'gilder'});
  hall('gilder2','Gilder Center bridge',-42,-174,-10,-149,['butterflies','restaurant']);
  hall('butterflies','Davis Family Butterfly Vivarium',-10,-174,32,-149,[],{ticketed:true});
  hall('restaurant','The Restaurant at Gilder',-36,-149,-8,-118,['northGalleria']);
  hall('africanPeoples','Hall of African Peoples',-69,-118,-15,-70,['akeleyGallery']);
  hall('akeleyGallery','Akeley Gallery',-15,-78,15,-57,['northGalleria']);
  hall('shop2','The Museum Shop',-38,-55,-15,-16);
  hall('northGalleria','North Galleria',-15,-118,24,-78,['eastWalk']);
  hall('eastWalk','Galleria connecting passage',15,-78,24,-17,['eastGalleria']);
  hall('eastGalleria','East Galleria',15,-17,41,6,['cosmicShop','terrace']);
  hall('terrace','Arthur Ross Terrace',24,-58,41,-17);
  hall('cosmicShop','Cosmic Shop',41,-17,60,4,['scales']);
  hall('scales','Scales of the Universe',60,-29,99,4,['cosmicPath']);
  hall('cosmicPath','Harriet and Robert Heilbrunn Cosmic Pathway',60,-65,99,-29,['bigBang'],{core:'rose'});
  hall('bigBang','Hayden Big Bang Theater',41,-65,60,-29);

  // Floor 3. The public balcony is above the *same* African Mammals gallery.
  // The planetarium dome and the upper void of the rotunda are not floor rooms.
  story(3);
  hall('core3','Central elevator landing',-15,-13,15,-3,['mezzanine','reptiles'],{lift:true});
  hall('mezzanine','Akeley Hall of African Mammals · Mezzanine',-15,-57,15,-13,['cityBirds']);
  hall('cityBirds','Hall of New York City Birds',-15,-70,15,-57,['nyMammals']);
  hall('nyMammals','Hall of New York State Mammals',-15,-111,15,-70,['birdsNA','center3']);
  hall('birdsNA','Leonard C. Sanford Hall of North American Birds',-69,-111,-15,-70,['primates','collections3']);
  hall('primates','Hall of Primates',-99,-111,-69,-70,['gallery3','southPassage']);
  hall('gallery3','Gallery 3',-99,-70,-69,-13,['reptiles'],{ticketed:true});
  hall('reptiles','Hall of Reptiles and Amphibians',-99,-13,-15,13);
  hall('southPassage','77th Street connecting gallery',-99,-148,-69,-111,['pacific']);
  hall('pacific','Margaret Mead Hall of Pacific Peoples',-99,-182,-42,-148,['climate']);
  hall('collections3','Collections Core',-69,-148,-36,-111,['center3'],{core:'gilder'});
  hall('climate','Climate Learning Lab',-42,-174,-10,-148,['center3']);
  hall('center3','Gilder Center third-floor galleries',-36,-148,15,-111,['invisibleShop']);
  hall('invisibleShop','Invisible Worlds Shop',15,-148,32,-135,['invisible']);
  hall('invisible','Invisible Worlds',15,-174,50,-148,[],{ticketed:true});

  // Floor 4. The fossil circuit passes through vertebrate origins, the
  // dinosaur halls and the mammal halls, with the Titanosaur in the orientation hall.
  story(4);
  hall('core4','Fourth-floor elevator landing',-15,-13,15,-3,['dinoStore','fossil','ornith'],{lift:true});
  hall('dinoStore','Dino Store',-15,-3,15,11,['ornith']);
  hall('ornith','Hall of Ornithischian Dinosaurs',-69,-13,-15,11,['primitive','gallery4']);
  hall('primitive','Hall of Primitive Mammals',-99,-37,-69,11,['turret','advanced']);
  hall('turret','Turret',-111,-3,-99,12);
  hall('advanced','Paul and Irma Milstein Hall of Advanced Mammals',-99,-72,-69,-37,['titan','cafe4']);
  hall('cafe4','Cafe on 4',-112,-95,-99,-59,['titan']);
  hall('titan','Wallach Orientation Center',-99,-112,-69,-72,['vertebrates']);
  hall('vertebrates','Hall of Vertebrate Origins',-69,-112,-15,-72,['fossilJunction','libraryBridge']);
  hall('gallery4','Gallery 4',-62,-55,-15,-13,[],{ticketed:true});
  hall('fossil','Hall of Saurischian Dinosaurs',-15,-72,15,-13,['fossilJunction']);
  hall('fossilJunction','Fossil halls junction',-15,-98,15,-72);
  hall('libraryBridge','Gilder Center fourth-floor passage',-48,-146,-33,-112,['alcove']);
  hall('alcove','Alcove Gallery',-55,-168,-33,-146,['library']);
  hall('library','David S. and Ruth L. Gottesman Research Library and Learning Center',-33,-174,11,-146,[],{core:'gilder'});

  // Store each connection once above; expose bidirectional graph edges to callers.
  for (const entries of Object.values(level)) {
    const byId = new Map(entries.map(room => [room.id,room]));
    for(const room of entries) for(const id of room.links) {
      const other = byId.get(id);
      if(!other.links.includes(room.id)) other.links.push(room.id);
    }
  }
  return level;
})();
