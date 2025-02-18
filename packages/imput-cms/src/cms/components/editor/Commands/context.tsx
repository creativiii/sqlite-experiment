import { createContext, useState } from 'react'

type Position = { left: number; top: number } | null

export type CommandsContextProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  position: Position
  setPosition: React.Dispatch<React.SetStateAction<Position>>
}

export const CommandsContext = createContext({
  open: false,
} as CommandsContextProps)

export const CommandsProvider = ({ children }: { children: JSX.Element }) => {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position>(null)
  return (
    <CommandsContext.Provider
      value={{
        open,
        setOpen,
        position,
        setPosition,
      }}
    >
      {children}
    </CommandsContext.Provider>
  )
}

export const withCommands = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithCommands: React.FC<P> = (props) => (
    <CommandsProvider>
      <WrappedComponent {...props} />
    </CommandsProvider>
  )

  WithCommands.displayName = `WithCommands(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`

  return WithCommands
}
