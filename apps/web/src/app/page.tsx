import { UrlShortenerForm } from '@/components/url-shortener-form'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          URL Shortener
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Transform long URLs into short, shareable links in seconds
        </p>
      </div>
      
      <UrlShortenerForm />
      
      <div className="text-center text-sm text-gray-500">
        <p>Free • Fast • Reliable</p>
      </div>
    </div>
  )
}