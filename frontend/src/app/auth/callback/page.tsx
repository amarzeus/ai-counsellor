"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { GraduationCap, Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useStore();

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      localStorage.setItem("token", token);
      
      authApi.getMe()
        .then((response) => {
          const user = response.data;
          localStorage.setItem("user", JSON.stringify(user));
          setUser(user);
          toast.success("Welcome!");
          
          if (!user.onboarding_completed) {
            router.push("/onboarding");
          } else {
            router.push("/dashboard");
          }
        })
        .catch((error) => {
          console.error("Failed to get profile:", error);
          toast.error("Authentication failed");
          router.push("/login");
        });
    } else {
      toast.error("No token received");
      router.push("/login");
    }
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Signing you in...</h1>
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mt-4" />
      </div>
    </div>
  );
}
