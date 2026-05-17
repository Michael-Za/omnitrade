"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTradingStore } from "@/hooks/use-trading-store";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NewsPanel() {
  const { news } = useTradingStore();

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-cyan-400" />
          Crypto News
          <Badge variant="outline" className="text-[10px] ml-auto">
            {news.length} articles
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2">
          {news.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Loading news from CryptoCompare...
            </p>
          ) : (
            news.slice(0, 8).map((article: any) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
              >
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt=""
                    className="h-10 w-10 rounded object-cover shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {article.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {article.source}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {timeAgo(article.publishedAt)}
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0 mt-0.5" />
              </a>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
