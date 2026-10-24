import type { FolderSpec } from './layout.ts'

// The portfolio, as a file tree. Names are placeholders to swap for real work;
// positions and branch paths shape the plant. World units are design px, y
// grows downward like the screen, and (0, 0) is the centre of the opening view.
// The trunk's path starts off screen to the left; a folder's branch grows out
// of the folder itself, so its path lists the points after the folder's mouth.
// Traced from the reference recording.
export const documents: FolderSpec = {
  name: 'Documents',
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
    {
      name: 'work',
      at: [-145, -47],
      label: 'right',
      branch: {
        path: [
          [-115, -82], [-92, -118], [-68, -165], [-50, -200], [-14, -234], [30, -256], [81, -267],
          [132, -270], [175, -274], [205, -289], [248, -314], [285, -358], [325, -419],
        ],
        limbs: [
          [[23, -251], [45, -290], [66, -332]],
          [[175, -273], [190, -250], [203, -228]],
        ],
      },
      children: [
        {
          name: 'case-study',
          at: [-8, -158],
          label: 'below',
          branch: {
            path: [
              [18, -186], [40, -192], [62, -180], [81, -162], [117, -147], [161, -139], [205, -139],
              [248, -143], [292, -147], [350, -151], [408, -158], [459, -166], [503, -177], [550, -200],
            ],
            limbs: [
              [[270, -145], [282, -160], [292, -176]],
              [[16, -196], [32, -208], [48, -217]],
            ],
          },
          children: [
            { name: 'brief.md', at: [127, -94], label: 'right' },
            {
              name: 'research',
              at: [321, -198],
              label: 'right',
              branch: {
                path: [
                  [342, -230], [355, -256], [380, -293], [410, -336], [439, -354], [482, -362],
                  [518, -369], [554, -387], [584, -413], [613, -449], [649, -447], [682, -438],
                  [708, -427],
                ],
                limbs: [
                  [[453, -358], [480, -382], [510, -402]],
                  [[392, -311], [425, -306], [453, -308]],
                ],
              },
              children: [
                { name: 'interviews.jpg', at: [442, -278], label: 'right' },
                { name: 'journey-map.png', at: [561, -329], label: 'right' },
                {
                  name: 'prototypes',
                  at: [681, -389],
                  label: 'below',
                  branch: {
                    path: [
                      [708, -420], [735, -450], [767, -476], [811, -491], [855, -494], [898, -487],
                      [927, -472], [956, -465], [990, -470],
                    ],
                    limbs: [
                      [[898, -487], [925, -505], [956, -516]],
                      [[956, -465], [1000, -505], [1054, -560]],
                      [[990, -470], [1030, -492], [1072, -498]],
                    ],
                  },
                  children: [
                    { name: 'prototype.mp4', at: [794, -416], label: 'right' },
                    { name: 'findings.txt', at: [1035, -454], label: 'right' },
                  ],
                },
              ],
            },
            { name: 'final-design.fig', at: [503, -121], label: 'right' },
          ],
        },
        { name: 'resume.pdf', at: [312, -320], label: 'below' },
      ],
    },
    {
      name: 'play',
      at: [37, 46],
      label: 'below',
      branch: {
        path: [
          [60, 20], [78, 14], [98, 22], [118, 42], [137, 66], [166, 110], [195, 154], [232, 197],
          [268, 241], [304, 274], [341, 285], [377, 281], [421, 266], [457, 252], [497, 232],
        ],
        limbs: [
          [[363, 281], [372, 298], [381, 314]],
          [[150, 85], [168, 84], [182, 88]],
        ],
      },
      children: [
        { name: 'sketches.jpg', at: [204, 103], label: 'right' },
        {
          name: 'experiments',
          at: [434, 203],
          label: 'right',
          branch: {
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
          children: [{ name: 'dither.mp4', at: [700, 78], label: 'right' }],
        },
      ],
    },
    { name: 'about.txt', at: [242, -4], label: 'right' },
  ],
}
