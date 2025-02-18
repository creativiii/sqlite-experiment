import { useImages } from '../../contexts/imageContext/useImageContext'
import { ImageSquare } from 'phosphor-react'
import { Element } from 'slate'
import ImageSelector from '../editor/Elements/Images/ImageSelector'
import ImageUploadButton from '../editor/Elements/Images/UploadButton'
import { Button } from '@imput/components/Button'
import { useFormItem } from '@imput/components/form'
import { Label } from '@imput/components/Label'
import { useCMS } from '../../contexts/cmsContext/useCMSContext'
import { useController, useFormContext } from 'react-hook-form'
import React, { forwardRef, useState } from 'react'
import { cva } from 'class-variance-authority'
import { FakeP } from '@imput/components/Typography'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@imput/components/Popover'
import { Input } from '@imput/components/Input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@imput/components/Dialog'
import { Separator } from '@imput/components/Separator'
import { FileSearch, MagnifyingGlass, X } from '@imput/components/Icon'

const StyledImageButton = cva(
  'imp-w-full imp-rounded-md imp-border imp-border-input imp-transition-colors imp-bg-background imp-shadow-sm hover:imp-bg-accent hover:imp-text-accent-foreground imp-my-1 imp-cursor-pointer imp-p-0 imp-overflow-hidden imp-relative',
  {
    variants: {
      selected: {
        true: 'imp-outline imp-outline-2 imp-outline-offset-4 imp-outline-primary/80',
      },
    },
  }
)

export interface ImageElement extends Element {
  type: 'image'
  link: string | null
  title: string
  caption: string
}

interface ImagePickerProps {
  name?: string
  /**
   * Adds a selection outline to the image picker
   */
  selected?: boolean
  imageTitle?:
    | {
        defaultValue: string
        onImageTitleChange: (value: string) => void
      }
    | false
  imageAltText?:
    | {
        defaultValue: string
        onImageAltTextChange: (value: string) => void
      }
    | false
  image: string | null
  /**
   * Callback that runs whenever an image is selected
   */
  onImageChange?: (value: string) => void
}

