import clsx from "clsx";
import { Sender } from "@/types";

interface Props {
  sender: Sender;
  recipient: Sender;
  body: string;
  ts: string;
  self: boolean;
}

export const MessageBubble = ({ body, self, sender }: Props) => (
  <div
    className={clsx(
      "rounded-2xl px-4 py-2 max-w-[80%] text-sm shadow",
      self ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-card"
    )}
  >
    {!self && (
      <span className="block text-xs font-medium mb-1 text-muted-foreground">
        {sender === "A" ? "AI" : sender === "H" ? "Human" : "You"}
      </span>
    )}
    {body}
  </div>
);