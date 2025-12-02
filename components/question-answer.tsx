"use client";

import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Question {
  id: string;
  text: string;
  type: "short" | "long" | "rating" | "multiple";
  options?: string[];
  answer?: string;
}

interface TopicQA {
  id: string;
  title: string;
  questions: Question[];
  answeredCount: number;
}

const TRAINING_TOPICS = [
  {
    id: "onboarding",
    title: "Onboarding & Orientation Training",
  },
  {
    id: "firstaid",
    title: "First Aid Training",
  },
  {
    id: "safety",
    title: "Safety Training",
  },
  {
    id: "policy",
    title: "Company Policy Training",
  },
  {
    id: "itsecurity",
    title: "IT & Cybersecurity Training",
  },
  {
    id: "communication",
    title: "Communication & Professional Skills Training",
  },
  {
    id: "payroll",
    title: "Financial or Payroll Training",
  },
];

interface CreateQuestionModalProps {
  open: boolean;
  topicTitle: string;
  onClose: () => void;
  onAdd: (question: Question) => void;
}

function CreateQuestionModal({
  open,
  topicTitle,
  onClose,
  onAdd,
}: CreateQuestionModalProps) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<
    "short" | "long" | "rating" | "multiple"
  >("short");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const handleAddQuestion = () => {
    if (!questionText.trim()) return;

    const newQuestion: Question = {
      id: Date.now().toString(),
      text: questionText,
      type: questionType,
      options: questionType === "multiple" ? options.filter((o) => o.trim()) : undefined,
    };

    onAdd(newQuestion);
    setQuestionText("");
    setQuestionType("short");
    setOptions(["", ""]);
    onClose();
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Question</h2>
            <p className="text-sm text-gray-600 mt-1">{topicTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={4}
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) =>
                setQuestionType(e.target.value as "short" | "long" | "rating" | "multiple")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="short">Short Text</option>
              <option value="long">Long Text</option>
              <option value="rating">Rating (1-5)</option>
              <option value="multiple">Multiple Choice</option>
            </select>
          </div>

          {/* Multiple Choice Options */}
          {questionType === "multiple" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ))}
                <button
                  onClick={() => setOptions([...options, ""])}
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 mt-2"
                >
                  <Plus size={16} /> Add Option
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddQuestion}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            Add Question
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AnswerQuestionModalProps {
  open: boolean;
  topicTitle: string;
  questions: Question[];
  onClose: () => void;
  onSaveAnswers: (answers: Record<string, string>) => void;
}

function AnswerQuestionModal({
  open,
  topicTitle,
  questions,
  onClose,
  onSaveAnswers,
}: AnswerQuestionModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    onSaveAnswers(answers);
    setAnswers({});
    onClose();
  };

  if (!open || questions.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Answer Questions</h2>
            <p className="text-sm text-gray-600 mt-1">{topicTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <p className="font-medium text-gray-900 mb-3">
                {index + 1}. {question.text}
              </p>

              {question.type === "short" && (
                <input
                  type="text"
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}

              {question.type === "long" && (
                <textarea
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={4}
                />
              )}

              {question.type === "rating" && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleAnswerChange(question.id, rating.toString())}
                      className={`w-10 h-10 rounded-md font-medium transition-all ${
                        answers[question.id] === rating.toString()
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "multiple" && (
                <div className="space-y-2">
                  {question.options?.map((option, optIndex) => (
                    <label key={optIndex} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            Submit Answers
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function QuestionAnswerModule() {
  const [topicsData, setTopicsData] = useState<TopicQA[]>(
    TRAINING_TOPICS.map((topic) => ({
      id: topic.id,
      title: topic.title,
      questions: [],
      answeredCount: 0,
    }))
  );

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicQA | null>(null);

  const handleCreateQuestion = (topic: TopicQA) => {
    setSelectedTopic(topic);
    setCreateModalOpen(true);
  };

  const handleAnswerQuestion = (topic: TopicQA) => {
    if (topic.questions.length === 0) return;
    setSelectedTopic(topic);
    setAnswerModalOpen(true);
  };

  const handleAddQuestion = (question: Question) => {
    if (!selectedTopic) return;

    setTopicsData((prev) =>
      prev.map((topic) =>
        topic.id === selectedTopic.id
          ? { ...topic, questions: [...topic.questions, question] }
          : topic
      )
    );

    setSelectedTopic(null);
    setCreateModalOpen(false);
  };

  const handleSaveAnswers = (answers: Record<string, string>) => {
    if (!selectedTopic) return;

    setTopicsData((prev) =>
      prev.map((topic) =>
        topic.id === selectedTopic.id
          ? {
              ...topic,
              answeredCount: Object.keys(answers).length,
              questions: topic.questions.map((q) =>
                answers[q.id] ? { ...q, answer: answers[q.id] } : q
              ),
            }
          : topic
      )
    );

    setSelectedTopic(null);
    setAnswerModalOpen(false);
  };

  const handleDeleteQuestion = (topicId: string, questionId: string) => {
    setTopicsData((prev) =>
      prev.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              questions: topic.questions.filter((q) => q.id !== questionId),
            }
          : topic
      )
    );
  };

  const totalQuestions = topicsData.reduce((sum, topic) => sum + topic.questions.length, 0);
  const totalAnswered = topicsData.reduce((sum, topic) => sum + topic.answeredCount, 0);
  const progressPercentage = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Training Q&A</h1>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Progress</label>
              <span className="text-sm font-semibold text-gray-900">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-3">
          {topicsData.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {topic.questions.length} question{topic.questions.length !== 1 ? "s" : ""} created
                  {topic.answeredCount > 0 && ` • ${topic.answeredCount} answered`}
                </p>

                {/* Questions Preview */}
                {topic.questions.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-20 overflow-y-auto">
                    {topic.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="flex items-start justify-between gap-2 text-sm bg-gray-50 p-2 rounded"
                      >
                        <span className="text-gray-700 line-clamp-1">
                          {idx + 1}. {q.text}
                        </span>
                        <button
                          onClick={() => handleDeleteQuestion(topic.id, q.id)}
                          className="text-gray-400 hover:text-red-600 transition flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  onClick={() => handleCreateQuestion(topic)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors whitespace-nowrap"
                >
                  Create Question
                </Button>
                <Button
                  onClick={() => handleAnswerQuestion(topic)}
                  disabled={topic.questions.length === 0}
                  className={`font-medium px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                    topic.questions.length === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  Answer Questions
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <CreateQuestionModal
        open={createModalOpen}
        topicTitle={selectedTopic?.title || ""}
        onClose={() => setCreateModalOpen(false)}
        onAdd={handleAddQuestion}
      />

      <AnswerQuestionModal
        open={answerModalOpen}
        topicTitle={selectedTopic?.title || ""}
        questions={selectedTopic?.questions || []}
        onClose={() => setAnswerModalOpen(false)}
        onSaveAnswers={handleSaveAnswers}
      />
    </div>
  );
}