const ImagePickerBase = forwardRef(
  (
    {
      image,
      selected,
      onImageChange,
      imageAltText = false,
      imageTitle = false,
      name = 'imagepicker',
    }: ImagePickerProps,
    ref
  ) => {
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const { images, loadImage, setImages } = useImages()
    const { public_folder } = useCMS()

    const imageBlobUrl = image
      ? images.find((i) => i.filename.includes(image))?.blobUrl
      : undefined

    // if the image isn't currently loaded into state we wait until its shown on screen and then load it
    React.useEffect(() => {
      const doLoad = async () => {
        const loadedImage = await loadImage(image!)
        setImages((i) => [...i, loadedImage])
      }
      if (imageBlobUrl === undefined && image) {
        doLoad()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageBlobUrl, image])

    return (
      <Popover>
        <PopoverContent>
          <div className="imp-relative imp-mb-2">
            <div className="imp-flex imp-flex-col imp-gap-2">
              {imageTitle !== false && (
                <div className="imp-flex imp-flex-col imp-gap-1">
                  <Label htmlFor={`input-image-title`}>Image title</Label>
                  <Input
                    name="image-title"
                    value={imageTitle?.defaultValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value
                      imageTitle?.onImageTitleChange(value)
                    }}
                  />
                </div>
              )}
              {imageAltText !== false && (
                <div className="imp-flex imp-flex-col imp-gap-1">
                  <Label htmlFor={`input-image-alt`}>Image alt text</Label>
                  <Input
                    name="image-alt"
                    value={imageAltText.defaultValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value
                      imageAltText?.onImageAltTextChange(value)
                    }}
                  />
                </div>
              )}
              <div className="imp-flex imp-flex-col imp-gap-2">
                <div className="imp-flex imp-flex-col imp-gap-1">
                  <Label htmlFor={`input-image-file`}>Upload image</Label>
                  <Dialog
                    open={open}
                    onOpenChange={(val) => {
                      setOpen(val)
                    }}
                  >
                    <DialogContent className="!imp-max-w-4xl imp-px-0">
                      <DialogHeader className="imp-px-4 imp-mb-2">
                        <DialogTitle>Select media</DialogTitle>
                        <DialogDescription>
                          <div className="imp-relative imp-flex-1 imp-flex imp-gap-2 imp-items-center imp-justify-end">
                            <div className="imp-relative imp-w-full imp-max-w-sm">
                              <MagnifyingGlass
                                className="imp-absolute imp-left-2.5 imp-top-1/2 -imp-translate-y-1/2 imp-h-4 imp-w-4 imp-text-gray-500 dark:imp-text-gray-400"
                                aria-hidden="true"
                              />
                              <Input
                                type="search"
                                placeholder="Search..."
                                className="imp-pl-9 imp-pr-10"
                                aria-label="Search"
                                onChange={(e) => {
                                  setSearch(e.target.value)
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="imp-absolute imp-right-0 imp-top-0 imp-h-full imp-px-3"
                                aria-label="Clear search"
                                onClick={() => {
                                  setSearch('')
                                }}
                              >
                                <X
                                  className="imp-h-4 imp-w-4"
                                  aria-hidden="true"
                                />
                              </Button>
                            </div>
                            <ImageUploadButton />
                          </div>
                        </DialogDescription>
                      </DialogHeader>

                      <Separator orientation="horizontal" />

                      <div
                        style={{
                          overflowY: 'scroll',
                          maxHeight: `calc(100vh - 160px )`,
                          height: '100%',
                        }}
                        className="imp-p-4"
                      >
                        <div className="">
                          <ImageSelector
                            search={search}
                            onImageSelect={(filename: string) => {
                              setOpen(false)
                              onImageChange?.(filename)
                            }}
                          />
                        </div>
                      </div>
                    </DialogContent>
                    <DialogTrigger
                      asChild
                      onClick={() => {
                        setOpen(true)
                      }}
                    >
                      <Button type="button">Select image</Button>
                    </DialogTrigger>
                  </Dialog>
                </div>

                <div className="imp-flex imp-flex-col imp-gap-1">
                  <Label htmlFor={`input-image-src`}>Image src</Label>
                  <Input
                    name="image-src"
                    value={image || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value
                      onImageChange?.(value)
                    }}
                  />
                </div>

                {Boolean(image) && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      onImageChange?.('')
                      if (imageTitle) imageTitle?.onImageTitleChange('')
                      if (imageAltText) imageAltText?.onImageAltTextChange('')
                    }}
                  >
                    Remove image
                  </Button>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
        <PopoverTrigger asChild>
          <button
            ref={ref as any}
            className={StyledImageButton({ selected })}
            contentEditable={false}
            data-testid={`${name}-input`}
          >
            <PopoverAnchor
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                height: !image ? '2em' : '6em',
                width: !image ? '2em' : '6em',
                background: 'transparent',
                zIndex: 1000,
                transform: 'translate(-50%, -50%)',
              }}
            />
            {image ? (
              <div
                className="imp-block imp-max-w-full imp-min-h-80 imp-bg-cover imp-bg-center"
                style={{
                  backgroundImage: `url(${
                    image
                      ? // needs to match the url as it is in markdown
                        // e.g. images/filename.png
                        images.find((i) =>
                          `${public_folder}/${i.filename}`.includes(`${image}`)
                        )?.blobUrl
                      : ''
                  })`,
                }}
              />
            ) : (
              <div className="imp-p-4">
                <div className="imp-flex imp-flex-row imp-gap-2 imp-items-center">
                  <ImageSquare size={16} weight="bold" />
                  <FakeP>Add an image</FakeP>
                </div>
              </div>
            )}
          </button>
        </PopoverTrigger>
      </Popover>
    )
  }
)

interface ControlledImagePickerProps extends Omit<ImagePickerProps, 'image'> {}

const Controlled = (props: ControlledImagePickerProps) => {
  const form = useFormContext()
  const { rules, name } = useFormItem()

  const {
    field: { onChange: formOnchange, value, ...rest },
  } = useController({
    name: name,
    control: form.control,
    rules,
  })

  return (
    <ImagePicker
      {...props}
      {...rest}
      onImageChange={formOnchange}
      image={value}
    />
  )
}

const ImagePicker = Object.assign(ImagePickerBase, { Controlled: Controlled })

export default ImagePicker
