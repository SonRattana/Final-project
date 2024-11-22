"use client";

import axios from "axios";
import qs from "query-string";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage, 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";

// Schema để kiểm tra tệp đính kèm
const attachmentSchema = z.object({
  fileUrl: z.string().min(1, {
    message: "Attachment is required or File size exceeds 4MB."
  })
});

// Schema để kiểm tra kích thước tệp
const fileSizeSchema = z.object({
  fileUrl: z.string().refine((value) => {
    const file = value ? new File([value], value) : null;
    return file ? file.size <= 4 * 1024 * 1024 : true;
  }, {
    message: "File size exceeds 4MB."
  })
});

export const MessageFileModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();

  const isModalOpen = isOpen && type === "messageFile";
  const { apiUrl, query } = data;

  const attachmentForm = useForm({
    resolver: zodResolver(attachmentSchema),
    defaultValues: {
      fileUrl: "",
    }
  });

  const fileSizeForm = useForm({
    resolver: zodResolver(fileSizeSchema),
    defaultValues: {
      fileUrl: "",
    }
  });

  const handleClose = () => {
    attachmentForm.reset();
    fileSizeForm.reset();
    onClose();
  }

  const isLoading = attachmentForm.formState.isSubmitting || fileSizeForm.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof attachmentSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl || "",
        query,
      });

      await axios.post(url, {
        ...values,
        content: values.fileUrl,
      });

      attachmentForm.reset();
      fileSizeForm.reset();
      router.refresh();
      handleClose();
    } catch (error) {
      console.log(error);
    }
  }

  const handleFileError = (error: string) => {
    if (error === "FileSizeMismatch") {
      fileSizeForm.setError("fileUrl", {
        type: "manual",
        message: "File size exceeds 4MB."
      });
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Add an attachment
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Send a file as a message
          </DialogDescription>
        </DialogHeader>
        <Form {...attachmentForm}>
          <form onSubmit={attachmentForm.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <div className="flex items-center justify-center text-center">
                <FormField
                  control={attachmentForm.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          endpoint="messageFile"
                          value={field.value}
                          onChange={field.onChange}
                          onError={handleFileError} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogDescription className="text-center font-bold text-zinc-500">
            File size must less than 4MB
          </DialogDescription>
            <DialogFooter className="bg-gray-100 px-6 py-4">
              <Button variant="primary" disabled={isLoading}>
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}