import { Descendant } from 'slate'
import { RenderElementProps, useSlate } from 'slate-react'
import { CustomRenderElementProps } from './element'
import ComponentEditor from './componentEditor'
import Panel from '../designSystem/panel'
import Box from '../designSystem/box'
import { useEditorDepth } from './depthContext'
import { styled } from 'stitches.config'
import Flex from '../designSystem/flex'
import { BracketsSquare, ImageSquare } from 'phosphor-react'

const StyledMdxButton = styled('button', {
  width: '100%',
  background: 'white',
  border: '1px solid var(--colors-gray-200)',
  borderRadius: '$md',
  marginBottom: '$2',
  cursor: 'pointer',
  padding: 0,
  overflow: 'hidden',
  position: 'relative',
})

/**
 * Interface for custom MDX element
 */
export interface MdxElementShape extends Pick<RenderElementProps, 'element'> {
  type: string
  align: string
  /**
   * Unique element Id, exists only on some elements
   */
  id: string
  /**
   * The component's name
   */
  name: string
  /**
   * An array of slate elements
   */
  reactChildren: Descendant[]
  /**
   * Component props
   */
  attributes: {
    type: 'mdxJsxAttribute'
    name: string
    value: // strings are easy
    | string
      // numbers are a bit more complicated
      | {
          type: string
          value: string
        }
  }[]
  /**
   * Component children
   */
  text: string
}

const MdxElement = (props: CustomRenderElementProps) => {
  const { attributes, children, element } = props
  const mdxElement = element as MdxElementShape
  const { addElement, removeElement, getDepth, depthArray } = useEditorDepth()

  const thisDepth = getDepth(mdxElement.id)

  return (
    <div contentEditable={false} {...attributes}>
      <Panel
        id="component"
        index={thisDepth}
        depth={thisDepth}
        depthOfType={thisDepth}
        length={depthArray.length}
        lengthOfType={depthArray.length}
        rootProps={{
          onOpenChange: (open) => {
            if (open) {
              addElement(mdxElement.id)
            } else {
              removeElement(mdxElement.id)
            }
          },
        }}
        title={'Edit component'}
        description={<ComponentEditor {...props} />}
      >
        <StyledMdxButton>
          <Box
            css={{
              padding: '$4',
            }}
          >
            <Flex direction="row" gap="2" align="center">
              <BracketsSquare size={16} weight="bold" />
              <Box
                css={{
                  color: '$gray-800',
                  fontWeight: '500',
                  fontSize: '$sm',
                }}
              >
                {mdxElement.name} Block
              </Box>
            </Flex>
          </Box>
          <div>{children}</div>
        </StyledMdxButton>
      </Panel>
    </div>
  )
}

export default MdxElement
