"use client";

import { logout } from "@/actions/auth-actions";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  variant?: "label" | "icon" | "iconWithLabel";
}

export default function LogoutButton({ className, variant = "label" }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      title="تسجيل الخروج"
      aria-label="تسجيل الخروج"
      className={cn(
        "text-[#BEE663] cursor-pointer",
        isLoading && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      ) : variant === "icon" ? (
        <LogOut className="w-5 h-5" strokeWidth={2.2} />
      ) : variant === "iconWithLabel" ? (
        <>
          <LogOut className="w-5 h-5" strokeWidth={2.2} />
          تسجيل الخروج
        </>
      ) : (
        "تسجيل الخروج"
      )}
    </button>
  );
}
