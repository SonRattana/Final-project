"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <Button
      className="bg-transparent border-0 relative flex items-center justify-center w-14 h-14 shadow-lg duration-300 [box-shadow:1px_1px_0px_1px_#eab92d] border-2 border-gray-800 rounded-lg cursor-pointer peer-checked:[box-shadow:1px_1px_0px_1px_#075985] peer-checked:hover:[box-shadow:1px_1px_0px_1px_#1e1e1e] hover:[box-shadow:1px_1px_0px_1px_#1e1e1e]"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
    >
      <Sun className="absolute stroke-black w-[1.2rem] h-[1.2rem] duration-300 rotate-0 scale-100 transition-all dark:opacity-0 dark:scale-0" />
      <Moon className="absolute stroke-white w-[1.2rem] h-[1.2rem] duration-300 opacity-0 scale-0 transition-all dark:opacity-100 dark:scale-100" />

      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
