import type { Metadata } from "next";
import { TopicPage } from "@/components/topic-page";
import { topicPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Crypto Scam Safety",
  description: topicPages["crypto-scams"].description,
};

export default function CryptoScamsPage() {
  return <TopicPage topic={topicPages["crypto-scams"]} />;
}
