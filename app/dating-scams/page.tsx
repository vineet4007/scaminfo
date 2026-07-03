import type { Metadata } from "next";
import { TopicPage } from "@/components/topic-page";
import { topicPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Dating App Scam Guide",
  description: topicPages["dating-scams"].description,
};

export default function DatingScamsPage() {
  return <TopicPage topic={topicPages["dating-scams"]} />;
}
