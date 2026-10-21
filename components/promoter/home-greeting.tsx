"use client";

import { useEffect, useState } from "react";
import { greetingText } from "@/lib/commercial/promoters/home-metrics";

export function HomeGreeting({
  name,
  className,
  readyClassName
}: {
  name: string | null;
  className?: string;
  readyClassName?: string;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(greetingText(name, new Date()));
  }, [name]);

  const appliedClass = text !== null
    ? [className, readyClassName].filter(Boolean).join(" ")
    : className;

  return (
    <h1 className={appliedClass || undefined}>
      {text ?? (name ? `\u00A0, ${name}` : "\u00A0")}
    </h1>
  );
}
