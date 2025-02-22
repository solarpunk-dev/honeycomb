import { generateSitemap as sitemap } from 'sitemap-ts'
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '⬡ Honeycomb',
  description: `A hexagon grid library made in TypeScript.`,
  lastUpdated: true,
  base: '/honeycomb/',
  markdown: {
    lineNumbers: true,
  },
  appearance: 'dark',

  buildEnd: ({ outDir }) => {
    sitemap({ hostname: 'https://abbekeultjes.nl/honeycomb/', basePath: 'honeycomb', outDir })
  },

  themeConfig: {
    algolia: {
      appId: 'AF859G6W5B',
      apiKey: '147ebb46c4c31e0ffbce1ae7961148e7',
      indexName: 'abbekeultjes',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/flauwekeul/honeycomb' }],
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API', link: '/api/index', activeMatch: '/api/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          collapsible: true,
          items: [{ text: 'Getting started', link: '/guide/getting-started' }],
        },
        {
          text: 'Hexes',
          collapsible: true,
          items: [
            { text: 'Coordinate system', link: '/guide/coordinate-system' },
            { text: 'Custom hexes', link: '/guide/custom-hexes' },
            { text: 'Custom hex creation', link: '/guide/custom-hex-creation' },
          ],
        },
        {
          text: 'Grid',
          collapsible: true,
          items: [
            { text: 'Creating grids', link: '/guide/creating-grids' },
            { text: 'Iterating grids', link: '/guide/iterating-grids' },
            { text: 'Traversing grids', link: '/guide/traversing-grids' },
            { text: 'Other grid methods', link: '/guide/other-grid-methods' },
          ],
        },
        {
          text: 'Recipes',
          collapsible: true,
          items: [
            { text: 'Rendering', link: '/guide/rendering' },
            { text: 'Point → hex', link: '/guide/point-to-hex' },
            { text: '(De)serializing', link: '/guide/serializing' },
            { text: 'Custom traverser', link: '/guide/custom-traverser' },
            { text: 'Custom Grid', link: '/guide/custom-grid' },
          ],
        },
      ],
      '/api/': [
        {
          items: [{ text: 'Table of contents', link: '/api/#table-of-contents' }],
        },
        {
          text: 'Grid',
          items: [{ text: 'Grid class', link: '/api/classes/Grid' }],
        },
        {
          text: 'Traversers',
          collapsible: true,
          items: [
            { text: 'concat', link: '/api/#concat' },
            { text: 'fromCoordinates', link: '/api/#fromCoordinates' },
            { text: 'line', link: '/api/#line' },
            { text: 'move', link: '/api/#move' },
            { text: 'rectangle', link: '/api/#rectangle' },
            { text: 'repeat', link: '/api/#repeat' },
            { text: 'repeatWith', link: '/api/#repeatWith' },
            { text: 'ring', link: '/api/#ring' },
            { text: 'spiral', link: '/api/#spiral' },
          ],
        },
        {
          text: 'Hex',
          collapsible: true,
          items: [
            { text: 'Hex class', link: '/api/classes/Hex' },
            { text: 'defineHex', link: '/api/#defineHex' },
          ],
        },
        {
          text: 'Coordinates',
          collapsible: true,
          items: [
            { text: 'Axial', link: '/api/interfaces/AxialCoordinates' },
            { text: 'Cube', link: '/api/interfaces/CubeCoordinates' },
            { text: 'Offset', link: '/api/interfaces/OffsetCoordinates' },
            { text: 'Tuple', link: '/api/#TupleCoordinates' },
            { text: 'HexCoordinates', link: '/api/#HexCoordinates' },
            { text: 'Point', link: '/api/interfaces/Point' },
          ],
        },
      ],
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2016-present Abbe Keultjes',
    },
  },
})
