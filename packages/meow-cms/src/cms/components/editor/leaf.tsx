import React from 'react'
import { cva } from 'class-variance-authority'

export const Leaf = (props: any) => {
  let { children, leaf } = props
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = (
      <code className="px-[0.2em] py-[0.4em] m-0 text-[85%] whitespace-break-spaces bg-secondary rounded text-red-500">
        {children}
      </code>
    )
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return <Text {...props}>{children}</Text>
}

// The following is a workaround for a Chromium bug where,
// if you have an inline at the end of a block,
// clicking the end of a block puts the cursor inside the inline
// instead of inside the final {text: ''} node
// https://github.com/ianstormtaylor/slate/issues/4704#issuecomment-1006696364
const Text = (props: any) => {
  const { attributes, children, leaf } = props
  return (
    <span
      className={StyledText({ text: leaf.text ? true : true })}
      {...attributes}
    >
      {children}
    </span>
  )
}

const StyledText = cva('', {
  variants: {
    text: {
      true: 'pl-[0.1px]',
    },
  },
})
