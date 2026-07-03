import type { Metadata } from "next";
import { TopicPage } from "@/components/topic-page";
import { topicPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Romance Scam Awareness",
  description: topicPages["romance-scams"].description,
};

export default function RomanceScamsPage() {
  return <TopicPage topic={topicPages["romance-scams"]} />;
}
