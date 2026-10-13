import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const groqApiKey = process.env.GROQ_API_KEY || "";
const geminiApiKey = process.env.GEMINI_API_KEY || "";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Helper: check if string is valid UUID
function isUuid(str: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

function maskName(name: string | null | undefined): string {
    if (!name || !name.trim()) return "Valued Customer";
    const parts = name.trim().split(/\s+/);
    return parts.map(part => {
        if (part.length <= 1) return part;
        if (part.length === 2) return part[0] + '*';
        return part[0] + '*'.repeat(Math.max(part.length - 2, 2)) + part.slice(-1);
    }).join(' ');
}

function maskOrderId(orderId: string): string {
    if (!orderId) return "MY-******";
    if (orderId.length <= 6) return orderId.slice(0, 2) + "***" + orderId.slice(-1);
    return orderId.slice(0, 3) + "***" + orderId.slice(-3);
}

// 1. Secure Order Tracking
async function trackOrder(orderIdOrPhone: string, sessionPhone?: string | null) {
    if (!supabaseUrl || !supabaseServiceKey) {
        return JSON.stringify({ error: "Order lookup database temporarily unavailable." });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const raw = orderIdOrPhone.trim();
        const cleanPhone = raw.replace(/^(\+91|91)/, '').replace(/\D/g, '');

        let order = null;
        let isQueriedByPrivateOrderId = false;

        // Try exact match on external_order_id first
        const { data: byExtId } = await supabase
            .from("orders")
            .select("id, external_order_id, status, payment_status, total_amount, created_at, customer_name, customer_phone")
            .ilike("external_order_id", `%${raw}%`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (byExtId) {
            order = byExtId;
            isQueriedByPrivateOrderId = true;
        }

        // Try UUID match
        if (!order && isUuid(raw)) {
            const { data: byId } = await supabase
                .from("orders")
                .select("id, external_order_id, status, payment_status, total_amount, created_at, customer_name, customer_phone")
                .eq("id", raw)
                .maybeSingle();
            if (byId) {
                order = byId;
                isQueriedByPrivateOrderId = true;
            }
        }

        // Try Phone match (last 10 digits)
        if (!order && cleanPhone.length >= 10) {
            const phoneSearch = cleanPhone.slice(-10);
            const { data: byPhone } = await supabase
                .from("orders")
                .select("id, external_order_id, status, payment_status, total_amount, created_at, customer_name, customer_phone")
                .or(`customer_phone.ilike.%${phoneSearch}%,customer_phone.ilike.%91${phoneSearch}%`)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            if (byPhone) order = byPhone;
        }

        if (!order) {
            return JSON.stringify({
                found: false,
                message: `⚠️ **No active order found** for **\`${raw}\`**.\n\nKripya apna **10-digit Mobile Number** ya **Order ID** (jaise **\`MY-1001\`**) check karein.\n\nAgar aapne abhi order place kiya hai ya customer assistance chahiye:\n• 📧 **Email**: [support@milletyard.com](mailto:support@milletyard.com)\n• 💬 **WhatsApp Support**: [Chat on WhatsApp](https://wa.me/919691045405)`
            });
        }

        const cleanSessionPhone = (sessionPhone || '').replace(/\D/g, '').slice(-10);
        const orderPhoneClean = (order.customer_phone || '').replace(/\D/g, '').slice(-10);
        const isSessionVerified = Boolean(cleanSessionPhone && cleanSessionPhone === orderPhoneClean);
        const isFullDetailsAllowed = isQueriedByPrivateOrderId || isSessionVerified;

        // Fetch associated items
        const { data: items } = await supabase
            .from("order_items")
            .select("name, quantity, unit_price, total_price")
            .eq("order_id", order.id);

        const orderIdDisplay = order.external_order_id || `MY-${order.id.slice(0, 8).toUpperCase()}`;
        const itemsSummary = items && items.length > 0
            ? items.map(i => `${i.name} (Qty: ${i.quantity})`).join(", ")
            : "Unpolished Millets & Superfoods";

        const maskedCustomerName = maskName(order.customer_name);

        if (!isFullDetailsAllowed) {
            return JSON.stringify({
                found: true,
                order_id: maskOrderId(orderIdDisplay),
                customer_name: maskedCustomerName,
                status: order.status || "CONFIRMED",
                order_date: new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                items: `${items?.length || 1} Item(s) [Protected for Privacy]`,
                total_amount: `₹${order.total_amount}`,
                payment_status: order.payment_status || "PAID",
                courier_partner: "Shiprocket Courier Network (Delhivery / BlueDart)",
                tracking_url: `https://shiprocket.co/tracking/${order.external_order_id || order.id}`,
                estimated_delivery: "3 to 5 business days from order confirmation"
            });
        }

        return JSON.stringify({
            found: true,
            order_id: orderIdDisplay,
            customer_name: maskedCustomerName,
            status: order.status || "CONFIRMED",
            payment_status: order.payment_status || "PAID",
            total_amount: `₹${order.total_amount}`,
            order_date: new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            items: itemsSummary,
            courier_partner: "Shiprocket Courier Network (Delhivery / BlueDart)",
            tracking_url: `https://shiprocket.co/tracking/${order.external_order_id || order.id}`,
            estimated_delivery: "3 to 5 business days from order confirmation"
        });
    } catch (e: any) {
        console.error("Order tracking error:", e);
        return JSON.stringify({ error: "Failed to track order: " + e.message });
    }
}

// 2. Product Search
async function searchProducts(query: string) {
    if (!supabaseUrl) return JSON.stringify({ message: "Store catalog currently unavailable." });
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey);
        const { data, error } = await supabase
            .from("products")
            .select("id, name, price, regular_price, sale_price, category, short_description")
            .or(`name.ilike.%${query}%,category.ilike.%${query}%,short_description.ilike.%${query}%`)
            .limit(4);

        if (error || !data || data.length === 0) {
            return JSON.stringify({
                found: false,
                message: `We offer 100% unpolished Foxtail, Kodo, Little, Barnyard, Browntop Millets, and stone-ground wholesome flours.`
            });
        }
        return JSON.stringify({ found: true, products: data });
    } catch (e: any) {
        return JSON.stringify({ error: e.message });
    }
}

