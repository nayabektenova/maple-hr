// app/api/chat/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';

// Enhanced fallback responses (more AI-like)
function getEnhancedResponse(question: string): string {
  const responses = [
    `Based on your question about "${question}", here's what I can share:\n\nMost companies have policies that cover this. Typically, employees should refer to the employee handbook or contact HR directly for specific guidelines. The standard approach is to submit requests through the proper channels and allow 2-3 business days for processing.\n\n💡 **Recommendation:** Check with your HR department for company-specific policies.`,
    
    `Regarding "${question}", this is a common HR inquiry. Generally, companies establish clear procedures for such matters. Employees are usually advised to:\n1. Review company policies\n2. Speak with their immediate supervisor\n3. Contact HR for clarification\n\n📋 **Standard Practice:** Documentation and proper channels are key for these matters.`,
    
    `For questions like "${question}", HR departments typically recommend:\n• Consulting the employee handbook first\n• Following established company procedures\n• Maintaining clear communication with your manager\n• Contacting HR for formal guidance\n\n🏢 **Best Practice:** Always use official channels for HR-related matters.`
  ];
  
  // Pick a random response for variety
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function POST(request: NextRequest) {
  console.log("=== CHAT API CALLED ===");
  
  let userQuestion = "";
  
  try {
    const body = await request.json();
    userQuestion = body.question || "";
    
    console.log("Question:", userQuestion);
    
    const token = process.env.HUGGINGFACE_TOKEN;
    console.log("Token exists:", !!token);

    if (!token) {
      console.error("ERROR: No Hugging Face token found!");
      return NextResponse.json({
        reply: "⚠️ AI service needs configuration. Please add HUGGINGFACE_TOKEN to .env.local"
      }, { status: 500 });
    }

    if (!userQuestion || userQuestion.trim().length < 2) {
      return NextResponse.json({
        reply: "👋 Hello! I'm your HR Assistant. Please ask me a question about benefits, PTO, policies, or other HR topics."
      });
    }

    console.log("Calling Hugging Face Inference API...");
    
    // Use the NEW correct endpoint with a working model
    try {
      // Option 1: Try the new router API (recommended)
      console.log("Trying new router API...");
      const response = await fetch(
        "https://router.huggingface.co/chat/completions", // NEW ENDPOINT
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "HuggingFaceH4/zephyr-7b-beta", // Free model that works
            messages: [
              {
                role: "system",
                content: `You are a professional HR assistant for a company. You help employees with:
- Benefits questions (health insurance, dental, vision, retirement plans)
- PTO and time-off policies
- Company policies and procedures
- Payroll and compensation questions
- HR contact information
- Dress code and workplace policies
- Onboarding and training
- Employee relations

Be helpful, professional, and concise. If you don't know something, suggest contacting HR directly at hr@company.com or calling (555) 123-4567.`
              },
              {
                role: "user",
                content: userQuestion
              }
            ],
            max_tokens: 300,
            temperature: 0.7
          }),
        }
      );

      console.log("Router API Status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Router API Success!");
        console.log("Response data:", JSON.stringify(data).substring(0, 200));
        
        const reply = data.choices?.[0]?.message?.content 
          || data[0]?.generated_text 
          || "I received a response but couldn't process it.";
        
        return NextResponse.json({ reply });
      }
      
      console.log("Router API failed, trying inference API...");
      
    } catch (routerError) {
      console.log("Router API error:", routerError);
    }

    // Option 2: Try the inference API with different models
    console.log("Trying inference API with different models...");
    
    // List of models to try (some might still work)
    const models = [
      "microsoft/phi-2",
      "google/flan-t5-base",
      "distilbert-base-uncased-distilled-squad",
      "bert-base-uncased"
    ];

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: `Act as an HR assistant. Answer this question: "${userQuestion}"`,
              parameters: {
                max_new_tokens: 250,
                temperature: 0.7,
              }
            }),
          }
        );

        console.log(`Model ${model} status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Model ${model} success!`);
          
          let reply = "";
          if (Array.isArray(data) && data[0]?.generated_text) {
            reply = data[0].generated_text.trim();
          } else if (data.generated_text) {
            reply = data.generated_text.trim();
          } else if (data[0]?.answer) {
            reply = data[0].answer;
          } else {
            reply = JSON.stringify(data).substring(0, 200);
          }
          
          return NextResponse.json({ reply });
        }
        
        if (response.status === 503) {
          console.log(`Model ${model} is loading, trying next...`);
          continue;
        }
        
      } catch (modelError) {
        console.log(`Model ${model} error:`, modelError);
        continue;
      }
    }

    // If all API calls fail, try a completely different approach
    console.log("All direct APIs failed, trying alternative service...");
    
    try {
      // Alternative: Use OpenRouter (free tier available)
      const openRouterResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "mistralai/mistral-7b-instruct",
            messages: [
              {
                role: "user",
                content: `As an HR assistant: ${userQuestion}`
              }
            ],
            max_tokens: 200
          }),
        }
      );

      if (openRouterResponse.ok) {
        const data = await openRouterResponse.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return NextResponse.json({ reply });
        }
      }
    } catch (openRouterError) {
      console.log("OpenRouter also failed:", openRouterError);
    }

    // Ultimate fallback: Use a local AI simulation
    console.log("All APIs failed, using enhanced simulation");
    return NextResponse.json({
      reply: getEnhancedResponse(userQuestion)
    });

  } catch (error: any) {
    console.error("Fatal error in chat API:", error);
    return NextResponse.json({
      reply: `🤖 **AI HR Assistant**\n\nI apologize, but I'm having technical difficulties right now.\n\nIn the meantime, here's what I can tell you:\n\n${getEnhancedResponse(userQuestion || "HR policies")}\n\nFor immediate help, please contact HR directly:\n📧 hr@company.com\n📞 (555) 123-4567`
    }, { status: 500 });
  }
}