import type { Bounds, BranchSpec, EntrySpec, FolderSpec, LabelSide, Vec2 } from '../grove'
import type { Entry } from './entries.ts'
import about from './writing/about.md?raw'
import attar from './writing/case-attar.md?raw'
import quickhajj from './writing/case-quickhajj.md?raw'
import stableconverse from './writing/case-stableconverse.md?raw'
import howThisGrew from './writing/how-this-grew.md?raw'

// The portfolio as a file tree. World px, y down; the opening view spans
// x -432 to 848 and stands on the ground. A folder's branch grows out of the
// folder itself, so its path lists the points after the folder's mouth.
// The trunk, work/, quickhajj/, four-versions/, fun/ and nahwan-os/ follow
// the plant concept recording point for point; the rest is drawn by hand to
// match. Nothing may grow into the intro or the time; branches may cross the
// name on the ground, which tucks itself away while they do.

/** World y of the ground the plant stands on, and the masthead with it. */
export const GROUND = 400

/** Where the intro sits, alone in the open sky at the top right of the opening view. */
export const INTRO: Bounds = { minX: 466, minY: -338, maxX: 814, maxY: -228 }
/** Where the time sits, alone in the top left corner. */
export const TIME: Bounds = { minX: -398, minY: -338, maxX: -282, maxY: -320 }

type Child = EntrySpec<Entry>

const file = (name: string, at: Vec2, label: LabelSide, data: Entry): Child => ({ name, at, label, data })

const folder = (name: string, at: Vec2, label: LabelSide, branch: BranchSpec, children: Child[], note?: string): Child => ({
  name,
  at,
  label,
  branch,
  children,
  data: { kind: 'folder', note },
})

const link = (href: string): Entry => ({ kind: 'link', href })

const OITIJJHYA = 'Oitijjhya · 2026 · direction'

