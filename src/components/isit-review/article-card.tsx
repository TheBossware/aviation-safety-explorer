import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HighlightedText } from "@/components/isit-review/highlighted-text";

/** The AvHerald article text next to the review, with the AI's evidence quotes highlighted. */
export function ArticleCard({ content, quotes }: { content: string; quotes: string[] }) {
  return (
    <Card className="min-h-0 p-6 xl:overflow-y-auto">
      <CardHeader className="p-0">
        <CardTitle className="text-base">Article</CardTitle>
        <p className="text-xs text-muted-foreground">
          AvHerald page linked from the post. It may describe an older or withdrawn story. Highlighted: evidence quoted by the AI.
        </p>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <HighlightedText text={content || "(no article text)"} quotes={quotes} />
      </CardContent>
    </Card>
  );
}