// 3. Store Policies (No "Shree Anna" mention)
function getPolicy(type: string): string {
    const policies: Record<string, string> = {
        returns: "We provide a 7-day hassle-free replacement or refund for damaged, compromised packaging, or incorrect items. Please share unboxing photos or a video to support@milletyard.com or WhatsApp us.",
        shipping: "Orders are dispatched within 24 to 48 business hours via Shiprocket express courier network. Pan-India delivery takes 3 to 5 business days. Free shipping on orders above ₹499 (Flat ₹50 for smaller orders).",
        refunds: "Approved refunds are credited directly to your original payment method (UPI / Cards / Net Banking) within 5 to 7 working days. For COD orders, refund is issued via instant UPI/bank transfer after verification.",
        support: "You can reach Millet Yard Customer Care at support@milletyard.com or WhatsApp us from Monday to Saturday, 10 AM to 6 PM IST.",
        cooking_guide: "Cooking Unpolished Millets: Always soak unpolished millets for 4 to 6 hours (minimum 30 minutes) before cooking to activate enzymes and break down phytates. Pressure cooker ratio is 1 cup millet to 2.5 cups water (2 whistles on medium flame). For open pot, use 1:3 ratio and simmer for 15-20 minutes.",
        diabetic_diet: "For diabetes management, Kodo Millet (कोदो, GI ~ 50) and Foxtail Millet (कंगनी, GI ~ 54) are proven to have a low glycemic index, preventing blood sugar spikes and keeping you satiated for 6+ hours due to rich dietary fiber."
    };
    return policies[type] || "Please contact support@milletyard.com for specific policies.";
}

