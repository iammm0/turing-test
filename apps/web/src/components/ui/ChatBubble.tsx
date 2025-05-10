import clsx from "clsx";

type Props = {
  sender: string;
  recipient: string;
  body: string;
  ts: string;
  isOwn: boolean;
};

export default function ChatBubble({ sender, recipient, body, ts, isOwn }: Props) {
  return (
    <div className={clsx("flex mb-2", isOwn ? "justify-end" : "justify-start")}>
      <div className={clsx(
        "rounded-xl px-4 py-2 max-w-xs text-sm shadow",
        isOwn ? "bg-blue-100 text-right" : "bg-gray-100 text-left"
      )}>
        <p className="font-medium">{sender} → {recipient}</p>
        <p>{body}</p>
        <p className="text-xs text-gray-400 mt-1">{new Date(ts).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
