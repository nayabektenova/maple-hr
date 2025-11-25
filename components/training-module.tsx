"use client";

import React, { useState } from "react";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    image: "image1.jpg",
    videoUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID_1",
  },
  {
    id: "firstaid",
    title: "First Aid Training",
    description: "Essential emergency preparedness and first aid procedures for workplace safety.",
    image: "image2.jpg",
    videoUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID_2",
  },
  {
    id: "safety",
    title: "Safety Training",
    description: "Workplace hazards, equipment usage, PPE, and emergency procedures.",
    image: "image3.jpg",
    videoUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID_3",
  },
  {
    id: "policy",
    title: "Company Policy Training",
    description: "Handbook overview, attendance, code of conduct, and privacy policy.",
    image: "image4.jpg",
    videoUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID_4",
  },
  {
    id: "itsecurity",
    title: "IT & Cybersecurity Training",
    description: "Password management, safe internet practices, phishing awareness, and data protection.",
    image: "image5.jpg",
    videoUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID_5",
  },
  {
    id: "communication",
    title: "Communication & Professional Skills Training",
    description: "Email etiquette, workplace communication, and customer service best practices.",
    image: "image6.jpg",
    videoUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID_6",
  },
  {
    id: "payroll",
    title: "Financial or Payroll Training",
    description: "Timesheet submission, benefits overview, and pay cycle process.",
    image: "image7.jpg",
    videoUrl: "https://www.youtube.com/embed/YOUR_VIDEO_ID_7",
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

  const handleViewClick = (topic: TrainingTopic) => {
    setSelectedVideo({
      title: topic.title,
      videoUrl: topic.videoUrl,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Training Modules</h1>
        <p className="text-gray-600">
          Explore our comprehensive training modules to enhance your skills and knowledge.
        </p>
      </div>

      {/* Training Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRAINING_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Image Container */}
              <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
                <img
                  src={topic.image}
                  alt={topic.title}
                  className="w-full h-full object-cover"
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

                {/* View Button */}
                <Button
                  onClick={() => handleViewClick(topic)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors duration-200"
                >
                  View Training
                </Button>
              </div>
            </div>
          ))}
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