'use client';

import Image from 'next/image';

const photos = [
  {
    id: 1,
    title: "Photo Title One",
    description: "Description of this photo or moment",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop",
    alt: "Placeholder photo"
  },
  {
    id: 2,
    title: "Photo Title Two",
    description: "Another captured moment",
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=500&fit=crop",
    alt: "Placeholder photo"
  },
  {
    id: 3,
    title: "Photo Title Three",
    description: "Description here",
    src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=500&h=500&fit=crop",
    alt: "Placeholder photo"
  },
  {
    id: 4,
    title: "Photo Title Four",
    description: "Another description",
    src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=500&h=500&fit=crop",
    alt: "Placeholder photo"
  },
  {
    id: 5,
    title: "Photo Title Five",
    description: "Description of moment",
    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=500&h=500&fit=crop",
    alt: "Placeholder photo"
  },
  {
    id: 6,
    title: "Photo Title Six",
    description: "Final description",
    src: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&h=500&fit=crop",
    alt: "Placeholder photo"
  }
];

export default function PhotoSection() {
  return (
    <section className="min-h-screen p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Photo
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            A visual collection of moments, places, and perspectives. Replace these placeholder images with your own photography.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group cursor-pointer"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 relative">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-3">
                <h3 className="font-medium text-gray-900">{photo.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{photo.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Replace these placeholder images with your own photography
          </p>
        </div>
      </div>
    </section>
  );
}