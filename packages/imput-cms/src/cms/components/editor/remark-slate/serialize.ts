import {
  BlockType,
  defaultNodeTypes,
  LeafType,
  NodeTypes,
} from '../../../../cms/components/editor/remark-slate/ast-types'
import { MdxElementShape } from '../Elements/MdxElement'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'
import get from 'lodash/get'
import {
  AttributeType,
  mdxAccessors,
} from '../../../../cms/components/editor/lib/mdx'
import {
  isLeafNode,
  isMdxElement,
  recursivelyStringifyArray,
  recursivelyStringifyObject,
  serializeMdxChildren,
} from './utils'

export interface Options {
  nodeTypes: NodeTypes
  listDepth?: number
  ignoreParagraphNewline?: boolean
  /**
   * Allows us to skip adding an ugly newline when a component
   * is used as a prop
   */
  ignoreSpaceAfterMdx?: boolean
}

const VOID_ELEMENTS: Array<keyof NodeTypes> = ['thematic_break', 'image']

const BREAK_TAG = '\n'

/**
 * Slate to Markdown serialization.
 * From https://github.com/hanford/remark-slate
 */
export default function serialize(
  chunk: BlockType | LeafType,
  opts: Options = { nodeTypes: defaultNodeTypes, ignoreSpaceAfterMdx: false }
) {
  const {
    nodeTypes: userNodeTypes = defaultNodeTypes,
    ignoreParagraphNewline = false,
    listDepth = 0,
  } = opts

  let text = (chunk as LeafType).text || ''
  let type = (chunk as BlockType).type || ''

  const nodeTypes: NodeTypes = {
    ...defaultNodeTypes,
    ...userNodeTypes,
    heading: {
      ...defaultNodeTypes.heading,
      ...userNodeTypes.heading,
    },
  }

  const LIST_TYPES = [nodeTypes.ul_list, nodeTypes.ol_list]

  let children = text

  if (!isLeafNode(chunk) && !isMdxElement(type)) {
    children = chunk.children
      .map((c: BlockType | LeafType) => {
        const isList = !isLeafNode(c)
          ? (LIST_TYPES as string[]).includes(c.type || '')
          : false

        const selfIsList = (LIST_TYPES as string[]).includes(chunk.type || '')

        // Links can have the following shape
        // In which case we don't want to surround
        // with break tags
        // {
        //  type: 'paragraph',
        //  children: [
        //    { text: '' },
        //    { type: 'link', children: [{ text: foo.com }]}
        //    { text: '' }
        //  ]
        // }
        let childrenHasLink = false

        // Code snippets have the following shape
        // In which case we don't want to surround
        // with break tags
        // {
        //  type: 'paragraph',
        //  children: [
        //    { text: '' },
        //    { type: 'code_snippet', children: [{ text: "mycode" }]}
        //    { text: '' }
        //  ]
        // }
        let childrenHasCode = false

        if (!isLeafNode(chunk) && Array.isArray(chunk.children)) {
          childrenHasLink = chunk.children.some(
            (f) => !isLeafNode(f) && f.type === nodeTypes.link
          )
          childrenHasCode = chunk.children.some(
            (f) => !isLeafNode(f) && f.type === nodeTypes.code_snippet
          )
        }

        // Lists now have an extra node, so to ensure they get information
        // about what type of list the items are part of
        // we pass down the type of their previous parent
        let parentType = type
        if (type === 'list_item') {
          parentType = chunk.parentType || type
        }

        return serialize(
          { ...c, parentType, language: chunk.language },
          {
            nodeTypes,
            // WOAH.
            // what we're doing here is pretty tricky, it relates to the block below where
            // we check for ignoreParagraphNewline and set type to paragraph.
            // We want to strip out empty paragraphs sometimes, but other times we don't.
            // If we're the descendant of a list, we know we don't want a bunch
            // of whitespace. If we're parallel to a link we also don't want
            // to respect neighboring paragraphs
            ignoreParagraphNewline:
              (ignoreParagraphNewline ||
                isList ||
                selfIsList ||
                childrenHasLink ||
                childrenHasCode) &&
              // if we have c.break, never ignore empty paragraph new line
              !(c as BlockType).break,

            // track depth of nested lists so we can add proper spacing
            listDepth: (LIST_TYPES as string[]).includes(
              (c as BlockType).type || ''
            )
              ? listDepth + 1
              : listDepth,
          }
        )
      })
      .join('')
  }

  // This is pretty fragile code, check the long comment where we iterate over children
  if (
    !ignoreParagraphNewline &&
    (text === '' || text === '\n') &&
    chunk.parentType === nodeTypes.paragraph
  ) {
    type = nodeTypes.paragraph
    children = BREAK_TAG
  }

  if (
    children === '' &&
    !VOID_ELEMENTS.find((k) => nodeTypes[k] === type) &&
    !isMdxElement(type)
  )
    return

  // Never allow decorating break tags with rich text formatting,
  // this can malform generated markdown
  // Also ensure we're only ever applying text formatting to leaf node
  // level chunks, otherwise we can end up in a situation where
  // we try applying formatting like to a node like this:
  // "Text foo bar **baz**" resulting in "**Text foo bar **baz****"
  // which is invalid markup and can mess everything up
  if (children !== BREAK_TAG && isLeafNode(chunk)) {
    if (chunk.strikeThrough && chunk.bold && chunk.italic) {
      children = retainWhitespaceAndFormat(children, '~~***')
    } else if (chunk.bold && chunk.italic) {
      children = retainWhitespaceAndFormat(children, '***')
    } else {
      if (chunk.bold) {
        children = retainWhitespaceAndFormat(children, '**')
      }

      if (chunk.italic) {
        children = retainWhitespaceAndFormat(children, '_')
      }

      if (chunk.strikeThrough) {
        children = retainWhitespaceAndFormat(children, '~~')
      }

      if (chunk.code) {
        children = retainWhitespaceAndFormat(children, '`')
      }
    }
  }

  switch (type) {
    /**
     * Mess of duplicated code, but it works so fuck it
     */
    case nodeTypes.mdxJsxFlowElement:
      const escapeDoubleQuotes = (str: string) => {
        return str.replace(/\\([\s\S])|(")/g, '\\$1$2') // thanks @slevithan!
      }

      const mdxElement = chunk as MdxElementShape
      let props: string | undefined

      if (mdxElement.reactAttributes.length > 0) {
        // console.log('reactAttributes', mdxElement.reactAttributes)
        props = mdxElement.reactAttributes
          .map((attribute): string => {
            if (attribute.type === AttributeType.String) {
              return `${attribute.attributeName}="${attribute.value}"`
            } else {
              switch (attribute.type) {
                case AttributeType.Literal:
                case AttributeType.Undefined:
                  return `${attribute.attributeName}={${attribute.value}}`
                case AttributeType.Array:
                  return `${attribute.attributeName}={${recursivelyStringifyArray(attribute.value)}}`
                case AttributeType.Object:
                  return `${attribute.attributeName}={${recursivelyStringifyObject(attribute.value)}}`
                case AttributeType.Json:
                  return `${attribute.attributeName}={${attribute.value}}`
                case AttributeType.Component:
                  let serializedChildren = attribute.value
                    .map((r: any) =>
                      serialize(r, {
                        ignoreSpaceAfterMdx: true,
                        nodeTypes,
                      })
                    )
                    .join('')

                  // the user might just write plain markdown in the prop
                  // for it to be valid for react it needs to be wrapped
                  // in fragments
                  if (!serializedChildren?.startsWith(`<`)) {
                    serializedChildren = `<>${serializedChildren}</>`
                  }

                  return `${attribute.attributeName}={${serializedChildren}}`
              }
              return ``
            }
          })
          .join(' ')
      }

      /**
       * Recursively check if the component has children. Components without children
       * usually have a {text: ''} array.
       * @param node
       * @returns
       */
      const checkForChildren = (node: any): boolean => {
        // if node has more than one child then we assume it has children
        if (node && node.length > 1) {
          return true
        }

        if (node && node.length === 1 && node[0].children) {
          return checkForChildren(node[0].children)
        }
        return node && node.length === 1 && node[0].text !== ''
      }

      const hasChildren = checkForChildren(mdxElement.reactChildren)

      if (hasChildren) {
        children = serializeMdxChildren(mdxElement)
      }

      // edge case for react fragments
      // they'll never have a name, and we always want to render them as <></> even
      // if they have no children
      if (mdxElement.name === null) {
        return `<>${!opts.ignoreSpaceAfterMdx || hasChildren ? `\n${BREAK_TAG}` : ''}${hasChildren ? `${children}` : ''}</>${opts.ignoreSpaceAfterMdx ? '' : `\n${BREAK_TAG}`}`
      }

      return `<${mdxElement.name}${props ? ` ${props} ` : ''}${
        hasChildren ? '' : '/'
      }>${!opts.ignoreSpaceAfterMdx || hasChildren ? `\n${BREAK_TAG}` : ''}${hasChildren ? `${children}` : ''}${
        hasChildren
          ? `</${mdxElement.name}>${opts.ignoreSpaceAfterMdx ? '' : `\n${BREAK_TAG}`}`
          : ''
      }`
    case nodeTypes.heading[1]:
      return `# ${children}\n${BREAK_TAG}`
    case nodeTypes.heading[2]:
      return `## ${children}\n${BREAK_TAG}`
    case nodeTypes.heading[3]:
      return `### ${children}\n${BREAK_TAG}`
    case nodeTypes.heading[4]:
      return `#### ${children}\n${BREAK_TAG}`
    case nodeTypes.heading[5]:
      return `##### ${children}\n${BREAK_TAG}`
    case nodeTypes.heading[6]:
      return `###### ${children}\n${BREAK_TAG}`

    case nodeTypes.block_quote:
      // For some reason, marked is parsing blockquotes w/ one new line
      // as contiued blockquotes, so adding two new lines ensures that doesn't
      // happen
      return `> ${children}\n\n${BREAK_TAG}`

    case nodeTypes.code_block:
      return `\`\`\`${
        (chunk as BlockType).language || ''
        // @ts-ignore
      }\n${children}\`\`\`\n${BREAK_TAG}`

    case nodeTypes.code_line:
      return `${children}${BREAK_TAG}`

    case nodeTypes.link:
      return `[${children}](${(chunk as BlockType).url || ''})`

    case nodeTypes.code_snippet:
      return `\`${children}\``
    case nodeTypes.image:
      return `![${(chunk as BlockType).caption}](${
        (chunk as BlockType).link || ''
      } "${(chunk as BlockType).title || ''}")\n${BREAK_TAG}`

    case nodeTypes.ol_list:
    case nodeTypes.ul_list:
      // if the list is a child of a list, we only want one newline at the end
      // weird code because sometimes lists are children of mdx elements
      const isNested = ['ol_list', 'ul_list'].includes(chunk.parentType || '')
      return `${children}${isNested ? '' : BREAK_TAG}`

    case nodeTypes.listItemText:
      // whether it's an ordered or unordered list
      const isOL = chunk && chunk.parentType === nodeTypes.ol_list

      let spacer = ''
      for (let k = 0; listDepth > k; k++) {
        if (isOL) {
          // https://github.com/remarkjs/remark-react/issues/65
          spacer += '   '
        } else {
          spacer += '  '
        }
      }
      return `${spacer}${isOL ? `1.` : '-'} ${children}${'\n'}`

    case nodeTypes.paragraph:
      return `${children !== '\n' ? `${children}\n` : ''}${BREAK_TAG}`

    case nodeTypes.thematic_break:
      return `---\n${BREAK_TAG}`

    default:
      return children
  }
}

// This function handles the case of a string like this: "   foo   "
// Where it would be invalid markdown to generate this: "**   foo   **"
// We instead, want to trim the whitespace out, apply formatting, and then
// bring the whitespace back. So our returned string looks like this: "   **foo**   "
function retainWhitespaceAndFormat(string: string, format: string) {
  // we keep this for a comparison later
  const frozenString = string.trim()

  // children will be mutated
  let children = frozenString

  // We reverse the right side formatting, to properly handle bold/italic and strikeThrough
  // formats, so we can create ~~***FooBar***~~
  const fullFormat = `${format}${children}${reverseStr(format)}`

  // This conditions accounts for no whitespace in our string
  // if we don't have any, we can return early.
  if (children.length === string.length) {
    return fullFormat
  }

  // if we do have whitespace, let's add our formatting around our trimmed string
  // We reverse the right side formatting, to properly handle bold/italic and strikeThrough
  // formats, so we can create ~~***FooBar***~~
  const formattedString = format + children + reverseStr(format)

  // and replace the non-whitespace content of the string
  return string.replace(frozenString, formattedString)
}

const reverseStr = (string: string) => string.split('').reverse().join('')
