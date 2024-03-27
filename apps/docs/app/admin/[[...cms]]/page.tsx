'use client'

import { BlockType } from 'local-imput-cms'
import dynamic from 'next/dynamic'
import { Components } from '@/components/MdxComponents'
import { PreviewWrapper } from '@/components/PreviewWrapper'
import '../../../styles/tailwind.css'

const NextCMS = dynamic(() => import('local-imput-cms'), {
  ssr: false,
})

const blocks: BlockType[] = [
  {
    name: 'PropsTable',
    label: 'Props Table',
    fields: [
      {
        name: 'data',
        label: 'Data',
        type: {
          widget: 'json',
        },
      },
    ],
  },
  {
    name: 'Test',
    label: 'Test Component',
    fields: [
      {
        name: 'select',
        label: 'Select',
        type: {
          options: ['Option 1', 'Option 2', 'Option 3'],
          default: 'Option 1',
          widget: 'select',
        },
      },
      {
        name: 'selectMultipleWithDefault',
        label: 'SelectMultiple',
        type: {
          options: ['Option 1', 'Option 2', 'Option 3'],
          default: ['Option 1'],
          widget: 'select',
          multiple: true,
        },
      },
      {
        name: 'selectMultiple',
        label: 'SelectMultiple',
        type: {
          options: ['Option 1', 'Option 2', 'Option 3'],
          widget: 'select',
          multiple: true,
        },
      },
    ],
  },
  {
    name: 'Note',
    label: 'Note',
    fields: [
      {
        name: 'children',
        label: 'Children',
        type: {
          widget: 'markdown',
        },
      },
    ],
  },
  {
    name: 'Video',
    label: 'Video',
    fields: [
      {
        name: 'src',
        label: 'Source',
        type: {
          widget: 'string',
        },
      },
    ],
  },
  {
    name: 'ContentLink',
    label: 'Content Link',
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: {
          widget: 'string',
        },
      },
      {
        name: 'href',
        label: 'Link',
        type: {
          widget: 'string',
        },
      },
    ],
  },
  {
    name: 'TabsRoot',
    label: 'Tabs',
    fields: [
      {
        name: 'defaultValue',
        label: 'Defailt tab id',
        type: {
          widget: 'string',
        },
      },
      {
        name: 'triggers',
        label: 'Triggers',
        type: {
          widget: 'json',
        },
      },
      {
        name: 'children',
        label: 'Children',
        type: {
          widget: 'markdown',
        },
      },
    ],
  },
  {
    name: 'TabsContent',
    label: 'Tabs Content',
    fields: [
      {
        name: 'value',
        label: 'Value',
        type: {
          widget: 'string',
        },
      },
      {
        name: 'children',
        label: 'Children',
        type: {
          widget: 'markdown',
        },
      },
    ],
  },
]

const CMS = () => (
  <NextCMS
    {...{
      settings: {
        backend: {
          name: 'github',
          repo: 'leo-petrucci/imput-cms',
          branch: 'main',
          base_url:
            process.env.NODE_ENV === 'production'
              ? 'https://imput.computer'
              : 'http://localhost:3000/',
          auth_endpoint: 'api/authorize',
        },
        media_folder: 'apps/docs/public/images',
        public_folder: '/images',
        collections: [
          {
            name: 'quick-start',
            label: 'Quick Start',
            folder: 'apps/docs/pages/docs/quick-start',
            create: true,
            slug: '{{name}}',
            extension: 'mdx',
            fields: [
              {
                label: 'Name',
                name: 'name',
                widget: 'string',
                rules: {
                  required: 'This field is required',
                },
              },
              {
                label: 'Order',
                name: 'order',
                widget: 'string',
              },
              { label: 'Content', name: 'body', widget: 'markdown' },
            ],
            preview: {
              components: Components,
              wrapper: PreviewWrapper,
            },
            blocks,
          },
          {
            name: 'docs',
            label: 'Docs',
            folder: 'apps/docs/pages/docs',
            create: true,
            slug: '{{name}}',
            extension: 'mdx',
            fields: [
              { label: 'Name', name: 'name', widget: 'string' },
              { label: 'Content', name: 'body', widget: 'markdown' },
            ],
            preview: {
              components: Components,
              wrapper: PreviewWrapper,
            },
            blocks,
          },
        ],
      },
    }}
  />
)

export default CMS
