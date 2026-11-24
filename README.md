# Two walks through the American Museum of Natural History

Astra 6.2 and Fable 5.2 each recreated New York’s American Museum of Natural History as a first-person browser simulation. Both let you walk floor by floor, read exhibit placards, and jump to a hall or specimen from the map. The layouts and specimens are independent reconstructions of the museum.

| Edition | Play | Source |
| --- | --- | --- |
| Astra 6.2 | [Enter Museum Atlas](https://natural-history-walk-amnh.dainty-deer-4395.chatgpt.site) | [astra/](astra/) |
| Fable 5.2 | [Enter Fable’s museum](https://amnh-fable-walk.dainty-deer-4395.chatgpt.site) | [fable/](fable/) |

Start in the Roosevelt Rotunda, visit the blue whale in the Milstein Hall of Ocean Life, or head to the fourth floor for T. rex and the Titanosaur. In both builds, use **WASD** to walk, drag to look around, and press **M** for the map.

## Run Astra locally

Astra is a static Three.js app. Run this from the repository root with Python 3 installed.

```sh
python3 -m http.server 8000 --directory astra
```

Open [localhost:8000](http://localhost:8000/). The JavaScript, fonts, and exhibit assets are bundled in the source tree.

## Run Fable locally

Fable generates its museum procedurally using Three.js and Vite. With Node.js 22.12 or later, run the following from the repository root.

```sh
cd fable
npm ci
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` to generate a production build in `fable/dist/`. The [Fable project guide](fable/README.md) covers the model libraries, exhibit layouts, and additional controls.

## Asset credits

Astra’s **Help → Photography, models and materials** lists the sources, authors, and licenses for its exhibit imagery and models. The [vendor notices](astra/vendor/) cover the bundled library and fonts.