// System Instruction for AI Assistant
const SYSTEM_INSTRUCTION = `
You are the official AI Assistant for 'Millet Yard' (milletyard.com).
Your tone is warm, polite, knowledgeable, and distinctly Indian (Namaste 🙏, helpful in natural Hinglish or English).

IMPORTANT BRAND GUIDELINE:
- NEVER use or mention the term "Shree Anna".
- ALWAYS refer to our products as "100% unpolished millets", "positive millets", "heritage grains", or "superfoods".

## ABOUT MILLET YARD:
- Products: 100% Unpolished native millets (Kodo, Foxtail, Little, Barnyard, Browntop, Ragi, Jowar, Bajra), stone-ground wholesome flours, sattu, and natural snacks.
- Quality: Zero chemical polish, zero preservatives, non-GMO, naturally gluten-free, low glycemic index (GI).
- Sourcing: Ethically sourced direct from farmer cooperatives and tribal farmers.

## HEALTH BENEFITS QUICK GUIDE:
1. Diabetes Management: Kodo Millet (GI ~ 50) and Foxtail Millet (GI ~ 54) - low GI, high dietary fiber, stabilizes blood sugar.
2. Weight Loss: Foxtail & Browntop Millets - high satiety, keeps tummy full for 6+ hours, prevents fat storage.
3. Gut Health & Constipation: Browntop Millet (12.5% prebiotic fiber) & Barnyard Millet - smooth digestion, detox.
4. Bone Strength: Ragi (Finger Millet) - 344mg Calcium per 100g (3x more than cow milk!).
5. Thyroid & Energy: Little Millet (Kutki) - rich in iron, zinc, phosphorus, cooks in just 10-12 minutes like rice.

## COOKING RULES:
- Soak 4-6 hours (min 30 mins) before cooking.
- Water ratio: 1 cup millet : 2.5 cups water in pressure cooker (2 whistles); 1:3 in open pot.

## SHIPPING & DELIVERY:
- Dispatch: Within 24-48 business hours. Delivery: 3 to 5 business days pan-India via Shiprocket.
- Free delivery on orders above ₹499 (Flat ₹50 below ₹499). COD available.

## INSTRUCTIONS FOR REPLIES:
- Keep responses concise, friendly, and structured (bullet points / clean formatting).
- When suggesting a product, include its clean name and benefits.
- If customer asks about their order, ask for their 10-digit phone number or Order ID (e.g. MY-1001).
`;

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json();
        if (!message || typeof message !== 'string') {
            return NextResponse.json({ reply: "Namaste! 🙏 How can I assist you today?" });
        }

        const trimmed = message.trim();
        const lower = trimmed.toLowerCase();

        // 1. Check Customer Cookie Session
        const cookieStore = await cookies();
        const customerSession = cookieStore.get("milletyard-customer-session");
        let customerPhone: string | null = null;
        let customerName = "Friend";

        if (customerSession) {
            try {
                const sessionData = JSON.parse(customerSession.value);
                customerPhone = sessionData.phone || null;
                customerName = sessionData.name || "Customer";
            } catch {
                // Ignore parse error
            }
        }

        // 2. Direct Instant Interception: Phone Number (10 digits) or Order ID (MY-)
        const phoneMatch = trimmed.match(/(?:(?:\+|0{0,2})91[\s-]?)?([6-9]\d{9})\b/);
        const orderIdMatch = trimmed.match(/\b(MY-[A-Z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4})\b/i);

        if (orderIdMatch || (phoneMatch && (lower.includes("order") || lower.includes("track") || lower.includes("status") || lower.length <= 15))) {
            const query = orderIdMatch ? orderIdMatch[0] : phoneMatch![1];
            const trackData = await trackOrder(query, customerPhone);
            const parsed = JSON.parse(trackData);

            if (parsed.found) {
                return NextResponse.json({
                    reply: `Namaste ${parsed.customer_name}! 🙏\n\n📦 **Order Status for #${parsed.order_id}**\n- **Status**: ${parsed.status}\n- **Items**: ${parsed.items}\n- **Total Amount**: ${parsed.total_amount} (${parsed.payment_status})\n- **Order Date**: ${parsed.order_date}\n- **Estimated Delivery**: ${parsed.estimated_delivery}\n\n🔗 **Live Courier Tracking**: [Click to Track on Shiprocket](${parsed.tracking_url})\n\nKya aapko kisi aur cheez me madad chahiye?`
                });
            } else {
                return NextResponse.json({
                    reply: `Namaste! 🙏\n\n${parsed.message}`
                });
            }
        }

        // 3. Simple Instant Greetings (sub-50ms latency)
        if (/^(hi|hello|hey|namaste|hlo|helo|ola|pranam)[!.\s]*$/i.test(trimmed)) {
            return NextResponse.json({
                reply: `Namaste ${customerName !== 'Friend' ? customerName : ''}! 🙏 Welcome to Millet Yard.\n\nMain aapki kaise madad kar sakta hoon?\n\n• **🌾 Unpolished Millets & Atta**: Diabetes, Weight Loss, ya Gut Health ke liye best grains janiye\n• **📦 Track Order**: Apna 10-digit Phone Number ya Order ID bhejiye\n• **🥣 Cooking Tips**: Simple soaking aur cooking ratios\n\nAap kya jaanna chahte hain?`
            });
        }

        // 4. Policy Quick Match
        if (lower.includes("shipping time") || lower.includes("delivery time") || lower.includes("kitne din me") || lower.includes("kab aayega")) {
            return NextResponse.json({
                reply: `Namaste! 🚚\n\n**Millet Yard Shipping Details:**\n• **Dispatch**: Order confirm hone ke 24-48 hours ke andar Shiprocket express network (BlueDart/Delhivery) se niklta hai.\n• **Delivery**: Pan-India 3 se 5 business days me deliver hota hai.\n• **Free Shipping**: ₹499 se upar ke orders par shipping bilkul free hai!\n\nAap apna phone number bhej kar live order bhi track kar sakte hain.`
            });
        }

        if (lower.includes("return") || lower.includes("refund")) {
            return NextResponse.json({
                reply: `Namaste! 🔄\n\n${getPolicy("returns")}\n\nRefunds approved hone ke 5-7 working days me aapke source account me credit ho jate hain.`
            });
        }

        if (lower.includes("track my order") || (lower.includes("track") && !phoneMatch && !orderIdMatch)) {
            return NextResponse.json({
                reply: "Namaste! 🙏 Apna order live track karne ke liye, kripya apna **10-digit Phone Number** ya **Order ID (jaise MY-1001)** yahan type karke bhejein. 📦"
            });
        }

        // 5. Context-aware Product Catalog Lookup if user asks about specific items
        let catalogContext = "";
        const searchKeywords = ["diabetes", "weight loss", "kodo", "foxtail", "little", "barnyard", "browntop", "ragi", "atta", "flour", "laddoo", "sattu", "combo", "price", "pack"];
        const matchedKw = searchKeywords.find(kw => lower.includes(kw));
        if (matchedKw) {
            try {
                const prodSearchRaw = await searchProducts(matchedKw);
                const prodSearch = JSON.parse(prodSearchRaw);
                if (prodSearch.found && prodSearch.products?.length > 0) {
                    catalogContext = "\n\nCURRENT STORE PRODUCTS IN CATALOG:\n" +
                        prodSearch.products.map((p: any) => `- ${p.name} | Price: ₹${p.sale_price || p.price} | Category: ${p.category}`).join("\n");
                }
            } catch {
                // Ignore search error
            }
        }

        // 6. Primary AI: Ultra-fast Groq LPU (gpt-oss-120b or qwen-27b)
        if (groqApiKey) {
            try {
                const groqMessages = [
                    {
                        role: "system",
                        content: SYSTEM_INSTRUCTION + catalogContext
                    },
                    ...(history || []).slice(-6).map((msg: any) => ({
                        role: msg.role === 'user' ? 'user' : 'assistant',
                        content: String(msg.content || '')
                    })),
                    {
                        role: "user",
                        content: trimmed
                    }
                ];

                const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${groqApiKey}`
                    },
                    body: JSON.stringify({
                        model: "openai/gpt-oss-120b",
                        messages: groqMessages,
                        temperature: 0.5,
                        max_tokens: 450
                    })
                });

                if (groqRes.ok) {
                    const groqData = await groqRes.json();
                    let replyText = groqData.choices?.[0]?.message?.content;
                    if (replyText) {
                        // Double check to strip any unexpected "Shree Anna"
                        replyText = replyText.replace(/shree\s+anna/gi, "unpolished millets");
                        return NextResponse.json({ reply: replyText });
                    }
                } else {
                    console.warn("Groq API error status:", groqRes.status);
                }
            } catch (groqErr) {
                console.error("Groq chat error:", groqErr);
            }
        }

        // 7. Secondary Fallback: Gemini API if valid key is set
        if (geminiApiKey) {
            try {
                const { GoogleGenerativeAI } = await import("@google/generative-ai");
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                const chat = model.startChat({
                    history: [
                        { role: "user", parts: [{ text: SYSTEM_INSTRUCTION + catalogContext }] },
                        { role: "model", parts: [{ text: "Namaste! I am your Millet Yard AI Superfood Assistant." }] },
                        ...(history || []).slice(-4).map((msg: any) => ({
                            role: msg.role === 'user' ? 'user' : 'model',
                            parts: [{ text: String(msg.content || '') }]
                        }))
                    ]
                });

                const result = await chat.sendMessage(trimmed);
                let text = result.response.text();
                text = text.replace(/shree\s+anna/gi, "unpolished millets");
                return NextResponse.json({ reply: text });
            } catch (geminiErr) {
                console.error("Gemini fallback error:", geminiErr);
            }
        }

        // 8. Graceful Intelligent Rule-Based Response (Zero failure, always helpful)
        let fallbackReply = `Namaste! 🙏 Welcome to Millet Yard.\n\nHum provide karte hain 100% naturally unpolished millets (Foxtail, Kodo, Little, Barnyard, Browntop) aur cold-milled stone-ground flours direct tribal farmers se.\n\n• **Diabetes / Low GI**: Kodo aur Foxtail Millets best hain.\n• **Weight Loss**: Foxtail aur Browntop Millets.\n• **Track Order**: Kripya apna 10-digit mobile number batayein.`;

        if (lower.includes("diabetes") || lower.includes("sugar")) {
            fallbackReply = `Namaste! 🙏\n\n**Diabetes ke liye Best Millets:**\n1. **Kodo Millet (कोदो)**: Glycemic Index sirf ~50 hai. Iska slow-release carbohydrates blood sugar spikes ko rokta hai.\n2. **Foxtail Millet (कंगनी)**: GI ~54, high dietary fiber aur minerals se insulin sensitivity improve hoti hai.\n\n💡 **Tip**: Inhe pakane se pehle 4-6 ghante zaroor bhigoyen taaki nutrients fully absorb hon!`;
        } else if (lower.includes("weight") || lower.includes("fat") || lower.includes("diet")) {
            fallbackReply = `Namaste! 🙏\n\n**Weight Loss & Satiety ke liye:**\n• **Foxtail Millet (कंगनी)**: High protein aur complex fiber aapko 6+ ghante tak bhookh nahi lagne deta.\n• **Browntop Millet**: 12.5% natural dietary fiber gut microbiome ko clean karta hai aur bloat khatam karta hai.\n\nAap rice ki jagah direct replace karke dal ya sabzi ke saath le sakte hain!`;
        }

        return NextResponse.json({ reply: fallbackReply });

    } catch (error: any) {
        console.error("Millet Yard AI Chat Root Error:", error);
        return NextResponse.json({
            reply: "Namaste! 🙏 Main aapki Millet Yard orders aur unpolished millets ki jankari me madad ke liye hazir hoon. Kripya apna sawal ya 10-digit phone number batayein."
        });
    }
}
