import type { Metadata } from "next";
import { TopicPage } from "@/components/topic-page";
import { topicPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Fake Website Detection",
  description: topicPages["fake-websites"].description,
};

export default function FakeWebsitesPage() {
  return <TopicPage topic={topicPages["fake-websites"]} />;
}
