"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FrontendUserClient from "../../FrontendUserClient";

export default function FrontendUserPage() {
  const params = useParams();
  const { country, shortId } = params as { country: string; shortId: string };
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    if (!country || !shortId) return;
    fetch(`/api/getState?shortId=${shortId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // บังคับ country จาก URL
          setState({ ...data.state, fixedCountry: country });
        } else console.error("Failed to load state:", data.error);
      })
      .catch(console.error);
  }, [country, shortId]);

  return <FrontendUserClient state={state} />;
}
