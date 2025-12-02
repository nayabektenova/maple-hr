"use client";

import React, { useState } from "react";
import { X, Play, Search } from "lucide-react";
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
    image: "/image1.png",
    videoUrl: "https://www.youtube.com/embed/UUNp7rnJZOM",
  },
  {
    id: "firstaid",
    title: "First Aid Training",
    description: "Essential emergency preparedness and first aid procedures for workplace safety.",
    image: "/image2.jpg",
    videoUrl: "https://www.youtube.com/embed/GhBGMfLnY-k",
  },
  {
    id: "safety",
    title: "Safety Training",
    description: "Workplace hazards, equipment usage, PPE, and emergency procedures.",
    image: "/image3.jpg",
    videoUrl: "https://www.youtube.com/embed/pbEsTl7yguw",
  },
  {
    id: "policy",
    title: "Company Policy Training",
    description: "Handbook overview, attendance, code of conduct, and privacy policy.",
    image: "/image4.jpg",
    videoUrl: "https://www.youtube.com/embed/7OLWjz3TEXg",
  },
  {
    id: "itsecurity",
    title: "IT & Cybersecurity Training",
    description: "Password management, safe internet practices, phishing awareness, and data protection.",
    image: "/image5.jpg",
    videoUrl: "https://www.youtube.com/embed/CT5gmh9cxpk",
  },
  {
    id: "communication",
    title: "Communication & Professional Skills Training",
    description: "Email etiquette, workplace communication, and customer service best practices.",
    image: "/image6.jpg",
    videoUrl: "https://www.youtube.com/embed/PiNN-HmHu7A",
  },
  {
    id: "payroll",
    title: "Financial or Payroll Training",
    description: "Timesheet submission, benefits overview, and pay cycle process.",
    image: "/image7.jpeg",
    videoUrl: "https://www.youtube.com/embed/u7zHYgXZPjs?start=39",
  },
];

interface VideoModalProps {
  open: boolean;
  title: string;
  videoUrl: string;
  onClose: () => void;
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

  
