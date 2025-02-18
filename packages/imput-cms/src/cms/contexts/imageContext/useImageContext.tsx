import React, { useContext } from 'react'
import {
  getGithubFileBase64,
  useGetGithubImages,
} from '../../../cms/queries/github'
import ctxt, { ImageState, LoadedImages } from './context'
import { useCMS } from '../../../cms/contexts/cmsContext/useCMSContext'
import { base64ToBlob } from '../../../cms/utils/base64ToBlob'
import Loader from '../../components/loader'
import { GenericError } from '../../components/atoms/GenericError'

const fileToBlob = async (file: File) =>
  new Blob([new Uint8Array(await file.arrayBuffer())], { type: file.type })

/**
 * Returns a page's images and methods related to those images.
 */
export const useImages = () => {
  const {
    imageTree,
    images: [images, setImages],
  } = useContext(ctxt)

  const { backend } = useCMS()
  const [owner, repo] = backend.repo.split('/')

  /**
   * Move image from sha fileTree to the CMS' local state
   * @param filename
   */
  const loadImage = async (filename: string): Promise<LoadedImages> => {
    /**
     * We find this image within the repo's image tree.
     * `imageTree` contains all the base64 files, so we just need to match filename to filename
     * then load the base64's to state.
     */
    const foundImage = imageTree.find((i) => filename.includes(i.path!))
    const blob =
      /**
       * TODO: handle remote images
       */
      foundImage
        ? await base64ToBlob(
            await getGithubFileBase64(owner, repo, foundImage.sha!)
          )
        : undefined
    return {
      // the full markdown string before we separate it
      markdown: '' as string,
      // all these images were previously uploaded
      state: ImageState.Uploaded,
      // the file's url
      filename,
      // the image's seo title
      title: '' as string,
      // alt text associated with the image
      alttext: '' as string,
      // the blob url
      blobUrl: blob ? URL.createObjectURL(blob) : undefined,
      blob,
    }
  }

  /**
   * Add a new image to to the images state
   * @param file - the file to add to the state
   */
  const addImage = async (file: File) => {
    const blob = await fileToBlob(file)
    // this has to be encoded or markdown serialises the image weird
    const encodedFileName = encodeURIComponent(file.name)
    const image: LoadedImages = {
      markdown: encodedFileName,
      // this is to identify which images need to be uploaded once the page has been saved
      state: ImageState.New,
      filename: `${encodedFileName}`,
      blobUrl: URL.createObjectURL(blob),
      blob,
    }
    setImages([...images, image])

    return image
  }

  /**
   * Remove image from images state. NOTE: Deleting an image does not remove it from the repo.
   * That should be done separately.
   * @param filename - the public url of the picture e.g. /images/my-pic.png
   */
  const removeImage = (filename: string) => {
    const newImages = images.filter((image) =>
      image.filename.includes(filename)
    )
    setImages(newImages)
  }

  /**
   * Duplicated code for removing and then adding an image
   * @param filename - the public url of the picture e.g. /images/my-pic.png
   * @param file - the file to add to the state
   * @returns
   */
  const updateImage = async (filename: string, file: File) => {
    const newImages = images.filter((image) =>
      image.filename.includes(filename)
    )

    const blob = await fileToBlob(file)
    // this has to be encoded or markdown serialises the image weird
    const encodedFileName = encodeURIComponent(file.name)
    const image: LoadedImages = {
      markdown: encodedFileName,
      // this is to identify which images need to be uploaded once the page has been saved
      state: ImageState.New,
      filename: `${encodedFileName}`,
      blobUrl: URL.createObjectURL(blob),
      blob,
    }
    setImages([...newImages, image])

    return image
  }

  return {
    imageTree,
    images,
    loadImage,
    setImages,
    addImage,
    removeImage,
    updateImage,
  }
}

const ImagesContextProvider = ctxt.Provider

/**
 * Context containing all images in uploads folder
 */
export const ImagesProvider = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const images = React.useState<LoadedImages[]>([])
  const imagesRef = React.useRef<LoadedImages[]>([])
  const { isLoading, data, isError } = useGetGithubImages()

  if (isError)
    return (
      <div className="imp-w-screen imp-h-screen imp-flex imp-items-center imp-justify-center">
        <GenericError title="Could not load content from Github.">
          Are you sure your configuration is correct?
        </GenericError>
      </div>
    )

  if (isLoading) {
    return <Loader />
  }

  return (
    <ImagesContextProvider
      value={{
        imageTree: data!.data.tree,
        images,
        imagesRef,
      }}
    >
      {children}
    </ImagesContextProvider>
  )
}
