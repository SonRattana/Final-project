"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Smile, Send } from "lucide-react"; // Add Send icon
import { useRouter } from "next/navigation";

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

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
  type: "conversation" | "channel";
}

const formSchema = z.object({
  content: z.string().min(1, "Message cannot be empty!"), 
});

export const ChatInput = ({
  apiUrl,
  query,
  name,
  type,
}: ChatInputProps) => {
  const { onOpen } = useModal();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    }
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.content.trim()) {
      
      return;
    }
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });

      await axios.post(url, values);

      form.reset();
      router.refresh();
    } catch (error) {
      console.log(error);
    }
  }

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
                  <Input
                    disabled={isLoading}
                    className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                    placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
                    {...field}
                  />
                  <div className="absolute top-7 right-16"> 
                    <EmojiPicker
                      onChange={(emoji: string) => field.onChange(`${field.value} ${emoji}`)}
                    />
                  </div>
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
  )
}
