'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Copy, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { copyToClipboard } from '@/lib/utils'

const formSchema = z.object({
  originalUrl: z.string().min(1, 'URL is required').url('Please enter a valid URL'),
  customSlug: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function UrlShortenerForm() {
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalUrl: '',
      customSlug: '',
    },
  })

  const createUrl = trpc.url.create.useMutation({
    onSuccess: (data) => {
      setShortenedUrl(data.shortUrl)
      form.reset()
    },
    onError: (error) => {
      console.error('Error creating short URL:', error)
    },
  })

  const onSubmit = (data: FormData) => {
    createUrl.mutate({
      originalUrl: data.originalUrl,
      customSlug: data.customSlug || undefined,
    })
  }

  const handleCopy = async () => {
    if (shortenedUrl) {
      try {
        await copyToClipboard(shortenedUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>URL Shortener</CardTitle>
          <CardDescription>
            Create short links for easy sharing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                {...form.register('originalUrl')}
                placeholder="Enter your URL (e.g., https://example.com)"
                className="w-full"
              />
              {form.formState.errors.originalUrl && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.originalUrl.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Input
                {...form.register('customSlug')}
                placeholder="Custom slug (optional)"
                className="w-full"
              />
              {form.formState.errors.customSlug && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.customSlug.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createUrl.isLoading}
            >
              {createUrl.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Shorten URL'
              )}
            </Button>

            {createUrl.error && (
              <p className="text-sm text-red-500">
                {createUrl.error.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {shortenedUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Success!</CardTitle>
            <CardDescription>Your shortened URL is ready</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input
                value={shortenedUrl}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => window.open(shortenedUrl, '_blank')}
                variant="outline"
                size="icon"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 mt-2">
                Copied to clipboard!
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}