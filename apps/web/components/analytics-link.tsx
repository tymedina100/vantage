"use client";

import { track } from "@vercel/analytics";
import type { AnchorHTMLAttributes, MouseEvent } from "react";

type AnalyticsLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { event: string; eventLocation: string };

export function AnalyticsLink({ event, eventLocation, onClick, ...props }: AnalyticsLinkProps) {
  return <a {...props} onClick={(eventObject: MouseEvent<HTMLAnchorElement>) => { track(event, { location: eventLocation }); onClick?.(eventObject); }} />;
}
