"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FrontendUserClient from "../../FrontendUserClient";

export default function FrontendUserPage() {
  const params = useParams();
  const { country, shortId } = params as { country: string; shortId: string };
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!country || !shortId) {
      setError("Report not found");
      return;
    }

    fetch(`/api/getState?shortId=${shortId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.state) {
          const currentPath = window.location.pathname;
          setState({
            ...data.state,
            fixedCountry: country,
            redirectUrl: currentPath,
          });
        } else {
          console.error("Failed to load state:", data.error);
          setError("Report not found");
        }
      })
      .catch(err => {
        console.error(err);
        setError("Report not found");
      });
  }, [country, shortId]);

  if (error)
    return (
      <div className="flex justify-center pt-20">
        <p className="text-red-700 font-extrabold text-3xl shadow-lg bg-yellow-100 px-6 py-4 rounded-lg">
          {error}
        </p>
      </div>
    );


  if (!state)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );

  return <FrontendUserClient state={state} />;
}
