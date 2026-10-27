import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
          "Bytespider",
          "Meta-ExternalAgent",
        ],
        allow: ["/llms.txt", "/", "/commercial", "/residential", "/investor", "/estimate", "/privacy"],
        disallow: ["/curated/", "/work/", "/images/", "/img_v16_web/", "/media/", "/login", "/portal", "/api/"],
      },
      {
        userAgent: "*",
        allow: ["/llms.txt"],
        disallow: ["/curated/", "/work/", "/images/", "/img_v16_web/", "/media/", "/login", "/portal", "/api/"],
      },
    ],
  };
}
