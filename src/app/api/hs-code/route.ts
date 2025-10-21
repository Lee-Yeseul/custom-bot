import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

const prompt = `You are an expert in HS code classification. Based on the user's product description, please recommend the top 3 most likely HS codes. For each recommendation, provide the HS code, a brief description of the item, a confidence score (out of 100), and a rationale for your recommendation. The output should be in JSON format, following this structure:

interface HSCodeResult {
  code: string;
  description: string;
  confidence: number;
  rationale: string;
}

Example for a "14-inch laptop computer":
[
  {
    "code": "8471.30",
    "description": "휴대용 자동자료처리기계(무게 10kg 이하)",
    "confidence": 92,
    "rationale": "제품 설명에서 '노트북', '휴대용', '컴퓨터'라는 키워드가 확인되었습니다. HS 코드 8471.30은 휴대용 자동자료처리기계를 분류하는 코드로, 무게 10kg 이하의 노트북 컴퓨터가 해당됩니다."
  },
  {
    "code": "8471.41",
    "description": "기타 자동자료처리기계(시스템 형태)",
    "confidence": 78,
    "rationale": "제품이 시스템 형태로 구성된 경우 이 코드가 적용될 수 있습니다. 다만 휴대용 특성이 강조되어 있어 8471.30이 더 적합할 것으로 판단됩니다."
  },
  {
    "code": "8471.50",
    "description": "자동자료처리기계의 처리장치",
    "confidence": 65,
    "rationale": "제품이 완제품이 아닌 처리장치 단독으로 수입되는 경우 이 코드를 고려할 수 있습니다. 그러나 완제품 노트북으로 보이므로 우선순위가 낮습니다."
  }
]

Now, please classify the following product description. Ensure the 'rationale' field is provided in Korean:
`;

export async function POST(req: NextRequest) {
  try {
    const { productDescription } = await req.json();

    if (!productDescription) {
      return NextResponse.json(
        { error: "Product description is required" },
        { status: 400 }
      );
    }

    const result = await model.generateContent([
      prompt,
      `Product Description: ${productDescription}`,
    ]);
    const response = await result.response;
    const text = await response.text();

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Error in HS code generation:", error);
    return NextResponse.json(
      { error: "Failed to generate HS code" },
      { status: 500 }
    );
  }
}
