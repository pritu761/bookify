"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ImageIcon, Upload } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import FileUploader from "@/components/FileUploader"
import LoadingOverlay from "@/components/LoadingOverlay"
import VoiceSelector from "@/components/VoiceSelector"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPES, DEFAULT_VOICE } from "@/lib/constants"
import { UploadSchema } from "@/lib/zod"
import type { BookUploadFormValues } from "@/types"

const UploadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BookUploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      persona: DEFAULT_VOICE,
      pdfFile: undefined,
      coverImage: null,
    },
  })

  const onSubmit = async (values: BookUploadFormValues) => {
    setIsSubmitting(true)

    try {
      // Upload and synthesis APIs can be connected here; the form data is now validated.
      console.log("Book upload form submitted", {
        title: values.title,
        author: values.author,
        persona: values.persona,
        pdfFile: values.pdfFile.name,
        coverImage: values.coverImage?.name ?? null,
      })

      await new Promise((resolve) => setTimeout(resolve, 900))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="new-book-wrapper">
      {isSubmitting && <LoadingOverlay />}

      <p className="text-sm font-medium text-[#777]">5 of 10 books used (Upgrade)</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FileUploader
            control={form.control}
            name="pdfFile"
            label="Book PDF File"
            acceptTypes={ACCEPTED_PDF_TYPES}
            disabled={isSubmitting}
            icon={Upload}
            placeholder="Click to upload PDF"
            hint="PDF file (max 50MB)"
          />

          <FileUploader
            control={form.control}
            name="coverImage"
            label="Cover Image (Optional)"
            acceptTypes={ACCEPTED_IMAGE_TYPES}
            disabled={isSubmitting}
            icon={ImageIcon}
            placeholder="Click to upload cover image"
            hint="Leave empty to auto-generate from PDF"
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Title</FormLabel>
                <FormControl>
                  <Input
                    className="form-input border-0 shadow-none focus-visible:ring-2 focus-visible:ring-[#663820]/20"
                    placeholder="ex: Rich Dad Poor Dad"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Author Name</FormLabel>
                <FormControl>
                  <Input
                    className="form-input border-0 shadow-none focus-visible:ring-2 focus-visible:ring-[#663820]/20"
                    placeholder="ex: Robert Kiyosaki"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="persona"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">Choose Assistant Voice</FormLabel>
                <FormControl>
                  <VoiceSelector
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button type="submit" className="form-btn" disabled={isSubmitting}>
            Begin Synthesis
          </button>
        </form>
      </Form>
    </div>
  )
}

export default UploadForm
