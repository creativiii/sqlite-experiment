import { NextPage } from 'next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextCMSContext } from 'cms/contexts/cmsContext/context'
import { CMSProvider } from 'cms/contexts/cmsContext/useCMSContext'
import { UserProvider } from 'cms/contexts/userContext/userContext'
import HomePage from 'cms/pages/home'
import CollectionPage from 'cms/pages/collection'
import { ImagesProvider } from 'cms/contexts/imageContext/useImageContext'
import Box from 'cms/components/designSystem/box'
import React from 'react'
import { Octokit } from 'octokit'
import { getToken } from 'cms/queries/auth'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import 'node_modules/modern-normalize/modern-normalize.css'

/**
 * Central routing point for all of our private CMS pages
 */
const NextCMSPrivateRoutes: NextPage = () => {
  return (
    <Switch>
      <Route path="/cms/:collection">
        <CollectionPage />
      </Route>
      <Route path="/cms">
        <HomePage />
      </Route>
    </Switch>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

/**
 * NextCMS wrapper. Checks for login status, sets up contexts, etc.
 */
const NextCMSRoutes = (props: { settings: NextCMSContext['settings'] }) => {
  React.useEffect(() => {
    const get = async () => {
      const octokit = new Octokit({
        auth: getToken(),
      })
      console.log(await octokit.request('GET /rate_limit'))
    }
    get()
  }, [])
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        {/* CMS settings and such */}
        <CMSProvider settings={props.settings}>
          {/* Github user info */}
          <UserProvider>
            {/* All images to be used in the CMS */}
            <ImagesProvider>
              <Box
                css={{
                  fontSize: 16,
                }}
              >
                <Toaster />
                <NextCMSPrivateRoutes />
              </Box>
            </ImagesProvider>
          </UserProvider>
        </CMSProvider>
      </QueryClientProvider>
    </Router>
  )
}

export default NextCMSRoutes
