import type { Line } from "./types";

type TextSegment = {
  type: "text";
  text: string;
  unconfirmed_text: string;
  start: number;
  end: number;
};

type Segment =
  | TextSegment
  | {
      type: "silence";
      start: number;
      end: number;
    };

export const compactSpeech = (lines: Line[]) => {
  const segments: Segment[] = [];
  let current_segment: TextSegment | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.type === "silence") {
      if (current_segment != null) {
        segments.push(current_segment);
        current_segment = null;
      }

      segments.push({
        type: "silence",
        start: line.timestamp.start,
        end: line.timestamp.end,
      });
    } else {
      const canJoin =
        current_segment !== null &&
        Math.abs(line.timestamp.start - current_segment.end) < 0.1;

      if (!current_segment || !canJoin) {
        if (current_segment != null) {
          segments.push(current_segment);
        }

        current_segment = {
          type: "text",
          start: line.timestamp.start,
          end: line.timestamp.end,
          text: line.type == "complete" ? line.text : "",
          unconfirmed_text: line.type == "partial" ? line.text : "",
        };
        continue;
      } else {
        current_segment.end = line.timestamp.end;
        if (line.type == "complete") {
          current_segment.text += " ";
          current_segment.text += line.text;
        } else if (line.type == "partial") {
          current_segment.unconfirmed_text += " ";
          current_segment.unconfirmed_text += line.text;
        }
      }
    }
  }

  if (current_segment != null) {
    segments.push(current_segment);
  }

  return segments;
};
