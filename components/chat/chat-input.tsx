"use client";

import { useState, useEffect } from "react";
import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Smile, Send } from "lucide-react"; // Add Send icon
import { useRouter } from "next/navigation";
import { filterBadWords } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage, // Import FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal-store";
import { EmojiPicker } from "@/components/emoji-picker";

// Define the props interface
interface ChatInputProps {
  apiUrl: string;
  query: {
    channelId: string;
    serverId: string; // Ensure serverId is inside query
    conversationId?: string;
  };
  name: string;
  type: "conversation" | "channel";
}

// Form validation schema using zod
const formSchema = z.object({
  content: z.string().min(1, "Message cannot be empty!"),
});

export const ChatInput = ({ apiUrl, query, name, type }: ChatInputProps) => {
  const { onOpen } = useModal();
  const router = useRouter();

  // State variables for tagging, input value, suggestions
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [activeSuggestion, setActiveSuggestion] = useState<number>(0);
  // Form setup using react-hook-form with zod for validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  // Check if the form is submitting
  const isLoading = form.formState.isSubmitting;

  // Fetch user suggestions when typing "@" for tagging
  const { serverId, channelId } = query; // Destructure from query

  useEffect(() => {
    if (!serverId) {
      console.log("serverId is missing in ChatInput");
    }
  }, [serverId]);

  const fetchUserSuggestions = async (query: string) => {
    if (!serverId) {
      console.error("serverId is undefined");
      return;
    }

    try {
      const response = await axios.get(
        `/api/socket/users/search?q=${query}&serverId=${serverId}`
      );
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching user suggestions", error);
    }
  };

  // Handle input change to detect "@" and fetch suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.includes("@")) {
      const query = value.split("@").pop() ?? "";
      fetchUserSuggestions(query);
    } else {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    // Ẩn danh sách nếu xóa hết hoặc không còn `@`
    if (!inputValue.includes("@")) {
      setShowSuggestions(false);
    }
  }, [inputValue]);

  const handleTagUser = (user: string) => {
    // Cập nhật người dùng được tag
    if (!taggedUsers.includes(user)) {
      setTaggedUsers((prev) => [...prev, user]);
    }

    const updatedValue = inputValue.replace(/@\w*$/, `@${user} `);
    setInputValue(updatedValue);
    form.setValue("content", updatedValue);

    setShowSuggestions(false);
  };
  
  

  // Handle form submission to send the message
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.content.trim()) {
      return;
    }
  
    try {
      // Đo thời gian lọc để kiểm tra hiệu năng
      const startTime = performance.now();
      const filteredContent = filterBadWords(values.content.trim()); // Lọc nội dung
      const endTime = performance.now();
  
      console.log(
        `filterBadWords executed in ${(endTime - startTime).toFixed(2)}ms`
      ); // Log thời gian lọc để debug hiệu năng
  
      // Gửi nội dung đã lọc lên server
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });
  
      await axios.post(url, {
        content: filteredContent,
        taggedUsers, // Gửi danh sách taggedUsers nếu có
      });
  
      // Reset form và input sau khi gửi thành công
      form.reset();
      setTaggedUsers([]);
      setInputValue("");
      router.refresh(); // Làm mới giao diện
    } catch (error) {
      console.error("Error sending message:", error);
      // Tùy chọn: Hiển thị thông báo lỗi nếu cần
    }
  };
  
  
  // Reset taggedUsers when sending a normal message
  useEffect(() => {
    if (inputValue.trim() && !inputValue.includes("@")) {
      setTaggedUsers([]); // Reset taggedUsers nếu không có tag
    }
  }, [inputValue]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative p-4 pb-6">
                  <button
                    type="button"
                    onClick={() => onOpen("messageFile", { apiUrl, query })}
                    className="group cursor-pointer outline-none hover:rotate-90 duration-300 absolute top-7 left-8 h-[24px] w-[24px] flex items-center justify-center"
                    title="Share Image or PDF file"
                  >
                    <svg
                      className="stroke-teal-500 fill-none group-hover:fill-teal-800 group-active:stroke-teal-200 group-active:fill-teal-600 group-active:duration-0 duration-300"
                      viewBox="0 0 24 24"
                      height="24px"
                      width="24px"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeWidth="1.5"
                        d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                      ></path>
                      <path strokeWidth="1.5" d="M8 12H16"></path>
                      <path strokeWidth="1.5" d="M12 16V8"></path>
                    </svg>
                  </button>
                  {/* Input field for typing the message */}
                  <Input
                    disabled={isLoading}
                    className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                    placeholder={`Message ${
                      type === "conversation" ? name : "#" + name
                    }`}
                    value={inputValue}
                    onChange={(e) => {
                      field.onChange(e);
                      handleInputChange(e);
                    }}
                    style={{
                      color: inputValue.includes("@") ? "blue" : "inherit", // Đặt màu xanh cho tin nhắn tag
                    }}
                  />

                  {/* Emoji picker button */}
                  <div className="absolute top-7 right-16">
                    <EmojiPicker
                      onChange={(emoji: string) =>
                        field.onChange(`${field.value} ${emoji}`)
                      }
                    />
                  </div>

                  {/* Show user suggestions for tagging */}
                  {showSuggestions && (
                    <ul className="absolute z-10 bg-gray-200 border rounded-md">
                      {suggestions.map((user) => (
                        <li
                          key={user.id}
                          onClick={() => handleTagUser(user.name)}
                          className="p-2 hover:bg-gray-300 cursor-pointer"
                        >
                          {user.name}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Send message button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`absolute top-7 right-8 h-[24px] w-[24px] transition rounded-full p-1 flex items-center justify-center ${
                      field.value.trim()
                        ? "bg-teal-500 hover:bg-teal-600"
                        : "bg-zinc-500 dark:bg-zinc-400"
                    }`}
                  >
                    <Send className="text-white" />
                  </button>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
