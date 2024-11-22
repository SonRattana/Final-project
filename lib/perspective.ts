import axios from "axios";

// Lấy API Key từ biến môi trường
const NEXT_PUBLIC_PERSPECTIVE_API_KEY = process.env.NEXT_PUBLIC_PERSPECTIVE_API_KEY;

export const analyzeContent = async (content: string): Promise<number | null> => {
  try {
    const response = await axios.post(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${NEXT_PUBLIC_PERSPECTIVE_API_KEY}`,
      {
        comment: { text: content },
        languages: ["en"], // Ngôn ngữ (ví dụ: "en" cho tiếng Anh)
        requestedAttributes: {
          TOXICITY: {}, // Yêu cầu phân tích mức độ độc hại
        },
      }
    );

    // Lấy điểm số TOXICITY từ phản hồi API
    const toxicityScore = response.data.attributeScores.TOXICITY.summaryScore.value;
    return toxicityScore;
  } catch (error) {
    console.error("Error analyzing content:", error);
    return null; // Trả về null nếu có lỗi
  }
};
