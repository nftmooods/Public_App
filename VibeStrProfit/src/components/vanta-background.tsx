"use client";
import { useState, useEffect, useRef } from "react";

export const VantaBackground = () => {
  // This component is kept to avoid breaking imports, but Vanta.js is removed.
  // The background is now handled by CSS.
  return <div className="fixed top-0 left-0 w-full h-full -z-10 bg-background" />;
};
