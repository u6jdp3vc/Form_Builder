// src/app/page.tsx
"use client";

import React, { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-white text-center mt-10">Loading...</p>}>
      <LoginPageClient />
    </Suspense>
  );
}