export const portfolio: FolderSpec<Entry> = {
  name: 'Nadid Azwad',
  branch: {
    width: 8.5,
    path: [
      [-480, 26], [-432, -2], [-396, -18], [-360, -33], [-323, -39], [-287, -33], [-250, -22],
      [-214, -4], [-177, 11], [-141, 19], [-90, 24], [-54, 15], [-25, 0], [4, -9], [41, -12],
      [92, -11], [130, -8], [164, -5], [201, 18], [237, 55], [277, 102],
    ],
    limbs: [
      [[164, -5], [201, -25], [237, -36], [262, -47]],
      [[-60, 18], [-40, -2], [-20, -22]],
      [[-6, -6], [2, -22], [8, -34]],
      [[77, -11], [95, 17], [113, 47]],
      [[222, 42], [265, 40], [312, 43]],
      [[-305, -34], [-262, -10], [-218, 10]],
    ],
  },
  children: [
    folder(
      'work',
      [-145, -47],
      'right',
      {
        path: [
          [-115, -82], [-92, -118], [-68, -165], [-50, -200], [-14, -234], [30, -256], [81, -267],
          [132, -270], [175, -274], [205, -289], [248, -314], [285, -358], [325, -419],
        ],
        limbs: [
          [[23, -251], [45, -290], [66, -332]],
          [[175, -273], [190, -250], [203, -228]],
        ],
      },
      [
        folder(
          'quickhajj',
          [4, -158],
          'below',
          {
            path: [
              [18, -186], [40, -192], [62, -180], [81, -162], [117, -147], [161, -139], [205, -139],
              [248, -143], [292, -147], [350, -151], [408, -158], [459, -166], [503, -177], [550, -200],
            ],
            limbs: [
              [[270, -145], [282, -160], [292, -176]],
              [[16, -196], [32, -208], [48, -217]],
            ],
          },
          [
            file('case-study.md', [110, -94], 'right', { kind: 'case', body: quickhajj }),
            folder(
              'four-versions',
              [321, -202],
              'right',
              {
                path: [
                  [342, -230], [355, -256], [380, -293], [410, -336], [439, -354], [482, -362],
                  [518, -369], [554, -387], [584, -413], [613, -449], [649, -447], [682, -438],
                  [708, -427], [735, -450], [767, -476], [811, -491], [855, -494], [898, -487],
                  [927, -472], [956, -465], [990, -470],
                ],
                limbs: [
                  [[453, -358], [480, -382], [510, -402]],
                  [[392, -311], [425, -306], [453, -308]],
                  [[898, -487], [925, -505], [956, -516]],
                  [[956, -465], [1000, -505], [1054, -560]],
                  [[990, -470], [1030, -492], [1072, -498]],
                ],
              },
              [
                file('v1.png', [322, -280], 'left', {
                  kind: 'image',
                  caption: 'Version one, September 2025.',
                  meta: 'quick-hajj.vercel.app',
                  alt: 'The first QuickHajj homepage',
                }),
                file('v2-reimagined.png', [680, -386], 'right', {
                  kind: 'image',
                  caption: 'Reimagined, late 2025.',
                  meta: 'quickhajj-reimagined.vercel.app',
                  alt: 'The second QuickHajj homepage',
                }),
                file('v3-remastered.png', [870, -424], 'right', {
                  kind: 'image',
                  caption: 'Remastered, summer 2026.',
                  meta: 'quickhajj-remastered.vercel.app',
                  alt: 'The third QuickHajj homepage',
                }),
                file('v4-live.png', [1090, -500], 'right', {
                  kind: 'image',
                  caption: 'The one that’s live now.',
                  meta: 'quickhajj.com',
                  alt: 'The current QuickHajj homepage',
                }),
              ],
            ),
            file('umrah-campaign.png', [290, -110], 'right', {
              kind: 'image',
              caption: 'Posters for a first-time Umrah campaign, in English and Bangla.',
              meta: 'QuickHajj · 2026',
              alt: 'Umrah campaign posters in English and Bangla, side by side',
            }),
            file('home.png', [503, -121], 'right', {
              kind: 'image',
              caption: 'The homepage, in English and Bangla.',
              meta: 'QuickHajj · 2026',
              alt: 'The QuickHajj homepage in English and in Bangla, side by side',
            }),
            file('quickhajj.com', [600, -170], 'right', link('https://www.quickhajj.com')),
          ],
          'Hajj & Umrah agency',
        ),
        folder(
          'attar',
          [366, -440],
          'right',
          {
            path: [
              [400, -500], [440, -524], [490, -538], [546, -544], [604, -546], [662, -552], [718, -566],
              [770, -586], [812, -612], [846, -646],
            ],
            limbs: [[[812, -612], [838, -598], [860, -596]]],
          },
          [
            file('case-study.md', [478, -486], 'right', { kind: 'case', body: attar }),
            file('storefront.png', [640, -516], 'right', {
              kind: 'image',
              caption: 'The storefront: cash on delivery, bKash and Nagad, in a shop that sets up for free.',
              meta: 'Attar · 2026 · product, design & code',
              alt: 'The Attar perfume storefront',
            }),
            file('admin.png', [800, -536], 'right', {
              kind: 'image',
              caption: 'The admin. Everyone who opens the demo gets a sandbox of their own.',
              meta: 'Attar · 2026',
              alt: 'The Attar admin dashboard',
            }),
            file('try-the-demo', [560, -600], 'right', link('https://nextjs-perfume-store.vercel.app')),
            file('github', [700, -650], 'right', link('https://github.com/nadidazwad/nextjs-perfume-store')),
          ],
          'shop template',
        ),
        folder(
          'stableconverse',
          [300, -496],
          'left',
          {
            path: [
              [314, -548], [326, -594], [348, -636], [382, -670], [426, -694], [478, -706], [534, -712],
              [590, -722], [640, -742],
            ],
            limbs: [[[534, -712], [544, -744], [540, -770]]],
          },
          [
            file('case-study.md', [366, -600], 'right', { kind: 'case', body: stableconverse }),
            file('landing.png', [430, -650], 'right', {
              kind: 'image',
              caption: 'The landing page.',
              meta: 'StableConverse · 2026 · founding design engineer',
              alt: 'The StableConverse landing page',
            }),
            file('stableconverse.com', [600, -690], 'right', link('https://stableconverse.com')),
            folder(
              'workspace',
              [668, -752],
              'right',
              {
                path: [[694, -800], [718, -836], [756, -864], [804, -880], [856, -884], [906, -894], [948, -914], [980, -944]],
                limbs: [[[856, -884], [870, -912], [868, -938]]],
              },
              [
                file('inbox.png', [760, -812], 'right', {
                  kind: 'image',
                  caption: 'The inbox, where the agent’s conversations with customers land.',
                  meta: 'StableConverse · demo data',
                  alt: 'The StableConverse inbox',
                }),
                file('orders.png', [900, -846], 'right', {
                  kind: 'image',
                  caption: 'Orders the agent took, ready to confirm.',
                  meta: 'StableConverse · demo data',
                  alt: 'The StableConverse orders view',
                }),
                file('catalog.png', [1000, -960], 'right', {
                  kind: 'image',
                  caption: 'The catalogue the agent sells from.',
                  meta: 'StableConverse · demo data',
                  alt: 'The StableConverse product catalogue',
                }),
              ],
              'the merchant’s side, demo data',
            ),
          ],
          'AI sales agent',
        ),
      ],
    ),
    folder(
      'films',
      [-250, -84],
      'left',
      {
        path: [[-244, -132], [-236, -180], [-218, -226], [-208, -276], [-214, -324], [-232, -366], [-240, -410]],
        limbs: [[[-218, -226], [-246, -246], [-258, -272]]],
      },
      [
        file('1-47-am.mp4', [-160, -300], 'right', {
          kind: 'video',
          caption: 'The launch film for StableConverse: a shop owner, a phone, and a message at 1:47 in the morning.',
          meta: 'StableConverse · 2026 · concept & direction',
        }),
        folder(
          'book-carnival-2026',
          [-212, -446],
          'right',
          {
            path: [
              [-176, -486], [-140, -514], [-96, -534], [-48, -548], [0, -566], [44, -592], [80, -626], [104, -668],
              [114, -712],
            ],
            limbs: [[[-48, -548], [-40, -580], [-46, -606]]],
          },
          [
            file('dadur-boi-tunir-rong.mp4', [-100, -500], 'right', {
              kind: 'video',
              caption: '“Dadur Boi, Tunir Rong” (Grandpa’s Books, Tuni’s Colours): the carnival’s first ad.',
              meta: `${OITIJJHYA} · 16K views`,
            }),
            file('influencer-get-together.mp4', [30, -556], 'right', {
              kind: 'video',
              caption: 'The reel for the book influencers’ get-together.',
              meta: `${OITIJJHYA} · 30K views`,
            }),
            file('chitrankan.mp4', [120, -610], 'right', {
              kind: 'video',
              caption: '“Chitrankan” (Drawing): eleven seconds for the drawing competition. It beat the sixty-second ad.',
              meta: `${OITIJJHYA} · 20K views`,
            }),
            folder(
              'apni-konjon',
              [126, -722],
              'right',
              {
                path: [[150, -770], [164, -812], [190, -848], [228, -872], [274, -882]],
              },
              [
                file('ep1.mp4', [200, -800], 'right', {
                  kind: 'video',
                  caption: '“Apni Konjon?” (Which one are you?): episode one.',
                  meta: OITIJJHYA,
                }),
                file('ep2.mp4', [294, -896], 'right', {
                  kind: 'video',
                  caption: '“Apni Konjon?” (Which one are you?): episode two.',
                  meta: OITIJJHYA,
                }),
              ],
              'which reader are you?',
            ),
          ],
          'Oitijjhya’s book carnival',
        ),
      ],
    ),
    folder(
      'fun',
      [37, 46],
      'below',
      {
        path: [
          [60, 20], [78, 14], [98, 22], [118, 42], [137, 66], [166, 110], [195, 154], [232, 197],
          [268, 241], [304, 274], [341, 285], [377, 281], [421, 266], [457, 252], [497, 232],
        ],
        limbs: [
          [[363, 281], [372, 298], [381, 314]],
          [[150, 85], [168, 84], [182, 88]],
        ],
      },
      [
        file('grand-theft-pokemon', [106, 118], 'left', link('https://bup-accounting.vercel.app')),
        file('assignment-cover-generator', [60, 196], 'below', link('https://assignmentcovergenerator.vercel.app')),
        folder(
          'nahwan-os',
          [434, 195],
          'right',
          {
            path: [
              [458, 170], [474, 140], [490, 115], [526, 66], [562, 57], [620, 54], [671, 39],
              [707, 24], [744, -1], [780, -34], [817, -48], [864, -48],
            ],
            limbs: [
              [[514, 74], [516, 50], [514, 32]],
              [[642, 50], [655, 66], [664, 79]],
              [[707, 25], [735, 31], [758, 33]],
              [[777, -31], [783, -70], [788, -103]],
            ],
          },
          [
            file('before.png', [548, 110], 'right', {
              kind: 'image',
              caption: 'The TV as it came, ads and all.',
              meta: 'Nahwan OS · 2026',
              alt: 'A stock Android TV home screen full of ads',
            }),
            file('nahwan-os.png', [700, 78], 'right', {
              kind: 'image',
              caption: 'I rebuilt the house TVs into an OS for my 7-year-old brother.',
              meta: 'Nahwan OS · 2026 · design & code',
              alt: 'Nahwan OS: a dark home screen with apps, the weather and live cricket',
            }),
            file('on-the-wall.jpg', [884, -18], 'right', {
              kind: 'image',
              caption: 'An earlier home screen, on the wall.',
              meta: 'Nahwan OS · 2026',
              alt: 'A TV on a wall showing a custom home screen',
            }),
          ],
        ),
        file('how-this-grew.txt', [190, 250], 'below', { kind: 'text', body: howThisGrew }),
        folder(
          'nobody-asked-me-to',
          [548, 262],
          'below',
          {
            path: [[584, 238], [630, 240], [680, 248], [730, 246], [780, 242], [828, 250], [868, 268], [900, 290]],
            limbs: [[[730, 246], [744, 274], [742, 300]]],
          },
          [
            file('tonsore.png', [700, 200], 'right', {
              kind: 'image',
              caption: 'A redesign for a Dhaka barbershop. They didn’t ask.',
              meta: 'Tonsore · 2026',
              alt: 'A redesigned website for Tonsore',
              link: { label: 'tonsorebd.vercel.app', href: 'https://tonsorebd.vercel.app' },
            }),
            file('grippermark-labs.png', [918, 306], 'right', {
              kind: 'image',
              caption: 'My studio site, from when I was dressing up as an agency.',
              meta: 'GripperMark Labs · 2026',
              alt: 'The GripperMark Labs website',
              link: { label: 'labs.grippermark.com', href: 'https://labs.grippermark.com' },
            }),
          ],
        ),
      ],
    ),
    file('about.txt', [242, -4], 'right', { kind: 'text', body: about }),
  ],
}
