"use client";

import React, { useState } from "react";
import { X, Play, Search } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TrainingTopic {
  id: string;
  title: string;
  description: string;
  image: string;
  videoUrl: string;
}

const TRAINING_TOPICS: TrainingTopic[] = [
  {
    id: "onboarding",
    title: "Onboarding & Orientation Training",
    description: "Company overview, team introduction, tools/software walkthrough, and workplace tour.",
    image: "/education.jpg",
    videoUrl: "https://www.youtube.com/embed/UUNp7rnJZOM",
  },
  {
    id: "firstaid",
    title: "First Aid Training",
    description: "Essential emergency preparedness and first aid procedures for workplace safety.",
    image: "/healthcare.jpeg",
    videoUrl: "https://www.youtube.com/embed/GhBGMfLnY-k",
  },
  {
    id: "safety",
    title: "Safety Training",
    description: "Workplace hazards, equipment usage, PPE, and emergency procedures.",
    image: "/construction.jpg",
    videoUrl: "https://www.youtube.com/embed/pbEsTl7yguw",
  },
  {
    id: "policy",
    title: "Company Policy Training",
    description: "Handbook overview, attendance, code of conduct, and privacy policy.",
    image: "/finance.jpg",
    videoUrl: "https://www.youtube.com/embed/7OLWjz3TEXg",
  },
  {
    id: "itsecurity",
    title: "IT & Cybersecurity Training",
    description: "Password management, safe internet practices, phishing awareness, and data protection.",
    image: "/technology.jpg",
    videoUrl: "https://www.youtube.com/embed/CT5gmh9cxpk",
  },
  {
    id: "communication",
    title: "Communication & Professional Skills Training",
    description: "Email etiquette, workplace communication, and customer service best practices.",
    image: "/retail.jpeg",
    videoUrl: "https://www.youtube.com/embed/PiNN-HmHu7A",
  },
  {
    id: "payroll",
    title: "Financial or Payroll Training",
    description: "Timesheet submission, benefits overview, and pay cycle process.",
    image: "/finance.jpg",
    videoUrl: "https://www.youtube.com/embed/u7zHYgXZPjs?start=39",
  },
];

interface VideoModalProps {
  open: boolean;
  title: string;
  videoUrl: string;
  onClose: () => void;
}

function VideoModal({ open, title, videoUrl, onClose }: VideoModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Container */}
        <div className="p-6">
          <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <iframe
              width="100%"
              height="100%"
              src={videoUrl}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrainingModule() {
  const [selectedVideo, setSelectedVideo] = useState<{
    title: string;
    videoUrl: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleViewClick = (topic: TrainingTopic) => {
    setSelectedVideo({
      title: topic.title,
      videoUrl: topic.videoUrl,
    });
  };

  const filtered = TRAINING_TOPICS.filter((topic) =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search and Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Training Modules</h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search training modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Training Grid */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600">No training modules found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Image Container */}
                  <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
                    <Image
                      src={topic.image}
                      alt={topic.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                      <Play size={40} className="text-white opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {topic.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {topic.description}
                    </p>

                    {/* View Button - Styled like Create Announcement */}
                    <Button
                      onClick={() => handleViewClick(topic)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors duration-200"
                    >
                      View Training
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal
        open={selectedVideo !== null}
        title={selectedVideo?.title || ""}
        videoUrl={selectedVideo?.videoUrl || ""}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
}