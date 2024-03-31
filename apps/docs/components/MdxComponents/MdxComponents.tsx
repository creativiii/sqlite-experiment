import PropsTable from '../PropsTable'
import Tabs from '@imput/components/tabs'
import { Card, CardHeader, CardTitle } from '@imput/components/Card'
import Link from 'next/link'
import { ArrowRight, Book } from '@imput/components/Icon'

export const Components = {
  Note: ({ children }: any) => {
    return (
      <div className="callout mb-6 overflow-x-auto mt-6 flex rounded-lg border py-2 ltr:pr-4 rtl:pl-4 contrast-more:border-current contrast-more:dark:border-current border-orange-100 bg-orange-50 text-orange-800 dark:border-orange-400/30 dark:bg-orange-400/20 dark:text-orange-300">
        <div className="select-none text-xl pl-3 pr-2">💡</div>
        <div className="w-full min-w-0 leading-7">{children}</div>
      </div>
    )
  },
  PropsTable,
  Video: ({ src }: any) => {
    return <video controls src={src}></video>
  },
  TabsRoot: Tabs,
  TabsContent: Tabs.Content,
  ContentLink: ({ title, href }: { title: string; href: string }) => (
    <Link href={href} className="mt-4 block">
      <Card className="group hover:bg-accent transition-colors">
        <CardHeader className="flex gap-2 items-center flex-row relative">
          <CardTitle className="!mt-0">{title}</CardTitle>
          <ArrowRight
            size={24}
            weight="bold"
            className="text-primary/20 absolute right-8 group-hover:text-primary group-hover:translate-x-2 transition-all"
          />
        </CardHeader>
      </Card>
    </Link>
  ),
}
