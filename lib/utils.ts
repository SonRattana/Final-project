import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Hợp nhất các lớp CSS với điều kiện hóa
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Danh sách từ tục tĩu (badWords) được import từ file riêng
import { badWords } from "./badWords";

// Chuyển danh sách từ tục tĩu thành một Set để tra cứu nhanh hơn
const badWordsSet = new Set(badWords.map((word) => word.toLowerCase()));

// Hàm lọc từ tục tĩu được tối ưu
export function filterBadWords(message: string): string {
  return message
    .split(/\b/) // Chia chuỗi thành các từ dựa trên ranh giới từ
    .map((word) =>
      badWordsSet.has(word.toLowerCase()) ? "****" : word
    ) // Kiểm tra từng từ trong Set
    .join(""); // Ghép lại thành chuỗi ban đầu
}

